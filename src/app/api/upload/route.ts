import { auth } from '@/lib/auth';
import {
  optimizeImage,
  readImageUpload,
  uploadErrorResponse,
} from '@/lib/image-upload';
import { db, eq, invalidateProfileLinkCache } from '@/server/db';
import { link } from '@/server/db/schema';
import { del, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const profileLinkId = formData.get('profileLinkId');

  if (typeof profileLinkId !== 'string' || !profileLinkId) {
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

  let optimized: Buffer;
  try {
    const input = await readImageUpload(formData);
    optimized = await optimizeImage(input, {
      width: 400,
      height: 400,
      fit: 'cover',
      quality: 85,
    });
  } catch (error) {
    return uploadErrorResponse(error);
  }

  // A fresh name per upload, so browsers and the CDN never serve the old
  // avatar from cache under the new one's URL.
  const blob = await put(
    `avatars/${profileLinkId}/${crypto.randomUUID()}.webp`,
    optimized,
    { access: 'public', contentType: 'image/webp' }
  );

  const [updated] = await db
    .update(link)
    .set({ image: blob.url, updatedAt: new Date() })
    .where(eq(link.id, profileLinkId))
    .returning({ link: link.link });

  if (updated) {
    await invalidateProfileLinkCache(updated.link);
  }

  // Remove the previous avatar only now that the new one is saved: deleting
  // it first would leave the profile pointing at nothing if this upload failed.
  if (profileLink.image) {
    await del(profileLink.image).catch(() => undefined);
  }

  return NextResponse.json({ url: blob.url });
}
