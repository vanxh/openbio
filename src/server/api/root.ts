import { mergeRouters } from "@/server/api/trpc";
import { edgeRouter } from "@/server/api/edge";
import { serverlessRouter } from "@/server/api/serverless";

export const appRouter = mergeRouters(edgeRouter, serverlessRouter);

export type AppRouter = typeof appRouter;
