import { aiRouter } from '@/server/api/routers/ai';
import { profileLinkRouter } from '@/server/api/routers/profile-link';
import { userRouter } from '@/server/api/routers/user';
import { createTRPCRouter } from '@/server/api/trpc';

export const appRouter = createTRPCRouter({
  user: userRouter,
  profileLink: profileLinkRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
