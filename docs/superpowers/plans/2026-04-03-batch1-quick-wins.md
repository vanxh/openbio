# Batch 1: Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve public profile UX with stronger CTA, public share/QR, card duplication, and loading states.

**Architecture:** All changes are client-side or minimal server additions. No schema migrations. Follows existing patterns (tRPC optimistic updates, shadcn/ui components, Skeleton loading).

**Tech Stack:** Next.js App Router, React, shadcn/ui, tRPC, lucide-react

---

## Task 1: Stronger "Claim your OpenBio" CTA on Public Profiles

**Files:**
- Modify: `src/app/[link]/page.tsx:127-134`

### Steps

- [ ] **Step 1: Update the footer to be a compelling CTA**

Replace the minimal footer in `src/app/[link]/page.tsx`:

```tsx
// OLD (lines 127-134):
<footer className="animate-fade-in py-8 text-center">
  <Link
    href="/"
    className="text-muted-foreground text-xs transition-colors hover:text-foreground"
  >
    {profileLink.customFooter || 'Made with OpenBio'}
  </Link>
</footer>
```

```tsx
// NEW:
<footer className="animate-fade-in py-8 text-center">
  {profileLink.customFooter ? (
    <p className="text-muted-foreground text-xs">{profileLink.customFooter}</p>
  ) : (
    <Link
      href="/claim-link"
      className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm transition-all hover:border-primary hover:text-foreground"
    >
      Create your own free page on
      <span className="font-semibold text-foreground">OpenBio</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )}
</footer>
```

Add `ArrowRight` to the lucide-react import at the top of the file.

- [ ] **Step 2: Verify the CTA renders on a non-owner profile view**

Run: `bun dev`
Visit a profile page while logged out. Confirm the pill-shaped CTA appears and links to `/claim-link`.

- [ ] **Step 3: Commit**

```bash
git add src/app/[link]/page.tsx
git commit -m "feat: stronger claim CTA on public profile footer"
```

---

## Task 2: Share Button on Public Profiles

**Files:**
- Modify: `src/app/[link]/_components/header.tsx`

### Steps

- [ ] **Step 1: Add a public share button visible to all visitors**

In `src/app/[link]/_components/header.tsx`, add `Share2` to the lucide-react import:

```tsx
import { Eye, Monitor, PenLine, QrCode, Share2, Smartphone } from 'lucide-react';
```

After the closing `</div>` of the `profileLink.isOwner` block (after line 168), add a share button for non-owners:

```tsx
{!profileLink.isOwner && (
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const url = `https://openbio.app/${profileLink.link}`;
        if (navigator.share) {
          navigator.share({ title: profileLink.name ?? 'OpenBio Profile', url }).catch(() => undefined);
        } else {
          navigator.clipboard
            .writeText(url)
            .then(() => {
              toast({
                title: 'Copied to clipboard!',
                description: 'Profile link copied!',
              });
            })
            .catch(() => undefined);
        }
      }}
    >
      <Share2 className="mr-1.5 h-4 w-4" />
      Share
    </Button>
  </div>
)}
```

- [ ] **Step 2: Test on desktop and mobile**

Run: `bun dev`
- Visit a profile while logged out — share button should appear top-right.
- On mobile (or DevTools mobile), clicking share should open native share sheet.
- On desktop, clicking should copy URL and show toast.

- [ ] **Step 3: Commit**

```bash
git add src/app/[link]/_components/header.tsx
git commit -m "feat: add share button visible to all profile visitors"
```

---

## Task 3: Card Duplication

**Files:**
- Modify: `src/components/bento/overlay/index.tsx`

### Steps

- [ ] **Step 1: Read current overlay component**

Read `src/components/bento/overlay/index.tsx` to understand the existing overlay buttons (delete, drag, resize).

- [ ] **Step 2: Add a duplicate button to the bento overlay**

In `src/components/bento/overlay/index.tsx`, add the duplicate button. Import `Copy` from lucide-react and `api` from `@/trpc/react`.

Add a `DuplicateButton` component (or inline) next to the existing `DeleteButton`. The duplicate button should:

```tsx
// Add to the overlay, near the delete button
<button
  type="button"
  className="rounded-md bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
  onClick={(e) => {
    e.stopPropagation();
    const newCard = {
      ...card,
      id: crypto.randomUUID(),
      position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
    };
    createBento({ link, bento: newCard });
  }}
  title="Duplicate card"
>
  <Copy className="h-4 w-4" />
</button>
```

The `createBento` mutation and `link` param need to be available in scope. Check how `DeleteButton` receives its props — follow the same pattern. The `card` data is the full bento item. We copy all properties, generate a new `id`, and reset position to `{0,0}` so it appears at the top-left.

- [ ] **Step 3: Test duplication**

Run: `bun dev`
- Open a profile you own in edit mode.
- Hover a card — a copy icon should appear.
- Click it — a duplicate card should appear at position (0,0) with identical content.
- Confirm the duplicate has a different `id` in the bento array.

- [ ] **Step 4: Commit**

```bash
git add src/components/bento/overlay/index.tsx
git commit -m "feat: add card duplication button to bento overlay"
```

---

## Task 4: QR Code More Prominent

**Files:**
- Modify: `src/app/[link]/_components/header.tsx`

### Steps

- [ ] **Step 1: Show QR button to all visitors (not just owners)**

In `src/app/[link]/_components/header.tsx`, move the `LinkQRModal` outside the `profileLink.isOwner` block. Add it inside the non-owner share section created in Task 2:

```tsx
{!profileLink.isOwner && (
  <div className="flex items-center gap-2">
    {/* Share button from Task 2 */}
    <LinkQRModal profileLink={profileLink}>
      <Button size="icon" variant="outline" className="h-9 w-9">
        <QrCode className="h-4 w-4" />
      </Button>
    </LinkQRModal>
  </div>
)}
```

- [ ] **Step 2: Test QR visibility for visitors**

Run: `bun dev`
Visit a profile while logged out. QR button should appear next to the share button. Click it — modal should open with a working QR code.

- [ ] **Step 3: Commit**

```bash
git add src/app/[link]/_components/header.tsx
git commit -m "feat: show QR code button to all profile visitors"
```

---

## Task 5: Loading/Skeleton States for Missing Pages

**Files:**
- Create: `src/app/app/(auth)/sign-in/loading.tsx`
- Create: `src/app/app/(auth)/sign-up/loading.tsx`
- Create: `src/app/app/(dashboard)/analytics/[id]/loading.tsx`
- Create: `src/app/(home)/loading.tsx`

### Steps

- [ ] **Step 1: Read existing loading states for reference**

Read `src/app/[link]/loading.tsx` and `src/app/app/(dashboard)/loading.tsx` to match existing patterns.

- [ ] **Step 2: Create auth page loading states**

`src/app/app/(auth)/sign-in/loading.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function SignInLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-y-6">
        <div className="flex flex-col gap-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-32" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
        <div className="flex flex-col gap-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="mx-auto h-4 w-40" />
      </div>
    </div>
  );
}
```

`src/app/app/(auth)/sign-up/loading.tsx`: Same content, export as `SignUpLoading`.

- [ ] **Step 3: Create analytics loading state**

Read the analytics page to understand its layout, then create `src/app/app/(dashboard)/analytics/[id]/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create homepage loading state**

`src/app/(home)/loading.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-y-16 py-16">
      <div className="flex flex-col items-center gap-y-6 text-center">
        <Skeleton className="h-12 w-3/4 max-w-lg" />
        <Skeleton className="h-6 w-1/2 max-w-sm" />
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test loading states**

Run: `bun dev`
Hard-refresh each page with network throttling enabled (Slow 3G in DevTools). Confirm skeleton UI appears briefly before content loads.

- [ ] **Step 6: Commit**

```bash
git add src/app/app/(auth)/sign-in/loading.tsx src/app/app/(auth)/sign-up/loading.tsx src/app/app/(dashboard)/analytics/\[id\]/loading.tsx src/app/\(home\)/loading.tsx
git commit -m "feat: add skeleton loading states for auth, analytics, and home pages"
```

---
