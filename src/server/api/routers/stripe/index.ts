import { createTRPCRouter } from "@/server/api/trpc";

import { webhookRouter } from "@/server/api/routers/stripe/webhook";

export const stripeRouter = createTRPCRouter({
  webhook: webhookRouter,
});
