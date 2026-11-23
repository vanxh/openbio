import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/upload-limits';
import sharp from 'sharp';

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
]);

/** A problem with the uploaded file that the uploader can fix. */
export class UploadError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

/** Pull the image out of a multipart form, rejecting anything unusable. */
export async function readImageUpload(formData: FormData): Promise<Buffer> {
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    throw new UploadError('Missing file');
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError('Upload a PNG, JPEG, WebP, GIF or AVIF image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `Images must be ${MAX_UPLOAD_LABEL} or smaller.`,
      413
    );
  }

  return Buffer.from(await file.arrayBuffer());
}

/**
 * Re-encode an upload as WebP at a bounded size. Decoding here doubles as
 * validation: a file that merely claims to be an image fails as an
 * `UploadError` instead of an unhandled exception.
 */
export async function optimizeImage(
  input: Buffer,
  options: {
    width: number;
    height: number;
    fit: 'cover' | 'inside';
    quality: number;
    /** Keep every frame of an animated GIF/WebP instead of only the first. */
    animated?: boolean;
  }
): Promise<Buffer> {
  try {
    return await sharp(input, { animated: options.animated ?? false })
      // Apply the EXIF orientation, or phone photos come out sideways once
      // the metadata is stripped.
      .rotate()
      .resize(options.width, options.height, {
        fit: options.fit,
        withoutEnlargement: true,
      })
      .webp({ quality: options.quality })
      .toBuffer();
  } catch {
    throw new UploadError('That file could not be read as an image.');
  }
}

/** JSON error response for a failed upload; rethrows anything unexpected. */
export function uploadErrorResponse(error: unknown): Response {
  if (error instanceof UploadError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
