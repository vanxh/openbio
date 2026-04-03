import { auth } from '@/lib/auth';
import type { Ratelimit } from '@upstash/ratelimit';
import { db } from '@/server/db/db';
import { TRPCError, initTRPC } from '@trpc/server';
import type { NextRequest } from 'next/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

export const createTRPCContext = async (opts: { req: NextRequest }) => {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: opts.req.headers });
  } catch {
    // Session fetch can fail in dev when DB connection is slow
  }
  return { db, session, req: opts.req };
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: { session: ctx.session, user: ctx.session.user },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    'unknown'
  );
}

export function createRateLimitedProcedure(limiter: Ratelimit) {
  return t.procedure.use(async ({ ctx, next }) => {
    const ip = getIp(ctx.req);
    const { success } = await limiter.limit(ip);
    if (!success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      });
    }
    return next();
  });
}
