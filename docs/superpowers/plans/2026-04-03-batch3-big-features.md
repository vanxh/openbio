# Batch 3: Big Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add undo/redo for bento editing, public explore/directory page, and free Pro trial.

**Architecture:** Undo/redo uses a client-side history stack in React context (no DB changes). Explore page needs a new `isPublic` column and tRPC endpoint. Free trial adds `trialEndsAt` column and modifies `isUserPremium` logic.

**Tech Stack:** Next.js App Router, React Context, tRPC, Drizzle ORM, Stripe

---

## Task 1: Undo/Redo for Bento Edits

**Files:**
- Create: `src/app/[link]/_components/bento-history.tsx`
- Modify: `src/app/[link]/_components/bento-layout.tsx`
- Modify: `src/app/[link]/_components/header.tsx`

### Steps

- [ ] **Step 1: Read current bento state management**

Read `src/app/[link]/_components/bento-layout.tsx` to understand how bento state flows. Read `src/app/[link]/_components/preview-context.tsx` to understand the existing context pattern.

- [ ] **Step 2: Create bento history context**

Create `src/app/[link]/_components/bento-history.tsx`:

```tsx
'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { BentoItem } from '@/types';

interface BentoHistoryContextValue {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => BentoItem[] | null;
  redo: () => BentoItem[] | null;
  pushState: (state: BentoItem[]) => void;
}

const BentoHistoryContext = createContext<BentoHistoryContextValue | null>(null);

const MAX_HISTORY = 50;

export function BentoHistoryProvider({ children }: { children: React.ReactNode }) {
  const pastRef = useRef<BentoItem[][]>([]);
  const futureRef = useRef<BentoItem[][]>([]);
  const [, forceUpdate] = useState(0);

  const pushState = useCallback((state: BentoItem[]) => {
    pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), state];
    futureRef.current = [];
    forceUpdate((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return null;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    // The caller must provide current state to push to future
    return previous ?? null;
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    return next ?? null;
  }, []);

  return (
    <BentoHistoryContext.Provider
      value={{
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
        undo,
        redo,
        pushState,
      }}
    >
      {children}
    </BentoHistoryContext.Provider>
  );
}

export function useBentoHistory() {
  const ctx = useContext(BentoHistoryContext);
  if (!ctx) throw new Error('useBentoHistory must be used within BentoHistoryProvider');
  return ctx;
}
```

- [ ] **Step 3: Integrate history into bento layout**

In `src/app/[link]/_components/bento-layout.tsx`:

1. Import `useBentoHistory` from `./bento-history`
2. Before each mutation (create, delete, update, reorder), call `pushState()` with the current bento array snapshot (deep copy via `structuredClone`)
3. When undo/redo returns a state, use the `updateProfileLink` mutation to replace the entire bento array

Key integration points — wrap existing mutation calls:

```typescript
const { pushState } = useBentoHistory();

// Before any bento mutation:
pushState(structuredClone(currentBentoArray));
```

For undo: restore the returned bento array by calling the update mutation with the full restored array.

- [ ] **Step 4: Add undo/redo buttons to the header**

In `src/app/[link]/_components/header.tsx`, add undo/redo buttons in the owner toolbar (next to the viewport switcher):

```tsx
import { Undo2, Redo2 } from 'lucide-react';
import { useBentoHistory } from './bento-history';

// Inside the owner toolbar:
const { canUndo, canRedo, undo, redo } = useBentoHistory();

<Button size="icon" variant="outline" disabled={!canUndo} onClick={() => { /* call undo, apply state */ }}>
  <Undo2 className="h-[1.2rem] w-[1.2rem]" />
</Button>
<Button size="icon" variant="outline" disabled={!canRedo} onClick={() => { /* call redo, apply state */ }}>
  <Redo2 className="h-[1.2rem] w-[1.2rem]" />
</Button>
```

- [ ] **Step 5: Add keyboard shortcuts**

In the bento layout component, add a `useEffect` for keyboard shortcuts:

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        // Redo
        const state = redo();
        if (state) applyBentoState(state);
      } else {
        // Undo
        const state = undo();
        if (state) applyBentoState(state);
      }
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [undo, redo]);
```

- [ ] **Step 6: Wrap the profile page in BentoHistoryProvider**

Find where `PreviewProvider` wraps the profile page content, and add `BentoHistoryProvider` at the same level. This is likely in the `[link]/page.tsx` or a layout file.

- [ ] **Step 7: Test undo/redo**

Run: `bun dev`
1. Edit a profile — add a card, move it, delete it
2. Press Cmd+Z — deleted card should reappear
3. Press Cmd+Shift+Z — card should delete again
4. Click undo/redo buttons — same behavior
5. Verify buttons are disabled when history is empty

- [ ] **Step 8: Commit**

```bash
git add src/app/[link]/_components/bento-history.tsx src/app/[link]/_components/bento-layout.tsx src/app/[link]/_components/header.tsx
git commit -m "feat: add undo/redo for bento card editing"
```

---

## Task 2: Public Explore/Directory Page

**Files:**
- Modify: `src/server/db/schema/link.ts`
- Modify: `src/server/api/routers/profile-link.ts`
- Modify: `src/server/api/schemas/profile-link.ts`
- Create: `src/app/explore/page.tsx`
- Create: `src/app/explore/loading.tsx`

### Steps

- [ ] **Step 1: Add isPublic column to link schema**

In `src/server/db/schema/link.ts`, add:

```typescript
isPublic: boolean('is_public').default(false).notNull(),
```

- [ ] **Step 2: Generate and push migration**

```bash
bun run db:generate
bun run db:push
```

- [ ] **Step 3: Add listPublic procedure**

In `src/server/api/routers/profile-link.ts`, add a new public procedure:

```typescript
listPublic: publicProcedure
  .input(
    z.object({
      cursor: z.string().uuid().optional(),
      limit: z.number().min(1).max(50).default(20),
    }),
  )
  .query(async ({ input }) => {
    const items = await db
      .select({
        id: link.id,
        link: link.link,
        name: link.name,
        image: link.image,
        bio: link.bio,
      })
      .from(link)
      .where(
        input.cursor
          ? and(eq(link.isPublic, true), lt(link.id, input.cursor))
          : eq(link.isPublic, true),
      )
      .orderBy(desc(link.createdAt))
      .limit(input.limit + 1);

    const hasMore = items.length > input.limit;
    const profiles = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? profiles[profiles.length - 1]?.id : undefined;

    return { profiles, nextCursor };
  }),
```

Import `lt`, `desc` from drizzle-orm if not already imported.

- [ ] **Step 4: Add isPublic toggle to update procedure**

In the `update` procedure input schema (`src/server/api/schemas/profile-link.ts`), add:

```typescript
isPublic: z.boolean().optional(),
```

And in the update handler, include `isPublic` in the `set` object.

- [ ] **Step 5: Create explore page**

Create `src/app/explore/page.tsx`:

```tsx
import { api } from '@/trpc/server';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Profiles | OpenBio',
  description: 'Discover creative profiles built with OpenBio',
};

export default async function ExplorePage() {
  const { profiles } = await api.profileLink.listPublic({ limit: 20 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-cal text-4xl">Explore</h1>
        <p className="mt-2 text-muted-foreground">
          Discover creative profiles built with OpenBio
        </p>
      </div>

      {profiles.length === 0 ? (
        <p className="text-muted-foreground">No public profiles yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/${profile.link}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border p-6 transition-colors hover:border-primary"
            >
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name ?? ''}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted" />
              )}
              <div className="text-center">
                <p className="font-cal text-lg">{profile.name}</p>
                <p className="text-sm text-muted-foreground">@{profile.link}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create explore loading state**

Create `src/app/explore/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-2 h-5 w-64" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Add "List publicly" toggle to dashboard settings**

Read the dashboard settings page to find where profile link settings are edited. Add a toggle/switch for `isPublic` that calls the `update` mutation. Label: "Show on Explore page". Add a description: "Let others discover your profile in the OpenBio directory."

- [ ] **Step 8: Add Explore link to navigation**

Read the navbar component(s). Add an "Explore" link to the main navigation that points to `/explore`.

- [ ] **Step 9: Test the full flow**

Run: `bun dev`
1. Toggle "Show on Explore page" on for a profile
2. Visit `/explore` — profile should appear
3. Click it — should navigate to the profile
4. Toggle off — profile should disappear from explore

- [ ] **Step 10: Commit**

```bash
git add src/server/db/schema/link.ts src/server/api/routers/profile-link.ts src/server/api/schemas/profile-link.ts src/app/explore/page.tsx src/app/explore/loading.tsx
git commit -m "feat: add public explore/directory page with opt-in visibility"
```

---

## Task 3: Free Pro Trial

**Files:**
- Modify: `src/server/db/schema/user.ts`
- Modify: `src/server/db/utils/user.ts`
- Modify: `src/server/api/routers/profile-link.ts`
- Create: `src/server/api/routers/user.ts` (or modify if exists)

### Steps

- [ ] **Step 1: Add trial columns to user schema**

In `src/server/db/schema/user.ts`, add:

```typescript
trialEndsAt: timestamp('trial_ends_at', { withTimezone: true, mode: 'date' }),
```

One column is enough — we only need to know when the trial expires.

- [ ] **Step 2: Generate and push migration**

```bash
bun run db:generate
bun run db:push
```

- [ ] **Step 3: Update isUserPremium to include trial**

In `src/server/db/utils/user.ts`, modify `isUserPremium`:

```typescript
export function isUserPremium(user: {
  plan: string;
  subscriptionEndsAt: Date | null;
  trialEndsAt: Date | null;
}): boolean {
  const now = new Date();

  // Active subscription
  if (user.plan === 'pro' && user.subscriptionEndsAt && user.subscriptionEndsAt > now) {
    return true;
  }

  // Active trial
  if (user.trialEndsAt && user.trialEndsAt > now) {
    return true;
  }

  return false;
}
```

- [ ] **Step 4: Add startTrial procedure**

In the user router (`src/server/api/routers/user.ts`), add:

```typescript
startTrial: protectedProcedure.mutation(async ({ ctx }) => {
  const user = ctx.user;

  // Already premium
  if (isUserPremium(user)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have Pro access.' });
  }

  // Already used trial
  if (user.trialEndsAt) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already used your free trial.' });
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial

  await db.update(userTable).set({ trialEndsAt }).where(eq(userTable.id, user.id));

  return { trialEndsAt };
}),
```

- [ ] **Step 5: Update dashboard to show trial banner**

Read the dashboard settings/pricing UI. Add a trial banner for free users who haven't used their trial:

```tsx
// If user is free and hasn't used trial:
<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
  <p className="font-semibold">Try Pro free for 7 days</p>
  <p className="mt-1 text-sm text-muted-foreground">
    Unlock all card types, themes, custom domains, and advanced analytics.
  </p>
  <Button className="mt-3" onClick={() => startTrial()}>
    Start Free Trial
  </Button>
</div>

// If user is on active trial:
<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
  <p className="font-semibold">Pro Trial — {daysLeft} days remaining</p>
  <Button className="mt-3" variant="outline" onClick={() => /* open checkout */}>
    Upgrade to keep Pro
  </Button>
</div>
```

- [ ] **Step 6: Pass trialEndsAt through tRPC context**

Ensure `trialEndsAt` is included in the user object returned by `protectedProcedure`'s context, and that `isUserPremium` checks in the profile link router use the updated function.

Read `src/server/api/trpc.ts` to see how the user is loaded in context. If `trialEndsAt` isn't selected, add it to the select query.

- [ ] **Step 7: Test the trial flow**

Run: `bun dev`
1. Sign in as a free user
2. Dashboard should show "Try Pro free for 7 days" banner
3. Click "Start Free Trial" — banner should change to "X days remaining"
4. Verify Pro features work (all card types, themes, etc.)
5. Verify trial can only be started once

- [ ] **Step 8: Commit**

```bash
git add src/server/db/schema/user.ts src/server/db/utils/user.ts src/server/api/routers/user.ts src/server/api/routers/profile-link.ts
git commit -m "feat: add 7-day free Pro trial for new users"
```

---
