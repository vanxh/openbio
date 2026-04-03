# OpenBio

Open-source link-in-bio page builder. Users create customizable profile pages at `openbio.app/{username}` with drag-and-drop "bento" cards.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
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
│   ├── explore/            # Browse public profiles
│   └── legal/              # Privacy/Terms
├── components/
│   ├── bento/              # Bento card system (core UI)
│   ├── ui/                 # shadcn/ui components
│   ├── forms/              # Form components
│   ├── emails/             # Resend email templates
│   ├── modals/             # Dialog components
│   ├── onboarding/         # New user onboarding wizard
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
│   ├── metadata.ts         # URL metadata fetching
│   ├── themes.ts           # Profile theme definitions
│   └── utils.ts            # Shared utilities (cn, etc.)
└── trpc/
    ├── react.ts            # tRPC React client + provider
    └── server.ts           # tRPC server caller
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
- Card types: link, note, image, map, github, email-collect, countdown, weather, twitter, views
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
