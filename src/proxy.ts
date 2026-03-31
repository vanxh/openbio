import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const pathname = request.nextUrl.pathname;
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
