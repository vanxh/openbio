import { getBillingState } from '@/lib/billing';
import { polar } from '@/lib/polar';
import { db } from '@/server/db/db';
import * as schema from '@/server/db/schema';
import {
  checkout,
  polar as polarPlugin,
  portal,
  webhooks,
} from '@polar-sh/better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

/** The fields of a Polar subscription webhook payload that we act on. */
type PolarSubscription = {
  id: string;
  status: string;
  productId: string;
  currentPeriodEnd: Date | null;
  customerId: string;
  customer: { email?: string | null; externalId?: string | null };
};

const PLAN_LABELS = { pro: 'Pro', business: 'Business' } as const;

/**
 * Find the user a subscription belongs to. The Polar customer is created with
 * our user id as its external id; email is the fallback for customers that
 * predate that link.
 */
async function findSubscriptionUser(subscription: PolarSubscription) {
  const { externalId, email } = subscription.customer;

  if (externalId) {
    const byId = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, externalId),
    });
    if (byId) {
      return byId;
    }
  }

  if (!email) {
    return null;
  }
  return db.query.user.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });
}

/**
 * Bring the user's plan in line with their Polar subscription. Called for
 * every subscription event, so the outcome depends only on the subscription's
 * current state. Sends the upgrade email the first time a free account
 * becomes paid.
 */
async function syncSubscription(subscription: PolarSubscription) {
  const found = await findSubscriptionUser(subscription);
  if (!found) {
    return;
  }

  const next = getBillingState(subscription, {
    plan: found.plan,
    subscriptionId: found.subscriptionId,
    subscriptionEndsAt: found.subscriptionEndsAt,
  });
  if (!next) {
    return;
  }

  const { eq } = await import('drizzle-orm');
  await db
    .update(schema.user)
    .set({ ...next, polarCustomerId: subscription.customerId })
    .where(eq(schema.user.id, found.id));

  if (found.plan === 'free' && next.plan !== 'free') {
    const { sendEmail } = await import('@/server/emails');
    const UpgradedEmail = (await import('@/components/emails/upgraded'))
      .default;
    await sendEmail({
      to: [found.email],
      subject: `You've upgraded to OpenBio ${PLAN_LABELS[next.plan]}!`,
      react: UpgradedEmail(),
    });
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({
      user,
      url,
    }: { user: { email: string }; url: string; token: string }) => {
      const { sendEmail } = await import('@/server/emails');
      const ResetPassword = (await import('@/components/emails/reset-password'))
        .default;
      await sendEmail({
        to: [user.email],
        subject: 'Reset your OpenBio password',
        react: ResetPassword({ url }),
      });
    },
  },
  // Better Auth reads the verification sender from here, not from
  // `emailAndPassword`; left there it is silently ignored and nobody who
  // signs up with a password can ever verify or sign in.
  emailVerification: {
    sendOnSignUp: true,
    // Someone who lost the first email gets a fresh link by trying to sign in.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: { user: { email: string }; url: string; token: string }) => {
      const { sendEmail } = await import('@/server/emails');
      const VerifyEmail = (await import('@/components/emails/verify-email'))
        .default;
      await sendEmail({
        to: [user.email],
        subject: 'Verify your OpenBio email',
        react: VerifyEmail({ url }),
      });
    },
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      plan: { type: 'string', defaultValue: 'free' },
      polarCustomerId: { type: 'string', required: false },
      subscriptionId: { type: 'string', required: false },
      subscriptionEndsAt: { type: 'date', required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const { sendEmail } = await import('@/server/emails');
          const Welcome = (await import('@/components/emails/welcome')).default;
          await sendEmail({
            to: [user.email],
            subject: 'Welcome to OpenBio!',
            react: Welcome({ name: user.name }),
          });
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    polarPlugin({
      client: polar,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_PRO_MONTHLY_PRODUCT_ID ?? '',
              slug: 'pro-monthly',
            },
            {
              productId: process.env.POLAR_PRO_YEARLY_PRODUCT_ID ?? '',
              slug: 'pro-yearly',
            },
            {
              productId: process.env.POLAR_BUSINESS_MONTHLY_PRODUCT_ID ?? '',
              slug: 'business-monthly',
            },
            {
              productId: process.env.POLAR_BUSINESS_YEARLY_PRODUCT_ID ?? '',
              slug: 'business-yearly',
            },
          ],
          successUrl: '/app?upgraded=true',
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET ?? '',
          // `subscription.updated` is Polar's catch-all: it fires for every
          // change, including renewals, which have no other subscription
          // event we handle. The specific events are synced too, so a missed
          // or reordered delivery still converges on the right state.
          onSubscriptionCreated: (payload) => syncSubscription(payload.data),
          onSubscriptionActive: (payload) => syncSubscription(payload.data),
          onSubscriptionUpdated: (payload) => syncSubscription(payload.data),
          onSubscriptionUncanceled: (payload) => syncSubscription(payload.data),
          onSubscriptionRevoked: (payload) => syncSubscription(payload.data),
          // Cancelling keeps the plan until the paid period runs out (the
          // subscription stays `active` until then), so this only syncs and
          // confirms by email; `revoked` is what ends access.
          onSubscriptionCanceled: async (payload) => {
            await syncSubscription(payload.data);

            const email = payload.data.customer.email;
            if (!email) {
              return;
            }
            const { sendEmail } = await import('@/server/emails');
            const CancelledEmail = (
              await import('@/components/emails/cancelled')
            ).default;
            await sendEmail({
              to: [email],
              subject: 'Your OpenBio subscription has been cancelled',
              react: CancelledEmail(),
            });
          },
        }),
      ],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
