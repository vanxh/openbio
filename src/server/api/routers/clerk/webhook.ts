import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { clerkEvent } from "@/server/api/routers/clerk/type";
// import { sendEmail } from "@/server/emails";
// import WelcomeEmail from "@/components/emails/welcome";

export const webhookProcedure = publicProcedure.input(
  z.object({
    data: clerkEvent,
  })
);

export const webhookRouter = createTRPCRouter({
  userCreated: webhookProcedure.mutation(async ({ input, ctx }) => {
    if (input.data.type === "user.created") {
      const email = input.data.data.email_addresses[0]?.email_address;
      const firstName = input.data.data.first_name;
      const lastName = input.data.data.last_name;

      if (!email) throw new Error("No email provided");

      const user = await ctx.prisma.user.create({
        data: {
          providerId: input.data.data.id,
          email,
          firstName,
          lastName,
        },
        select: {
          id: true,
        },
      });

      // TODO: Send email. NEXT JS APP ROUTER IS ACTING WEIRD.
      // await sendEmail({
      //   subject: "Welcome to OpenBio.app 👋",
      //   to: [email],
      //   react: WelcomeEmail(),
      // });

      return user;
    }
  }),

  userUpdated: webhookProcedure.mutation((opts) => {
    if (opts.input.data.type === "user.updated") {
      // TODO: Update user
    }
  }),

  userSignedIn: webhookProcedure.mutation(({ input, ctx }) => {
    if (input.data.type === "session.created") {
      const user = ctx.prisma.user.findUnique({
        where: {
          providerId: input.data.data.user_id,
        },
        select: {
          id: true,
        },
      });

      return user;
    }
  }),
});

export const clerkRouter = createTRPCRouter({
  webhooks: webhookRouter,
});
