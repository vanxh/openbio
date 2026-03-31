import { profileLinkRouter } from '@/server/api/routers/profile-link';
import { stripeRouter } from '@/server/api/routers/stripe';
import { userRouter } from '@/server/api/routers/user';
import { createTRPCRouter } from '@/server/api/trpc';

export const appRouter = createTRPCRouter({
  user: userRouter,
  profileLink: profileLinkRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
