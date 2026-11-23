import {
  isLegacyTokenAccepted,
  verifyUnsubscribeToken,
} from '@/lib/unsubscribe';
import { db } from '@/server/db/db';
import { user } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { escape as escapeHtml } from 'html-escaper';
import type { NextRequest } from 'next/server';

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${title}</title>
</head>
<body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fafafa;">
  <div style="text-align: center; max-width: 400px; padding: 40px;">
    <h1 style="font-size: 24px; margin-bottom: 8px;">${title}</h1>
    ${body}
  </div>
</body>
</html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

const TEXT_STYLE = 'color: #71717a; font-size: 14px;';
const DASHBOARD_LINK =
  '<a href="https://openbio.app/app?tab=settings" style="display: inline-block; margin-top: 16px; color: #7c3aed; text-decoration: none; font-size: 14px;">Go to dashboard</a>';

/** The user a valid unsubscribe link belongs to, or null. */
async function resolveUser(req: NextRequest): Promise<string | null> {
  const userId = req.nextUrl.searchParams.get('userId');
  const token = req.nextUrl.searchParams.get('token');
  if (!(userId && token)) {
    return null;
  }

  if (verifyUnsubscribeToken(userId, token)) {
    return userId;
  }

  // Links in digests sent before tokens were signed: the token is the email.
  if (isLegacyTokenAccepted()) {
    const found = await db.query.user.findFirst({
      where: (u, { eq, and }) => and(eq(u.id, userId), eq(u.email, token)),
      columns: { id: true },
    });
    return found?.id ?? null;
  }

  return null;
}

const invalid = () =>
  page(
    'Link not valid',
    `<p style="${TEXT_STYLE}">This unsubscribe link is invalid or has expired. You can turn weekly digests off from your dashboard settings.</p>${DASHBOARD_LINK}`,
    400
  );

/**
 * Opening the link only asks for confirmation. Mail scanners and link
 * previewers fetch every URL in a message; if a GET unsubscribed, they would
 * silently opt people out.
 */
export async function GET(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) {
    return invalid();
  }

  const action = `/api/unsubscribe?${escapeHtml(req.nextUrl.searchParams.toString())}`;
  return page(
    'Unsubscribe from weekly digests?',
    `<p style="${TEXT_STYLE}">You will stop receiving the weekly analytics email. You can turn it back on any time from your dashboard settings.</p>
    <form method="post" action="${action}">
      <button type="submit" style="margin-top: 16px; padding: 10px 20px; border: 0; border-radius: 10px; background: #18181b; color: #fff; font-size: 14px; cursor: pointer;">Unsubscribe</button>
    </form>`
  );
}

/**
 * Performs the unsubscribe: from the confirmation button above, or directly
 * from a mail client's one-click unsubscribe (RFC 8058), which POSTs here.
 */
export async function POST(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) {
    return invalid();
  }

  await db.update(user).set({ emailDigest: false }).where(eq(user.id, userId));

  return page(
    'Unsubscribed',
    `<p style="${TEXT_STYLE}">You won't receive weekly digest emails anymore. You can re-enable them from your dashboard settings.</p>${DASHBOARD_LINK}`
  );
}
