/**
 * A post-auth destination taken from the query string, limited to paths on
 * this site. Anything that could leave the origin (`//evil.com`, `/\evil.com`,
 * an absolute URL) falls back to the dashboard.
 */
export function getSafeRedirect(
  raw: string | null | undefined,
  fallback = '/app'
): string {
  if (!raw?.startsWith('/') || raw.startsWith('//')) {
    return fallback;
  }
  // Browsers treat backslashes as slashes and strip tabs/newlines from URLs,
  // either of which can turn a path into a protocol-relative URL.
  if (raw.includes('\\') || hasControlCharacter(raw)) {
    return fallback;
  }
  return raw;
}

function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/** Append `redirectUrl` to an auth page path when it is not the default. */
export function withRedirect(path: string, redirect: string): string {
  return redirect === '/app'
    ? path
    : `${path}?redirectUrl=${encodeURIComponent(redirect)}`;
}
