import { auth } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { db, eq } from '@/server/db';
import { link } from '@/server/db/schema';
import { del, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const profileLinkId = formData.get('profileLinkId') as string;

  if (!file || !profileLinkId) {
    return NextResponse.json(
      { error: 'Missing file or profileLinkId' },
      { status: 400 }
    );
  }

  const profileLink = await db.query.link.findFirst({
    where: (l, { eq }) => eq(l.id, profileLinkId),
    columns: { image: true, userId: true },
  });

  if (!profileLink || profileLink.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (profileLink.image) {
    try {
      await del(profileLink.image);
    } catch {
      // Ignore errors when deleting
    }
  }

  const blob = await put(`avatars/${profileLinkId}/${file.name}`, file, {
    access: 'public',
  });
  const [updated] = await db
    .update(link)
    .set({ image: blob.url })
    .where(eq(link.id, profileLinkId))
    .returning();

  if (updated?.link) {
    await redis.set(`profile-link:${updated.link}`, updated, {
      ex: 30 * 60,
    });
  }

  return NextResponse.json({ url: blob.url });
}
