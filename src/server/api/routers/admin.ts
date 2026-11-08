import { isAdminUser } from '@/lib/admin-access';
import { redis } from '@/lib/redis';
import {
  adminDirectorySchema,
  adminPeriodSchema,
  adminUpdateUserSchema,
} from '@/server/api/schemas/admin';
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/server/api/trpc';
import { link, linkClick, linkView, session, user } from '@/server/db/schema';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';

const PAGE_SIZE = 12;
const numeric = (value: unknown) => Number(value ?? 0);
const userColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image,
  plan: user.plan,
  aiCredits: user.aiCredits,
  createdAt: user.createdAt,
  subscriptionId: user.subscriptionId,
  subscriptionEndsAt: user.subscriptionEndsAt,
  trialEndsAt: user.trialEndsAt,
  // Explicit outer qualification survives Drizzle’s single-table SELECT rewriting.
  profileCount: sql<number>`(select count(*)::int from ${link} as admin_profiles where admin_profiles.user_id = "user"."id")`,
};

function searchPattern(search: string) {
  return `%${search.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
}

export const adminRouter = createTRPCRouter({
  access: protectedProcedure.query(({ ctx }) => ({
    allowed: isAdminUser(ctx.user.id),
  })),

  overview: adminProcedure
    .input(adminPeriodSchema)
    .query(async ({ ctx, input }) => {
      // UTC calendar days, including today, with an equally sized preceding period.
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const since = new Date(today.getTime() - (input.days - 1) * 86_400_000);
      const previous = new Date(since.getTime() - input.days * 86_400_000);
      const [
        users,
        profiles,
        views,
        clicks,
        daily,
        plans,
        recent,
        topProfiles,
        countries,
        referrers,
      ] = await Promise.all([
        ctx.db
          .select({
            total: count(),
            current: sql<number>`count(*) filter (where ${user.createdAt} >= ${since})::int`,
            previous: sql<number>`count(*) filter (where ${user.createdAt} >= ${previous} and ${user.createdAt} < ${since})::int`,
            unverified: sql<number>`count(*) filter (where not ${user.emailVerified})::int`,
          })
          .from(user),
        ctx.db
          .select({
            total: count(),
            listed: sql<number>`count(*) filter (where ${link.isPublic})::int`,
            domains: sql<number>`count(*) filter (where ${link.customDomain} is not null)::int`,
          })
          .from(link),
        ctx.db
          .select({
            current: sql<number>`count(*) filter (where ${linkView.createdAt} >= ${since})::int`,
            previous: sql<number>`count(*) filter (where ${linkView.createdAt} < ${since})::int`,
            unique: sql<number>`count(distinct ${linkView.ip}) filter (where ${linkView.createdAt} >= ${since})::int`,
          })
          .from(linkView)
          .where(gte(linkView.createdAt, previous)),
        ctx.db
          .select({
            current: sql<number>`count(*) filter (where ${linkClick.createdAt} >= ${since})::int`,
            previous: sql<number>`count(*) filter (where ${linkClick.createdAt} < ${since})::int`,
          })
          .from(linkClick)
          .where(gte(linkClick.createdAt, previous)),
        ctx.db.execute<{
          day: string;
          views: number;
          clicks: number;
          users: number;
        }>(sql`
        with days as (select generate_series(${since}::timestamptz at time zone 'UTC', ${today}::timestamptz at time zone 'UTC', interval '1 day') as day),
        views as (select (${linkView.createdAt} at time zone 'UTC')::date as day, count(*)::int as n from ${linkView} where ${linkView.createdAt} >= ${since} group by 1),
        clicks as (select (${linkClick.createdAt} at time zone 'UTC')::date as day, count(*)::int as n from ${linkClick} where ${linkClick.createdAt} >= ${since} group by 1),
        users as (select (${user.createdAt} at time zone 'UTC')::date as day, count(*)::int as n from ${user} where ${user.createdAt} >= ${since} group by 1)
        select to_char(days.day, 'YYYY-MM-DD') as day, coalesce(views.n, 0)::int as views, coalesce(clicks.n, 0)::int as clicks, coalesce(users.n, 0)::int as users
        from days left join views on views.day = days.day::date left join clicks on clicks.day = days.day::date left join users on users.day = days.day::date order by days.day
      `),
        ctx.db
          .select({
            plan: user.plan,
            count: count(),
            subscribed: sql<number>`count(*) filter (where ${user.subscriptionId} is not null and (${user.subscriptionEndsAt} is null or ${user.subscriptionEndsAt} > now()))::int`,
          })
          .from(user)
          .groupBy(user.plan),
        ctx.db
          .select(userColumns)
          .from(user)
          .orderBy(desc(user.createdAt), desc(user.id))
          .limit(5),
        ctx.db
          .select({
            id: link.id,
            name: link.name,
            slug: link.link,
            views: count(linkView.id),
          })
          .from(link)
          .innerJoin(
            linkView,
            and(eq(linkView.linkId, link.id), gte(linkView.createdAt, since))
          )
          .groupBy(link.id)
          .orderBy(desc(count(linkView.id)), desc(link.id))
          .limit(5),
        ctx.db
          .select({ country: linkView.country, count: count() })
          .from(linkView)
          .where(gte(linkView.createdAt, since))
          .groupBy(linkView.country)
          .orderBy(desc(count()))
          .limit(6),
        ctx.db
          .select({ referrer: linkView.referrer, count: count() })
          .from(linkView)
          .where(gte(linkView.createdAt, since))
          .groupBy(linkView.referrer)
          .orderBy(desc(count()))
          .limit(6),
      ]);
      return {
        users: {
          total: numeric(users[0]?.total),
          current: numeric(users[0]?.current),
          previous: numeric(users[0]?.previous),
          unverified: numeric(users[0]?.unverified),
        },
        profiles: {
          total: numeric(profiles[0]?.total),
          listed: numeric(profiles[0]?.listed),
          domains: numeric(profiles[0]?.domains),
        },
        views: {
          current: numeric(views[0]?.current),
          previous: numeric(views[0]?.previous),
          unique: numeric(views[0]?.unique),
        },
        clicks: {
          current: numeric(clicks[0]?.current),
          previous: numeric(clicks[0]?.previous),
        },
        daily: daily.rows,
        plans,
        recent,
        topProfiles,
        countries,
        referrers,
        generatedAt: new Date(),
      };
    }),

  users: adminProcedure
    .input(adminDirectorySchema)
    .query(async ({ ctx, input }) => {
      const pattern = searchPattern(input.search);
      const where = and(
        input.search
          ? or(
              ilike(user.name, pattern),
              ilike(user.email, pattern),
              ilike(user.id, pattern)
            )
          : undefined,
        input.plan !== 'all' ? eq(user.plan, input.plan) : undefined
      );
      const [items, total] = await Promise.all([
        ctx.db
          .select(userColumns)
          .from(user)
          .where(where)
          .orderBy(desc(user.createdAt), desc(user.id))
          .limit(PAGE_SIZE)
          .offset((input.page - 1) * PAGE_SIZE),
        ctx.db.select({ count: count() }).from(user).where(where),
      ]);
      return { items, total: total[0]?.count ?? 0, pageSize: PAGE_SIZE };
    }),

  profiles: adminProcedure
    .input(adminDirectorySchema)
    .query(async ({ ctx, input }) => {
      const pattern = searchPattern(input.search);
      const where = and(
        input.search
          ? or(
              ilike(link.name, pattern),
              ilike(link.link, pattern),
              ilike(user.email, pattern),
              ilike(link.customDomain, pattern)
            )
          : undefined,
        input.visibility !== 'all'
          ? eq(link.isPublic, input.visibility === 'listed')
          : undefined
      );
      const [items, total] = await Promise.all([
        ctx.db
          .select({
            id: link.id,
            name: link.name,
            slug: link.link,
            image: link.image,
            isPublic: link.isPublic,
            customDomain: link.customDomain,
            createdAt: link.createdAt,
            owner: user.email,
            cards: sql<number>`json_array_length(${link.bento})`,
          })
          .from(link)
          .leftJoin(user, eq(link.userId, user.id))
          .where(where)
          .orderBy(desc(link.createdAt), desc(link.id))
          .limit(PAGE_SIZE)
          .offset((input.page - 1) * PAGE_SIZE),
        ctx.db
          .select({ count: count() })
          .from(link)
          .leftJoin(user, eq(link.userId, user.id))
          .where(where),
      ]);
      return { items, total: total[0]?.count ?? 0, pageSize: PAGE_SIZE };
    }),

  updateUser: adminProcedure
    .input(adminUpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(user)
        .set({
          name: input.name,
          emailVerified: input.emailVerified,
          aiCredits: input.aiCredits,
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.id))
        .returning({ id: user.id });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User no longer exists.',
        });
      }
      return updated;
    }),

  revokeSessions: adminProcedure
    .input(z.object({ id: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id || isAdminUser(input.id)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Administrator sessions cannot be revoked here.',
        });
      }
      const removed = await ctx.db
        .delete(session)
        .where(eq(session.userId, input.id))
        .returning({ id: session.id });
      return { count: removed.length };
    }),

  setDiscovery: adminProcedure
    .input(z.object({ id: z.string().uuid(), listed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(link)
        .set({ isPublic: input.listed, updatedAt: new Date() })
        .where(eq(link.id, input.id))
        .returning({ slug: link.link });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile no longer exists.',
        });
      }
      // Invalidate before returning so the profile editor also receives the new visibility.
      await redis.del(`profile-link:${updated.slug}`);
      return updated;
    }),

  system: adminProcedure.query(async ({ ctx }) => {
    await ctx.db.select({ count: count() }).from(user);
    const configured = (names: string[]) =>
      names.every((name) => Boolean(process.env[name]));
    return {
      database: true,
      services: [
        {
          name: 'Authentication',
          description: 'Better Auth · session-based access',
          configured: configured(['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL']),
        },
        {
          name: 'Cache & rate limiting',
          description: 'Upstash Redis',
          configured: configured([
            'UPSTASH_REDIS_REST_URL',
            'UPSTASH_REDIS_REST_TOKEN',
          ]),
        },
        {
          name: 'Payments',
          description: 'Polar · subscription webhooks',
          configured: configured([
            'POLAR_ACCESS_TOKEN',
            'POLAR_WEBHOOK_SECRET',
          ]),
        },
        {
          name: 'Transactional email',
          description: 'Resend',
          configured: configured(['RESEND_API_KEY']),
        },
        {
          name: 'Image storage',
          description: 'Vercel Blob',
          configured: configured(['BLOB_READ_WRITE_TOKEN']),
        },
        {
          name: 'AI generation',
          description: 'AI Gateway',
          configured: configured(['AI_GATEWAY_API_KEY']),
        },
        {
          name: 'Custom domains',
          description: 'Vercel domain management',
          configured: configured(['VERCEL_TOKEN', 'VERCEL_PROJECT_ID']),
        },
      ],
      adminCount: new Set(
        (process.env.ADMIN_USER_IDS ?? '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      ).size,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }),
});
