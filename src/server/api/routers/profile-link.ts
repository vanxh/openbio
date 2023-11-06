import { type SignedInAuthObject } from "@clerk/nextjs/api";
import * as z from "zod";
import { getMetadata } from "@/lib/metadata";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  type Context,
} from "@/server/api/trpc";
import {
  addProfileLinkBento,
  canModifyProfileLink,
  canUserCreateProfileLink,
  createProfileLink,
  deleteProfileLink,
  deleteProfileLinkBento,
  getProfileLinkByLink,
  getProfileLinksOfUser,
  getProfileLinkViews,
  getUserByProviderId,
  isProfileLinkAvailable,
  recordLinkView,
  updateProfileLink,
  updateProfileLinkBento,
} from "@/server/db";
import { type LinkBento } from "@/types";
import {
  CreateLinkBentoSchema,
  CreateLinkSchema,
  DeleteLinkBentoSchema,
  DeleteLinkSchema,
  GetByLinkSchema,
  GetLinkViewsSchema,
  LinkAvailableSchema,
  UpdateLinkBentoSchema,
  UpdateLinkSchema,
} from "../schemas";

const getUser = async (
  ctx: Context & {
    auth: SignedInAuthObject;
  },
) => {
  const user = await getUserByProviderId(ctx.auth.userId, {
    id: true,
    plan: true,
    subscriptionEndsAt: true,
  });

  if (!user) throw new Error("User not found");

  return user;
};

export const profileLinkRouter = createTRPCRouter({
  linkAvailable: publicProcedure
    .input(LinkAvailableSchema)
    .query(async ({ input }) => {
      return isProfileLinkAvailable(input.link);
    }),

  create: protectedProcedure
    .input(CreateLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await getUser(ctx);

      const canCreate = await canUserCreateProfileLink(user);
      if (!canCreate) {
        throw new Error(
          "You can't create more profile links, upgrade your plan",
        );
      }

      const isAvailable = await isProfileLinkAvailable(input.link);
      if (!isAvailable) {
        throw new Error("This profile link is not available");
      }

      const bento: LinkBento[] = [];

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

      const profileLink = await createProfileLink({
        link: input.link,
        name: input.link,
        bio: "I'm using OpenBio.app!",
        bento,
        userId: user.id,
      });

      return profileLink;
    }),

  getAll: protectedProcedure.input(z.undefined()).query(async ({ ctx }) => {
    const user = await getUser(ctx);
    const profileLinks = await getProfileLinksOfUser(user.id);

    return profileLinks;
  }),

  getByLink: publicProcedure
    .input(GetByLinkSchema)
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

      const profileLink = await getProfileLinkByLink(input.link);

      if (!profileLink) {
        return null;
      }

      let ip = ctx.req.ip ?? ctx.req.headers.get("x-real-ip");
      const forwardedFor = ctx.req.headers.get("x-forwarded-for");
      if (!ip && forwardedFor) {
        ip = forwardedFor.split(",").at(0) ?? "Unknown";
      }

      await recordLinkView(profileLink.id, {
        ip: ip ?? "Unknown",
        userAgent: ctx.req.headers.get("user-agent") ?? "Unknown",
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

  getViews: publicProcedure
    .input(GetLinkViewsSchema)
    .query(async ({ input }) => {
      return getProfileLinkViews(input.id);
    }),

  update: protectedProcedure
    .input(UpdateLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = await getUser(ctx);
      await canModifyProfileLink({
        userId,
        linkId: input.id,
      });

      return updateProfileLink(input);
    }),

  delete: protectedProcedure
    .input(DeleteLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = await getUser(ctx);
      await canModifyProfileLink({
        userId,
        link: input.link,
      });

      return deleteProfileLink(input.link);
    }),

  createBento: protectedProcedure
    .input(CreateLinkBentoSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = await getUser(ctx);
      await canModifyProfileLink({
        userId,
        link: input.link,
      });

      return addProfileLinkBento(input.link, input.bento);
    }),

  deleteBento: protectedProcedure
    .input(DeleteLinkBentoSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = await getUser(ctx);
      await canModifyProfileLink({
        userId,
        link: input.link,
      });

      return deleteProfileLinkBento(input.link, input.id);
    }),

  updateBento: protectedProcedure
    .input(UpdateLinkBentoSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = await getUser(ctx);
      await canModifyProfileLink({
        userId,
        link: input.link,
      });

      return updateProfileLinkBento(input.link, input.bento);
    }),

  getMetadataOfURL: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return getMetadata(input.url);
    }),
});
