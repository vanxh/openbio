import { db } from '@/server/db/db';
import * as schema from '@/server/db/schema';
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
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string; token: string }) => {
      const { sendEmail } = await import('@/server/emails');
      const VerifyEmail = (await import('@/components/emails/verify-email'))
        .default;
      await sendEmail({
        to: [user.email],
        subject: 'Verify your OpenBio email',
        react: VerifyEmail({ url }),
      });
    },
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string; token: string }) => {
      const { sendEmail } = await import('@/server/emails');
      const ResetPassword = (
        await import('@/components/emails/reset-password')
      ).default;
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
      stripeCustomerId: { type: 'string', required: false },
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
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
