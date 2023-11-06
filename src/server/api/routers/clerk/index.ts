import { webhookRouter } from "@/server/api/routers/clerk/webhook";
import { createTRPCRouter } from "@/server/api/trpc";

export const clerkRouter = createTRPCRouter({
  webhook: webhookRouter,
});
