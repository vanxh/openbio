import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { consumeAiCredits, getAiCredits } from '@/server/db/utils/ai-credits';
import { TRPCError } from '@trpc/server';
import { generateText } from 'ai';
import * as z from 'zod';

export const aiRouter = createTRPCRouter({
  getCredits: protectedProcedure.query(({ ctx }) => {
    return getAiCredits(ctx.user.id);
  }),

  generateBio: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        links: z.array(z.string()).optional(),
        tone: z
          .enum(['professional', 'casual', 'creative', 'minimal'])
          .default('casual'),
        context: z.string().optional(),
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

      const { text } = await generateText({
        model: 'google/gemini-2.0-flash',
        system: `You are a bio writer for a link-in-bio platform called OpenBio.
Write short, engaging bios for user profiles.
The bio should be 1-3 sentences max.
Do NOT use hashtags or emojis unless the tone is creative.
Do NOT use quotes around the bio.
Return ONLY the bio text, nothing else.`,
        prompt: `Write a ${input.tone} bio for ${input.name}.
${linksContext}
${extraContext}`,
      });

      return { bio: text.trim() };
    }),

  buildProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
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

      const { text } = await generateText({
        model: 'google/gemini-2.0-flash',
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

      try {
        const cleaned = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const result = JSON.parse(cleaned);
        return result as {
          bio: string;
          cards: { type: string; title: string; value: string }[];
        };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse AI response. Please try again.',
        });
      }
    }),

  generateNote: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        existingContent: z.string().optional(),
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

      const { text } = await generateText({
        model: 'google/gemini-2.0-flash',
        system: `You are a note writer for a link-in-bio platform.
Write or expand note content based on the user's prompt.
Keep it concise — notes are displayed on small cards.
Use simple HTML: <p>, <strong>, <em>, <ul>, <li>, <h2>.
Do NOT use markdown. Return ONLY the HTML content.`,
        prompt: `${context}User request: ${input.prompt}`,
      });

      return { html: text.trim() };
    }),
});
