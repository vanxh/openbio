import { exampleRouter } from "@/server/api/routers/example";
import { createTRPCRouter } from "@/server/api/trpc";
import { clerkRouter } from "@/server/api/routers/clerk/webhook";
import { userRouter } from "@/server/api/routers/user";
import { profileLinkRouter } from "@/server/api/routers/profile-link";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  clerk: clerkRouter,
  user: userRouter,
  profileLink: profileLinkRouter,
});

export type AppRouter = typeof appRouter;
