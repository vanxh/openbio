import * as z from "zod";
import {
  BentoSize,
  type ProfileLink,
  BentoType,
  type Bento,
} from "@prisma/client";
import { kv } from "@vercel/kv";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

const createProfileLinkInput = z.object({
  link: z.string().toLowerCase(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  youtube: z.string().optional(),
  twitch: z.string().optional(),
});

const isValidLink = (link: string) => {
  if (
    /^[a-zA-Z0-9_]+$/.test(link) &&
    link.length >= 3 &&
    ![
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
    ].includes(link)
  ) {
    return true;
  }

  return false;
};

type ProfileLinkCache = ProfileLink & {
  Bento: (Bento & {
    mobilePosition: {
      x: number;
      y: number;
    };
    desktopPosition: {
      x: number;
      y: number;
    };
  })[];
  user: {
    providerId: string;
  };
};

export const profileLinkRouter = createTRPCRouter({
  linkAvailable: publicProcedure
    .input(
      z.object({
        link: z.string().toLowerCase(),
      })
    )
    .query(async ({ input, ctx }) => {
      const profileLink = await ctx.prisma.profileLink.findUnique({
        where: {
          link: input.link,
        },
        select: { id: true },
      });

      if (profileLink) return false;

      return isValidLink(input.link);
    }),

  create: protectedProcedure
    .input(createProfileLinkInput)
    .mutation(async ({ input, ctx }) => {
      if (!isValidLink(input.link)) {
        throw new Error("Invalid link");
      }

      const profileLinks = await ctx.prisma.profileLink.count({
        where: {
          user: {
            providerId: ctx.auth.userId,
          },
        },
      });
      if (profileLinks >= 1) {
        throw new Error(
          "You can't create more profile links, upgrade your plan"
        );
      }

      const bento: {
        type: BentoType;
        href: string;

        mobileSize: BentoSize;
        desktopSize: BentoSize;

        mobilePosition: number;
        desktopPosition: number;
      }[] = [];

      let position = 1;
      for (const [key, value] of Object.entries(input)) {
        if (key !== "link" && value) {
          let url = `https://${key}.com/${value}`;

          if (key === "linkedin") {
            url = `https://www.${key}.com/in/${value}`;
          }

          if (key === "youtube") {
            url = `https://www.${key}.com/@${value}`;
          }

          if (key === "twitch") {
            url = `https://www.${key}.tv/${value}`;
          }

          if (key === "telegram") {
            url = `https://t.me/${value}`;
          }

          bento.push({
            type: "LINK",

            href: url,

            mobileSize: "SIZE_2x2",
            desktopSize: "SIZE_2x2",

            mobilePosition: position,
            desktopPosition: position,
          });

          position += 1;
        }
      }

      const profileLink = await ctx.prisma.profileLink.create({
        data: {
          link: input.link,
          name: input.link,
          bio: "I'm using OpenBio.app!",

          Bento: {
            createMany: {
              data: bento,
            },
          },

          user: {
            connect: {
              providerId: ctx.auth.userId,
            },
          },
        },

        include: {
          Bento: true,
          user: {
            select: {
              providerId: true,
            },
          },
        },
      });

      await kv.set(`profile-link:${input.link}`, profileLink, {
        ex: 30 * 60,
      });

      return profileLink;
    }),

  getAll: protectedProcedure.input(z.undefined()).query(async ({ ctx }) => {
    const profileLinks = await ctx.prisma.profileLink.findMany({
      where: {
        user: {
          providerId: ctx.auth.userId,
        },
      },
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
      const cached = await kv.get<ProfileLinkCache | null>(
        `profile-link:${input.link}`
      );

      if (cached) {
        return {
          ...cached,
          isOwner: ctx.auth?.userId === cached.user.providerId,
        };
      }

      const profileLink = await ctx.prisma.profileLink.findUnique({
        where: {
          link: input.link,
        },
        include: {
          Bento: true,
          user: {
            select: {
              providerId: true,
            },
          },
        },
      });

      if (!profileLink) {
        return null;
      }

      const data = {
        ...profileLink,

        Bento: profileLink.Bento.map((b) => ({
          ...b,
          mobilePosition: b.mobilePosition as {
            x: number;
            y: number;
          },
          desktopPosition: b.desktopPosition as {
            x: number;
            y: number;
          },
        })),
      };

      await kv.set(`profile-link:${input.link}`, data, {
        ex: 30 * 60,
      });

      return {
        ...data,
        isOwner: ctx.auth?.userId === profileLink.user.providerId,
      };
    }),

  recordVisit: publicProcedure
    .input(
      z.object({
        link: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let ip = ctx.req.ip ?? ctx.req.headers.get("x-real-ip");
      const forwardedFor = ctx.req.headers.get("x-forwarded-for");
      if (!ip && forwardedFor) {
        ip = forwardedFor.split(",").at(0) ?? "Unknown";
      }

      const exists = await ctx.prisma.profileLinkView.findFirst({
        where: {
          ip: ip ?? "Unknown",
          profileLink: {
            link: input.link,
          },
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      });

      if (!exists) {
        console.log("Creating view", ip, input.link);
        await ctx.prisma.profileLinkView.create({
          data: {
            ip: ip ?? "Unknown",
            userAgent: ctx.req.headers.get("user-agent") ?? "Unknown",
            profileLink: {
              connect: {
                link: input.link,
              },
            },
          },
        });
      }

      return true;
    }),

  getViews: publicProcedure
    .input(
      z.object({
        link: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const exists = await ctx.prisma.profileLink.findUnique({
        where: {
          link: input.link,
        },
        select: {
          id: true,
        },
      });
      if (!exists) {
        throw new Error("Profile link not found");
      }

      const views = await ctx.prisma.profileLinkView.count({
        where: {
          profileLink: {
            link: input.link,
          },
        },
      });

      return views;
    }),

  update: protectedProcedure
    .input(
      z.object({
        link: z.string(),
        name: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const update = await ctx.prisma.profileLink.update({
        where: {
          link: input.link,
        },
        data: {
          ...input,
        },
        include: {
          Bento: true,
          user: {
            select: {
              providerId: true,
            },
          },
        },
      });

      await kv.set(`profile-link:${input.link}`, update, {
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
      await ctx.prisma.profileLink.delete({
        where: {
          link: input.link,
        },
      });

      await kv.del(`profile-link:${input.link}`);

      return true;
    }),

  createBento: protectedProcedure
    .input(
      z
        .object({
          link: z.string(),
          type: z.nativeEnum(BentoType).refine((v) => v === "LINK"),
          href: z.string().url(),
        })
        .or(
          z.object({
            link: z.string(),
            type: z
              .nativeEnum(BentoType)
              .refine((v) => ["IMAGE", "VIDEO"].includes(v)),
            url: z.string().url(),
            caption: z.string().optional(),
          })
        )
    )
    .mutation(async ({ input, ctx }) => {
      const cached = await kv.get<ProfileLinkCache | null>(
        `profile-link:${input.link}`
      );

      const mobileX =
        cached?.Bento.reduce(
          (acc, b) => Math.max(acc, b.mobilePosition.x),
          0
        ) ?? 0;
      const mobileY =
        cached?.Bento.reduce(
          (acc, b) => Math.max(acc, b.mobilePosition.y),
          0
        ) ?? 0;
      const desktopX =
        cached?.Bento.reduce(
          (acc, b) => Math.max(acc, b.desktopPosition.x),
          0
        ) ?? 0;
      const desktopY =
        cached?.Bento.reduce(
          (acc, b) => Math.max(acc, b.desktopPosition.y),
          0
        ) ?? 0;

      const data = {
        ...input,
        link: undefined,
      };

      const bento = await ctx.prisma.bento.create({
        data: {
          ...data,
          mobilePosition: {
            x: mobileX + 1,
            y: mobileY + 1,
          },
          desktopPosition: {
            x: desktopX + 1,
            y: desktopY + 1,
          },
          profileLink: {
            connect: {
              link: input.link,
            },
          },
        },
      });

      if (cached) {
        await kv.set(
          `profile-link:${cached.link}`,
          {
            ...cached,
            Bento: [...cached.Bento, bento],
          },
          {
            ex: 30 * 60,
          }
        );
      }

      return bento;
    }),

  deleteBento: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.prisma.bento.delete({
        where: {
          id: input.id,
        },
        select: {
          profileLink: {
            select: {
              link: true,
            },
          },
        },
      });

      const cached = await kv.get<ProfileLinkCache | null>(
        `profile-link:${res.profileLink.link}`
      );

      if (cached) {
        await kv.set(
          `profile-link:${cached.link}`,
          {
            ...cached,
            Bento: cached.Bento.filter((b) => b.id !== input.id),
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
        id: z.string(),
        mobilePosition: z
          .object({
            x: z.number(),
            y: z.number(),
          })
          .optional(),
        desktopPosition: z
          .object({
            x: z.number(),
            y: z.number(),
          })
          .optional(),
        mobileSize: z.nativeEnum(BentoSize).optional(),
        desktopSize: z.nativeEnum(BentoSize).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const update = await ctx.prisma.bento.update({
        where: {
          id: input.id,
        },
        data: {
          mobilePosition: input.mobilePosition,
          desktopPosition: input.desktopPosition,
          mobileSize: input.mobileSize,
          desktopSize: input.desktopSize,
        },
        select: {
          profileLink: {
            select: {
              link: true,
            },
          },
        },
      });

      const cached = await kv.get<ProfileLinkCache | null>(
        `profile-link:${update.profileLink.link}`
      );

      if (cached) {
        await kv.set(
          `profile-link:${cached.link}`,
          {
            ...cached,
            Bento: cached.Bento.map((b) => {
              if (b.id === input.id) {
                return {
                  ...b,
                  mobilePosition:
                    (input.mobilePosition as {
                      x: number;
                      y: number;
                    }) ?? b.mobilePosition,
                  desktopPosition:
                    (input.desktopPosition as {
                      x: number;
                      y: number;
                    }) ?? b.desktopPosition,
                  mobileSize: input.mobileSize ?? b.mobileSize,
                  desktopSize: input.desktopSize ?? b.desktopSize,
                };
              }

              return b;
            }),
          },
          {
            ex: 30 * 60,
          }
        );
      }

      return true;
    }),
});
