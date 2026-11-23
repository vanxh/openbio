import { auth } from '@/lib/auth';
import {
  consumeAiCredits,
  refundAiCredits,
} from '@/server/db/utils/ai-credits';
import { streamText } from 'ai';
import * as z from 'zod';

export const maxDuration = 30;

// Validated before any credits are spent: an unrecognised `type` used to fall
// through to the most expensive prompt, and a malformed body threw after the
// charge.
const BodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bio'),
    name: z.string().trim().min(1).max(100),
    links: z.array(z.string().max(2048)).max(50).optional(),
    tone: z.enum(['professional', 'casual', 'creative', 'minimal']).optional(),
    context: z.string().max(2000).optional(),
  }),
  z.object({
    type: z.literal('note'),
    prompt: z.string().trim().min(1).max(2000),
  }),
  z.object({
    type: z.literal('profile'),
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(2000),
  }),
]);

type Body = z.infer<typeof BodySchema>;

const CREDIT_COST: Record<Body['type'], number> = {
  bio: 1,
  note: 1,
  profile: 3,
};

function buildPrompts(body: Body): { system: string; prompt: string } {
  if (body.type === 'bio') {
    const linksCtx = body.links?.length
      ? `Their links/socials: ${body.links.join(', ')}`
      : '';
    const extraCtx = body.context ? `Additional context: ${body.context}` : '';
    return {
      system: `You are a bio writer for a link-in-bio platform called OpenBio.
Write short, engaging bios for user profiles.
The bio should be 1-3 sentences max.
Do NOT use hashtags or emojis unless the tone is creative.
Do NOT use quotes around the bio.
Return ONLY the bio text, nothing else.`,
      prompt: `Write a ${body.tone ?? 'casual'} bio for ${body.name}.\n${linksCtx}\n${extraCtx}`,
    };
  }

  if (body.type === 'note') {
    return {
      system: `You are a note writer for a link-in-bio platform.
Write or expand note content based on the user's prompt.
Keep it concise — notes are displayed on small cards.
Use simple HTML: <p>, <strong>, <em>, <ul>, <li>, <h2>.
Do NOT use markdown. Return ONLY the HTML content.`,
      prompt: body.prompt,
    };
  }

  return {
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
    prompt: `Build a profile for: ${body.name}\nDescription: ${body.description}`,
  };
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 });
  }
  const body = parsed.data;

  const userId = session.user.id;
  const creditCost = CREDIT_COST[body.type];
  const canUse = await consumeAiCredits(userId, creditCost);
  if (!canUse) {
    return new Response('No AI credits remaining. Upgrade your plan.', {
      status: 403,
    });
  }

  const result = streamText({
    model: 'openai/gpt-5.4-mini',
    ...buildPrompts(body),
    // The stream fails after the credits were taken; hand them back.
    onError: async () => {
      await refundAiCredits(userId, creditCost).catch(() => undefined);
    },
  });

  return result.toUIMessageStreamResponse();
}
