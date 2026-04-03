# OpenBio

Open-source link-in-bio page builder. Users create customizable profile pages at `openbio.app/{username}` with drag-and-drop "bento" cards.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5.7+ (strict mode, `noUncheckedIndexedAccess`)
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4 (CSS-based config in `src/styles/globals.css`)
- **UI**: shadcn/ui (Radix UI primitives) + Lucide icons
- **Rich Text**: Tiptap (note cards)
- **API**: tRPC 11 (`@trpc/tanstack-react-query`)
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Cache**: Upstash Redis
- **Auth**: Better Auth (email/password + GitHub, Google, Discord, Twitter OAuth)
- **Payments**: Stripe (subscriptions + 7-day free trial)
- **Email**: Resend (transactional + digest emails)
- **File Storage**: Vercel Blob
- **Analytics**: Custom (views, clicks, device/geo tracking via `ua-parser-js`)
- **Linting**: Biome + Ultracite (extends `ultracite` in `biome.json`)
- **Git Hooks**: Husky (pre-commit: `bunx biome check --write --staged --no-errors-on-unmatched`)

## Commands

```bash
bun dev              # Start dev server (Turbopack)
bun run build        # Production build
bun run lint         # Lint with Biome
bun run lint:fix     # Lint and auto-fix
bun run format       # Format with Biome
bun run typecheck    # TypeScript check (tsc --noEmit)
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to database
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (home)/                 # Landing page
│   ├── app/                    # Dashboard (auth required)
│   │   ├── (auth)/             # Sign-in/sign-up pages
│   │   └── (dashboard)/       # Protected dashboard
│   ├── [link]/                 # Public profile pages
│   ├── actions/                # Server actions (e.g. claim-link)
│   ├── api/
│   │   ├── auth/[...all]/     # Better Auth handler
│   │   ├── trpc/[trpc]/       # tRPC handler
│   │   ├── upload/            # Vercel Blob uploads
│   │   ├── webhook/stripe/    # Stripe webhooks
│   │   ├── og/                # OG image generation (Edge runtime)
│   │   ├── cron/digest/       # Weekly analytics digest email
│   │   └── unsubscribe/       # Email unsubscribe handler
│   ├── claim-link/             # Link claiming
│   ├── create-link/            # Profile setup
│   ├── explore/                # Browse public profiles
│   ├── discord/, github/, twitter/  # OAuth redirect routes
│   └── legal/                  # Privacy/Terms
├── components/
│   ├── bento/                  # Bento card system (core UI)
│   ├── ui/                     # shadcn/ui components
│   ├── dashboard/              # Dashboard-specific components
│   ├── forms/                  # Form components
│   ├── emails/                 # Resend email templates
│   ├── modals/                 # Dialog components
│   ├── onboarding/             # New user onboarding wizard
│   ├── navbar/                 # Navigation
│   ├── background/             # Background effects
│   ├── footer/                 # Footer components
│   └── icons/                  # Custom icon components
├── hooks/                      # Custom React hooks
├── server/
│   ├── api/
│   │   ├── trpc.ts            # tRPC init, context, procedures
│   │   ├── root.ts            # Root router (combines all routers)
│   │   └── routers/
│   │       ├── profile-link.ts # Profile CRUD, bento, analytics, custom domains
│   │       ├── user.ts        # User account, trial, email preferences
│   │       └── stripe.ts      # Billing portal, checkout, subscriptions
│   ├── db/
│   │   ├── db.ts              # Drizzle client (Neon)
│   │   ├── schema/
│   │   │   ├── user.ts        # user, session, account, verification tables
│   │   │   ├── link.ts        # link table (profile, bento JSON, theme, custom domain)
│   │   │   ├── link-view.ts   # link_view table (page views, geo/device)
│   │   │   ├── link-click.ts  # link_click table (click tracking)
│   │   │   ├── email-subscriber.ts  # email_subscriber table
│   │   │   └── index.ts       # Schema exports
│   │   └── utils/             # DB query helpers (link, user, analytics)
│   └── emails.ts              # sendEmail() server action via Resend
├── lib/
│   ├── auth.ts                # Better Auth server config
│   ├── auth-client.ts         # Better Auth React client
│   ├── redis.ts               # Upstash Redis client
│   ├── stripe/                # Stripe config & plan definitions
│   ├── metadata.ts            # URL metadata fetching
│   ├── themes.ts              # 10+ profile theme definitions
│   └── utils.ts               # Shared utilities (cn, etc.)
├── trpc/
│   ├── react.ts               # tRPC React client + provider
│   └── server.ts              # tRPC server caller
├── proxy.ts                   # Subdomain/custom domain routing middleware
├── env.mjs                    # Environment variable validation (@t3-oss/env-nextjs)
└── types.ts                   # Shared TypeScript types (BentoCard, etc.)
```

## Key Patterns

### Authentication
- Server: `auth.api.getSession({ headers: await headers() })`
- Client: `useSession()` from `@/lib/auth-client`
- tRPC: `protectedProcedure` checks `ctx.session.user`
- Proxy: Cookie-based session check via `getSessionCookie()`
- OAuth providers: GitHub, Google, Discord, Twitter

### tRPC
- Single endpoint at `/api/trpc`
- `publicProcedure` for unauthenticated routes
- `protectedProcedure` for authenticated routes (adds `ctx.user`)
- `createRateLimitedProcedure` for rate-limited endpoints
- Client uses `useTRPC()` hook from `@/trpc/react`
- Three routers: `profileLink`, `user`, `stripe`

### Database
- Drizzle ORM with Neon PostgreSQL (serverless driver)
- Schema in `src/server/db/schema/`
- Query helpers in `src/server/db/utils/`
- Config: `drizzle.config.ts` (schema at `./src/server/db/schema/index.ts`)
- Caching via Upstash Redis (30min TTL for profiles, 5min TTL for analytics)

### Rate Limiting
- Via Upstash Redis (`@upstash/ratelimit`)
- `generalLimit`: 60 req/min (public endpoints)
- `subscribeLimit`: 5 req/min (email subscribe)
- `fetchLimit`: 10 req/min (external metadata/music fetches)

### Bento System
- Grid layout with `react-grid-layout`
- **12 card types**: link, note, image, map, github, email-collect, countdown, weather, twitter, music, calendar, views
- Responsive breakpoints: `sm` (2 cols, mobile), `md` (4 cols, desktop)
- Sizes: `2x2` (default), `4x1`, `2x4`, `4x2`, `4x4`
- Position: x, y coordinates per breakpoint
- Stored as JSON array in `link.bento` column

### Themes
- Defined in `src/lib/themes.ts` (10+ built-in themes)
- Per-profile: theme selection, accent color, dark mode toggle, custom footer

### Email System
- Resend for transactional email
- Templates in `src/components/emails/`: verify-email, welcome, reset-password, upgraded, cancelled, analytics-digest
- Weekly digest cron at `/api/cron/digest`
- Unsubscribe handler at `/api/unsubscribe`

### Plans & Billing
- Free: 1 profile link
- Pro ($9/mo or $90/yr): Unlimited links
- 7-day free trial
- Stripe webhooks at `/api/webhook/stripe`
- Billing portal and checkout via tRPC `stripe` router

### Custom Domains
- Vercel domain management (`addDomainToVercel`, `removeDomainFromVercel`, `verifyDomain`)
- Subdomain routing via `src/proxy.ts`

### Environment Variables
- Validated in `src/env.mjs` using `@t3-oss/env-nextjs`
- Required server: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_YEARLY_PRICE_ID`
- Required client: `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Optional: OAuth credentials (GitHub, Google), Vercel API tokens (for custom domains)

## Conventions

- Use `bun` for all commands (not npm/pnpm)
- Prefer server components; use `"use client"` only when needed
- All request APIs are async: `await headers()`, `await cookies()`
- CSS config in `src/styles/globals.css` (no `tailwind.config.ts`)
- Biome for linting/formatting (no ESLint/Prettier); config extends `ultracite`
- Path alias: `@/*` maps to `src/*`
- Drizzle schema changes require `bun run db:generate` then `bun run db:push`
- Types shared via `src/types.ts` (e.g. `BentoCard`, `BentoType`)
- Form validation with `zod` + `react-hook-form` + `@hookform/resolvers`
