import { MAX_BENTO_CARDS } from '@/lib/bento-limits';
import { redis } from '@/lib/redis';
import { type BentoSchema, ValidLinkSchema } from '@/types';
import type * as z from 'zod';
import {
  type InferSelectModel,
  and,
  eq,
  getLinkLimit,
  isUserPremium,
  sql,
} from '..';
import { db } from '../db';
import { link, linkClick, linkView } from '../schema';

type Bento = z.infer<typeof BentoSchema>;
type BentoPosition = Bento['position'];

const profileLinkCacheKey = (slug: string) => `profile-link:${slug}`;

/**
 * Drop the cached profile so the next read comes from the database.
 * Writers delete rather than overwrite: two concurrent writers overwriting
 * the cache can land out of order and leave a stale copy behind.
 */
export const invalidateProfileLinkCache = (slug: string) =>
  redis.del(profileLinkCacheKey(slug));

type SelectProfileLinkColumns = {
  id?: boolean | undefined;
  link?: boolean | undefined;
  image?: boolean | undefined;
  name?: boolean | undefined;
  bio?: boolean | undefined;
  bento?: boolean | undefined;
  createdAt?: boolean | undefined;
  updatedAt?: boolean | undefined;
  userId?: boolean | undefined;
};

export const getProfileLinkByLink = async (inputLink: string) => {
  const cached = await redis.get<InferSelectModel<typeof link> | null>(
    profileLinkCacheKey(inputLink)
  );

  if (cached) {
    return cached;
  }

  const result = await db.query.link.findFirst({
    where: (_link, { eq }) => eq(_link.link, inputLink),
  });

  if (result) {
    await redis.set(profileLinkCacheKey(inputLink), result, {
      ex: 30 * 60,
    });
  }

  return result;
};

export const getProfileLinkById = async (
  id: string,
  columns?: SelectProfileLinkColumns
) => {
  const result = await db.query.link.findFirst({
    where: (_link, { eq }) => eq(_link.id, id),
    columns,
  });

  return result;
};

export const isProfileLinkAvailable = async (link: string) => {
  const profileLink = await getProfileLinkByLink(link);

  return profileLink ? false : ValidLinkSchema.safeParse(link).success;
};

export const getProfileLinksOfUser = async (userId: string) => {
  const result = await db.query.link.findMany({
    where: (link, { eq }) => eq(link.userId, userId),
  });

  return result;
};

export const getProfileLinksCountOfUser = async (userId: string) => {
  const profileLinks = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(link)
    .where(eq(link.userId, userId));

  const nProfileLinks = profileLinks[0]?.count ?? 0;

  return nProfileLinks;
};

export const canUserCreateProfileLink = async ({
  id,
  plan,
  subscriptionEndsAt,
  trialEndsAt,
}: {
  id: string;
  plan: string;
  subscriptionEndsAt?: Date | null;
  trialEndsAt?: Date | null;
}) => {
  const nProfileLinks = await getProfileLinksCountOfUser(id);
  const limit = getLinkLimit(plan);

  const isPremium = isUserPremium({ plan, subscriptionEndsAt, trialEndsAt });
  const canCreateProfileLink = isPremium
    ? nProfileLinks < limit
    : nProfileLinks < 1;

  return canCreateProfileLink;
};

export const createProfileLink = async (data: {
  link: string;
  userId: string;
  image?: string;
  name: string;
  bio?: string;
  bento: Bento[];
}) => {
  const result = await db
    .insert(link)
    .values(data)
    .onConflictDoNothing({ target: link.link })
    .returning()
    .execute();

  // Lost a race with another signup for the same slug.
  if (!result[0]) {
    throw new Error('This profile link is not available');
  }

  await invalidateProfileLinkCache(data.link);

  return result[0];
};

export const canModifyProfileLink = async ({
  userId,
  linkId,
  link: linkSlug,
}: {
  userId: string;
  linkId?: string;
  link?: string;
}) => {
  let profileLink: InferSelectModel<typeof link> | undefined | null = null;
  if (linkId) {
    profileLink = await getProfileLinkById(linkId);
  } else if (linkSlug) {
    profileLink = await getProfileLinkByLink(linkSlug);
  }

  const canModify = profileLink?.userId === userId;

  if (!canModify) {
    throw new Error("You can't modify this profile link");
  }

  return canModify;
};

export const updateProfileLink = async (data: {
  id: string;
  name?: string;
  bio?: string;
  theme?: string;
  accentColor?: string | null;
  darkMode?: boolean;
  customDomain?: string | null;
  customFooter?: string | null;
  isPublic?: boolean;
}) => {
  const { id, ...fields } = data;

  const result = await db
    .update(link)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(link.id, id))
    .returning()
    .execute();

  if (result[0]) {
    await invalidateProfileLinkCache(result[0].link);
  }

  return result[0];
};

/**
 * Delete a profile along with its analytics rows. `link_view` and `link_click`
 * have no foreign key to `link`, so they must be removed explicitly.
 */
export const deleteProfileLink = async (inputLink: string) => {
  const deleted = await db
    .delete(link)
    .where(eq(link.link, inputLink))
    .returning({ id: link.id, customDomain: link.customDomain })
    .execute();

  await invalidateProfileLinkCache(inputLink);

  const removed = deleted[0];
  if (!removed) {
    return null;
  }

  await Promise.all([
    db.delete(linkView).where(eq(linkView.linkId, removed.id)).execute(),
    db.delete(linkClick).where(eq(linkClick.linkId, removed.id)).execute(),
  ]);

  return removed;
};

// --- Bento cards -----------------------------------------------------------
//
// Every write below is a single UPDATE that derives the new array from the
// row's current value. A read-modify-write in application code loses updates
// when two saves overlap (a drag while a note autosaves, say), and reading
// the "current" array through the Redis cache makes that window far wider.

/**
 * JSON for a bound parameter. Always cast it `::text` first in the query so
 * the server parses it, whichever driver sent it.
 */
const toJsonText = (value: unknown) => JSON.stringify(value);

/** The profile's cards as rows, in their stored order. */
const bentoElements = sql`json_array_elements(${link.bento}) with ordinality as t(e, ord)`;

export const addProfileLinkBento = async (inputLink: string, bento: Bento) => {
  const result = await db
    .update(link)
    .set({
      bento: sql`(${link.bento}::jsonb || ${toJsonText([bento])}::text::jsonb)::json`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(link.link, inputLink),
        sql`json_array_length(${link.bento}) < ${MAX_BENTO_CARDS}`
      )
    )
    .returning({ bento: link.bento })
    .execute();

  await invalidateProfileLinkCache(inputLink);

  if (!result[0]) {
    throw new Error(`A profile can have at most ${MAX_BENTO_CARDS} cards`);
  }

  return result[0].bento;
};

export const deleteProfileLinkBento = async (
  inputLink: string,
  bentoId: string
) => {
  await db
    .update(link)
    .set({
      bento: sql`coalesce((select json_agg(t.e order by t.ord) from ${bentoElements} where t.e->>'id' is distinct from ${bentoId}), '[]'::json)`,
      updatedAt: new Date(),
    })
    .where(eq(link.link, inputLink))
    .execute();

  await invalidateProfileLinkCache(inputLink);
};

export const updateProfileLinkBento = async (
  inputLink: string,
  bento: Bento
) => {
  await db
    .update(link)
    .set({
      bento: sql`coalesce((select json_agg(case when t.e->>'id' = ${bento.id} then ${toJsonText(bento)}::text::json else t.e end order by t.ord) from ${bentoElements}), '[]'::json)`,
      updatedAt: new Date(),
    })
    .where(eq(link.link, inputLink))
    .execute();

  await invalidateProfileLinkCache(inputLink);
};

/**
 * Move several cards in one statement, leaving every other field of each card
 * untouched. Used after a drag, which shifts many cards at once.
 */
export const updateProfileLinkBentoPositions = async (
  inputLink: string,
  positions: Record<string, BentoPosition>
) => {
  if (Object.keys(positions).length === 0) {
    return;
  }

  await db
    .update(link)
    .set({
      bento: sql`coalesce((select json_agg(case when p.value is null then t.e else (t.e::jsonb || jsonb_build_object('position', p.value))::json end order by t.ord) from ${bentoElements} left join jsonb_each(${toJsonText(positions)}::text::jsonb) as p(key, value) on p.key = t.e->>'id'), '[]'::json)`,
      updatedAt: new Date(),
    })
    .where(eq(link.link, inputLink))
    .execute();

  await invalidateProfileLinkCache(inputLink);
};

/** Replace the whole card array. Used to persist an undo/redo snapshot. */
export const setProfileLinkBento = async (
  inputLink: string,
  bento: Bento[]
) => {
  await db
    .update(link)
    .set({
      bento: sql`${toJsonText(bento)}::text::json`,
      updatedAt: new Date(),
    })
    .where(eq(link.link, inputLink))
    .execute();

  await invalidateProfileLinkCache(inputLink);
};
