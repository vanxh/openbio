import { edgeRouter } from "@/server/api/edge";
import { serverlessRouter } from "@/server/api/serverless";
import { mergeRouters } from "@/server/api/trpc";

export const appRouter = mergeRouters(edgeRouter, serverlessRouter);

export type AppRouter = typeof appRouter;
