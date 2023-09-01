import { createTRPCRouter } from "@/server/api/trpc";

import { webhookRouter } from "@/server/api/routers/clerk/webhook";

export const clerkRouter = createTRPCRouter({
  webhook: webhookRouter,
});
