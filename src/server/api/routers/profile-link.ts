import * as z from "zod";
import { kv } from "@vercel/kv";

import {
  type Context,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  link,
  type sizeSchema,
  type positionSchema,
  type InferSelectModel,
  eq,
  sql,
  linkView,
  bentoSchema,
} from "@/server/db";

const RESERVED_LINKS = [
  "sign-up",
  "sign-in",
  "claim",
  "api",
  "actions",
  "app",
  "create-link",
  "twitter",
  "github",
  "linkedin",
  "instagram",
  "telegram",
  "discord",
  "youtube",
  "twitch",
  "about",
  "pricing",
  "contact",
  "privacy",
  "terms",
  "legal",
  "blog",
  "docs",
  "support",
  "help",
  "status",
  "jobs",
  "press",
  "partners",
  "developers",
  "security",
  "cookies",
  "settings",
  "profile",
  "account",
  "dashboard",
  "admin",
  "login",
  "logout",
  "signout",
  "auth",
  "oauth",
  "openbio",
];

const validLinkSchema = z
  .string()
  .min(3, {
    message: "Link must be at least 3 characters long.",
  })
  .max(50, {
    message: "Link must be at most 50 characters long.",
  })
  .regex(/^[a-z0-9-]+$/, {
    message: "Link must only contain lowercase letters, numbers, and dashes.",
  })
  .transform((value) => value.toLowerCase())
  .refine((value) => !RESERVED_LINKS.includes(value), {
    message: "This link is reserved.",
  });

const getUser = async (
  ctx: Context & {
    auth: {
      userId: string;
    };
  }
) => {
  const user = await ctx.db.query.user.findFirst({
    where: (user, { eq }) => eq(user.providerId, ctx.auth.userId),
    columns: {
      id: true,
      plan: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) throw new Error("User not found");

  return user;
};

export const profileLinkRouter = createTRPCRouter({
  linkAvailable: publicProcedure
    .input(
      z.object({
        link: z.string().toLowerCase(),
      })
    )
    .query(async ({ input, ctx }) => {
      const profileLink = await ctx.db.query.link.findFirst({
        where: (link, { eq }) => eq(link.link, input.link),
        columns: {
          id: true,
        },
      });

      if (profileLink) return false;

      return validLinkSchema.safeParse(input.link).success;
    }),

  create: protectedProcedure
    .input(
      z.object({
        link: validLinkSchema,
        twitter: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
        instagram: z.string().optional(),
        telegram: z.string().optional(),
        discord: z.string().optional(),
        youtube: z.string().optional(),
        twitch: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await getUser(ctx);

      const profileLinks = await ctx.db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(link)
        .where(eq(link.userId, user.id));
      const nProfileLinks = profileLinks[0]?.count ?? 0;

      const isPremium =
        user.plan === "pro" &&
        user.subscriptionEndsAt &&
        user.subscriptionEndsAt > new Date();

      if (nProfileLinks >= 1 && !isPremium) {
        throw new Error(
          "You can't create more profile links, upgrade your plan"
        );
      }

      const bento: {
        id: string;
        type: "link";
        href: string;
        clicks: number;

        size: z.infer<typeof sizeSchema>;
        position: z.infer<typeof positionSchema>;
      }[] = [];

      let position = {
        sm: {
          x: 0,
          y: 0,
        },
        md: {
          x: 0,
          y: 0,
        },
      };
      for (const [key, value] of Object.entries(input)) {
        if (key !== "link" && value) {
          let url = `https://${key}.com/${value}`;

          if (key === "linkedin") {
            url = `https://www.${key}.com/in/${value}`;
          }

          if (key === "youtube") {
            url = `https://www.${key}.com/@${value.replace("@", "")}`;
          }

          if (key === "twitch") {
            url = `https://www.${key}.tv/${value}`;
          }

          if (key === "telegram") {
            url = `https://t.me/${value}`;
          }

          bento.push({
            id: crypto.randomUUID(),
            type: "link",

            href: url,
            clicks: 0,

            size: {
              sm: "2x2",
              md: "2x2",
            },

            position,
          });

          position = {
            sm: {
              x: position.sm.x % 2 === 0 ? position.sm.x + 1 : 0,
              y: position.sm.x % 2 === 0 ? position.sm.y + 1 : position.sm.y,
            },
            md: {
              x: position.md.x % 4 === 0 ? position.md.x + 1 : 0,
              y: position.md.x % 4 === 0 ? position.md.y + 1 : position.md.y,
            },
          };
        }
      }

      const profileLink = await ctx.db
        .insert(link)
        .values({
          link: input.link,
          name: input.link,
          bio: "I'm using OpenBio.app!",
          bento,
          userId: user.id,
        })
        .returning()
        .execute();

      await kv.set(`profile-link:${input.link}`, profileLink[0], {
        ex: 30 * 60,
      });

      return profileLink;
    }),

  getAll: protectedProcedure.input(z.undefined()).query(async ({ ctx }) => {
    const user = await getUser(ctx);

    const profileLinks = await ctx.db.query.link.findMany({
      where: (link, { eq }) => eq(link.userId, user.id),
    });

    return profileLinks;
  }),

  getByLink: publicProcedure
    .input(
      z.object({
        link: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const authedUserId = ctx.auth?.userId;

      const user = authedUserId
        ? await ctx.db.query.user.findFirst({
            where: (user, { eq }) => eq(user.providerId, authedUserId),
            columns: {
              id: true,
              plan: true,
              subscriptionEndsAt: true,
            },
          })
        : null;

      const cached = await kv.get<InferSelectModel<typeof link> | null>(
        `profile-link:${input.link}`
      );

      if (cached) {
        return {
          ...cached,
          isOwner: user?.id === cached.userId,
          isPremium:
            user?.id === cached.userId &&
            user?.plan === "pro" &&
            user?.subscriptionEndsAt &&
            user?.subscriptionEndsAt > new Date(),
        };
      }

      const profileLink = await ctx.db.query.link.findFirst({
        where: (link, { eq }) => eq(link.link, input.link),
      });

      if (!profileLink) {
        return null;
      }

      await kv.set(`profile-link:${input.link}`, profileLink, {
        ex: 30 * 60,
      });

      return {
        ...profileLink,
        isOwner: user?.id === profileLink.userId,
        isPremium:
          user?.id === profileLink.userId &&
          user?.plan === "pro" &&
          user?.subscriptionEndsAt &&
          user?.subscriptionEndsAt > new Date(),
      };
    }),

  recordVisit: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let ip = ctx.req.ip ?? ctx.req.headers.get("x-real-ip");
      const forwardedFor = ctx.req.headers.get("x-forwarded-for");
      if (!ip && forwardedFor) {
        ip = forwardedFor.split(",").at(0) ?? "Unknown";
      }

      const exists = await ctx.db.query.linkView.findFirst({
        where: (linkView, { eq, and, sql }) =>
          and(
            eq(linkView.ip, ip ?? "Unknown"),
            eq(linkView.linkId, input.id),
            sql`created_at > now() - interval '1 hour'`
          ),
        columns: {
          id: true,
        },
      });

      if (!exists) {
        await ctx.db.insert(linkView).values({
          ip: ip ?? "Unknown",
          userAgent: ctx.req.headers.get("user-agent") ?? "Unknown",
          linkId: input.id,
        });
      }

      return true;
    }),

  getViews: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const cached = await kv.get<number | null>(
        `profile-link-views:${input.id}`
      );

      if (cached) {
        return cached;
      }

      const views = await ctx.db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(linkView)
        .where(eq(linkView.linkId, input.id));

      await kv.set(`profile-link-views:${input.id}`, views[0]?.count ?? 0, {
        ex: 30 * 60,
      });

      return views[0]?.count ?? 0;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const update = await ctx.db
        .update(link)
        .set({
          name: input.name,
          bio: input.bio,
        })
        .where(eq(link.id, input.id))
        .returning()
        .execute();

      await kv.set(`profile-link:${update[0]?.link}`, update[0], {
        ex: 30 * 60,
      });

      return update;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        link: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(link).where(eq(link.link, input.link));

      await kv.del(`profile-link:${input.link}`);

      return true;
    }),

  createBento: protectedProcedure
    .input(
      z.object({
        link: z.string(),
        bento: bentoSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profileLink = await ctx.db.query.link.findFirst({
        where: (link, { eq }) => eq(link.link, input.link),
        columns: {
          id: true,
          bento: true,
        },
      });

      if (!profileLink) {
        throw new Error("Profile link not found");
      }

      const cached = await kv.get<InferSelectModel<typeof link> | null>(
        `profile-link:${input.link}`
      );

      const update = await ctx.db
        .update(link)
        .set({
          bento: (cached?.bento ?? []).concat([input.bento]),
        })
        .where(eq(link.link, input.link))
        .returning()
        .execute();

      if (cached) {
        await kv.set(
          `profile-link:${cached.link}`,
          {
            ...cached,
            bento: cached.bento.concat([input.bento]),
          },
          {
            ex: 30 * 60,
          }
        );
      }

      return update[0]?.bento;
    }),

  deleteBento: protectedProcedure
    .input(
      z.object({
        link: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profileLink = await ctx.db.query.link.findFirst({
        where: (link, { eq }) => eq(link.link, input.link),
        columns: {
          id: true,
          bento: true,
        },
      });

      if (!profileLink) {
        throw new Error("Profile link not found");
      }

      await ctx.db
        .update(link)
        .set({
          bento: profileLink.bento.filter((b) => b.id !== input.id),
        })
        .where(eq(link.link, input.link));

      const cached = await kv.get<InferSelectModel<typeof link> | null>(
        `profile-link:${input.link}`
      );

      if (cached) {
        await kv.set(
          `profile-link:${cached.link}`,
          {
            ...cached,
            bento: cached.bento.filter((b) => b.id !== input.id),
          },
          {
            ex: 30 * 60,
          }
        );
      }

      return true;
    }),

  updateBento: protectedProcedure
    .input(
      z.object({
        link: z.string(),
        bento: bentoSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profileLink = await ctx.db.query.link.findFirst({
        where: (link, { eq }) => eq(link.link, input.link),
        columns: {
          id: true,
          bento: true,
        },
      });

      if (!profileLink) {
        throw new Error("Profile link not found");
      }

      const update = await ctx.db
        .update(link)
        .set({
          bento: [
            ...profileLink.bento.filter((b) => b.id !== input.bento.id),
            input.bento,
          ],
        })
        .where(eq(link.link, input.link))
        .returning()
        .execute();

      const cached = await kv.get<InferSelectModel<typeof link> | null>(
        `profile-link:${input.link}`
      );

      if (cached) {
        await kv.set(
          `profile-link:${cached.link}`,
          {
            ...cached,
            ...update[0],
          },
          {
            ex: 30 * 60,
          }
        );
      }

      return true;
    }),
});
