import { redis } from '@/lib/redis';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import { linkClick, linkView } from '../schema';

export const recordLinkClick = async (
  linkId: string,
  {
    bentoId,
    href,
    ip,
    userAgent,
    referrer,
  }: {
    bentoId: string;
    href: string;
    ip: string;
    userAgent: string;
    referrer?: string;
  }
) => {
  await db.insert(linkClick).values({
    linkId,
    bentoId,
    href,
    ip,
    userAgent,
    referrer,
  });
};

export const getViewsOverTime = async (linkId: string, days: number) => {
  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${linkView.createdAt})::date`.as(
        'date'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkView)
    .where(
      and(
        eq(linkView.linkId, linkId),
        gte(linkView.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`date_trunc('day', ${linkView.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${linkView.createdAt})::date`);

  return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
};

export const getClicksOverTime = async (linkId: string, days: number) => {
  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${linkClick.createdAt})::date`.as(
        'date'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkClick)
    .where(
      and(
        eq(linkClick.linkId, linkId),
        gte(linkClick.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`date_trunc('day', ${linkClick.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${linkClick.createdAt})::date`);

  return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
};

export const getTopCards = async (linkId: string, days: number) => {
  const rows = await db
    .select({
      bentoId: linkClick.bentoId,
      href: linkClick.href,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkClick)
    .where(
      and(
        eq(linkClick.linkId, linkId),
        gte(linkClick.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(linkClick.bentoId, linkClick.href)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  return rows.map((r) => ({
    bentoId: r.bentoId,
    href: r.href,
    count: Number(r.count),
  }));
};

export const getTopReferrers = async (linkId: string, days: number) => {
  const rows = await db
    .select({
      referrer: sql<string>`coalesce(${linkView.referrer}, 'Direct')`.as(
        'referrer'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkView)
    .where(
      and(
        eq(linkView.linkId, linkId),
        gte(linkView.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`coalesce(${linkView.referrer}, 'Direct')`)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  return rows.map((r) => ({
    referrer: r.referrer,
    count: Number(r.count),
  }));
};

export const getTotalClicks = async (linkId: string) => {
  const cached = await redis.get<number | null>(
    `profile-link-clicks:${linkId}`
  );
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(linkClick)
    .where(eq(linkClick.linkId, linkId));

  const count = Number(rows[0]?.count ?? 0);
  await redis.set(`profile-link-clicks:${linkId}`, count, { ex: 30 * 60 });
  return count;
};
