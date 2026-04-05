import { auth } from '@/lib/auth';
import { consumeAiCredits } from '@/server/db/utils/ai-credits';
import { streamText } from 'ai';
import { headers } from 'next/headers';

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { type, ...input } = (await req.json()) as {
    type: 'bio' | 'note' | 'profile';
    name?: string;
    links?: string[];
    tone?: string;
    context?: string;
    prompt?: string;
    description?: string;
  };

  const creditCost = type === 'profile' ? 3 : 1;
  const canUse = await consumeAiCredits(session.user.id, creditCost);
  if (!canUse) {
    return new Response('No AI credits remaining. Upgrade your plan.', {
      status: 403,
    });
  }

  let systemPrompt: string;
  let userPrompt: string;

  if (type === 'bio') {
    const linksCtx = input.links?.length
      ? `Their links/socials: ${input.links.join(', ')}`
      : '';
    const extraCtx = input.context ? `Additional context: ${input.context}` : '';
    systemPrompt = `You are a bio writer for a link-in-bio platform called OpenBio.
Write short, engaging bios for user profiles.
The bio should be 1-3 sentences max.
Do NOT use hashtags or emojis unless the tone is creative.
Do NOT use quotes around the bio.
Return ONLY the bio text, nothing else.`;
    userPrompt = `Write a ${input.tone ?? 'casual'} bio for ${input.name}.\n${linksCtx}\n${extraCtx}`;
  } else if (type === 'note') {
    systemPrompt = `You are a note writer for a link-in-bio platform.
Write or expand note content based on the user's prompt.
Keep it concise — notes are displayed on small cards.
Use simple HTML: <p>, <strong>, <em>, <ul>, <li>, <h2>.
Do NOT use markdown. Return ONLY the HTML content.`;
    userPrompt = input.prompt ?? '';
  } else {
    systemPrompt = `You are a profile builder for OpenBio, a link-in-bio platform.
Given a user description, generate a complete profile suggestion.
Return a JSON object with:
- "bio": a short 1-3 sentence bio
- "cards": an array of suggested bento cards to add, each with:
  - "type": one of "link", "note", "music", "calendar", "github", "email-collect"
  - "title": what the card should be about
  - "value": the URL or content to use (or empty string if user needs to fill in)
Suggest 3-6 cards that make sense for the person described.
Return ONLY valid JSON, no markdown or explanation.`;
    userPrompt = `Build a profile for: ${input.name}\nDescription: ${input.description}`;
  }

  const result = streamText({
    model: 'openai/gpt-5.4-mini',
    system: systemPrompt,
    prompt: userPrompt,
  });

  return result.toTextStreamResponse();
}
