/** Where uploads live (see `src/app/api/upload`). Keep in sync with `images.remotePatterns`. */
const OPTIMIZED_HOST_SUFFIX = '.public.blob.vercel-storage.com';

/**
 * Whether an image may go through Next's image optimizer: only our own
 * static assets and the uploads we host. `next.config.mjs` allows the
 * optimizer to fetch nothing else, because a wildcard there turns
 * `/_next/image` into an open proxy anyone can drive at our expense.
 */
export function isOptimizable(src: string): boolean {
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
