import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { eq, user } from "@/server/db";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.input(z.undefined()).query(async ({ ctx }) => {
    return ctx.db.query.user.findFirst({
      where: eq(user.providerId, ctx.auth.userId),
    });
  }),
});
