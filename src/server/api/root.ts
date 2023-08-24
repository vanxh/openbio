import { exampleRouter } from "@/server/api/routers/example";
import { createTRPCRouter } from "@/server/api/trpc";
import { clerkRouter } from "@/server/api/routers/clerk/webhook";
import { profileLinkRouter } from "./routers/profile-link";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  clerk: clerkRouter,
  profileLink: profileLinkRouter,
});

export type AppRouter = typeof appRouter;
