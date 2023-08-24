import { exampleRouter } from "@/server/api/routers/example";
import { createTRPCRouter } from "@/server/api/trpc";
import { clerkRouter } from "@/server/api/routers/clerk/webhook";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  clerk: clerkRouter,
});

export type AppRouter = typeof appRouter;
