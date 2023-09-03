import * as z from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs";

import { prisma } from "@/server/db/db";
import { utapi } from "uploadthing/server";

const f = createUploadthing({
  errorFormatter: (err) => {
    return {
      message: err.message,
      zodError: err.cause instanceof z.ZodError ? err.cause.flatten() : null,
    };
  },
});

export const appFileRouter = {
  profileLinkImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(
      z.object({
        profileLinkId: z.string(),
      })
    )
    .middleware(async ({ input }) => {
      const user = await currentUser();

      if (!user) throw new Error("Unauthorized");

      return {
        userId: user.id,
        profileLinkId: input.profileLinkId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const profileLink = await prisma.profileLink.findUnique({
        where: { id: metadata.profileLinkId },
        select: { image: true },
      });

      if (profileLink?.image) {
        await utapi.deleteFiles(profileLink.image.split("/").pop()!);
      }

      await prisma.profileLink.update({
        where: { id: metadata.profileLinkId },
        data: { image: file.url },
      });
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof appFileRouter;
