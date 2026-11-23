import { neon } from '@neondatabase/serverless';
import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'openbio.app';
const IP_REGEX = /^\d+\.\d+\.\d+\.\d+/;
const PORT_RE = /:\d+$/;

const PASSTHROUGH_PREFIXES = ['/api', '/trpc', '/_next', '/app', '/admin'];

// Pages under /app that must work signed out.
const PUBLIC_APP_PAGES = [
  '/app/sign-in',
  '/app/sign-up',
  '/app/reset-password',
];

// Sections that need a session. Matched as whole path segments (see
// `isUnder`), because profile slugs share the namespace: `/appleseed` is
// someone's public page, not part of `/app`.
const PROTECTED_PREFIXES = ['/app', '/create-link'];

/** True when `pathname` is `prefix` itself or a path inside it. */
function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPassthrough(pathname: string) {
  return PASSTHROUGH_PREFIXES.some((p) => isUnder(pathname, p));
}

function isPlainLocalhost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname.startsWith('localhost:') ||
    IP_REGEX.test(hostname)
  );
}

function getSubdomain(hostname: string): string | null {
  if (isPlainLocalhost(hostname)) {
    return null;
  }

  const clean = hostname.replace(`:${process.env.PORT ?? 3000}`, '');

  // Local dev: vanxh.localhost → ['vanxh', 'localhost']
  if (clean.endsWith('.localhost')) {
    const sub = clean.replace('.localhost', '');
    if (sub && sub !== 'www') {
      return sub;
    }
    return null;
  }

  // Only extract subdomains from the root domain
  if (!clean.endsWith(`.${ROOT_DOMAIN}`)) {
    return null;
  }

  const sub = clean.replace(`.${ROOT_DOMAIN}`, '');
  if (sub && sub !== 'www') {
    return sub;
  }

  return null;
}

function isCustomDomain(hostname: string) {
  if (isPlainLocalhost(hostname)) {
    return false;
  }
  const host = stripPort(hostname);
  // `endsWith(ROOT_DOMAIN)` alone would also match "notopenbio.app".
  const isOurs = host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`);
  // Preview deployments are ours too, and never a customer's domain.
  return !(isOurs || host.endsWith('.vercel.app'));
}

function stripPort(hostname: string) {
  return hostname.toLowerCase().replace(PORT_RE, '');
}

// Custom-domain lookups hit the database on every page view of that domain.
// Function instances are reused across requests, so a short-lived in-memory
// cache removes nearly all of them. Misses are cached as well, which keeps
// stray hostnames pointed at the app from querying on every request.
const DOMAIN_CACHE_TTL_MS = 60_000;
const DOMAIN_CACHE_MAX = 1000;
const domainCache = new Map<string, { slug: string | null; expires: number }>();

async function resolveCustomDomain(hostname: string): Promise<string | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }

  const host = stripPort(hostname);
  const cached = domainCache.get(host);
  if (cached && cached.expires > Date.now()) {
    return cached.slug;
  }

  const sql = neon(dbUrl);
  // Case-insensitive, matching how the API checks whether a domain is taken:
  // a row saved with capitals must resolve to the same single profile.
  const rows = await sql(
    'SELECT link FROM link WHERE lower(custom_domain) = $1 ORDER BY created_at LIMIT 1',
    [host]
  );
  const slug = (rows[0] as { link: string } | undefined)?.link ?? null;

  if (domainCache.size >= DOMAIN_CACHE_MAX) {
    domainCache.clear();
  }
  domainCache.set(host, { slug, expires: Date.now() + DOMAIN_CACHE_TTL_MS });

  return slug;
}

function rewriteToProfile(request: NextRequest, slug: string) {
  const url = request.nextUrl.clone();
  const pathname = request.nextUrl.pathname;
  url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;

  // --- Subdomain rewrite: vanxh.openbio.app → /vanxh ---
  const subdomain = getSubdomain(hostname);
  if (subdomain) {
    if (isPassthrough(pathname)) {
      return NextResponse.next();
    }
    return rewriteToProfile(request, subdomain);
  }

  // --- Custom domain rewrite: mycool.site → /{link} ---
  if (isCustomDomain(hostname)) {
    if (isPassthrough(pathname)) {
      return NextResponse.next();
    }
    const linkSlug = await resolveCustomDomain(hostname);
    if (!linkSlug) {
      return NextResponse.next();
    }
    return rewriteToProfile(request, linkSlug);
  }

  // --- Auth guard ---
  const sessionCookie = getSessionCookie(request);
  const isPublicAppPage = PUBLIC_APP_PAGES.some((p) => isUnder(pathname, p));
  const isProtected = PROTECTED_PREFIXES.some((p) => isUnder(pathname, p));

  if (!sessionCookie && isProtected && !isPublicAppPage) {
    const signUp = new URL('/app/sign-up', request.nextUrl.origin);
    // Remember where they were headed (a claimed profile name, say) so
    // signing up returns them there instead of to an empty dashboard.
    if (pathname !== '/app') {
      signUp.searchParams.set(
        'redirectUrl',
        `${pathname}${request.nextUrl.search}`
      );
    }
    return NextResponse.redirect(signUp);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
