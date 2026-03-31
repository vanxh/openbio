import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

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

  const blob = await put(
    `bento-images/${session.user.id}/${crypto.randomUUID()}-${file.name}`,
    file,
    { access: 'public' }
  );

  return NextResponse.json({ url: blob.url });
}
