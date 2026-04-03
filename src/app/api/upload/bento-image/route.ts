import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const FILE_EXT_RE = /\.\w+$/;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const optimized = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const optimizedFile = new File(
    [new Uint8Array(optimized)],
    file.name.replace(FILE_EXT_RE, '.webp'),
    { type: 'image/webp' }
  );

  const blob = await put(
    `bento-images/${session.user.id}/${crypto.randomUUID()}-${optimizedFile.name}`,
    optimizedFile,
    { access: 'public' }
  );

  return NextResponse.json({ url: blob.url });
}
