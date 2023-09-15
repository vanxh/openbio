import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTRPCContext } from "@/server/api/trpc";
import { serverlessRouter } from "@/server/api/serverless";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc/serverless",
    router: serverlessRouter,
    req: req,
    createContext: () => createTRPCContext({ req }),
    onError: ({ error }) => {
      console.log("Error in tRPC handler");
      console.error(error);
    },
  });

export { handler as GET, handler as POST };
