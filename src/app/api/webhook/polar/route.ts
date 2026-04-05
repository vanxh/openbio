import CancelledEmail from '@/components/emails/cancelled';
import UpgradedEmail from '@/components/emails/upgraded';
import { db } from '@/server/db/db';
import { user } from '@/server/db/schema';
import { sendEmail } from '@/server/emails';
import { Webhooks } from '@polar-sh/nextjs';
import { eq } from 'drizzle-orm';

async function findUserByEmail(email: string) {
  return db.query.user.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? '',

  onSubscriptionCreated: async (payload) => {
    const sub = payload.data;
    const email = sub.customer.email;

    if (!email) {
      return;
    }

    const found = await findUserByEmail(email);
    if (!found) {
      return;
    }

    await db
      .update(user)
      .set({
        plan: 'pro',
        polarCustomerId: sub.customerId,
        subscriptionId: sub.id,
        subscriptionEndsAt: sub.currentPeriodEnd,
      })
      .where(eq(user.id, found.id));

    await sendEmail({
      to: [email],
      subject: "You've upgraded to OpenBio Pro!",
      react: UpgradedEmail(),
    });
  },

  onSubscriptionActive: async (payload) => {
    const sub = payload.data;
    const email = sub.customer.email;

    if (!email) {
      return;
    }

    const found = await findUserByEmail(email);
    if (!found) {
      return;
    }

    await db
      .update(user)
      .set({
        plan: 'pro',
        subscriptionId: sub.id,
        subscriptionEndsAt: sub.currentPeriodEnd,
      })
      .where(eq(user.id, found.id));
  },

  onSubscriptionCanceled: async (payload) => {
    const sub = payload.data;
    const email = sub.customer.email;

    if (!email) {
      return;
    }

    const found = await findUserByEmail(email);
    if (!found) {
      return;
    }

    await db
      .update(user)
      .set({
        plan: 'free',
        subscriptionId: null,
        subscriptionEndsAt: null,
      })
      .where(eq(user.id, found.id));

    await sendEmail({
      to: [email],
      subject: 'Your OpenBio Pro subscription has been cancelled',
      react: CancelledEmail(),
    });
  },

  onSubscriptionRevoked: async (payload) => {
    const sub = payload.data;
    const email = sub.customer.email;

    if (!email) {
      return;
    }

    const found = await findUserByEmail(email);
    if (!found) {
      return;
    }

    await db
      .update(user)
      .set({
        plan: 'free',
        subscriptionId: null,
        subscriptionEndsAt: null,
      })
      .where(eq(user.id, found.id));
  },
});
