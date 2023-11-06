import { createNextRouteHandler } from "uploadthing/next";
import { appFileRouter } from "@/server/uploadthing";

export const { GET, POST } = createNextRouteHandler({
  router: appFileRouter,
});
