import { redis } from '@/lib/redis';
import { UAParser } from 'ua-parser-js';
import { and, count, countDistinct, desc, eq, gte, sql } from '..';
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
    country,
  }: {
    ip: string;
    userAgent: string;
    referrer?: string;
    country?: string;
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
      country,
    });

    await Promise.all([
      redis.del(`profile-link-views:${linkId}`),
      redis.del(`profile-link-unique-views:${linkId}`),
      redis.del(`analytics:views-over-time:${linkId}:7`),
      redis.del(`analytics:views-over-time:${linkId}:30`),
      redis.del(`analytics:views-over-time:${linkId}:90`),
      redis.del(`analytics:top-referrers:${linkId}:7`),
      redis.del(`analytics:top-referrers:${linkId}:30`),
      redis.del(`analytics:top-referrers:${linkId}:90`),
      redis.del(`analytics:devices:${linkId}:7`),
      redis.del(`analytics:devices:${linkId}:30`),
      redis.del(`analytics:devices:${linkId}:90`),
      redis.del(`analytics:geo:${linkId}:7`),
      redis.del(`analytics:geo:${linkId}:30`),
      redis.del(`analytics:geo:${linkId}:90`),
    ]);
  }
};

export async function getProfileLinkUniqueViews(
  linkId: string
): Promise<number> {
  const cacheKey = `profile-link-unique-views:${linkId}`;
  const cached = await redis.get<number>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const result = await db
    .select({ count: countDistinct(linkView.ip) })
    .from(linkView)
    .where(eq(linkView.linkId, linkId));

  const count = Number(result[0]?.count ?? 0);
  await redis.set(cacheKey, count, { ex: 1800 });
  return count;
}

export async function getDeviceBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:devices:${linkId}:${days}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached as {
      devices: { device: string; count: number }[];
      browsers: { browser: string; count: number }[];
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({ userAgent: linkView.userAgent })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)));

  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};

  for (const row of rows) {
    const ua = UAParser(row.userAgent ?? undefined);
    const device = ua.device.type || 'desktop';
    const browser = ua.browser.name || 'Unknown';
    devices[device] = (devices[device] ?? 0) + 1;
    browsers[browser] = (browsers[browser] ?? 0) + 1;
  }

  const result = {
    devices: Object.entries(devices)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count),
    browsers: Object.entries(browsers)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count),
  };

  await redis.set(cacheKey, result, { ex: 300 });
  return result;
}

export async function getGeoBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:geo:${linkId}:${days}`;
  const cached = await redis.get(cacheKey);
  if (cached) { return cached as { country: string; count: number }[]; }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      country: sql<string>`coalesce(${linkView.country}, 'Unknown')`,
      count: count(),
    })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)))
    .groupBy(linkView.country)
    .orderBy(desc(count()))
    .limit(20);

  const mapped = result.map(r => ({ country: r.country, count: Number(r.count) }));
  await redis.set(cacheKey, mapped, { ex: 300 });
  return mapped;
}
