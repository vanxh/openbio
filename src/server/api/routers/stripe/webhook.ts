import * as z from "zod";
import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { sendEmail } from "@/server/emails";
import { stripe } from "@/lib/stripe";
import UpgradedEmail from "@/components/emails/upgraded";
import CancelledEmail from "@/components/emails/cancelled";

export const webhookProcedure = publicProcedure.input(
  z.object({
    event: z.object({
      id: z.string(),
      account: z.string().nullish(),
      created: z.number(),
      data: z.object({
        object: z.record(z.any()),
      }),
      type: z.string(),
    }),
  })
);

export const webhookRouter = createTRPCRouter({
  sessionCompleted: webhookProcedure.mutation(async ({ ctx, input }) => {
    const session = input.event.data.object as Stripe.Checkout.Session;

    if (typeof session.subscription !== "string") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing or invalid subscription id",
      });
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    const stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const user = await ctx.prisma.user.findUnique({
      where: { stripeCustomerId },
    });

    if (!user) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User not found",
      });
    }

    await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "PRO",
        subscriptionId: subscription.id,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      },
    });

    await sendEmail({
      subject: "Thank you for upgrading! 🎉",
      to: [user.email],
      react: UpgradedEmail(),
    });
  }),

  customerSubscriptionDeleted: webhookProcedure.mutation(
    async ({ ctx, input }) => {
      const subscription = input.event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const user = await ctx.prisma.user.update({
        where: { stripeCustomerId: customerId },
        data: {
          plan: "FREE",
          subscriptionId: null,
          subscriptionEndsAt: null,
        },
      });

      await sendEmail({
        subject: "Sad to see you go 😢",
        to: [user.email],
        react: CancelledEmail(),
      });
    }
  ),
});
