import { kv } from "@vercel/kv";
import type * as z from "zod";
import { ValidLinkSchema, type BentoSchema, type LinkBento } from "@/types";
import { eq, isUserPremium, sql, type InferSelectModel } from "..";
import { db } from "../db";
import { link } from "../schema";

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

export const getProfileLinkByLink = async (
  inputLink: string,
  columns?: SelectProfileLinkColumns,
) => {
  const cached = await kv.get<InferSelectModel<typeof link> | null>(
    `profile-link:${inputLink}`,
  );

  if (cached) {
    return cached;
  }

  const result = await db.query.link.findFirst({
    where: (_link, { eq }) => eq(_link.link, inputLink),
    columns,
  });

  if (result) {
    await kv.set(`profile-link:${inputLink}`, result, {
      ex: 30 * 60,
    });
  }

  return result;
};

export const getProfileLinkById = async (
  id: string,
  columns?: SelectProfileLinkColumns,
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
}: {
  id: string;
  plan: "free" | "pro";
  subscriptionEndsAt?: Date | null;
}) => {
  const nProfileLinks = await getProfileLinksCountOfUser(id);

  const isPremium = isUserPremium({ plan, subscriptionEndsAt });
  const canCreateProfileLink = isPremium || nProfileLinks < 1;

  return canCreateProfileLink;
};

export const createProfileLink = async (data: {
  link: string;
  userId: string;
  image?: string;
  name: string;
  bio?: string;
  bento: LinkBento[];
}) => {
  const result = await db.insert(link).values(data).returning().execute();

  await kv.set(`profile-link:${data.link}`, result[0], {
    ex: 30 * 60,
  });

  return result[0]!;
};

export const canModifyProfileLink = async ({
  userId,
  linkId,
  link,
}: {
  userId: string;
  linkId?: string;
  link?: string;
}) => {
  const profileLink = linkId
    ? await getProfileLinkById(linkId)
    : link
    ? await getProfileLinkByLink(link)
    : null;

  const canModify =
    profileLink?.userId === userId && profileLink?.id === linkId;

  if (!canModify) {
    throw new Error("You can't modify this profile link");
  }

  return canModify;
};

export const updateProfileLink = async (data: {
  id: string;
  name?: string;
  bio?: string;
}) => {
  const result = await db
    .update(link)
    .set(data)
    .where(eq(link.id, data.id))
    .returning()
    .execute();

  await kv.set(`profile-link:${result[0]!.link}`, result[0], {
    ex: 30 * 60,
  });

  return result[0]!;
};

export const deleteProfileLink = async (inputLink: string) => {
  await db.delete(link).where(eq(link.link, inputLink)).execute();

  await kv.del(`profile-link:${inputLink}`);
};

export const addProfileLinkBento = async (
  inputLink: string,
  bento: z.infer<typeof BentoSchema>,
) => {
  const profileLink = await getProfileLinkByLink(inputLink);

  const result = await db
    .update(link)
    .set({
      bento: (profileLink?.bento ?? []).concat(bento),
    })
    .where(eq(link.link, inputLink))
    .returning()
    .execute();

  await kv.set(`profile-link:${result[0]!.link}`, result[0], {
    ex: 30 * 60,
  });

  return result[0]!.bento;
};

export const deleteProfileLinkBento = async (
  inputLink: string,
  bentoId: string,
) => {
  const profileLink = await getProfileLinkByLink(inputLink);

  const result = await db
    .update(link)
    .set({
      bento: (profileLink?.bento ?? []).filter((b) => b.id !== bentoId),
    })
    .where(eq(link.link, inputLink))
    .returning()
    .execute();

  await kv.set(`profile-link:${result[0]!.link}`, result[0], {
    ex: 30 * 60,
  });
};

export const updateProfileLinkBento = async (
  inputLink: string,
  bento: z.infer<typeof BentoSchema>,
) => {
  const profileLink = await getProfileLinkByLink(inputLink);

  const result = await db
    .update(link)
    .set({
      bento: (profileLink?.bento ?? []).map((b) =>
        b.id === bento.id ? bento : b,
      ),
    })
    .where(eq(link.link, inputLink))
    .returning()
    .execute();

  await kv.set(`profile-link:${result[0]!.link}`, result[0], {
    ex: 30 * 60,
  });
};
