import { createTRPCRouter } from "@/server/api/trpc";
import { clerkRouter } from "@/server/api/routers/clerk";
import { stripeRouter } from "@/server/api/routers/stripe";

export const serverlessRouter = createTRPCRouter({
  clerk: clerkRouter,
  stripe: stripeRouter,
});
