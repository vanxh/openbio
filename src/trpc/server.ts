'use server';

import { appRouter } from '@/server/api/root';
import { createCallerFactory, createTRPCContext } from '@/server/api/trpc';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export type RouterInputs = inferRouterInputs<typeof appRouter>;
export type RouterOutputs = inferRouterOutputs<typeof appRouter>;

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(async () => {
  const h = await headers();
  return createTRPCContext({
    req: {
      headers: h,
      ip: h.get('x-real-ip') ?? undefined,
    } as unknown as NextRequest,
  });
});
