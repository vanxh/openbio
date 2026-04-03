import AnalyticsDigest from '@/components/emails/analytics-digest';
import { db } from '@/server/db/db';
import { emailSubscriber, linkClick, linkView } from '@/server/db/schema';
import { sendEmail } from '@/server/emails';
import { and, count as countFn, eq, gte, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

async function getWeeklyStats(linkIds: string[], since: Date) {
  let totalViews = 0;
  let totalUniqueViews = 0;
  let totalClicks = 0;
  let totalNewSubscribers = 0;

  for (const linkId of linkIds) {
    const [viewsResult, uniqueResult, clicksResult, subsResult] =
      await Promise.all([
        db
          .select({ count: countFn() })
          .from(linkView)
          .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since))),
        db
          .select({ count: sql<number>`count(distinct ${linkView.ip})` })
          .from(linkView)
          .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since))),
        db
          .select({ count: countFn() })
          .from(linkClick)
          .where(and(eq(linkClick.linkId, linkId), gte(linkClick.createdAt, since))),
        db
          .select({ count: countFn() })
          .from(emailSubscriber)
          .where(
            and(
              eq(emailSubscriber.linkId, linkId),
              gte(emailSubscriber.createdAt, since)
            )
          ),
      ]);

    totalViews += Number(viewsResult[0]?.count ?? 0);
    totalUniqueViews += Number(uniqueResult[0]?.count ?? 0);
    totalClicks += Number(clicksResult[0]?.count ?? 0);
    totalNewSubscribers += Number(subsResult[0]?.count ?? 0);
  }

  return { totalViews, totalUniqueViews, totalClicks, totalNewSubscribers };
}

async function getTopReferrerForLinks(linkIds: string[], since: Date) {
  if (linkIds.length === 0) {
    return null;
  }

  const result = await db
    .select({
      referrer: sql<string>`coalesce(${linkView.referrer}, 'Direct')`,
      count: countFn(),
    })
    .from(linkView)
    .where(
      and(
        sql`${linkView.linkId} in (${sql.join(
          linkIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        gte(linkView.createdAt, since),
        sql`${linkView.referrer} is not null`
      )
    )
    .groupBy(linkView.referrer)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  if (!result[0]) {
    return null;
  }

  try {
    return new URL(result[0].referrer).hostname.replace('www.', '');
  } catch {
    return result[0].referrer;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const users = await db.query.user.findMany({
    where: (u, { eq }) => eq(u.emailDigest, true),
  });

  let sent = 0;

  for (const u of users) {
    const links = await db.query.link.findMany({
      where: (l, { eq }) => eq(l.userId, u.id),
    });

    if (links.length === 0) {
      continue;
    }

    const linkIds = links.map((l) => l.id);
    const stats = await getWeeklyStats(linkIds, oneWeekAgo);

    if (
      stats.totalViews === 0 &&
      stats.totalClicks === 0 &&
      stats.totalNewSubscribers === 0
    ) {
      continue;
    }

    const topReferrer = await getTopReferrerForLinks(linkIds, oneWeekAgo);
    const primaryLink = links[0];
    const unsubscribeUrl = `https://openbio.app/api/unsubscribe?userId=${u.id}&token=${encodeURIComponent(u.email)}`;

    await sendEmail({
      to: [u.email],
      subject: `Weekly digest: ${stats.totalViews} views, ${stats.totalClicks} clicks`,
      react: AnalyticsDigest({
        name: u.name,
        profileLink: primaryLink?.link ?? 'profile',
        views: stats.totalViews,
        uniqueViews: stats.totalUniqueViews,
        clicks: stats.totalClicks,
        topReferrer,
        newSubscribers: stats.totalNewSubscribers,
        unsubscribeUrl,
      }),
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
