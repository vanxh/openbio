import { env } from '@/env.mjs';
import { stripe } from '@/lib/stripe';
import { user } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export const stripeRouter = createTRPCRouter({
  getBillingPortalUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const dbUser = await ctx.db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, ctx.user.id),
    });

    if (!dbUser?.stripeCustomerId) {
      throw new Error('No billing account found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${getBaseUrl()}/app/settings`,
    });

    return session.url;
  }),

  getCheckoutSession: protectedProcedure
    .input(z.object({ billing: z.enum(['monthly', 'annually']) }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
      });

      let customerId = dbUser?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email,
          metadata: { userId: ctx.user.id },
        });
        customerId = customer.id;
        await ctx.db
          .update(user)
          .set({ stripeCustomerId: customer.id })
          .where(eq(user.id, ctx.user.id));
      }

      const priceId =
        input.billing === 'monthly'
          ? env.STRIPE_PRO_MONTHLY_PRICE_ID
          : env.STRIPE_PRO_YEARLY_PRICE_ID;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${getBaseUrl()}/app/settings?success=true`,
        cancel_url: `${getBaseUrl()}/app/settings?canceled=true`,
      });

      return { id: session.id };
    }),
});
