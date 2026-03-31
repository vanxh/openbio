# Better Auth Patterns

## Files
- Server: `src/lib/auth.ts`
- Client: `src/lib/auth-client.ts`
- API: `src/app/api/auth/[...all]/route.ts`

## Server Session
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
const session = await auth.api.getSession({ headers: await headers() });
```

## Client Session
```typescript
import { useSession, signIn, signOut } from "@/lib/auth-client";
const { data: session } = useSession();
```

## tRPC: protectedProcedure guarantees ctx.user
## Middleware: Cookie check via getSessionCookie()

## Adding Social Provider
1. Add env vars in src/env.mjs
2. Add to socialProviders in src/lib/auth.ts
3. Client: signIn.social({ provider: "name" })
