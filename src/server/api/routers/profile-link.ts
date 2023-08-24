import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

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

      if (!profileLink) {
        // make sure the username is not a reserved word and is above 3 characters and don't contain any special characters
        if (/^[a-zA-Z0-9_]+$/.test(input) && input.length >= 3) {
          return true;
        }
      }

      return false;
    }),
});
