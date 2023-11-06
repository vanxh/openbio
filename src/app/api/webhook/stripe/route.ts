import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { stripe } from "@/lib/stripe";
import { serverlessRouter } from "@/server/api/serverless";
import { createTRPCContext } from "@/server/api/trpc";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    const ctx = createTRPCContext({ req });
    const caller = serverlessRouter.createCaller(ctx);

    switch (event.type) {
      case "checkout.session.completed":
        await caller.stripe.webhook.sessionCompleted({ event });
        break;

      case "customer.subscription.deleted":
        await caller.stripe.webhook.customerSubscriptionDeleted({
          event,
        });
        break;

      default:
        console.error(`Unhandled event type: ${event.type}`);
        return null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
