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
          ],
          successUrl: '/app?upgraded=true',
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET ?? '',
          onSubscriptionCreated: async (payload) => {
            const sub = payload.data;
            const email = sub.customer.email;
            if (!email) {
              return;
            }

            const { eq } = await import('drizzle-orm');
            const found = await db.query.user.findFirst({
              where: (u, { eq }) => eq(u.email, email),
            });
            if (!found) {
              return;
            }

            await db
              .update(schema.user)
              .set({
                plan: 'pro',
                polarCustomerId: sub.customerId,
                subscriptionId: sub.id,
                subscriptionEndsAt: sub.currentPeriodEnd,
              })
              .where(eq(schema.user.id, found.id));

            const { sendEmail } = await import('@/server/emails');
            const UpgradedEmail = (await import('@/components/emails/upgraded'))
              .default;
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

            const { eq } = await import('drizzle-orm');
            const found = await db.query.user.findFirst({
              where: (u, { eq }) => eq(u.email, email),
            });
            if (!found) {
              return;
            }

            await db
              .update(schema.user)
              .set({
                plan: 'pro',
                subscriptionId: sub.id,
                subscriptionEndsAt: sub.currentPeriodEnd,
              })
              .where(eq(schema.user.id, found.id));
          },
          onSubscriptionCanceled: async (payload) => {
            const sub = payload.data;
            const email = sub.customer.email;
            if (!email) {
              return;
            }

            const { eq } = await import('drizzle-orm');
            const found = await db.query.user.findFirst({
              where: (u, { eq }) => eq(u.email, email),
            });
            if (!found) {
              return;
            }

            await db
              .update(schema.user)
              .set({
                plan: 'free',
                subscriptionId: null,
                subscriptionEndsAt: null,
              })
              .where(eq(schema.user.id, found.id));

            const { sendEmail } = await import('@/server/emails');
            const CancelledEmail = (
              await import('@/components/emails/cancelled')
            ).default;
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

            const { eq } = await import('drizzle-orm');
            const found = await db.query.user.findFirst({
              where: (u, { eq }) => eq(u.email, email),
            });
            if (!found) {
              return;
            }

            await db
              .update(schema.user)
              .set({
                plan: 'free',
                subscriptionId: null,
                subscriptionEndsAt: null,
              })
              .where(eq(schema.user.id, found.id));
          },
        }),
      ],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
