import { clerkRouter } from "@/server/api/routers/clerk";
import { stripeRouter } from "@/server/api/routers/stripe";
import { createTRPCRouter } from "@/server/api/trpc";

export const serverlessRouter = createTRPCRouter({
  clerk: clerkRouter,
  stripe: stripeRouter,
});
