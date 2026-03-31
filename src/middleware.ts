import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (
    !sessionCookie &&
    ['/app', '/create-link'].some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )
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
