import { currentUser } from "@clerk/nextjs";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { utapi } from "uploadthing/server";
import * as z from "zod";
import { db, eq, link } from "@/server/db";

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
      }),
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
      const profileLink = await db.query.link.findFirst({
        where: (link, { eq }) => eq(link.id, metadata.profileLinkId),
        columns: { image: true },
      });

      if (profileLink?.image) {
        await utapi.deleteFiles(profileLink.image.split("/").pop()!);
      }

      await db
        .update(link)
        .set({
          image: file.url,
        })
        .where(eq(link.id, metadata.profileLinkId));
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof appFileRouter;
