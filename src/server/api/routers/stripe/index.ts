import * as z from "zod";
import { env } from "@/env.mjs";
import { stripe } from "@/lib/stripe";
import { webhookRouter } from "@/server/api/routers/stripe/webhook";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db, eq, user } from "@/server/db";

const getStripeCustomer = async ({
  id,
  email,
  firstName,
  lastName,
  stripeCustomerId,
}: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  stripeCustomerId: string | null;
}) => {
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: email,
      name: firstName + " " + lastName,
      metadata: {
        id: id,
      },
    });

    await db
      .update(user)
      .set({
        stripeCustomerId: customer.id,
      })
      .where(eq(user.id, id));

    return customer;
  }

  return stripe.customers.retrieve(stripeCustomerId!);
};

export const stripeRouter = createTRPCRouter({
  webhook: webhookRouter,

  getBillingPortalUrl: protectedProcedure
    .input(z.undefined())
    .mutation(async ({ ctx }) => {
      const res = await ctx.db.query.user.findFirst({
        where: (user, { eq }) => eq(user.providerId, ctx.auth.userId),
      });

      if (!res) {
        throw new Error("User not found");
      }

      const customer = await getStripeCustomer(res);

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${env.NEXT_PUBLIC_URL}/app`,
      });

      return portalSession.url;
    }),

  getCheckoutSession: protectedProcedure
    .input(
      z.object({
        billing: z.enum(["monthly", "annually"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db.query.user.findFirst({
        where: (user, { eq }) => eq(user.providerId, ctx.auth.userId),
      });

      if (!res) {
        throw new Error("User not found");
      }

      const customer = await getStripeCustomer(res);

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        line_items: [
          {
            price:
              input.billing === "monthly"
                ? env.STRIPE_PRO_MONTHLY_PRICE_ID
                : env.STRIPE_PRO_YEARLY_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${env.NEXT_PUBLIC_URL}/app`,
        cancel_url: `${env.NEXT_PUBLIC_URL}/app`,
      });

      return session;
    }),
});
