import { neon } from '@neondatabase/serverless';
import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'openbio.app';
const ROOT_PARTS_LENGTH = ROOT_DOMAIN.split('.').length;
const IP_REGEX = /^\d+\.\d+\.\d+\.\d+/;

const PASSTHROUGH_PREFIXES = ['/api', '/trpc', '/_next', '/app'];

function isPassthrough(pathname: string) {
  return PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p));
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

  const parts = clean.split('.');
  if (parts.length > ROOT_PARTS_LENGTH) {
    const sub = parts[0];
    if (sub && sub !== 'www') {
      return sub;
    }
  }

  return null;
}

function isCustomDomain(hostname: string) {
  return !hostname.endsWith(ROOT_DOMAIN) && !isPlainLocalhost(hostname);
}

async function resolveCustomDomain(hostname: string): Promise<string | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }
  const sql = neon(dbUrl);
  const rows = await sql(
    'SELECT link FROM link WHERE custom_domain = $1 LIMIT 1',
    [hostname]
  );
  return (rows[0] as { link: string } | undefined)?.link ?? null;
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
  const isAuthPage =
    pathname.startsWith('/app/sign-in') || pathname.startsWith('/app/sign-up');

  if (
    !sessionCookie &&
    !isAuthPage &&
    ['/app', '/create-link'].some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.redirect(
      new URL('/app/sign-up', request.nextUrl.origin)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
