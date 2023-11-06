import * as z from "zod";
import WelcomeEmail from "@/components/emails/welcome";
import { clerkEvent } from "@/server/api/routers/clerk/type";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { user } from "@/server/db";
import { sendEmail } from "@/server/emails";

export const webhookProcedure = publicProcedure.input(
  z.object({
    data: clerkEvent,
  }),
);

export const webhookRouter = createTRPCRouter({
  userCreated: webhookProcedure.mutation(async ({ input, ctx }) => {
    if (input.data.type === "user.created") {
      const email = input.data.data.email_addresses[0]?.email_address;
      const firstName = input.data.data.first_name;
      const lastName = input.data.data.last_name;

      if (!email) throw new Error("No email provided");

      const exists = await ctx.db.query.user.findFirst({
        where: (user, { eq }) => eq(user.providerId, input.data.data.id),
        columns: {
          id: true,
        },
      });
      if (exists) return;

      await ctx.db.insert(user).values({
        providerId: input.data.data.id,
        email,
        firstName,
        lastName,
      });

      await sendEmail({
        subject: "Welcome to OpenBio.app 👋",
        to: [email],
        react: WelcomeEmail(),
      });
    }
  }),

  userUpdated: webhookProcedure.mutation((opts) => {
    if (opts.input.data.type === "user.updated") {
      // TODO: Update user
    }
  }),

  userSignedIn: webhookProcedure.mutation(({ input, ctx }) => {
    if (input.data.type === "session.created") {
      const res = ctx.db.query.user.findFirst({
        where: (user, { eq }) => eq(user.providerId, input.data.data.id),
        columns: {
          id: true,
        },
      });

      return res;
    }
  }),
});
