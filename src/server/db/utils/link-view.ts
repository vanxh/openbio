import { redis } from '@/lib/redis';
import { eq, sql } from '..';
import { db } from '../db';
import { linkView } from '../schema';

export const getProfileLinkViews = async (linkId: string) => {
  const cached = await redis.get<number | null>(`profile-link-views:${linkId}`);

  if (cached) {
    return cached;
  }

  const views = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(linkView)
    .where(eq(linkView.linkId, linkId));

  await redis.set(`profile-link-views:${linkId}`, views[0]?.count ?? 0, {
    ex: 30 * 60,
  });

  return views[0]?.count ?? 0;
};

export const recordLinkView = async (
  linkId: string,
  {
    ip,
    userAgent,
    referrer,
  }: {
    ip: string;
    userAgent: string;
    referrer?: string;
  }
) => {
  const exists = await db.query.linkView.findFirst({
    where: (linkView, { eq, and, sql }) =>
      and(
        eq(linkView.ip, ip ?? 'Unknown'),
        eq(linkView.linkId, linkId),
        sql`created_at > now() - interval '1 hour'`
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
      referrer,
    });

    await Promise.all([
      redis.del(`profile-link-views:${linkId}`),
      redis.del(`analytics:views-over-time:${linkId}:7`),
      redis.del(`analytics:views-over-time:${linkId}:30`),
      redis.del(`analytics:views-over-time:${linkId}:90`),
      redis.del(`analytics:top-referrers:${linkId}:7`),
      redis.del(`analytics:top-referrers:${linkId}:30`),
      redis.del(`analytics:top-referrers:${linkId}:90`),
    ]);
  }
};
