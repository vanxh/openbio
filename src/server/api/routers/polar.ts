import { polar } from '@/lib/polar';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import * as z from 'zod';

export const polarRouter = createTRPCRouter({
  getCustomerPortalUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, ctx.user.id),
      columns: { polarCustomerId: true },
    });

    if (!user?.polarCustomerId) {
      throw new Error('No subscription found');
    }

    const session = await polar.customerSessions.create({
      customerId: user.polarCustomerId,
    });

    return { url: session.customerPortalUrl };
  }),

  getCheckoutUrl: protectedProcedure
    .input(z.object({ billing: z.enum(['monthly', 'annually']) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
        columns: { email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const productId =
        input.billing === 'monthly'
          ? (process.env.POLAR_PRO_MONTHLY_PRODUCT_ID ?? '')
          : (process.env.POLAR_PRO_YEARLY_PRODUCT_ID ?? '');

      const checkout = await polar.checkouts.create({
        products: [productId],
        customerEmail: user.email,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://openbio.app'}/app`,
      });

      return { url: checkout.url };
    }),
});
