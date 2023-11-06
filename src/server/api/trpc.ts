import type { NextRequest } from "next/server";
import type {
  SignedInAuthObject,
  SignedOutAuthObject,
} from "@clerk/nextjs/api";
import { getAuth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError, type inferAsyncReturnType } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/server/db";

type CreateContextOptions = {
  auth: SignedInAuthObject | SignedOutAuthObject | null;
  req: NextRequest;
};

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    ...opts,
    db,
  };
};

export const createTRPCContext = (opts: { req: NextRequest }) => {
  const auth = getAuth(opts.req);

  return createInnerTRPCContext({
    auth,
    req: opts.req,
  });
};

export type Context = inferAsyncReturnType<typeof createTRPCContext>;

const t = initTRPC.context<typeof createTRPCContext>().create({
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

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      auth: {
        ...ctx.auth,
        userId: ctx.auth.userId,
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
