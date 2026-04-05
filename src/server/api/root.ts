import { polarRouter } from '@/server/api/routers/polar';
import { profileLinkRouter } from '@/server/api/routers/profile-link';
import { userRouter } from '@/server/api/routers/user';
import { createTRPCRouter } from '@/server/api/trpc';

export const appRouter = createTRPCRouter({
  user: userRouter,
  profileLink: profileLinkRouter,
  polar: polarRouter,
});

export type AppRouter = typeof appRouter;
