import { createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "@/server/api/routers/user";
import { profileLinkRouter } from "@/server/api/routers/profile-link";

export const edgeRouter = createTRPCRouter({
  user: userRouter,
  profileLink: profileLinkRouter,
});
