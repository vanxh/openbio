# Batch 2: Backend Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix foundational backend gaps: caching consistency, image optimization, richer analytics (unique views, device/geo breakdown), email verification, password reset, and welcome emails.

**Architecture:** Server-side changes to tRPC routers, DB utils, auth config, and upload routes. New dependency: `ua-parser-js` for User-Agent parsing. Geo lookup via request headers (Vercel provides `x-vercel-ip-country`/`x-vercel-ip-city` on deployed environments). Better Auth plugins for email verification and password reset.

**Tech Stack:** tRPC, Drizzle ORM, Better Auth, Resend, Upstash Redis, Vercel Blob, sharp (image optimization)

---

## Task 1: Redis Caching Consistency

**Files:**
- Modify: `src/server/db/utils/link-click.ts`
- Modify: `src/server/api/routers/profile-link.ts`

### Steps

- [ ] **Step 1: Read current caching in link-view.ts and link-click.ts**

Read `src/server/db/utils/link-view.ts` to see the caching pattern used for views. Read `src/server/db/utils/link-click.ts` to confirm clicks aren't cached.

- [ ] **Step 2: Add Redis caching to analytics time-series queries**

In `src/server/db/utils/link-click.ts`, add Redis caching for `getViewsOverTime`, `getClicksOverTime`, `getTopCards`, and `getTopReferrers`. Follow the same pattern used in `link-view.ts`:

```typescript
import { redis } from '@/lib/redis';

export async function getViewsOverTime(linkId: string, days: number) {
  const cacheKey = `analytics:views-over-time:${linkId}:${days}`;
  const cached = await redis.get<{ date: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  // ... existing DB query ...

  await redis.set(cacheKey, result, { ex: 300 }); // 5-min TTL for analytics
  return result;
}
```

Apply the same pattern to `getClicksOverTime`, `getTopCards`, and `getTopReferrers`. Use 5-minute TTL (300 seconds) for analytics data — shorter than the 30-min TTL for view/click totals since analytics should feel more responsive.

- [ ] **Step 3: Invalidate analytics cache when new views/clicks are recorded**

In `src/server/db/utils/link-view.ts`, after recording a new view, delete the relevant analytics cache keys:

```typescript
// After inserting the view record:
await Promise.all([
  redis.del(`analytics:views-over-time:${linkId}:7`),
  redis.del(`analytics:views-over-time:${linkId}:30`),
  redis.del(`analytics:views-over-time:${linkId}:90`),
]);
```

Do the same in `link-click.ts` after recording a click, for click-related cache keys.

- [ ] **Step 4: Test caching**

Run: `bun dev`
Visit a profile to trigger views. Open analytics dashboard. Check that subsequent loads are faster (cached). Verify data still updates after new visits (cache invalidation works).

- [ ] **Step 5: Commit**

```bash
git add src/server/db/utils/link-click.ts src/server/db/utils/link-view.ts
git commit -m "feat: add Redis caching for analytics queries with 5-min TTL"
```

---

## Task 2: Image Optimization on Upload

**Files:**
- Modify: `src/app/api/upload/bento-image/route.ts`
- Modify: `src/app/api/upload/route.ts`

### Steps

- [ ] **Step 1: Install sharp**

```bash
bun add sharp
bun add -d @types/sharp
```

- [ ] **Step 2: Read current upload routes**

Read `src/app/api/upload/bento-image/route.ts` and `src/app/api/upload/route.ts` to understand the current upload flow.

- [ ] **Step 3: Add image optimization to bento image upload**

In `src/app/api/upload/bento-image/route.ts`, add sharp processing before uploading to Vercel Blob:

```typescript
import sharp from 'sharp';

// After receiving the file blob and before put():
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

const optimized = await sharp(buffer)
  .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 80 })
  .toBuffer();

const optimizedFile = new File([optimized], file.name.replace(/\.\w+$/, '.webp'), {
  type: 'image/webp',
});

// Use optimizedFile instead of file in the put() call
```

This resizes to max 1200x1200 (maintaining aspect ratio), converts to WebP at 80% quality. Typical reduction: 60-80% file size.

- [ ] **Step 4: Add image optimization to avatar upload**

Apply the same pattern to `src/app/api/upload/route.ts`, but resize to 400x400 max for avatars:

```typescript
const optimized = await sharp(buffer)
  .resize(400, 400, { fit: 'cover' })
  .webp({ quality: 85 })
  .toBuffer();
```

- [ ] **Step 5: Test uploads**

Run: `bun dev`
Upload a large image (2MB+ JPEG) as a bento card image. Verify:
- Image appears correctly
- Check the Vercel Blob URL — filename should end in `.webp`
- Image file size should be significantly smaller

- [ ] **Step 6: Commit**

```bash
git add src/app/api/upload/bento-image/route.ts src/app/api/upload/route.ts package.json bun.lock
git commit -m "feat: optimize uploaded images with sharp (WebP, resize)"
```

---

## Task 3: Unique vs Total Views

**Files:**
- Modify: `src/server/db/utils/link-view.ts`
- Modify: `src/server/api/routers/profile-link.ts`

### Steps

- [ ] **Step 1: Read current view counting logic**

Read `src/server/db/utils/link-view.ts` to understand the dedup logic and how `getProfileLinkViews` works.

- [ ] **Step 2: Add separate unique and total view counts**

In `src/server/db/utils/link-view.ts`, add a function to get unique views (by distinct IP):

```typescript
export async function getProfileLinkUniqueViews(linkId: string): Promise<number> {
  const cacheKey = `profile-link-unique-views:${linkId}`;
  const cached = await redis.get<number>(cacheKey);
  if (cached !== null) return cached;

  const result = await db
    .select({ count: countDistinct(linkView.ip) })
    .from(linkView)
    .where(eq(linkView.linkId, linkId));

  const count = result[0]?.count ?? 0;
  await redis.set(cacheKey, count, { ex: 1800 });
  return count;
}
```

Import `countDistinct` from `drizzle-orm`.

- [ ] **Step 3: Expose both counts in analytics**

In `src/server/api/routers/profile-link.ts`, update the `analytics` procedure to include unique views:

```typescript
const [views, uniqueViews, clicks, viewsOverTime, clicksOverTime, topCards, topReferrers] =
  await Promise.all([
    getProfileLinkViews(input.linkId),
    getProfileLinkUniqueViews(input.linkId),
    getTotalClicks(input.linkId),
    getViewsOverTime(input.linkId, input.days),
    getClicksOverTime(input.linkId, input.days),
    getTopCards(input.linkId, input.days),
    getTopReferrers(input.linkId, input.days),
  ]);

return { views, uniqueViews, clicks, viewsOverTime, clicksOverTime, topCards, topReferrers };
```

- [ ] **Step 4: Invalidate unique views cache on new view**

In the `recordLinkView` function, after inserting, also delete the unique views cache:

```typescript
await redis.del(`profile-link-unique-views:${linkId}`);
```

- [ ] **Step 5: Update analytics UI to show both counts**

Read the analytics page component. Add a second stat card showing "Unique Views" alongside "Total Views". Follow the same card pattern used for the existing views card.

- [ ] **Step 6: Commit**

```bash
git add src/server/db/utils/link-view.ts src/server/api/routers/profile-link.ts
git commit -m "feat: track and display unique vs total profile views"
```

---

## Task 4: Device/Browser Breakdown

**Files:**
- Modify: `src/server/db/utils/link-view.ts`
- Modify: `src/server/api/routers/profile-link.ts`

### Steps

- [ ] **Step 1: Install ua-parser-js**

```bash
bun add ua-parser-js
bun add -d @types/ua-parser-js
```

- [ ] **Step 2: Add device/browser analytics query**

In `src/server/db/utils/link-view.ts`, add a function to parse and aggregate User-Agent data:

```typescript
import UAParser from 'ua-parser-js';

export async function getDeviceBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:devices:${linkId}:${days}`;
  const cached = await redis.get<{ device: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({ userAgent: linkView.userAgent })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)));

  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};

  for (const row of rows) {
    const ua = new UAParser(row.userAgent);
    const device = ua.getDevice().type || 'desktop';
    const browser = ua.getBrowser().name || 'Unknown';
    devices[device] = (devices[device] || 0) + 1;
    browsers[browser] = (browsers[browser] || 0) + 1;
  }

  const deviceResult = Object.entries(devices)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  const browserResult = Object.entries(browsers)
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count);

  const result = { devices: deviceResult, browsers: browserResult };
  await redis.set(cacheKey, result, { ex: 300 });
  return result;
}
```

- [ ] **Step 3: Expose in analytics endpoint**

In the `analytics` procedure in `src/server/api/routers/profile-link.ts`, add the device breakdown to the `Promise.all`:

```typescript
const [views, uniqueViews, clicks, viewsOverTime, clicksOverTime, topCards, topReferrers, deviceBreakdown] =
  await Promise.all([
    // ... existing queries ...
    getDeviceBreakdown(input.linkId, input.days),
  ]);

return { views, uniqueViews, clicks, viewsOverTime, clicksOverTime, topCards, topReferrers, deviceBreakdown };
```

- [ ] **Step 4: Commit**

```bash
git add src/server/db/utils/link-view.ts src/server/api/routers/profile-link.ts package.json bun.lock
git commit -m "feat: add device and browser breakdown to analytics"
```

---

## Task 5: Geographic Breakdown

**Files:**
- Modify: `src/server/db/schema/link-view.ts`
- Modify: `src/server/db/utils/link-view.ts`
- Modify: `src/server/api/routers/profile-link.ts`

### Steps

- [ ] **Step 1: Add country column to link_view schema**

In `src/server/db/schema/link-view.ts`, add a `country` column:

```typescript
country: varchar('country', { length: 2 }), // ISO 3166-1 alpha-2
```

- [ ] **Step 2: Generate and push migration**

```bash
bun run db:generate
bun run db:push
```

- [ ] **Step 3: Capture country from Vercel headers**

In `src/server/api/routers/profile-link.ts`, inside the `getByLink` procedure where `recordLinkView` is called, extract the country from Vercel's `x-vercel-ip-country` header:

```typescript
const headersList = await headers();
const country = headersList.get('x-vercel-ip-country') ?? undefined;

after(async () => {
  await recordLinkView(profileLink.id, ip, userAgent, referrer, country);
});
```

Update `recordLinkView` in `src/server/db/utils/link-view.ts` to accept and store `country`:

```typescript
export async function recordLinkView(
  linkId: string,
  ip: string,
  userAgent: string,
  referrer: string | undefined,
  country?: string,
) {
  // ... existing dedup check ...
  await db.insert(linkView).values({ linkId, ip, userAgent, referrer, country });
  // ... existing cache invalidation ...
}
```

- [ ] **Step 4: Add geographic breakdown query**

In `src/server/db/utils/link-view.ts`:

```typescript
export async function getGeoBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:geo:${linkId}:${days}`;
  const cached = await redis.get<{ country: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      country: sql<string>`coalesce(${linkView.country}, 'Unknown')`,
      count: count(),
    })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)))
    .groupBy(linkView.country)
    .orderBy(desc(count()))
    .limit(20);

  await redis.set(cacheKey, result, { ex: 300 });
  return result;
}
```

- [ ] **Step 5: Expose in analytics endpoint**

Add `getGeoBreakdown` to the `Promise.all` in the `analytics` procedure and include in the return value.

- [ ] **Step 6: Commit**

```bash
git add src/server/db/schema/link-view.ts src/server/db/utils/link-view.ts src/server/api/routers/profile-link.ts
git commit -m "feat: track and display geographic breakdown in analytics"
```

---

## Task 6: Email Verification Enforcement

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/auth-client.ts`
- Create: `src/components/emails/verify-email.tsx`

### Steps

- [ ] **Step 1: Read current auth config**

Read `src/lib/auth.ts` and `src/lib/auth-client.ts` to understand the current Better Auth setup.

- [ ] **Step 2: Create email verification template**

Create `src/components/emails/verify-email.tsx`:

```tsx
interface VerifyEmailProps {
  url: string;
}

export default function VerifyEmail({ url }: VerifyEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Verify your email</h1>
      <p style={{ color: '#666', lineHeight: 1.6 }}>
        Click the button below to verify your email address and activate your OpenBio account.
      </p>
      <a
        href={url}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          marginTop: '16px',
        }}
      >
        Verify Email
      </a>
      <p style={{ color: '#999', fontSize: '12px', marginTop: '24px' }}>
        If you didn't create an OpenBio account, you can safely ignore this email.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Enable email verification in auth config**

In `src/lib/auth.ts`, add the email verification configuration to `emailAndPassword`:

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendVerificationEmail: async ({ user, url }) => {
    const { sendEmail } = await import('@/server/emails');
    const VerifyEmail = (await import('@/components/emails/verify-email')).default;
    await sendEmail({
      to: user.email,
      subject: 'Verify your OpenBio email',
      react: VerifyEmail({ url }),
    });
  },
},
```

- [ ] **Step 4: Test email verification flow**

Run: `bun dev`
Sign up with a new email. Verify that:
- A verification email is sent (check Resend dashboard or logs)
- User cannot access dashboard until verified
- Clicking the verification link activates the account

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/components/emails/verify-email.tsx
git commit -m "feat: enforce email verification on signup"
```

---

## Task 7: Password Reset Flow

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/auth-client.ts`
- Create: `src/components/emails/reset-password.tsx`
- Create: `src/app/app/(auth)/reset-password/page.tsx`
- Modify: `src/app/app/(auth)/sign-in/page.tsx`

### Steps

- [ ] **Step 1: Create password reset email template**

Create `src/components/emails/reset-password.tsx`:

```tsx
interface ResetPasswordProps {
  url: string;
}

export default function ResetPassword({ url }: ResetPasswordProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Reset your password</h1>
      <p style={{ color: '#666', lineHeight: 1.6 }}>
        Someone requested a password reset for your OpenBio account. Click below to set a new password.
      </p>
      <a
        href={url}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          marginTop: '16px',
        }}
      >
        Reset Password
      </a>
      <p style={{ color: '#999', fontSize: '12px', marginTop: '24px' }}>
        If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Enable forgetPassword in auth config**

In `src/lib/auth.ts`, add the `sendResetPassword` handler to `emailAndPassword`:

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendVerificationEmail: async ({ user, url }) => { /* ... from Task 6 ... */ },
  sendResetPassword: async ({ user, url }) => {
    const { sendEmail } = await import('@/server/emails');
    const ResetPassword = (await import('@/components/emails/reset-password')).default;
    await sendEmail({
      to: user.email,
      subject: 'Reset your OpenBio password',
      react: ResetPassword({ url }),
    });
  },
},
```

- [ ] **Step 3: Create reset password page**

Create `src/app/app/(auth)/reset-password/page.tsx` with a form that:
- Accepts email input for requesting a reset
- If URL has a `token` param, shows new password + confirm password inputs
- Calls `authClient.forgetPassword()` to request reset
- Calls `authClient.resetPassword()` with token to set new password
- Follow the same UI patterns as the sign-in page

- [ ] **Step 4: Add "Forgot password?" link to sign-in page**

In `src/app/app/(auth)/sign-in/page.tsx`, add a link below the password field:

```tsx
<Link href="/app/reset-password" className="text-sm text-muted-foreground hover:text-foreground">
  Forgot your password?
</Link>
```

- [ ] **Step 5: Export forgetPassword and resetPassword from auth client**

In `src/lib/auth-client.ts`, ensure the client exports these methods:

```typescript
export const { signIn, signUp, signOut, useSession, forgetPassword, resetPassword } =
  createAuthClient();
```

- [ ] **Step 6: Test the full flow**

Run: `bun dev`
1. Go to sign-in → click "Forgot your password?"
2. Enter email → submit
3. Check Resend logs for reset email
4. Click link → enter new password → submit
5. Sign in with new password

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-client.ts src/components/emails/reset-password.tsx src/app/app/\(auth\)/reset-password/page.tsx src/app/app/\(auth\)/sign-in/page.tsx
git commit -m "feat: add password reset flow with email"
```

---

## Task 8: Welcome Emails

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/components/emails/welcome.tsx`

### Steps

- [ ] **Step 1: Read existing welcome email template**

Read `src/components/emails/welcome.tsx` and `src/server/emails.ts` to understand the current setup.

- [ ] **Step 2: Wire welcome email to signup hook**

In `src/lib/auth.ts`, add a `databaseHooks.user.create.after` hook (Better Auth's post-signup hook):

```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        const { sendEmail } = await import('@/server/emails');
        const Welcome = (await import('@/components/emails/welcome')).default;
        await sendEmail({
          to: user.email,
          subject: 'Welcome to OpenBio!',
          react: Welcome({ name: user.name }),
        });
      },
    },
  },
},
```

Check Better Auth docs for exact hook API — the hook receives the created user object.

- [ ] **Step 3: Update welcome email template if needed**

Read the existing `src/components/emails/welcome.tsx`. Update it to accept a `name` prop and personalize the greeting. Ensure it includes a CTA button to `/claim-link`.

- [ ] **Step 4: Test signup sends welcome email**

Run: `bun dev`
Sign up with a new account. Check Resend dashboard to confirm welcome email was sent with correct content.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/components/emails/welcome.tsx
git commit -m "feat: send welcome email on user signup"
```

---
