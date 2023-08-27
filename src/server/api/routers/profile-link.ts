import * as z from "zod";
import {
  BentoSize,
  type ProfileLink,
  type BentoType,
  type Bento,
} from "@prisma/client";
import { kv } from "@vercel/kv";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

const createProfileLinkInput = z.object({
  link: z.string(),
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
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const profileLink = await ctx.prisma.profileLink.findUnique({
        where: {
          link: input,
        },
        select: { id: true },
      });

      if (profileLink) return false;

      return isValidLink(input);
    }),

  createProfileLink: protectedProcedure
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
            url = `https://www.${key}.com/channel/${value}`;
          }

          if (key === "twitch") {
            url = `https://www.${key}.tv/${value}`;
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

  getProfileLinks: protectedProcedure
    .input(z.undefined())
    .query(async ({ ctx }) => {
      const profileLinks = await ctx.prisma.profileLink.findMany({
        where: {
          user: {
            providerId: ctx.auth.userId,
          },
        },
      });

      return profileLinks;
    }),

  getProfileLink: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const cached = await kv.get<ProfileLinkCache | null>(
        `profile-link:${input}`
      );

      if (cached) {
        return {
          ...cached,
          isOwner: ctx.auth?.userId === cached.user.providerId,
        };
      }

      const profileLink = await ctx.prisma.profileLink.findUnique({
        where: {
          link: input,
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

      await kv.set(`profile-link:${input}`, data, {
        ex: 30 * 60,
      });

      return {
        ...data,
        isOwner: ctx.auth?.userId === profileLink.user.providerId,
      };
    }),

  updateProfileLink: protectedProcedure
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

  deleteProfileLink: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.profileLink.delete({
        where: {
          link: input,
        },
      });

      await kv.del(`profile-link:${input}`);

      return true;
    }),

  deleteProfileLinkBento: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.bento.delete({
        where: {
          id: input,
        },
      });

      const cached = await kv.get<ProfileLinkCache | null>(
        `profile-link:${input}`
      );

      if (cached) {
        await kv.set(
          `profile-link:${cached.link}`,
          {
            ...cached,
            Bento: cached.Bento.filter((b) => b.id !== input),
          },
          {
            ex: 30 * 60,
          }
        );
      }

      return true;
    }),

  updateProfileLinkBento: protectedProcedure
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
      await ctx.prisma.bento.update({
        where: {
          id: input.id,
        },
        data: {
          mobilePosition: input.mobilePosition,
          desktopPosition: input.desktopPosition,
          mobileSize: input.mobileSize,
          desktopSize: input.desktopSize,
        },
      });

      const cached = await kv.get<ProfileLinkCache | null>(
        `profile-link:${input.id}`
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
                  mobilePosition: input.mobilePosition as {
                    x: number;
                    y: number;
                  },
                  desktopPosition: input.desktopPosition as {
                    x: number;
                    y: number;
                  },
                  mobileSize: input.mobileSize,
                  desktopSize: input.desktopSize,
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
