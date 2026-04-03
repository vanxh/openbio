import { db } from '@/server/db/db';
import { user } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const token = req.nextUrl.searchParams.get('token');

  if (!userId || !token) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // Verify token matches user email (simple check)
  const found = await db.query.user.findFirst({
    where: (u, { eq, and }) => and(eq(u.id, userId), eq(u.email, token)),
    columns: { id: true },
  });

  if (!found) {
    return new NextResponse('Invalid link', { status: 400 });
  }

  await db.update(user).set({ emailDigest: false }).where(eq(user.id, userId));

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><title>Unsubscribed</title></head>
<body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fafafa;">
  <div style="text-align: center; max-width: 400px; padding: 40px;">
    <h1 style="font-size: 24px; margin-bottom: 8px;">Unsubscribed</h1>
    <p style="color: #71717a; font-size: 14px;">You won't receive weekly digest emails anymore. You can re-enable them from your dashboard settings.</p>
    <a href="https://openbio.app/app" style="display: inline-block; margin-top: 16px; color: #7c3aed; text-decoration: none; font-size: 14px;">Go to dashboard</a>
  </div>
</body>
</html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
