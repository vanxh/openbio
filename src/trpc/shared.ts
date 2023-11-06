import {
  unstable_httpBatchStreamLink,
  type HTTPBatchLinkOptions,
  type HTTPHeaders,
  type TRPCLink,
} from "@trpc/client";
import { type AppRouter } from "@/server/api/root";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  const vc = process.env.VERCEL_URL;
  if (vc) return `https://${vc}`;
  return `http://localhost:3000`;
};

const serverlessRouters = ["clerk", "stripe"];

export const endingLink = (opts?: { headers?: HTTPHeaders }) =>
  ((runtime) => {
    const sharedOpts = {
      headers: opts?.headers,
    } satisfies Partial<HTTPBatchLinkOptions>;

    const edgeLink = unstable_httpBatchStreamLink({
      ...sharedOpts,
      url: `${getBaseUrl()}/api/trpc/edge`,
    })(runtime);
    const serverlessLink = unstable_httpBatchStreamLink({
      ...sharedOpts,
      url: `${getBaseUrl()}/api/trpc/serverless`,
    })(runtime);

    return (ctx) => {
      const path = ctx.op.path.split(".") as [string, ...string[]];
      const endpoint = serverlessRouters.includes(path[0])
        ? "serverless"
        : "edge";

      const newCtx = {
        ...ctx,
        op: { ...ctx.op, path: path.join(".") },
      };

      return endpoint === "serverless"
        ? serverlessLink(newCtx)
        : edgeLink(newCtx);
    };
  }) satisfies TRPCLink<AppRouter>;
