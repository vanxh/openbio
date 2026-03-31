import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    router: appRouter,
    req: req,
    createContext: () => createTRPCContext({ req }),
    onError: () => {
      // Log errors in development
    },
  });

export { handler as GET, handler as POST };
