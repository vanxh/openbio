/** Schemes a visitor can safely be sent to from a profile. */
export const LINK_PROTOCOLS: ReadonlySet<string> = new Set([
  'http:',
  'https:',
  'mailto:',
  'tel:',
]);

/** Schemes that can be embedded or fetched as a web page. */
export const WEB_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);

const KNOWN_SCHEME_RE = /^(?:https?|mailto|tel):/i;
// Any other `scheme:` prefix. The digit lookahead keeps `example.com:8080`
// (a host and port) from being read as a scheme.
const OTHER_SCHEME_RE = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

/**
 * Turn text a person typed into an absolute URL that is safe to link to, or
 * null if it cannot be one. A bare `example.com/page` becomes https, and
 * anything outside `protocols` (`javascript:`, `data:`, …) is rejected.
 */
export function toSafeUrl(
  raw: string,
  protocols: ReadonlySet<string> = LINK_PROTOCOLS
): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const hasScheme = KNOWN_SCHEME_RE.test(value) || OTHER_SCHEME_RE.test(value);
  const candidate = hasScheme ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (!protocols.has(url.protocol)) {
    return null;
  }

  // "hello" parses as https://hello/, which is never what was meant.
  const isWeb = url.protocol === 'http:' || url.protocol === 'https:';
  if (isWeb && !url.hostname.includes('.') && url.hostname !== 'localhost') {
    return null;
  }

  return url.href;
}

/**
 * True when `hostname` is `domain` itself or one of its subdomains. Substring
 * checks are not enough: "netflix.com" contains "x.com", and
 * "cal.com.evil.net" contains "cal.com".
 */
export function isHostOf(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}
