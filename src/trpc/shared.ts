import type { HTTPBatchLinkOptions, HTTPHeaders } from "@trpc/client";
import { httpBatchLink } from "@trpc/client";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  const vc = process.env.VERCEL_URL;
  if (vc) return `https://${vc}`;
  return `http://localhost:3000`;
};

export const endingLink = (opts?: { headers?: HTTPHeaders }) => {
  const sharedOpts = {
    headers: opts?.headers,
  } satisfies Partial<HTTPBatchLinkOptions>;

  const link = httpBatchLink({
    ...sharedOpts,
    url: `${getBaseUrl()}/api/trpc`,
  });

  return link;
};
