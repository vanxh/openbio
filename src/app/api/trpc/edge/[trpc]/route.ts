import { edgeRouter } from '@/server/api/edge';
import { createTRPCContext } from '@/server/api/trpc';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc/edge',
    router: edgeRouter,
    req: req,
    createContext: () => createTRPCContext({ req }),
    onError: ({ error }) => {
      console.log('Error in tRPC handler');
      console.error(error);
    },
  });

export { handler as GET, handler as POST };
