# OpenBio admin

The admin panel lives at `/admin`. It uses the existing database tables and requires no migrations.

## Grant access

1. Sign up and verify an OpenBio account through the normal authentication flow.
2. Find that account’s immutable ID in the `user` table using Drizzle Studio (`bun run db:studio`) or a trusted database console.
3. Set `ADMIN_USER_IDS` on the server to a comma-separated list of allowed IDs, then restart or redeploy:

   ```dotenv
   ADMIN_USER_IDS=user-id-one,user-id-two
   ```

An empty allowlist denies access to everyone. The page and every admin API independently check the authenticated user ID. Email addresses, account plans, browser state, and query parameters cannot grant admin privileges. Allowed users also see **Admin panel** in their account menu.

## Available tools

- **Overview:** total users and profiles, period views and clicks, new signups, plan distribution, recent accounts, and top profiles.
- **Users:** search by name, email, or ID; filter by plan; paginate; export the current page; edit names, email verification, and AI credit balances; revoke sessions after confirmation. Admin sessions are protected from revocation.
- **Profiles:** search by profile, owner email, or domain; filter discovery visibility; export the current page; open a profile; list or unlist it in Explore after confirmation.
- **Analytics:** 7/30/90-day reports, traffic charts, countries, referring URLs, and daily CSV exports. Dates use UTC; absent days are filled with zeroes. Unique visitor counts use distinct recorded IP addresses, not authenticated people. Percentage changes compare with the preceding period; today is a partial day.
- **Subscriptions:** recorded plans, Polar subscription IDs, and period end dates, with a link to the Polar dashboard. This panel does not change billing or estimate revenue from plan prices.
- **System & access:** a database connectivity check, allowlist account count, and service configuration presence. Configuration presence is not an external service uptime check; credentials are never exposed.

Explore visibility controls discovery only. Direct links continue to work, and owners can change their own visibility preference. Credit changes set a current balance and remain subject to existing monthly resets. CSV fields are quoted and spreadsheet formula prefixes are escaped.

## Development preview

`/admin/preview` is available only under `next dev`. It uses clearly labeled synthetic data, makes no admin API calls, and lets you try search, filtering, pagination, edits, confirmation dialogs, charts, and exports. Changes last until a reload. In production the route returns 404.

To inspect just this preview without service credentials, use local placeholders; they do not configure a working backend:

```sh
SKIP_ENV_VALIDATION=1 \
DATABASE_URL=postgresql://preview:preview@localhost:5432/preview \
BETTER_AUTH_SECRET=local-preview-only-secret-at-least-32-characters \
BETTER_AUTH_URL=http://localhost:3000 \
NEXT_PUBLIC_URL=http://localhost:3000 \
bun dev
```

## Validation

```sh
bun run typecheck
bun run test:admin
```

The unit tests cover authorization on every endpoint, protected admin sessions, allowed edit fields, cache invalidation, input limits, and safe CSV output.

An optional PostgreSQL integration check exercises the actual Drizzle queries and mutations. Point it at a test database where the connecting role can create schemas. It creates a uniquely named schema on a reserved connection and removes it in `finally`; it does not use existing application tables.

```sh
ADMIN_TEST_DATABASE_URL=postgresql://localhost/openbio_test bun run test:admin:postgres
```
