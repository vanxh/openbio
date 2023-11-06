import { type IncomingHttpHeaders } from "http";
import { NextResponse, type NextRequest } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook, type WebhookRequiredHeaders } from "svix";
import { env } from "@/env.mjs";
import { clerkEvent } from "@/server/api/routers/clerk/type";
import { serverlessRouter } from "@/server/api/serverless";
import { createTRPCContext } from "@/server/api/trpc";

export async function POST(req: NextRequestWithSvixRequiredHeaders) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await req.json();
  const parsed = clerkEvent.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
  const payload = parsed.data;

  const headers = Object.fromEntries(req.headers.entries());
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  try {
    if (env.NODE_ENV === "production") {
      wh.verify(JSON.stringify(json), headers) as WebhookEvent;
    }
  } catch (_) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const ctx = createTRPCContext({ req });
  const caller = serverlessRouter.createCaller(ctx);
  const event = payload.type;

  switch (event) {
    case "user.created":
      await caller.clerk.webhook.userCreated({ data: payload });
      break;
    case "user.updated":
      await caller.clerk.webhook.userUpdated({ data: payload });
    case "user.deleted":
      break;

    case "session.created":
      await caller.clerk.webhook.userSignedIn({ data: payload });
      break;
    case "session.revoked":
    case "session.removed":
    case "session.ended":
      break;

    case "organization.created":
    case "organizationMembership.created":
      break;

    default:
      console.error(`${event as string} is not a valid event`);
      return null;
  }

  return NextResponse.json({ success: true });
}

type NextRequestWithSvixRequiredHeaders = NextRequest & {
  headers: IncomingHttpHeaders & WebhookRequiredHeaders;
};
