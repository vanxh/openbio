# OpenBio v2 Full Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the entire OpenBio stack in a single pass on the `v2` branch — Next.js 15, React 19, Tailwind v4, tRPC v11, Drizzle latest, Clerk→Better Auth, KV→Upstash, UploadThing→Vercel Blob, pnpm→Bun, ESLint/Prettier→Biome/Ultracite, and `.claude/` AI readiness.

**Architecture:** Big bang upgrade on `v2` branch. Each task produces a commit. The dependency order is: tooling → core framework → CSS → database → storage → tRPC → auth → upload → cleanup → AI readiness.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7+, Tailwind CSS 4, tRPC 11, Drizzle ORM (latest), Better Auth, Upstash Redis, Vercel Blob, Bun, Biome/Ultracite, Husky

---

## File Structure

### Files to Create
- `biome.json` — Biome config extending ultracite
- `.husky/pre-commit` — Pre-commit hook
- `src/lib/auth.ts` — Better Auth server config
- `src/lib/auth-client.ts` — Better Auth React client
- `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all handler
- `src/lib/redis.ts` — Upstash Redis client
- `src/app/api/upload/route.ts` — Vercel Blob upload handler
- `src/app/app/(auth)/sign-in/page.tsx` — Custom sign-in page
- `src/app/app/(auth)/sign-up/page.tsx` — Custom sign-up page
- `CLAUDE.md` — AI readiness project context
- `.claude/settings.json` — Claude Code project settings
- `.claude/commands/bento.md` — Bento system skill
- `.claude/commands/trpc-router.md` — tRPC router skill
- `.claude/commands/db-schema.md` — Drizzle schema skill
- `.claude/commands/auth.md` — Better Auth skill
- `.claude/commands/stripe.md` — Stripe integration skill

### Files to Delete
- `pnpm-lock.yaml`
- `.eslintrc.cjs` (if exists)
- `.prettierrc` / `.prettierrc.js` / `prettier.config.js` (if exists)
- `postcss.config.cjs` / `postcss.config.js` (if exists)
- `tailwind.config.ts`
- `src/lib/uploadthing.ts`
- `src/server/uploadthing.ts`
- `src/app/api/uploadthing/route.ts`
- `src/app/api/webhook/clerk/route.ts`
- `src/server/api/routers/clerk/` (entire directory)
- `src/app/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `src/app/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- `src/trpc/shared.ts`
- `src/trpc/server.ts` (rewritten)

### Files to Modify (major changes)
- `package.json` — All deps, scripts, remove packageManager
- `tsconfig.json` — Update target/module
- `next.config.mjs` — Next.js 15 config
- `drizzle.config.ts` — New Drizzle format
- `src/styles/globals.css` — Tailwind v4 CSS config (replaces tailwind.config.ts)
- `src/env.mjs` — Swap env vars (Clerk→BetterAuth, KV→Upstash, UploadThing→Blob)
- `src/middleware.ts` — Better Auth session check
- `src/app/layout.tsx` — Remove ClerkProvider
- `src/app/client-providers.tsx` — tRPC v11 + remove ReactQueryStreamedHydration
- `src/trpc/react.ts` — tRPC v11 createTRPCContext
- `src/server/api/trpc.ts` — Better Auth session, new initTRPC
- `src/server/api/root.ts` — Remove clerk router
- `src/server/api/edge.ts` — Remove (merged into single handler)
- `src/server/api/serverless.ts` — Remove (merged into single handler)
- `src/server/api/routers/user.ts` — Better Auth userId
- `src/server/api/routers/profile-link.ts` — Better Auth userId
- `src/server/db/db.ts` — Update neon driver
- `src/server/db/schema/user.ts` — Better Auth user schema
- `src/server/db/utils/link.ts` — KV→Upstash Redis
- `src/server/db/utils/link-view.ts` — KV→Upstash Redis
- `src/lib/metadata.ts` — KV→Upstash Redis
- `src/components/user-settings.tsx` — Better Auth session
- `src/components/navbar/app.tsx` — Better Auth client
- `src/components/navbar/home.tsx` — Better Auth client
- `src/app/actions/claim-link.tsx` — Better Auth session
- `src/app/create-link/page.tsx` — Better Auth session
- `src/app/[link]/_components/avatar.tsx` — Vercel Blob
- `src/app/api/webhook/stripe/route.ts` — Remove tRPC caller, direct DB

---

### Task 1: Switch to Bun and Update package.json

**Files:**
- Modify: `package.json`
- Delete: `pnpm-lock.yaml`

- [ ] **Step 1: Delete pnpm lock**

```bash
rm -f pnpm-lock.yaml
```

- [ ] **Step 2: Rewrite package.json with all updated deps**

Replace the entire `package.json` with updated dependencies. Key changes:
- Remove `packageManager` field and `preinstall` script
- Update all deps to latest versions
- Replace eslint/prettier with biome/ultracite
- Replace @clerk/nextjs with better-auth
- Replace @vercel/kv with @upstash/redis
- Replace uploadthing with @vercel/blob
- Update tRPC from v10 to v11
- Update React Query from v4 to v5
- Update scripts to use bun

```json
{
  "name": "openbio",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "vercel-build": "bun run db:migrate && bun run build",
    "prepare": "husky"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@stripe/react-stripe-js": "^3.0.0",
    "@stripe/stripe-js": "^5.0.0",
    "@t3-oss/env-nextjs": "^0.11.0",
    "@tanstack/react-query": "^5.60.0",
    "@trpc/client": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "@trpc/tanstack-react-query": "^11.0.0",
    "@upstash/redis": "^1.34.0",
    "@vercel/analytics": "^1.4.0",
    "@vercel/blob": "^0.27.0",
    "better-auth": "^1.2.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "drizzle-orm": "^0.38.0",
    "drizzle-zod": "^0.7.0",
    "lucide-react": "^0.460.0",
    "nanoid": "^5.0.0",
    "next": "^15.2.0",
    "next-themes": "^0.4.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-grid-layout": "^1.5.0",
    "react-hook-form": "^7.54.0",
    "react-icons": "^5.4.0",
    "resend": "^4.0.0",
    "stripe": "^17.0.0",
    "superjson": "^2.2.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/react-grid-layout": "^1.3.0",
    "drizzle-kit": "^0.30.0",
    "husky": "^9.0.0",
    "tailwindcss": "^4.0.0",
    "tw-animate-css": "^1.0.0",
    "typescript": "^5.7.0",
    "ultracite": "^4.0.0"
  }
}
```

- [ ] **Step 3: Install with bun**

```bash
bun install
```

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "feat: switch to bun, update all dependencies to latest"
```

---

### Task 2: Setup Biome, Ultracite, and Husky

**Files:**
- Create: `biome.json`
- Create: `.husky/pre-commit`
- Delete: `.eslintrc.cjs` (if exists), `.prettierrc` (if exists), `prettier.config.js` (if exists)

- [ ] **Step 1: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "extends": ["ultracite"]
}
```

- [ ] **Step 2: Initialize husky**

```bash
bunx husky init
```

- [ ] **Step 3: Create pre-commit hook**

Write `.husky/pre-commit`:

```bash
bunx biome check --write --staged
```

- [ ] **Step 4: Remove old lint/format configs**

```bash
rm -f .eslintrc.cjs .eslintrc.json .prettierrc .prettierrc.js prettier.config.js prettier.config.cjs
```

- [ ] **Step 5: Commit**

```bash
git add biome.json .husky/
git commit -m "feat: replace eslint/prettier with biome/ultracite, add husky"
```

---

### Task 3: Update TypeScript and Next.js Config

**Files:**
- Modify: `tsconfig.json`
- Modify: `next.config.mjs`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: Update tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Update next.config.mjs**

```javascript
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config;
```

Key change: removed `swcMinify` (default in Next.js 15).

- [ ] **Step 3: Update drizzle.config.ts**

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
});
```

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json next.config.mjs drizzle.config.ts
git commit -m "feat: update tsconfig, next.config, drizzle.config for latest versions"
```

---

### Task 4: Migrate Tailwind CSS v3 → v4

**Files:**
- Delete: `tailwind.config.ts`
- Delete: `postcss.config.cjs` / `postcss.config.js` (if exists)
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Delete tailwind.config.ts and postcss config**

```bash
rm -f tailwind.config.ts postcss.config.cjs postcss.config.js
```

- [ ] **Step 2: Rewrite globals.css with Tailwind v4 CSS config**

Tailwind v4 moves all configuration to CSS. The `@theme` directive replaces `tailwind.config.ts`.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme {
  --font-inter: "Inter", sans-serif;
  --font-cal: "Cal Sans", sans-serif;

  --radius: 0.5rem;

  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git rm -f tailwind.config.ts postcss.config.cjs postcss.config.js 2>/dev/null; true
git commit -m "feat: migrate tailwind v3 to v4, move config to CSS"
```

---

### Task 5: Update Environment Variables

**Files:**
- Modify: `src/env.mjs`
- Modify: `.env.example`

- [ ] **Step 1: Rewrite env.mjs**

Remove Clerk, KV, and UploadThing vars. Add Better Auth, Upstash, and Blob vars.

```javascript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    RESEND_API_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRO_MONTHLY_PRICE_ID: z.string().min(1),
    STRIPE_PRO_YEARLY_PRICE_ID: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_URL: z.string(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

- [ ] **Step 2: Update .env.example**

```
DATABASE_URL=
NODE_ENV=development
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
# Optional social OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] **Step 3: Commit**

```bash
git add src/env.mjs .env.example
git commit -m "feat: update env vars for better-auth, upstash, vercel blob"
```

---

### Task 6: Setup Upstash Redis Client and Migrate KV Usages

**Files:**
- Create: `src/lib/redis.ts`
- Modify: `src/server/db/utils/link.ts`
- Modify: `src/server/db/utils/link-view.ts`
- Modify: `src/lib/metadata.ts`

- [ ] **Step 1: Create redis client**

```typescript
// src/lib/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

- [ ] **Step 2: Update src/server/db/utils/link.ts**

Replace `import { kv } from "@vercel/kv"` with `import { redis } from "@/lib/redis"`, then replace all `kv.` with `redis.` throughout the file (~10 occurrences). The API is compatible — both use `get(key)`, `set(key, value, { ex })`, `del(key)`.

- [ ] **Step 3: Update src/server/db/utils/link-view.ts**

Same replacement: `import { kv } from "@vercel/kv"` → `import { redis } from "@/lib/redis"`, `kv.` → `redis.` (2 occurrences).

- [ ] **Step 4: Update src/lib/metadata.ts**

```typescript
import { redis } from "@/lib/redis";
import * as z from "zod";

const metadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().url(),
});

export const getMetadata = async (url: string) => {
  let cached = await redis.get<z.infer<typeof metadataSchema> | null>(url);

  if (!cached) {
    try {
      const res = await fetch(`https://api.dub.co/metatags?url=${url}`);
      const data = metadataSchema.parse(await res.json());
      await redis.set(url, data, { ex: 60 * 60 });
      cached = data;
      return data;
    } catch (e) {
      await redis.set(url, null, { ex: 60 * 60 });
      return null;
    }
  }

  return cached;
};
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/redis.ts src/server/db/utils/link.ts src/server/db/utils/link-view.ts src/lib/metadata.ts
git commit -m "feat: replace @vercel/kv with @upstash/redis"
```

---

### Task 7: Update Drizzle DB and Schema for Better Auth

**Files:**
- Modify: `src/server/db/db.ts`
- Modify: `src/server/db/schema/user.ts`
- Modify: `src/server/db/index.ts`

- [ ] **Step 1: Update db.ts for latest neon driver**

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
```

Removed `neonConfig.fetchConnectionCache = true` (deprecated) and direct env import.

- [ ] **Step 2: Update user schema for Better Auth**

Better Auth expects `user`, `session`, `account`, `verification` tables. We add our custom fields alongside.

```typescript
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { link } from "./link";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  plan: text("plan", { enum: ["free", "pro"] }).default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionId: text("subscription_id"),
  subscriptionEndsAt: timestamp("subscription_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  links: many(link),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").unique().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
```

- [ ] **Step 3: Update src/server/db/index.ts**

```typescript
export * from "drizzle-orm";
export * from "./db";
export * from "./schema";
export * as schema from "./schema";
export * from "./utils";
```

- [ ] **Step 4: Commit**

```bash
git add src/server/db/
git commit -m "feat: update drizzle schema for better-auth, add session/account/verification tables"
```

---

### Task 8: Setup Better Auth Server and Client

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create Better Auth server config**

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db/db";
import * as schema from "@/server/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      plan: { type: "string", defaultValue: "free" },
      stripeCustomerId: { type: "string", required: false },
      subscriptionId: { type: "string", required: false },
      subscriptionEndsAt: { type: "date", required: false },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
```

- [ ] **Step 2: Create Better Auth client**

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { signIn, signUp, signOut, useSession } = authClient;
```

- [ ] **Step 3: Create API route handler**

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-client.ts "src/app/api/auth/[...all]/route.ts"
git commit -m "feat: setup better-auth server, client, and API route"
```

---

### Task 9: Update Middleware

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Rewrite middleware with Better Auth**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (
    !sessionCookie &&
    ["/app", "/create-link"].some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )
  ) {
    return NextResponse.redirect(new URL("/app/sign-up", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: replace clerk middleware with better-auth session check"
```

---

### Task 10: Migrate tRPC to v11

**Files:**
- Modify: `src/server/api/trpc.ts`
- Rewrite: `src/trpc/react.ts`
- Delete: `src/trpc/shared.ts`, `src/trpc/server.ts`
- Modify: `src/app/client-providers.tsx`
- Modify: `src/server/api/root.ts`
- Delete: `src/server/api/edge.ts`, `src/server/api/serverless.ts`
- Create/Modify: `src/app/api/trpc/[trpc]/route.ts`

- [ ] **Step 1: Rewrite src/server/api/trpc.ts**

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/server/db/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return { db, session };
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { session: ctx.session, user: ctx.session.user },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
```

- [ ] **Step 2: Rewrite src/trpc/react.ts**

```tsx
"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "@/server/api/root";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function makeQueryClient() {
  return new (require("@tanstack/react-query").QueryClient)({
    defaultOptions: { queries: { staleTime: 5 * 1000 } },
  }) as QueryClient;
}

let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchStreamLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Delete old tRPC files**

```bash
rm -f src/trpc/shared.ts src/trpc/server.ts
```

- [ ] **Step 4: Create unified tRPC route handler**

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });

export { handler as GET, handler as POST };
```

- [ ] **Step 5: Simplify root router**

```typescript
// src/server/api/root.ts
import { profileLinkRouter } from "@/server/api/routers/profile-link";
import { stripeRouter } from "@/server/api/routers/stripe";
import { userRouter } from "@/server/api/routers/user";
import { createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  profileLink: profileLinkRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
```

Note: if `stripeRouter` only had webhook procedures that are now handled directly in the route handler (Task 16), remove `stripe: stripeRouter` from the root router and remove the stripe tRPC router entirely.

- [ ] **Step 6: Remove edge/serverless split files**

```bash
rm -f src/server/api/edge.ts src/server/api/serverless.ts
rm -rf src/app/api/trpc/edge/ src/app/api/trpc/serverless/
```

- [ ] **Step 7: Update client-providers.tsx**

```tsx
"use client";

import { Elements as StripeElements } from "@stripe/react-stripe-js";
import { ThemeProvider } from "@/components/theme-provider";
import { getStripe } from "@/lib/stripe/client";
import { TRPCReactProvider } from "@/trpc/react";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ThemeProvider>
        <StripeElements stripe={getStripe()} options={{}}>
          {children}
        </StripeElements>
      </ThemeProvider>
    </TRPCReactProvider>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/server/api/trpc.ts src/trpc/react.ts src/app/api/trpc/ src/server/api/root.ts src/app/client-providers.tsx
git rm -f src/trpc/shared.ts src/trpc/server.ts src/server/api/edge.ts src/server/api/serverless.ts 2>/dev/null; true
git rm -rf src/app/api/trpc/edge/ src/app/api/trpc/serverless/ 2>/dev/null; true
git commit -m "feat: migrate tRPC v10 to v11 with tanstack-react-query"
```

---

### Task 11: Update User Router for Better Auth

**Files:**
- Modify: `src/server/api/routers/user.ts`

- [ ] **Step 1: Rewrite user router**

```typescript
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ctx.user.id),
    });
  }),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/server/api/routers/user.ts
git commit -m "feat: update user router for better-auth session"
```

---

### Task 12: Update Profile Link Router for Better Auth

**Files:**
- Modify: `src/server/api/routers/profile-link.ts`

- [ ] **Step 1: Replace auth references**

Global find-and-replace in `src/server/api/routers/profile-link.ts`:
- `ctx.auth.userId` → `ctx.user.id`
- Replace any `getUserByProviderId(ctx.auth.userId)` with direct DB query: `ctx.db.query.user.findFirst({ where: (u, { eq }) => eq(u.id, ctx.user.id) })`

- [ ] **Step 2: Commit**

```bash
git add src/server/api/routers/profile-link.ts
git commit -m "feat: update profile-link router for better-auth"
```

---

### Task 13: Remove Clerk, Add Custom Auth Pages

**Files:**
- Delete: `src/app/api/webhook/clerk/route.ts`, `src/server/api/routers/clerk/`
- Delete: `src/app/app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `src/app/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Create: `src/app/app/(auth)/sign-in/page.tsx`, `src/app/app/(auth)/sign-up/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Remove Clerk files**

```bash
rm -rf src/app/api/webhook/clerk/
rm -rf src/server/api/routers/clerk/
rm -rf "src/app/app/(auth)/sign-in/[[...sign-in]]/"
rm -rf "src/app/app/(auth)/sign-up/[[...sign-up]]/"
```

- [ ] **Step 2: Create sign-in page**

```tsx
// src/app/app/(auth)/sign-in/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/app");
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-y-6 px-4 py-12">
      <div className="text-center">
        <h1 className="font-cal text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/app/sign-up" className="text-primary underline">Sign up</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create sign-up page**

```tsx
// src/app/app/(auth)/sign-up/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signUp.email({ name, email, password });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/app");
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-y-6 px-4 py-12">
      <div className="text-center">
        <h1 className="font-cal text-3xl">Create an account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Get started with OpenBio</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/app/sign-in" className="text-primary underline">Sign in</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Update root layout — remove ClerkProvider**

```tsx
// src/app/layout.tsx
import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import LocalFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import ClientProviders from "@/app/client-providers";
import { defaultMetadata, ogMetadata, twitterMetadata } from "@/app/shared-metadata";
import Background from "@/components/background";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const calSans = LocalFont({
  src: "../../public/fonts/CalSans-SemiBold.ttf",
  variable: "--font-calsans",
});

export const metadata: Metadata = {
  ...defaultMetadata,
  twitter: { ...twitterMetadata },
  openGraph: { ...ogMetadata },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${calSans.variable} font-inter`}>
        <Background />
        <ClientProviders>{children}</ClientProviders>
        <Toaster />
        <TailwindIndicator />
        <Analytics />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx "src/app/app/(auth)/"
git rm -rf src/app/api/webhook/clerk/ src/server/api/routers/clerk/ 2>/dev/null; true
git commit -m "feat: remove clerk, add better-auth sign-in/sign-up pages"
```

---

### Task 14: Update Remaining Auth-Dependent Components

**Files:**
- Modify: `src/components/user-settings.tsx`
- Modify: `src/components/navbar/app.tsx`
- Modify: `src/components/navbar/home.tsx`
- Modify: `src/app/actions/claim-link.tsx`
- Modify: `src/app/create-link/page.tsx`

- [ ] **Step 1: Update user-settings.tsx**

Replace `import { currentUser } from "@clerk/nextjs"` with Better Auth session:

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
// ... keep other imports ...

export default async function UserSettings({ user }: { user: NonNullable<RouterOutputs["user"]["me"]> }) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Replace clerk?.imageUrl with session?.user?.image
  // Replace user.firstName/lastName with user.name
}
```

- [ ] **Step 2: Update navbar/app.tsx and navbar/home.tsx**

Replace Clerk imports (`useUser`, `UserButton`, `SignInButton`) with:
```typescript
import { useSession, signOut } from "@/lib/auth-client";
```
Replace `useUser()` with `useSession()`. Replace `<UserButton />` with custom avatar dropdown calling `signOut()`.

- [ ] **Step 3: Update claim-link action**

```typescript
"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const claimLink = async (link: string) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return redirect(`/app/sign-up?redirectUrl=/create-link?link=${link.toLowerCase()}`);
  }

  redirect(`/create-link?link=${link.toLowerCase()}`);
};
```

- [ ] **Step 4: Update create-link page**

Replace `import { auth } from "@clerk/nextjs"` with:
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/app/sign-up");
```

- [ ] **Step 5: Commit**

```bash
git add src/components/user-settings.tsx src/components/navbar/ src/app/actions/claim-link.tsx src/app/create-link/page.tsx
git commit -m "feat: update all components from clerk to better-auth"
```

---

### Task 15: Replace UploadThing with Vercel Blob

**Files:**
- Delete: `src/server/uploadthing.ts`, `src/lib/uploadthing.ts`, `src/app/api/uploadthing/route.ts`
- Create: `src/app/api/upload/route.ts`
- Modify: `src/app/[link]/_components/avatar.tsx`

- [ ] **Step 1: Remove UploadThing files**

```bash
rm -f src/server/uploadthing.ts src/lib/uploadthing.ts src/app/api/uploadthing/route.ts
```

- [ ] **Step 2: Create Vercel Blob upload handler**

```typescript
// src/app/api/upload/route.ts
import { put, del } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db, eq } from "@/server/db";
import { link } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const profileLinkId = formData.get("profileLinkId") as string;

  if (!file || !profileLinkId) {
    return NextResponse.json({ error: "Missing file or profileLinkId" }, { status: 400 });
  }

  const profileLink = await db.query.link.findFirst({
    where: (l, { eq }) => eq(l.id, profileLinkId),
    columns: { image: true, userId: true },
  });

  if (!profileLink || profileLink.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (profileLink.image) {
    try { await del(profileLink.image); } catch {}
  }

  const blob = await put(`avatars/${profileLinkId}/${file.name}`, file, { access: "public" });

  await db.update(link).set({ image: blob.url }).where(eq(link.id, profileLinkId));

  return NextResponse.json({ url: blob.url });
}
```

- [ ] **Step 3: Update avatar component**

In `src/app/[link]/_components/avatar.tsx`, replace UploadThing upload component with standard file input + `fetch("/api/upload", { method: "POST", body: formData })`. Remove `@uploadthing/react` imports.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/upload/route.ts src/app/\[link\]/_components/avatar.tsx
git rm -f src/server/uploadthing.ts src/lib/uploadthing.ts src/app/api/uploadthing/route.ts 2>/dev/null; true
git commit -m "feat: replace uploadthing with vercel blob"
```

---

### Task 16: Simplify Stripe Webhook (Remove tRPC Caller)

**Files:**
- Modify: `src/app/api/webhook/stripe/route.ts`

- [ ] **Step 1: Rewrite stripe webhook to call DB directly**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db, eq } from "@/server/db";
import { user } from "@/server/db/schema";
import { sendEmail } from "@/server/emails";
import UpgradedEmail from "@/components/emails/upgraded";
import CancelledEmail from "@/components/emails/cancelled";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload, signature, process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription !== "string") {
          return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const stripeCustomerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

        const existingUser = await db.query.user.findFirst({
          where: (u, { eq }) => eq(u.stripeCustomerId, stripeCustomerId),
        });
        if (!existingUser) {
          return NextResponse.json({ error: "User not found" }, { status: 400 });
        }

        await db.update(user).set({
          plan: "pro",
          subscriptionId: subscription.id,
          subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        }).where(eq(user.id, existingUser.id));

        await sendEmail({ subject: "Thank you for upgrading!", to: [existingUser.email], react: UpgradedEmail() });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

        const existingUser = await db.query.user.findFirst({
          where: (u, { eq }) => eq(u.stripeCustomerId, customerId),
        });
        if (!existingUser) {
          return NextResponse.json({ error: "User not found" }, { status: 400 });
        }

        await db.update(user).set({
          plan: "free", subscriptionId: null, subscriptionEndsAt: null,
        }).where(eq(user.id, existingUser.id));

        await sendEmail({ subject: "Sad to see you go", to: [existingUser.email], react: CancelledEmail() });
        break;
      }

      default:
        console.error(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Update root router if stripe router only had webhooks**

If the stripe tRPC router only contained webhook procedures, remove it from the root router:

```typescript
// src/server/api/root.ts — remove stripe import and entry if webhook-only
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhook/stripe/route.ts src/server/api/root.ts
git commit -m "feat: simplify stripe webhook, remove tRPC caller pattern"
```

---

### Task 17: Cleanup Dead Code

- [ ] **Step 1: Search for remaining old references**

```bash
grep -r "@clerk" src/ --include="*.ts" --include="*.tsx" -l
grep -r "@vercel/kv" src/ --include="*.ts" --include="*.tsx" -l
grep -r "uploadthing" src/ --include="*.ts" --include="*.tsx" -l
grep -r "providerId" src/ --include="*.ts" --include="*.tsx" -l
```

Fix any remaining imports.

- [ ] **Step 2: Remove getUserByProviderId if it exists**

Check `src/server/db/utils/` for `getUserByProviderId` and remove it.

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Fix type errors.

- [ ] **Step 4: Run lint**

```bash
bun run lint:fix
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: cleanup dead code, fix types and lint"
```

---

### Task 18: AI Readiness — CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md**

```markdown
# OpenBio

Open-source link-in-bio page builder. Users create customizable profile pages at `openbio.app/{username}` with drag-and-drop "bento" cards.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript 5.7+ (strict mode)
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4 (CSS-based config in `src/styles/globals.css`)
- **UI**: shadcn/ui (Radix UI primitives)
- **API**: tRPC 11 (`@trpc/tanstack-react-query`)
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Cache**: Upstash Redis
- **Auth**: Better Auth (email/password + social OAuth)
- **Payments**: Stripe (subscriptions)
- **Email**: Resend
- **File Storage**: Vercel Blob
- **Linting**: Biome + Ultracite
- **Git Hooks**: Husky (pre-commit: biome check)

## Commands

```bash
bun dev              # Start dev server (Turbopack)
bun run build        # Production build
bun run lint         # Lint with Biome
bun run lint:fix     # Lint and auto-fix
bun run format       # Format with Biome
bun run typecheck    # TypeScript check
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to database
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (home)/             # Landing page
│   ├── app/                # Dashboard (auth required)
│   │   ├── (auth)/         # Sign-in/sign-up pages
│   │   └── (dashboard)/    # Protected dashboard
│   ├── [link]/             # Public profile pages
│   ├── api/
│   │   ├── auth/[...all]/  # Better Auth handler
│   │   ├── trpc/[trpc]/    # tRPC handler
│   │   ├── upload/         # Vercel Blob uploads
│   │   ├── webhook/stripe/ # Stripe webhooks
│   │   └── og/             # OG image generation
│   ├── claim-link/         # Link claiming
│   ├── create-link/        # Profile setup
│   └── legal/              # Privacy/Terms
├── components/
│   ├── bento/              # Bento card system (core UI)
│   ├── ui/                 # shadcn/ui components
│   ├── forms/              # Form components
│   ├── emails/             # Resend email templates
│   ├── modals/             # Dialog components
│   └── navbar/             # Navigation
├── server/
│   ├── api/
│   │   ├── trpc.ts         # tRPC init, context, procedures
│   │   ├── root.ts         # Root router
│   │   └── routers/        # Feature routers
│   └── db/
│       ├── db.ts           # Drizzle client (Neon)
│       ├── schema/         # Drizzle schema definitions
│       └── utils/          # DB query helpers
├── lib/
│   ├── auth.ts             # Better Auth server config
│   ├── auth-client.ts      # Better Auth React client
│   ├── redis.ts            # Upstash Redis client
│   ├── stripe/             # Stripe config & plans
│   └── metadata.ts         # URL metadata fetching
└── trpc/
    └── react.ts            # tRPC React client + provider
```

## Key Patterns

### Authentication
- Server: `auth.api.getSession({ headers: await headers() })`
- Client: `useSession()` from `@/lib/auth-client`
- tRPC: `protectedProcedure` checks `ctx.session.user`
- Middleware: Cookie-based session check via `getSessionCookie()`

### tRPC
- Single endpoint at `/api/trpc`
- `publicProcedure` for unauthenticated routes
- `protectedProcedure` for authenticated routes (adds `ctx.user`)
- Client uses `useTRPC()` hook from `@/trpc/react`

### Database
- Drizzle ORM with Neon PostgreSQL
- Schema in `src/server/db/schema/`
- Query helpers in `src/server/db/utils/`
- Caching via Upstash Redis (30min TTL for profiles)

### Bento System
- Grid layout with react-grid-layout
- Card types: link, note, image, video
- Responsive: 2 cols (mobile), 4 cols (desktop)
- Sizes: 2x2, 4x1, 2x4, 4x2, 4x4
- Stored as JSON array in `link.bento` column

### Plans
- Free: 1 profile link
- Pro ($9/mo or $90/yr): Unlimited links

## Conventions

- Use `bun` for all commands (not npm/pnpm)
- Prefer server components; use `"use client"` only when needed
- All request APIs are async: `await headers()`, `await cookies()`
- CSS config in `src/styles/globals.css` (no tailwind.config.ts)
- Biome for linting/formatting (no ESLint/Prettier)
- Drizzle schema changes require `bun run db:generate` then `bun run db:push`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md for AI readiness"
```

---

### Task 19: AI Readiness — .claude/ Directory

**Files:**
- Create: `.claude/settings.json`
- Create: `.claude/commands/bento.md`
- Create: `.claude/commands/trpc-router.md`
- Create: `.claude/commands/db-schema.md`
- Create: `.claude/commands/auth.md`
- Create: `.claude/commands/stripe.md`

- [ ] **Step 1: Create .claude/settings.json**

```json
{
  "permissions": {
    "allow": [
      "Bash(bun run dev)",
      "Bash(bun run build)",
      "Bash(bun run lint*)",
      "Bash(bun run format)",
      "Bash(bun run typecheck)",
      "Bash(bun run db:*)",
      "Bash(bun install*)",
      "Bash(bun add*)",
      "Bash(bun remove*)",
      "Bash(bunx*)"
    ]
  }
}
```

- [ ] **Step 2: Create bento.md skill**

```markdown
# Bento Card System

## Types
- `link` — URL card with metadata. Fields: id, type, href, clicks, size, position
- `note` — Text card. Fields: id, type, text, size, position
- `image` — Image card. Fields: id, type, url, caption?, size, position
- `video` — Video card. Fields: id, type, url, caption?, size, position

## Sizes: 2x2, 4x1, 2x4, 4x2, 4x4 (separate sm/md breakpoints)
## Grid: react-grid-layout, 2 cols mobile, 4 cols desktop

## Key Files
- Schema: `src/types.ts` (BentoSchema, SizeSchema, PositionSchema)
- Components: `src/components/bento/`
- CRUD: `src/server/db/utils/link.ts` (addProfileLinkBento, updateProfileLinkBento, deleteProfileLinkBento)
- tRPC: `src/server/api/routers/profile-link.ts` (createBento, updateBento, deleteBento)

## Adding a New Card Type
1. Add type to BentoSchema union in `src/types.ts`
2. Create renderer in `src/components/bento/`
3. Add case to BentoCard dispatcher
```

- [ ] **Step 3: Create trpc-router.md skill**

```markdown
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

## Client Usage
```tsx
const trpc = useTRPC();
const { data } = useQuery(trpc.example.getById.queryOptions({ id: "123" }));
```
```

- [ ] **Step 4: Create db-schema.md skill**

```markdown
# Drizzle Schema Guide

## Key Files
- Schema: `src/server/db/schema/`
- Client: `src/server/db/db.ts`
- Utils: `src/server/db/utils/`
- Config: `drizzle.config.ts`

## Tables
- user (Better Auth managed + plan, stripeCustomerId, subscriptionId, subscriptionEndsAt)
- session, account, verification (Better Auth managed)
- link (profile pages with bento JSON)
- link_view (analytics)

## Workflow: Edit schema → `bun run db:generate` → `bun run db:push`
## Better Auth fields: modify via user.additionalFields in `src/lib/auth.ts`
## Primary keys: text type (Better Auth generates string IDs)
## Timestamps: always withTimezone: true
```

- [ ] **Step 5: Create auth.md skill**

```markdown
# Better Auth Patterns

## Files: `src/lib/auth.ts` (server), `src/lib/auth-client.ts` (client), `src/app/api/auth/[...all]/route.ts`

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

## tRPC: protectedProcedure guarantees ctx.user. Access ctx.user.id.
## Middleware: Cookie check via getSessionCookie() in src/middleware.ts

## Adding Social Provider
1. Add env vars in src/env.mjs
2. Add to socialProviders in src/lib/auth.ts
3. Client: signIn.social({ provider: "name" })
```

- [ ] **Step 6: Create stripe.md skill**

```markdown
# Stripe Integration

## Files: `src/lib/stripe/` (config), `src/app/api/webhook/stripe/route.ts` (webhook)

## Flow
1. User clicks upgrade → Stripe Checkout session
2. Payment → checkout.session.completed webhook → plan: "pro"
3. Cancel → customer.subscription.deleted → plan: "free"

## Gating: isUserPremium({ plan, subscriptionEndsAt })
## Free: max 1 link, Pro: unlimited
## Webhook security: stripe.webhooks.constructEvent() with STRIPE_WEBHOOK_SECRET
```

- [ ] **Step 7: Commit**

```bash
git add .claude/
git commit -m "feat: add .claude/ directory with settings and skills"
```

---

### Task 20: Final Verification

- [ ] **Step 1: Typecheck**

```bash
bun run typecheck
```

Fix any remaining type errors.

- [ ] **Step 2: Lint**

```bash
bun run lint:fix
```

- [ ] **Step 3: Build**

```bash
SKIP_ENV_VALIDATION=1 bun run build
```

Fix any build errors.

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "chore: fix remaining type and build errors"
```
