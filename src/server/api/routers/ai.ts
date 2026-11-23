import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import {
  consumeAiCredits,
  getAiCredits,
  refundAiCredits,
} from '@/server/db/utils/ai-credits';
import { TRPCError } from '@trpc/server';
import { generateText } from 'ai';
import * as z from 'zod';

const MODEL = 'openai/gpt-5.4-mini';

/**
 * Run a generation that has already been paid for. If it fails, the credits
 * go back: nobody should be charged for an error.
 */
async function generateOrRefund<T>(
  userId: string,
  cost: number,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    await refundAiCredits(userId, cost).catch(() => undefined);
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'The AI request failed. Your credits were not used.',
      cause: error,
    });
  }
}

// Whatever the model returns is coerced into this shape, so a missing or
// malformed field degrades to an empty suggestion instead of crashing the UI.
const ProfileSuggestionSchema = z.object({
  bio: z.string().catch(''),
  cards: z
    .array(
      z.object({
        type: z.string(),
        title: z.string().catch(''),
        value: z.string().catch(''),
      })
    )
    .catch([]),
});

export const aiRouter = createTRPCRouter({
  getCredits: protectedProcedure.query(({ ctx }) => {
    return getAiCredits(ctx.user.id);
  }),

  generateBio: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        links: z.array(z.string().max(2048)).max(50).optional(),
        tone: z
          .enum(['professional', 'casual', 'creative', 'minimal'])
          .default('casual'),
        context: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const canUse = await consumeAiCredits(ctx.user.id, 1);
      if (!canUse) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No AI credits remaining. Upgrade your plan for more.',
        });
      }

      const linksContext = input.links?.length
        ? `Their links/socials: ${input.links.join(', ')}`
        : '';

      const extraContext = input.context
        ? `Additional context: ${input.context}`
        : '';

      const { text } = await generateOrRefund(ctx.user.id, 1, () =>
        generateText({
          model: MODEL,
          system: `You are a bio writer for a link-in-bio platform called OpenBio.
Write short, engaging bios for user profiles.
The bio should be 1-3 sentences max.
Do NOT use hashtags or emojis unless the tone is creative.
Do NOT use quotes around the bio.
Return ONLY the bio text, nothing else.`,
          prompt: `Write a ${input.tone} bio for ${input.name}.
${linksContext}
${extraContext}`,
        })
      );

      return { bio: text.trim() };
    }),

  buildProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const canUse = await consumeAiCredits(ctx.user.id, 3);
      if (!canUse) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Not enough AI credits (3 required). Upgrade your plan for more.',
        });
      }

      return generateOrRefund(ctx.user.id, 3, async () => {
        const { text } = await generateText({
          model: MODEL,
          system: `You are a profile builder for OpenBio, a link-in-bio platform.
Given a user description, generate a complete profile suggestion.
Return a JSON object with:
- "bio": a short 1-3 sentence bio
- "cards": an array of suggested bento cards to add, each with:
  - "type": one of "link", "note", "music", "calendar", "github", "email-collect"
  - "title": what the card should be about
  - "value": the URL or content to use (or empty string if user needs to fill in)

Suggest 3-6 cards that make sense for the person described.
Return ONLY valid JSON, no markdown or explanation.`,
          prompt: `Build a profile for: ${input.name}
Description: ${input.description}`,
        });

        let parsed: unknown;
        try {
          parsed = JSON.parse(
            text
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim()
          );
        } catch {
          parsed = null;
        }

        const suggestion = ProfileSuggestionSchema.safeParse(parsed);
        if (!suggestion.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'The AI returned something unusable. Your credits were not used; please try again.',
          });
        }
        return suggestion.data;
      });
    }),

  generateNote: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(2000),
        existingContent: z.string().max(20_000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const canUse = await consumeAiCredits(ctx.user.id, 1);
      if (!canUse) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No AI credits remaining. Upgrade your plan for more.',
        });
      }

      const context = input.existingContent
        ? `Existing note content: ${input.existingContent}\n\n`
        : '';

      const { text } = await generateOrRefund(ctx.user.id, 1, () =>
        generateText({
          model: MODEL,
          system: `You are a note writer for a link-in-bio platform.
Write or expand note content based on the user's prompt.
Keep it concise — notes are displayed on small cards.
Use simple HTML: <p>, <strong>, <em>, <ul>, <li>, <h2>.
Do NOT use markdown. Return ONLY the HTML content.`,
          prompt: `${context}User request: ${input.prompt}`,
        })
      );

      return { html: text.trim() };
    }),
});
