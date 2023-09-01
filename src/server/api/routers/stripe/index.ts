import * as z from "zod";
import { type User } from "@prisma/client";

import { env } from "@/env.mjs";
import { stripe } from "@/stripe";
import { prisma } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { webhookRouter } from "@/server/api/routers/stripe/webhook";

const getStripeCustomer = async (user: User) => {
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.firstName + " " + user.lastName,
      metadata: {
        id: user.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return customer;
  }

  return stripe.customers.retrieve(user.stripeCustomerId);
};

export const stripeRouter = createTRPCRouter({
  webhook: webhookRouter,

  getBillingPortalUrl: protectedProcedure
    .input(z.undefined())
    .mutation(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { providerId: ctx.auth.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const customer = await getStripeCustomer(user);

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { providerId: ctx.auth.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const customer = await getStripeCustomer(user);

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
