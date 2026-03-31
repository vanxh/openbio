# Adding tRPC Routers

## Files
- Init: `src/server/api/trpc.ts`
- Root: `src/server/api/root.ts`
- Routers: `src/server/api/routers/{name}.ts`
- Client: `src/trpc/react.ts` (useTRPC hook)

## New Router Steps
1. Create `src/server/api/routers/{name}.ts`
2. Use createTRPCRouter + publicProcedure/protectedProcedure
3. Add to root router in `src/server/api/root.ts`

## Auth Context
- publicProcedure: ctx.db, ctx.session (nullable)
- protectedProcedure: ctx.db, ctx.session, ctx.user (non-null)
- User ID: ctx.user.id
