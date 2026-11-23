import { auth } from '@/lib/auth';
import {
  optimizeImage,
  readImageUpload,
  uploadErrorResponse,
} from '@/lib/image-upload';
import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let optimized: Buffer;
  try {
    const input = await readImageUpload(await request.formData());
    optimized = await optimizeImage(input, {
      width: 1200,
      height: 1200,
      fit: 'inside',
      quality: 80,
      animated: true,
    });
  } catch (error) {
    return uploadErrorResponse(error);
  }

  // The stored name is ours, not the uploader's: file names can carry path
  // separators and other characters that do not belong in a blob key.
  const blob = await put(
    `bento-images/${session.user.id}/${crypto.randomUUID()}.webp`,
    optimized,
    { access: 'public', contentType: 'image/webp' }
  );

  return NextResponse.json({ url: blob.url });
}
