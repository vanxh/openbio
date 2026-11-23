/**
 * Loader for every `next/image` in the app (wired up in `next.config.mjs`).
 *
 * Cards show images from anywhere: link previews, album art, avatars, map
 * tiles. Allowing the built-in optimizer to fetch any host turns
 * `/_next/image` into an open proxy that anyone can drive at our expense, so
 * it is limited to images we host. Everything else is loaded straight from
 * its own server, exactly as a plain `<img>` would.
 */

/** Where uploads live (see `src/app/api/upload`). Keep in sync with `remotePatterns`. */
const OPTIMIZED_HOST_SUFFIX = '.public.blob.vercel-storage.com';

export function isOptimizable(src: string): boolean {
  // Our own static assets and imported images.
  if (src.startsWith('/') && !src.startsWith('//')) {
    return true;
  }
  try {
    const { protocol, hostname } = new URL(src);
    return protocol === 'https:' && hostname.endsWith(OPTIMIZED_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!isOptimizable(src)) {
    return src;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
