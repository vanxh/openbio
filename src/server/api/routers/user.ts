import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.input(z.undefined()).query(async ({ ctx }) => {
    return prisma.user.findUnique({
      where: { providerId: ctx.auth.userId },
    });
  }),
});
