import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware } from "@clerk/nextjs";

import { env } from "@/env.mjs";

const before = (req: NextRequest) => {
  const url = req.nextUrl.clone();

  if (url.pathname.includes("api/trpc")) {
    return NextResponse.next();
  }

  const host = req.headers.get("host");
  const subdomain = getValidSubdomain(host);
  if (subdomain) {
    // TODO
  }

  return NextResponse.next();
};

export const getValidSubdomain = (host?: string | null) => {
  let subdomain: string | null = null;
  if (!host && typeof window !== "undefined") {
    host = window.location.host;
  }

  if (host && host.includes(".") && !host.includes(".vercel.app")) {
    const candidate = host.split(".")[0];
    if (candidate && !candidate.includes("www")) {
      subdomain = candidate;
    }
  }

  if (
    host &&
    !(host?.includes(env.NEXT_PUBLIC_URL) || host?.endsWith(".vercel.app"))
  ) {
    subdomain = host;
  }

  return subdomain;
};

export default authMiddleware({
  publicRoutes: ["/", "/api", "/api/(.*)", "/:link"],
  beforeAuth: before,
  afterAuth: (auth, req) => {
    if (
      !auth.userId &&
      ["/app", "/create-link"].includes(req.nextUrl.pathname)
    ) {
      return NextResponse.redirect(new URL("/sign-up", req.nextUrl.origin));
    }
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
