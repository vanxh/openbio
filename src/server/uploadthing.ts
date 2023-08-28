import * as z from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs";

import { prisma } from "@/server/db";

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
    image: { maxFileSize: "1MB", maxFileCount: 1 },
  })
    .input(
      z.object({
        profileLinkId: z.string(),
      })
    )
    .middleware(async ({ input }) => {
      console.log("middleware", input);
      const user = await currentUser();

      if (!user) throw new Error("Unauthorized");

      return {
        userId: user.id,
        profileLinkId: input.profileLinkId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("onUploadComplete", metadata, file);
      await prisma.profileLink.update({
        where: { id: metadata.profileLinkId },
        data: { image: file.url },
      });
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof appFileRouter;
