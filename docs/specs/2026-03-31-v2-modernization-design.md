# OpenBio v2 — Full Modernization Design

**Date:** 2026-03-31
**Approach:** Big Bang — single upgrade pass on `v2` branch with incremental commits

---

## Overview

OpenBio is a 3-year-old link-in-bio builder. This upgrade modernizes the entire stack: framework, runtime, auth, storage, tooling, and AI developer experience.

**Branch:** `v2`
**Strategy:** Commits after each logical chunk, all on one branch.

---

## 1. Core Upgrades

### Version Bumps

| Package | Current | Target |
|---------|---------|--------|
| Next.js | 14.0 | 15 (latest stable) |
| React / React DOM | 18.2 | 19 |
| TypeScript | 5.2 | 5.7+ |
| Tailwind CSS | 3.3 | 4 |
| Drizzle ORM | 0.28 | latest (0.38+) |
| Drizzle Kit | 0.19 | latest |
| tRPC | 10.43 | 11 |
| TanStack React Query | 4.36 | 5 |
| Zod | 3.22 | 3.24+ |

### Package Manager

- **pnpm → Bun**
- Remove `pnpm-lock.yaml`, generate `bun.lock`
- Remove `"preinstall"` script and `"packageManager"` field
- All scripts use `bun` / `bunx`
- `ts-node` migration script → `bun` (native TS execution)

### New Tooling

| Tool | Purpose | Replaces |
|------|---------|----------|
| Biome | Linting + formatting | ESLint + Prettier |
| Ultracite | Opinionated Biome config | ESLint configs, Prettier plugins |
| Husky | Git hooks (pre-commit) | Nothing (new) |

### Removals (replaced by Biome/Ultracite)

- `eslint`, `eslint-config-next`, `@typescript-eslint/*`
- `prettier`, `prettier-plugin-tailwindcss`, `@ianvs/prettier-plugin-sort-imports`
- All `.eslintrc` / `.prettierrc` configs

### New Config Files

- `biome.json` — extends ultracite
- `.husky/pre-commit` — runs `biome check --write` on staged files

### Key Breaking Changes

- **Tailwind v4**: No `tailwind.config.ts` — config moves to CSS `@theme`. `tailwindcss-animate` → `tw-animate-css`. PostCSS simplifies.
- **tRPC v11**: `@trpc/next` deprecated → `@trpc/tanstack-react-query` + `@trpc/server/http`. New init API.
- **React 19**: `forwardRef` no longer needed. `useFormStatus` from `react-dom`.
- **Next.js 15**: Async request APIs (`await cookies()`, `await headers()`, `await params`, `await searchParams`). Turbopack default dev bundler.
- **Drizzle**: `drizzle-kit generate:pg` → `drizzle-kit generate`. New config format with `dialect`.

### Additional Removals

- `@tanstack/react-query-next-experimental` (merged into v5 core)
- `autoprefixer` (not needed with Tailwind v4)
- `postcss` config simplifies

---

## 2. Backend Modernization

### Storage Replacements

| Current | Replacement | Env Var Change |
|---------|-------------|----------------|
| `@vercel/kv` | `@upstash/redis` | `KV_*` (4 vars) → `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (2 vars) |
| UploadThing | `@vercel/blob` | `UPLOADTHING_*` (2 vars) → `BLOB_READ_WRITE_TOKEN` (1 var) |

**Files affected by KV → Upstash:**
- `src/server/db/utils/link.ts`
- `src/server/db/utils/link-view.ts`
- `src/lib/metadata.ts`

**Files affected by UploadThing → Vercel Blob:**
- `src/server/uploadthing.ts` (remove)
- `src/lib/uploadthing.ts` (remove)
- `src/app/api/uploadthing/route.ts` → `src/app/api/upload/route.ts`
- `src/app/[link]/_components/avatar.tsx`

### tRPC v11 Migration

- `@trpc/next` → `@trpc/tanstack-react-query` + `@trpc/server`
- New client setup pattern (no `createTRPCNext`)
- Edge/serverless split stays with updated handler APIs
- Superjson transformer stays (explicit opt-in)

### Drizzle Updates

- `drizzle-kit generate:pg` → `drizzle-kit generate`
- `drizzle-kit push:pg` → `drizzle-kit push`
- `drizzle.config.ts` updated: `dialect: "postgresql"`
- Migration runner: `ts-node --esm` → `bun`

### Other Dep Updates

- `@neondatabase/serverless` → latest
- `stripe` → latest (v17+)
- `resend` → latest stable (not canary)
- `svix` → removed (Clerk-specific)
- `react-grid-layout` → latest
- All Radix UI deps → latest
- `lucide-react` → latest
- `next-themes` → latest

---

## 3. Auth Swap (Clerk → Better Auth)

### Current Clerk Touchpoints (13 files)

- `src/app/layout.tsx` — `ClerkProvider`
- `src/middleware.ts` — `authMiddleware`
- `src/server/api/trpc.ts` — `getAuth` from Clerk
- `src/app/app/(auth)/sign-in/` — Clerk sign-in component
- `src/app/app/(auth)/sign-up/` — Clerk sign-up component
- `src/app/api/webhook/clerk/route.ts` — webhook handler
- `src/components/navbar/app.tsx` — Clerk `UserButton`
- `src/components/navbar/home.tsx` — Clerk imports
- `src/components/user-settings.tsx` — Clerk hooks
- `src/app/create-link/page.tsx` — Clerk auth
- `src/app/actions/claim-link.tsx` — Clerk auth
- `src/server/uploadthing.ts` — Clerk auth
- `src/server/api/routers/profile-link.ts` — Clerk userId

### Better Auth Setup

| Piece | File |
|-------|------|
| Server config | `src/lib/auth.ts` |
| Client | `src/lib/auth-client.ts` |
| API route | `src/app/api/auth/[...all]/route.ts` |
| Middleware | `src/middleware.ts` |

### Database Changes

Better Auth manages its own tables: `user`, `session`, `account`, `verification`.

**User table transformation:**
- Keep: `id`, `email`, `createdAt`, `updatedAt`
- Add (Better Auth required): `name`, `emailVerified`, `image`
- Add as `additionalFields`: `plan`, `stripeCustomerId`, `subscriptionId`, `subscriptionEndsAt`
- Drop: `providerId` (Clerk-specific)
- Merge: `firstName` + `lastName` → `name`

### Removals

- `@clerk/nextjs`, `@clerk/clerk-react`, `@clerk/themes`
- `svix`
- `/api/webhook/clerk` route
- All `CLERK_*` and `NEXT_PUBLIC_CLERK_*` env vars (7 vars removed)

### New Env Vars

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional, for social OAuth)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (optional, for social OAuth)

### Auth Flow

1. Better Auth handles sign-up/sign-in via `/api/auth/[...all]`
2. Middleware checks session, redirects unauthenticated users
3. tRPC context reads session from Better Auth (replaces `getAuth`)
4. Custom sign-in/sign-up pages using Better Auth React client (`signIn.email()`, `signUp.email()`, `signIn.social()`)

---

## 4. AI Readiness

### `CLAUDE.md` (project root)

- Project overview
- Tech stack with versions
- Architecture overview (App Router, tRPC split, bento system)
- Dev commands (`bun dev`, `bun run build`, `bun run db:*`)
- File structure map
- Coding conventions
- Database schema summary
- Auth flow (Better Auth)
- Common gotchas

### `.claude/settings.json`

- Project-level Claude Code settings
- Allowed tools config

### Custom Skills (`.claude/commands/`)

| Skill | Purpose |
|-------|---------|
| `bento.md` | Bento card system — types, grid layout, CRUD, size/position schema |
| `trpc-router.md` | Adding tRPC routers/procedures, edge vs serverless, auth patterns |
| `db-schema.md` | Drizzle schema modifications, migrations, relations |
| `auth.md` | Better Auth patterns — protecting routes, sessions, social providers |
| `stripe.md` | Stripe webhooks, subscription flow, plan gating |

---

## Env Var Summary (Before → After)

### Removed (12 vars)
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`
- `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`

### Added (7 vars)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `BLOB_READ_WRITE_TOKEN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (optional)

### Kept
- `DATABASE_URL`, `NODE_ENV`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_YEARLY_PRICE_ID`
- `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
