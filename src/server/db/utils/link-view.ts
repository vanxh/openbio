import { kv } from "@vercel/kv";
import { eq, sql } from "..";
import { db } from "../db";
import { linkView } from "../schema";

export const getProfileLinkViews = async (linkId: string) => {
  const cached = await kv.get<number | null>(`profile-link-views:${linkId}`);

  if (cached) {
    return cached;
  }

  const views = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(linkView)
    .where(eq(linkView.linkId, linkId));

  await kv.set(`profile-link-views:${linkId}`, views[0]?.count ?? 0, {
    ex: 30 * 60,
  });

  return views[0]?.count ?? 0;
};

export const recordLinkView = async (
  linkId: string,
  {
    ip,
    userAgent,
  }: {
    ip: string;
    userAgent: string;
  },
) => {
  const exists = await db.query.linkView.findFirst({
    where: (linkView, { eq, and, sql }) =>
      and(
        eq(linkView.ip, ip ?? "Unknown"),
        eq(linkView.linkId, linkId),
        sql`created_at > now() - interval '1 hour'`,
      ),
    columns: {
      id: true,
    },
  });

  if (!exists) {
    await db.insert(linkView).values({
      linkId,
      ip,
      userAgent,
    });
  }
};
