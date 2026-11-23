import { generateInitialBento } from '@/lib/initial-bento';
import { getMetadata } from '@/lib/metadata';
import { fetchMusicMetadata } from '@/lib/music';
import { fetchLimit, generalLimit, subscribeLimit } from '@/lib/ratelimit';
import { getThemePreset } from '@/lib/themes';
import { fetchTweet } from '@/lib/twitter';
import {
  addDomainToVercel,
  getDomainConfig,
  removeDomainFromVercel,
  verifyDomain,
} from '@/lib/vercel';
import {
  createRateLimitedProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc';

import {
  addEmailSubscriber,
  addProfileLinkBento,
  canModifyProfileLink,
  canUserCreateProfileLink,
  createProfileLink,
  deleteProfileLink,
  deleteProfileLinkBento,
  getClicksOverTime,
  getDeviceBreakdown,
  getEmailSubscribers,
  getGeoBreakdown,
  getProfileLinkById,
  getProfileLinkByLink,
  getProfileLinkUniqueViews,
  getProfileLinkViews,
  getProfileLinksOfUser,
  getTopCards,
  getTopReferrers,
  getTotalClicks,
  getViewsOverTime,
  isProfileLinkAvailable,
  recordLinkClick,
  recordLinkView,
  setProfileLinkBento,
  updateProfileLink,
  updateProfileLinkBento,
  updateProfileLinkBentoPositions,
} from '@/server/db';
import { db } from '@/server/db/db';
import { link } from '@/server/db/schema';
import { isUserPremium } from '@/server/db/utils/user';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { escape as escapeHtml } from 'html-escaper';
import { after } from 'next/server';
import * as z from 'zod';
import {
  CreateLinkBentoSchema,
  CreateLinkSchema,
  CustomDomainSchema,
  DeleteLinkBentoSchema,
  DeleteLinkSchema,
  GetByLinkSchema,
  GetLinkViewsSchema,
  LinkAvailableSchema,
  SetLinkBentoSchema,
  UpdateLinkBentoPositionsSchema,
  UpdateLinkBentoSchema,
  UpdateLinkSchema,
} from '../schemas';

const rateLimitedProcedure = createRateLimitedProcedure(generalLimit);
const rateLimitedSubscribe = createRateLimitedProcedure(subscribeLimit);
const rateLimitedFetch = createRateLimitedProcedure(fetchLimit);

const TWEET_ID_RE = /^\d+$/;

/** Plain text typed at sign-up, stored as the HTML the bio editor expects. */
const textToBioHtml = (text: string) => `<p>${escapeHtml(text)}</p>`;

export const profileLinkRouter = createTRPCRouter({
  linkAvailable: publicProcedure
    .input(LinkAvailableSchema)
    .query(async ({ input }) => {
      return await isProfileLinkAvailable(input.link);
    }),

  create: protectedProcedure
    .input(CreateLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
        columns: {
          id: true,
          plan: true,
          subscriptionEndsAt: true,
          trialEndsAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const canCreate = await canUserCreateProfileLink(user);
      if (!canCreate) {
        throw new Error(
          "You can't create more profile links, upgrade your plan"
        );
      }

      const isAvailable = await isProfileLinkAvailable(input.link);
      if (!isAvailable) {
        throw new Error('This profile link is not available');
      }

      const { link: slug, name, bio, ...socials } = input;

      const profileLink = await createProfileLink({
        link: slug,
        name: name || slug,
        bio: textToBioHtml(bio || "I'm using OpenBio.app!"),
        bento: generateInitialBento(socials),
        userId: user.id,
      });

      return profileLink;
    }),

  getAll: protectedProcedure.input(z.undefined()).query(async ({ ctx }) => {
    const user = await ctx.db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, ctx.user.id),
      columns: { id: true, plan: true, subscriptionEndsAt: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const profileLinks = await getProfileLinksOfUser(user.id);

    return profileLinks;
  }),

  getByLink: publicProcedure
    .input(GetByLinkSchema)
    .query(async ({ input, ctx }) => {
      const authedUserId = ctx.session?.user?.id;

      const profileLink = await getProfileLinkByLink(input.link);

      if (!profileLink) {
        return null;
      }

      const owner = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, profileLink.userId),
        columns: {
          id: true,
          plan: true,
          subscriptionEndsAt: true,
          trialEndsAt: true,
        },
      });

      let ip = ctx.req.headers.get('x-real-ip');
      const forwardedFor = ctx.req.headers.get('x-forwarded-for');
      if (!ip && forwardedFor) {
        ip = forwardedFor.split(',').at(0) ?? 'Unknown';
      }

      const country = ctx.req.headers.get('x-vercel-ip-country') ?? undefined;

      const isOwner = authedUserId === profileLink.userId;

      // Owners load their own page constantly while editing; counting those
      // would drown out real traffic in their analytics.
      if (!isOwner) {
        after(() =>
          recordLinkView(profileLink.id, {
            ip: ip ?? 'Unknown',
            userAgent: ctx.req.headers.get('user-agent') ?? 'Unknown',
            referrer: ctx.req.headers.get('referer') ?? undefined,
            country,
          })
        );
      }

      return {
        ...profileLink,
        isOwner,
        isPremium: !!owner && isUserPremium(owner),
      };
    }),

  getViews: publicProcedure
    .input(GetLinkViewsSchema)
    .query(async ({ input }) => {
      return await getProfileLinkViews(input.id);
    }),

  trackClick: rateLimitedProcedure
    .input(
      z.object({
        linkId: z.string().uuid(),
        bentoId: z.string().max(100),
        href: z.string().max(2048),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Record only clicks on a link card that exists on this profile, using
      // the card's own URL. This endpoint is public, so anything else would
      // let anyone write arbitrary rows into someone's "Top cards".
      const profile = await getProfileLinkById(input.linkId, { bento: true });
      const card = profile?.bento.find((b) => b.id === input.bentoId);
      if (card?.type !== 'link') {
        return;
      }

      let ip = ctx.req.headers.get('x-real-ip');
      const forwardedFor = ctx.req.headers.get('x-forwarded-for');
      if (!ip && forwardedFor) {
        ip = forwardedFor.split(',').at(0) ?? 'Unknown';
      }

      await recordLinkClick(input.linkId, {
        bentoId: card.id,
        href: card.href,
        ip: ip ?? 'Unknown',
        userAgent: ctx.req.headers.get('user-agent') ?? 'Unknown',
        referrer: ctx.req.headers.get('referer') ?? undefined,
      });
    }),

  subscribe: rateLimitedSubscribe
    .input(
      z.object({
        linkId: z.string().uuid(),
        email: z.string().trim().toLowerCase().email().max(254),
      })
    )
    .mutation(async ({ input }) => {
      // Only profiles that actually show a sign-up form collect addresses.
      const profile = await getProfileLinkById(input.linkId, { bento: true });
      if (!profile?.bento.some((b) => b.type === 'email-collect')) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'This profile is not collecting emails.',
        });
      }

      await addEmailSubscriber(input.linkId, input.email);
      // Nothing about the subscriber row is returned to the public caller.
      return { subscribed: true };
    }),

  subscribers: protectedProcedure
    .input(z.object({ linkId: z.string() }))
    .query(async ({ input, ctx }) => {
      await canModifyProfileLink({
        userId: ctx.user.id,
        linkId: input.linkId,
      });
      return getEmailSubscribers(input.linkId);
    }),

  analytics: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      await canModifyProfileLink({
        userId: ctx.user.id,
        linkId: input.linkId,
      });

      const [
        views,
        uniqueViews,
        clicks,
        viewsOverTime,
        clicksOverTime,
        topCards,
        topReferrers,
        deviceBreakdown,
        geoBreakdown,
      ] = await Promise.all([
        getProfileLinkViews(input.linkId),
        getProfileLinkUniqueViews(input.linkId),
        getTotalClicks(input.linkId),
        getViewsOverTime(input.linkId, input.days),
        getClicksOverTime(input.linkId, input.days),
        getTopCards(input.linkId, input.days),
        getTopReferrers(input.linkId, input.days),
        getDeviceBreakdown(input.linkId, input.days),
        getGeoBreakdown(input.linkId, input.days),
      ]);

      return {
        views,
        uniqueViews,
        clicks,
        viewsOverTime,
        clicksOverTime,
        topCards,
        topReferrers,
        deviceBreakdown,
        geoBreakdown,
      };
    }),

  checkDomain: protectedProcedure
    .input(z.object({ domain: CustomDomainSchema }))
    .query(async ({ input, ctx }) => {
      const { domain } = input;

      // Only the profile that holds a domain may query its status: the lookup
      // below spends the server's Vercel token.
      const owned = await ctx.db.query.link.findFirst({
        where: (l, { and, eq }) =>
          and(eq(l.customDomain, domain), eq(l.userId, ctx.user.id)),
        columns: { id: true },
      });
      if (!owned) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Domain not found' });
      }

      const [config, verification] = await Promise.all([
        getDomainConfig(domain),
        verifyDomain(domain),
      ]);

      const isSubdomain = domain.split('.').length > 2;

      return {
        configured: config?.misconfigured === false,
        verified: verification?.verified ?? false,
        verification: verification?.verification ?? [],
        isSubdomain,
        // For subdomains: CNAME record with subdomain prefix
        // For root domains: A record with @ pointing to Vercel IP
        dns: isSubdomain
          ? {
              type: 'CNAME' as const,
              name: domain.split('.').slice(0, -2).join('.'),
              value: 'cname.vercel-dns.com',
            }
          : {
              type: 'A' as const,
              name: '@',
              value: '76.76.21.21',
            },
      };
    }),

  update: protectedProcedure
    .input(UpdateLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
        columns: {
          id: true,
          plan: true,
          subscriptionEndsAt: true,
          trialEndsAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await canModifyProfileLink({
        userId: user.id,
        linkId: input.id,
      });

      const isPro = isUserPremium(user);
      const existing = await getProfileLinkById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      const proOnlyChange = getProOnlyChange(input, existing);
      if (proOnlyChange && !isPro) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `${proOnlyChange} a Pro subscription`,
        });
      }

      if (
        input.customDomain !== undefined &&
        input.customDomain !== existing.customDomain
      ) {
        const oldDomain = existing.customDomain;

        if (input.customDomain) {
          const taken = await ctx.db.query.link.findFirst({
            where: (l, { and, eq }) =>
              and(
                eq(l.customDomain, input.customDomain as string),
                ne(l.id, input.id)
              ),
            columns: { id: true },
          });
          if (taken) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'This domain is already connected to another profile',
            });
          }

          await addDomainToVercel(input.customDomain);
        }

        const updated = await updateProfileLink(input);

        // Release the old domain only once the new value is saved, so a
        // failed save cannot leave the profile pointing at a detached domain.
        if (oldDomain) {
          await removeDomainFromVercel(oldDomain).catch(() => undefined);
        }

        return updated;
      }

      return updateProfileLink(input);
    }),

  delete: protectedProcedure
    .input(DeleteLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
        columns: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await canModifyProfileLink({
        userId: user.id,
        link: input.link,
      });

      const removed = await deleteProfileLink(input.link);

      if (removed?.customDomain) {
        await removeDomainFromVercel(removed.customDomain).catch(
          () => undefined
        );
      }
    }),

  createBento: protectedProcedure
    .input(CreateLinkBentoSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
        columns: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await canModifyProfileLink({
        userId: user.id,
        link: input.link,
      });

      return addProfileLinkBento(input.link, input.bento);
    }),

  deleteBento: protectedProcedure
    .input(DeleteLinkBentoSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
        columns: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await canModifyProfileLink({
        userId: user.id,
        link: input.link,
      });

      return deleteProfileLinkBento(input.link, input.id);
    }),

  updateBento: protectedProcedure
    .input(UpdateLinkBentoSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.user.id),
        columns: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await canModifyProfileLink({
        userId: user.id,
        link: input.link,
      });

      return updateProfileLinkBento(input.link, input.bento);
    }),

  /** Move many cards at once (after a drag) without touching their content. */
  updateBentoPositions: protectedProcedure
    .input(UpdateLinkBentoPositionsSchema)
    .mutation(async ({ input, ctx }) => {
      await canModifyProfileLink({ userId: ctx.user.id, link: input.link });

      return updateProfileLinkBentoPositions(input.link, input.positions);
    }),

  /** Replace every card, to persist an undo/redo snapshot. */
  setBento: protectedProcedure
    .input(SetLinkBentoSchema)
    .mutation(async ({ input, ctx }) => {
      await canModifyProfileLink({ userId: ctx.user.id, link: input.link });

      return setProfileLinkBento(input.link, input.bento);
    }),

  listPublic: publicProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const items = await db
        .select({
          id: link.id,
          link: link.link,
          name: link.name,
          image: link.image,
          bio: link.bio,
          bento: link.bento,
        })
        .from(link)
        .where(
          input.cursor
            ? and(
                eq(link.isPublic, true),
                // Keyset on the sort order itself. Ids are random UUIDs, so
                // comparing ids alone would skip and repeat profiles.
                sql`(${link.createdAt}, ${link.id}) < (select c.created_at, c.id from ${link} as c where c.id = ${input.cursor})`
              )
            : eq(link.isPublic, true)
        )
        .orderBy(desc(link.createdAt), desc(link.id))
        .limit(input.limit + 1);

      const hasMore = items.length > input.limit;
      const profiles = hasMore ? items.slice(0, -1) : items;
      const nextCursor = hasMore ? profiles.at(-1)?.id : undefined;

      return { profiles, nextCursor };
    }),

  getMetadataOfURL: rateLimitedFetch
    .input(
      z.object({
        url: z.string().max(2048),
      })
    )
    .query(async ({ input }) => {
      return await getMetadata(input.url);
    }),

  getTweet: rateLimitedFetch
    .input(z.object({ tweetId: z.string().max(25) }))
    .query(async ({ input }) => {
      if (!TWEET_ID_RE.test(input.tweetId)) {
        return null;
      }
      return await fetchTweet(input.tweetId);
    }),

  getMusicMetadata: rateLimitedFetch
    .input(z.object({ url: z.string().max(2048) }))
    .query(async ({ input }) => {
      return await fetchMusicMetadata(input.url);
    }),
});

/**
 * Names the Pro-only setting an update would turn on, if any. Only a change
 * *to* a Pro value counts: clearing one, or re-saving a value kept from an
 * earlier subscription, is allowed, so a lapsed account can still edit the
 * rest of its profile.
 */
function getProOnlyChange(
  input: z.infer<typeof UpdateLinkSchema>,
  existing: {
    customFooter: string | null;
    customDomain: string | null;
    accentColor: string | null;
    darkMode: boolean;
    theme: string;
  }
): string | null {
  if (input.customFooter && input.customFooter !== existing.customFooter) {
    return 'Custom footers require';
  }
  if (input.customDomain && input.customDomain !== existing.customDomain) {
    return 'Custom domains require';
  }
  if (input.accentColor && input.accentColor !== existing.accentColor) {
    return 'Accent colours require';
  }
  if (input.darkMode && !existing.darkMode) {
    return 'Dark mode requires';
  }
  if (
    input.theme !== undefined &&
    input.theme !== existing.theme &&
    getThemePreset(input.theme).pro
  ) {
    return 'This theme requires';
  }
  return null;
}
