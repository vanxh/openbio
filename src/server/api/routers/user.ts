import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { db } from '@/server/db/db';
import { user as userTable } from '@/server/db/schema';
import { isUserPremium } from '@/server/db/utils/user';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ctx.user.id),
    });
  }),

  startTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    if (isUserPremium(user)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You already have Pro access.',
      });
    }

    if (user.trialEndsAt) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You have already used your free trial.',
      });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    await db
      .update(userTable)
      .set({ trialEndsAt })
      .where(eq(userTable.id, user.id));

    return { trialEndsAt };
  }),

  updateEmailDigest: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(userTable)
        .set({ emailDigest: input.enabled })
        .where(eq(userTable.id, ctx.user.id));
      return { emailDigest: input.enabled };
    }),
});
