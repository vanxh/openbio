import { getMetadata } from '@/lib/metadata';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc';
import {
  addProfileLinkBento,
  canModifyProfileLink,
  canUserCreateProfileLink,
  createProfileLink,
  deleteProfileLink,
  deleteProfileLinkBento,
  getProfileLinkByLink,
  getProfileLinkViews,
  getProfileLinksOfUser,
  isProfileLinkAvailable,
  recordLinkView,
  updateProfileLink,
  updateProfileLinkBento,
} from '@/server/db';
import type { LinkBento } from '@/types';
import * as z from 'zod';
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
} from '../schemas';

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
        columns: { id: true, plan: true, subscriptionEndsAt: true },
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

      const bento = generateInitialBento(input);

      const profileLink = await createProfileLink({
        link: input.link,
        name: input.name || input.link,
        bio: input.bio || "I'm using OpenBio.app!",
        bento,
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

      const user = authedUserId
        ? await ctx.db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, authedUserId),
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

      let ip = ctx.req.headers.get('x-real-ip');
      const forwardedFor = ctx.req.headers.get('x-forwarded-for');
      if (!ip && forwardedFor) {
        ip = forwardedFor.split(',').at(0) ?? 'Unknown';
      }

      await recordLinkView(profileLink.id, {
        ip: ip ?? 'Unknown',
        userAgent: ctx.req.headers.get('user-agent') ?? 'Unknown',
      });

      return {
        ...profileLink,
        isOwner: user?.id === profileLink.userId,
        isPremium:
          user?.id === profileLink.userId &&
          user?.plan === 'pro' &&
          user?.subscriptionEndsAt &&
          user?.subscriptionEndsAt > new Date(),
      };
    }),

  getViews: publicProcedure
    .input(GetLinkViewsSchema)
    .query(async ({ input }) => {
      return await getProfileLinkViews(input.id);
    }),

  update: protectedProcedure
    .input(UpdateLinkSchema)
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
        linkId: input.id,
      });

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

      return deleteProfileLink(input.link);
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

  getMetadataOfURL: publicProcedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getMetadata(input.url);
    }),
});

function generateInitialBento(input: z.infer<typeof CreateLinkSchema>) {
  const bento: LinkBento[] = [];
  let position = { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } };

  for (const [key, value] of Object.entries(input)) {
    if (key === 'link' || !value) {
      continue;
    }

    const url = getSocialUrl(key, value);
    bento.push({
      id: crypto.randomUUID(),
      type: 'link',
      href: url,
      clicks: 0,
      size: { sm: '2x2', md: '2x2' },
      position,
    });

    position = getNextPosition(position);
  }
  return bento;
}

function getSocialUrl(key: string, value: string) {
  if (key === 'linkedin') {
    return `https://www.linkedin.com/in/${value}`;
  }
  if (key === 'youtube') {
    return `https://www.youtube.com/@${value.replace('@', '')}`;
  }
  if (key === 'twitch') {
    return `https://www.twitch.tv/${value}`;
  }
  if (key === 'telegram') {
    return `https://t.me/${value}`;
  }
  return `https://${key}.com/${value}`;
}

function getNextPosition(pos: {
  sm: { x: number; y: number };
  md: { x: number; y: number };
}) {
  return {
    sm: {
      x: pos.sm.x % 2 === 0 ? pos.sm.x + 1 : 0,
      y: pos.sm.x % 2 === 0 ? pos.sm.y + 1 : pos.sm.y,
    },
    md: {
      x: pos.md.x % 4 === 0 ? pos.md.x + 1 : 0,
      y: pos.md.x % 4 === 0 ? pos.md.y + 1 : pos.md.y,
    },
  };
}
