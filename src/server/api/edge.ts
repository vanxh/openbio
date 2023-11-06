import { profileLinkRouter } from "@/server/api/routers/profile-link";
import { userRouter } from "@/server/api/routers/user";
import { createTRPCRouter } from "@/server/api/trpc";

export const edgeRouter = createTRPCRouter({
  user: userRouter,
  profileLink: profileLinkRouter,
});
