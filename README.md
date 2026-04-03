<p align="center" style="margin-top: 120px">
   <a href="https://openbio.app">
    <img width="100px" src="https://openbio.app/openbio.png" alt="OpenBio">
   </a>
</p>

<h3 align="center">OpenBio</h3>

<p align="center">
   Open-source link-in-bio page builder with a customizable bento grid layout.
</p>

<p align="center">
   <a href="/discord"><img alt="Discord" src="https://img.shields.io/discord/1146392594948034682"></a>
   <a href="https://github.com/vanxh/openbio/stargazers"><img src="https://img.shields.io/github/stars/vanxh/openbio" alt="Github Stars"></a>
   <a href="https://github.com/vanxh/openbio/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPLv3-purple" alt="License"></a>
   <a href="https://github.com/vanxh/openbio/pulse"><img src="https://img.shields.io/github/commit-activity/m/vanxh/openbio" alt="Commits-per-month"></a>
</p>

<p align="center">
   <a href="https://openbio.app/vanxh">
      <img width="600px" src="/public/example.png" alt="OpenBio example" />
   </a>
</p>

## Features

- **Bento Grid Layout** — drag-and-drop cards in a responsive bento grid
- **Multiple Card Types** — links, notes, images, and videos
- **Custom Profiles** — claim your `openbio.app/username` link
- **Social OAuth** — sign in with GitHub or Google
- **Pro Plan** — unlimited profile links with Stripe-powered subscriptions
- **OG Image Generation** — auto-generated social preview images
- **Self-hostable** — deploy your own instance with ease

## Tech Stack

- [Next.js 15](https://nextjs.org/) — App Router, Turbopack
- [TypeScript](https://www.typescriptlang.org/) — strict mode
- [Tailwind CSS 4](https://tailwindcss.com/) — styling
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [tRPC 11](https://trpc.io/) — type-safe API
- [Drizzle ORM](https://orm.drizzle.team/) — database ORM
- [Neon](https://neon.tech/) — serverless PostgreSQL
- [Better Auth](https://www.better-auth.com/) — authentication
- [Stripe](https://stripe.com/) — payments
- [Upstash Redis](https://upstash.com/) — caching
- [Vercel Blob](https://vercel.com/storage/blob) — file storage
- [Resend](https://resend.com/) — transactional email

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [PostgreSQL](https://www.postgresql.org/) (or a [Neon](https://neon.tech/) account)

### Installation

1. Clone the repo

```sh
git clone https://github.com/vanxh/openbio
cd openbio
```

2. Install dependencies

```sh
bun install
```

3. Copy `.env.example` to `.env`

```sh
cp .env.example .env
```

4. Configure environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (generate with `openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | Yes | Your app URL (`http://localhost:3000` for dev) |
| `NEXT_PUBLIC_URL` | Yes | Public app URL (`http://localhost:3000` for dev) |
| `RESEND_API_KEY` | Yes | [Resend](https://resend.com/) API key for emails |
| `UPSTASH_REDIS_REST_URL` | Yes | [Upstash](https://upstash.com/) Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token |
| `BLOB_READ_WRITE_TOKEN` | Yes | [Vercel Blob](https://vercel.com/storage/blob) token |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Yes | Stripe price ID for monthly plan |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Yes | Stripe price ID for yearly plan |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

5. Push the database schema

```sh
bun run db:push
```

6. Start the development server

```sh
bun dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

## Self-Hosting

OpenBio is designed to be deployed on [Vercel](https://vercel.com/):

1. Fork this repository
2. Create a new project on Vercel and import the fork
3. Add the required environment variables in the Vercel dashboard
4. Deploy

You can also deploy anywhere that supports Next.js — just make sure to set up the environment variables and a PostgreSQL database.

## Contributing

Want to help build a better open-source link-in-bio page builder? Check out our [contribution guidelines](https://github.com/vanxh/openbio/blob/main/CONTRIBUTING.md).

## Top Contributors

[![Top Contributors](https://contrib.rocks/image?repo=vanxh/openbio)](https://github.com/vanxh/openbio/graphs/contributors)

## License

OpenBio is open source under the [AGPLv3 license](https://github.com/vanxh/openbio/blob/main/LICENSE).
