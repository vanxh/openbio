# OpenBio UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every user-facing page with a Bento.me-inspired playful style — gradient buttons, rounded cards, micro-animations, multi-step onboarding wizard.

**Architecture:** Design system changes (CSS + shared components) first, then rewrite each page top-to-bottom. Each task produces a working committed state. No backend changes — this is purely frontend/UI.

**Tech Stack:** Next.js 16, Tailwind CSS 4, shadcn/ui, Cal Sans + Geist fonts, Lucide icons, react-grid-layout

---

## File Structure

### Files to Create
- `src/components/ui/gradient-button.tsx` — Primary gradient CTA button
- `src/components/ui/pill-badge.tsx` — Small rounded-full badge component
- `src/components/navbar/shared.tsx` — Shared sticky blurred navbar shell
- `src/components/onboarding/wizard-progress.tsx` — 3-step progress indicator
- `src/components/onboarding/step-profile.tsx` — Step 1: avatar + name + bio
- `src/components/onboarding/step-socials.tsx` — Step 2: social links grid
- `src/components/onboarding/step-preview.tsx` — Step 3: live preview
- `src/components/dashboard/link-card.tsx` — Redesigned profile link card
- `src/components/dashboard/empty-state.tsx` — No-links empty state
- `src/components/dashboard/user-menu.tsx` — Avatar dropdown (settings, sign out)

### Files to Modify
- `src/styles/globals.css` — Add warm bg color, fade-up animation keyframes
- `src/components/ui/button.tsx` — Add `gradient` variant
- `src/components/navbar/home.tsx` — Rewrite with sticky blurred style
- `src/components/navbar/app.tsx` — Rewrite with user menu dropdown
- `src/app/(home)/page.tsx` — Full landing page rewrite
- `src/app/(home)/layout.tsx` — Add navbar + footer
- `src/components/pricing.tsx` — Refresh card style
- `src/app/app/(auth)/sign-in/page.tsx` — Redesign with logo + card
- `src/app/app/(auth)/sign-up/page.tsx` — Redesign with logo + card
- `src/app/claim-link/page.tsx` — Centered card layout
- `src/components/forms/claim-link.tsx` — Styled inline URL input
- `src/app/create-link/page.tsx` — Multi-step wizard
- `src/components/forms/setup-link.tsx` — Split into wizard steps
- `src/app/app/(dashboard)/page.tsx` — Dashboard rewrite
- `src/app/app/(dashboard)/layout.tsx` — Updated layout
- `src/components/profile-link-card.tsx` — Replaced by dashboard/link-card.tsx
- `src/app/[link]/page.tsx` — Refined public profile
- `src/app/[link]/_components/header.tsx` — Updated header style
- `src/app/[link]/_components/bento-layout.tsx` — Refined card styles
- `src/components/bento/link.tsx` — Updated card style
- `src/components/bento/overlay/delete-button.tsx` — Updated to action bar
- `src/components/footer/marketing.tsx` — Simple new footer
- `src/app/not-found.tsx` — Fun 404 page

---

### Task 1: Design System — CSS + Animation Foundations

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add warm background, fade-up animation, and gradient utilities to globals.css**

Add these after the existing `@theme inline` block and before `:root`:

```css
@theme inline {
  /* ...existing theme tokens... */
  --animate-fade-up: fade-up 0.5s ease-out both;
  --animate-fade-in: fade-in 0.3s ease-out both;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Update `:root` to change the background to warm off-white:
```css
:root {
  --background: oklch(0.99 0.005 80);
  /* ...rest stays the same... */
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add fade-up animation and warm background to design system"
```

---

### Task 2: Gradient Button + Pill Badge Components

**Files:**
- Create: `src/components/ui/gradient-button.tsx`
- Create: `src/components/ui/pill-badge.tsx`
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Create gradient-button.tsx**

```tsx
// src/components/ui/gradient-button.tsx
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "default" | "sm" | "lg";
}

export function GradientButton({
  className,
  asChild,
  size = "default",
  ...props
}: GradientButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-pink-500 font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "px-4 py-2 text-sm",
        size === "default" && "px-6 py-3 text-base",
        size === "lg" && "px-8 py-4 text-lg",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Create pill-badge.tsx**

```tsx
// src/components/ui/pill-badge.tsx
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function PillBadge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-x-1.5 rounded-full border border-border/50 bg-background px-3 py-1 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/gradient-button.tsx src/components/ui/pill-badge.tsx
git commit -m "feat: add GradientButton and PillBadge components"
```

---

### Task 3: Shared Navbar Shell + Home Navbar

**Files:**
- Create: `src/components/navbar/shared.tsx`
- Modify: `src/components/navbar/home.tsx`

- [ ] **Step 1: Create shared navbar shell**

```tsx
// src/components/navbar/shared.tsx
import { cn } from "@/lib/utils";
import OpenBioLogo from "@/public/openbio.png";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function NavbarShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link href="/" className="flex items-center gap-x-2">
          <Image src={OpenBioLogo} alt="OpenBio" width={32} height={32} />
          <span className="font-cal text-lg">OpenBio</span>
        </Link>
        <div className="ml-auto flex items-center gap-x-3">{children}</div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Rewrite home navbar**

```tsx
// src/components/navbar/home.tsx
"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { NavbarShell } from "@/components/navbar/shared";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export default function HomeNavbar() {
  const { data: session } = useSession();

  return (
    <NavbarShell>
      {!session && (
        <Link href="/app/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Sign in
        </Link>
      )}
      <Link href={session ? "/app" : "/claim-link"}>
        <GradientButton size="sm">
          {session ? "Go to App" : "Get Started"}
        </GradientButton>
      </Link>
    </NavbarShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/navbar/shared.tsx src/components/navbar/home.tsx
git commit -m "feat: add shared navbar shell, redesign home navbar"
```

---

### Task 4: User Menu Dropdown + App Navbar

**Files:**
- Create: `src/components/dashboard/user-menu.tsx`
- Modify: `src/components/navbar/app.tsx`

- [ ] **Step 1: Create user menu dropdown**

```tsx
// src/components/dashboard/user-menu.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "@/lib/auth-client";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-9 w-9 cursor-pointer transition-transform hover:scale-105">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-sm text-white">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem onClick={() => router.push("/app#settings")} className="cursor-pointer gap-x-2 rounded-lg">
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-x-2 rounded-lg text-destructive">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Rewrite app navbar**

```tsx
// src/components/navbar/app.tsx
"use client";

import { NavbarShell } from "@/components/navbar/shared";
import { UserMenu } from "@/components/dashboard/user-menu";

export default function AppNavbar() {
  return (
    <NavbarShell>
      <UserMenu />
    </NavbarShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/user-menu.tsx src/components/navbar/app.tsx
git commit -m "feat: add user menu dropdown, redesign app navbar"
```

---

### Task 5: Landing Page Rewrite

**Files:**
- Modify: `src/app/(home)/page.tsx`
- Modify: `src/components/footer/marketing.tsx`

- [ ] **Step 1: Rewrite landing page**

```tsx
// src/app/(home)/page.tsx
import { GradientButton } from "@/components/ui/gradient-button";
import { PillBadge } from "@/components/ui/pill-badge";
import Pricing from "@/components/pricing";
import OpenBioLogo from "@/public/openbio.png";
import { Github, Sparkles, BarChart3, Link2, Share2, Moon, Code2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  { icon: Link2, title: "Bento Grid", description: "Drag-and-drop cards to build your perfect layout" },
  { icon: BarChart3, title: "Analytics", description: "Track views and clicks on your profile" },
  { icon: Share2, title: "Social Links", description: "Connect all your platforms in one place" },
  { icon: Sparkles, title: "Customizable", description: "Notes, images, videos, and link cards" },
  { icon: Moon, title: "Dark Mode", description: "Beautiful in light and dark themes" },
  { icon: Code2, title: "Open Source", description: "Free forever. Contribute on GitHub" },
];

export default function Page() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex w-full max-w-5xl flex-col items-center px-4 pt-32 pb-20 text-center">
        <PillBadge className="animate-fade-up">
          <Sparkles className="h-3.5 w-3.5" />
          Open source & free forever
        </PillBadge>

        <h1 className="mt-6 animate-fade-up font-cal text-5xl leading-tight md:text-7xl" style={{ animationDelay: "0.1s" }}>
          Create your
          <br />
          internet home page
        </h1>

        <p className="mt-4 max-w-lg animate-fade-up text-lg text-muted-foreground" style={{ animationDelay: "0.2s" }}>
          The prettiest link-in-bio. Free, open source, and takes 2 minutes.
        </p>

        <div className="mt-8 flex animate-fade-up items-center gap-x-3" style={{ animationDelay: "0.3s" }}>
          <Link href="/claim-link">
            <GradientButton size="lg">Claim your page</GradientButton>
          </Link>
          <Link href="/github" target="_blank" rel="noopener noreferrer">
            <button className="inline-flex items-center gap-x-2 rounded-full border border-border bg-background px-6 py-3 text-base font-medium shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95">
              <Github className="h-5 w-5" />
              Star on GitHub
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-5xl px-4 py-20">
        <h2 className="text-center font-cal text-3xl md:text-4xl">Everything you need</h2>
        <p className="mt-2 text-center text-muted-foreground">Simple, powerful, and free</p>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/50 bg-card p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 p-2.5">
                <feature.icon className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="font-cal text-lg">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="w-full max-w-5xl px-4 py-20">
        <Pricing />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite marketing footer**

```tsx
// src/components/footer/marketing.tsx
import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">
          Built by{" "}
          <Link href="https://twitter.com/vanxhh" target="_blank" className="underline underline-offset-4 hover:text-foreground">
            @vanxh
          </Link>
        </p>
        <div className="flex items-center gap-x-3">
          <Link href="/github" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="h-4 w-4" />
          </Link>
          <Link href="/twitter" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
            <Twitter className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(home\)/page.tsx src/components/footer/marketing.tsx
git commit -m "feat: redesign landing page with hero, features grid, new footer"
```

---

### Task 6: Auth Pages Redesign

**Files:**
- Modify: `src/app/app/(auth)/sign-in/page.tsx`
- Modify: `src/app/app/(auth)/sign-up/page.tsx`

- [ ] **Step 1: Rewrite sign-in page**

```tsx
// src/app/app/(auth)/sign-in/page.tsx
"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import OpenBioLogo from "@/public/openbio.png";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/">
            <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
          </Link>
          <h1 className="mt-4 font-cal text-2xl">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" className="h-11 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <GradientButton type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </GradientButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/app/sign-up" className="font-medium text-foreground underline underline-offset-4 hover:text-violet-600">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite sign-up page**

Same structure as sign-in but with:
- Name field added (first field)
- Heading: "Create your account"
- Subheading: "Get started with OpenBio"
- Button text: "Create account" / Loader2 spinner
- Footer link: "Already have an account? **Sign in**"
- Password minLength={8}

```tsx
// src/app/app/(auth)/sign-up/page.tsx
"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import OpenBioLogo from "@/public/openbio.png";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/">
            <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
          </Link>
          <h1 className="mt-4 font-cal text-2xl">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Get started with OpenBio</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="John Doe" className="h-11 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" className="h-11 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <GradientButton type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </GradientButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/app/sign-in" className="font-medium text-foreground underline underline-offset-4 hover:text-violet-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/app/(auth)/"
git commit -m "feat: redesign auth pages with logo, card, gradient buttons"
```

---

### Task 7: Claim Link Page Redesign

**Files:**
- Modify: `src/app/claim-link/page.tsx`
- Modify: `src/components/forms/claim-link.tsx`

- [ ] **Step 1: Rewrite claim-link page**

```tsx
// src/app/claim-link/page.tsx
import ClaimLinkForm from "@/components/forms/claim-link";
import OpenBioLogo from "@/public/openbio.png";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/">
            <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
          </Link>
          <h1 className="mt-4 font-cal text-3xl">Claim your page</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick a username for your OpenBio page</p>
        </div>

        <ClaimLinkForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/app/sign-in" className="font-medium text-foreground underline underline-offset-4 hover:text-violet-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Restyle claim-link form**

```tsx
// src/components/forms/claim-link.tsx
"use client";

import { claimLink } from "@/app/actions/claim-link";
import { GradientButton } from "@/components/ui/gradient-button";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/trpc/react";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

export default function ClaimLinkForm() {
  const [link, setLink] = useState("");
  const debouncedLink = useDebounce(link, 500);

  const { data: available, isFetching } =
    api.profileLink.linkAvailable.useQuery(
      { link: debouncedLink },
      { enabled: !!debouncedLink, staleTime: Number.POSITIVE_INFINITY },
    );

  return (
    <form
      className="space-y-4"
      action={() => {
        if (!debouncedLink || isFetching || !available) return;
        void claimLink(link);
      }}
    >
      <div className="flex h-12 items-center gap-x-1 rounded-xl border border-input bg-background px-4 shadow-sm focus-within:ring-2 focus-within:ring-violet-500/50">
        <span className="text-sm text-muted-foreground">openbio.app/</span>
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
          placeholder="yourname"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        {debouncedLink && (
          <div className="ml-auto">
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : available ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {debouncedLink && !isFetching && !available && (
        <p className="text-center text-sm text-red-500">This username is taken</p>
      )}

      {debouncedLink && !isFetching && available && (
        <GradientButton type="submit" className="w-full">
          Claim my page
        </GradientButton>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/claim-link/page.tsx src/components/forms/claim-link.tsx
git commit -m "feat: redesign claim-link page with centered card"
```

---

### Task 8: Create Link — Multi-Step Wizard

**Files:**
- Create: `src/components/onboarding/wizard-progress.tsx`
- Create: `src/components/onboarding/step-profile.tsx`
- Create: `src/components/onboarding/step-socials.tsx`
- Create: `src/components/onboarding/step-preview.tsx`
- Modify: `src/app/create-link/page.tsx`

- [ ] **Step 1: Create wizard progress indicator**

```tsx
// src/components/onboarding/wizard-progress.tsx
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = ["Profile", "Socials", "Preview"];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-x-2">
          <div className="flex flex-col items-center gap-y-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all",
                i < currentStep && "bg-gradient-to-r from-violet-500 to-pink-500 text-white",
                i === currentStep && "bg-gradient-to-r from-violet-500 to-pink-500 text-white ring-4 ring-violet-500/20",
                i > currentStep && "border-2 border-border text-muted-foreground",
              )}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-xs", i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("mb-5 h-0.5 w-12", i < currentStep ? "bg-gradient-to-r from-violet-500 to-pink-500" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create step-profile component**

```tsx
// src/components/onboarding/step-profile.tsx
"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepProfileProps {
  name: string;
  bio: string;
  onNameChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onNext: () => void;
}

export function StepProfile({ name, bio, onNameChange, onBioChange, onNext }: StepProfileProps) {
  return (
    <div className="flex flex-col gap-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" placeholder="John Doe" className="h-11 rounded-xl" value={name} onChange={(e) => onNameChange(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={3}
          placeholder="Tell the world about yourself..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
        />
      </div>

      <GradientButton onClick={onNext} disabled={!name} className="mt-2 w-full">
        Next
      </GradientButton>
    </div>
  );
}
```

- [ ] **Step 3: Create step-socials component**

```tsx
// src/components/onboarding/step-socials.tsx
"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import { AtSign, Github, Instagram, Linkedin, Twitch, Twitter, Youtube } from "lucide-react";
import { BiLogoTelegram } from "react-icons/bi";
import { BsDiscord } from "react-icons/bs";

const socials = [
  { key: "twitter", name: "Twitter", icon: Twitter, placeholder: "username" },
  { key: "github", name: "GitHub", icon: Github, placeholder: "username" },
  { key: "linkedin", name: "LinkedIn", icon: Linkedin, placeholder: "username" },
  { key: "instagram", name: "Instagram", icon: Instagram, placeholder: "username" },
  { key: "telegram", name: "Telegram", icon: BiLogoTelegram, placeholder: "username" },
  { key: "discord", name: "Discord", icon: BsDiscord, placeholder: "username" },
  { key: "youtube", name: "YouTube", icon: Youtube, placeholder: "username" },
  { key: "twitch", name: "Twitch", icon: Twitch, placeholder: "username" },
] as const;

interface StepSocialsProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepSocials({ values, onChange, onBack, onNext }: StepSocialsProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {socials.map((social) => (
          <div key={social.key} className="flex items-center gap-x-3 rounded-xl border border-border/50 bg-background p-3">
            <social.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex flex-1 items-center gap-x-1">
              <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder={social.placeholder}
                value={values[social.key] ?? ""}
                onChange={(e) => onChange(social.key, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-x-3">
        <Button variant="ghost" onClick={onBack} className="flex-1 rounded-full">
          Back
        </Button>
        <GradientButton onClick={onNext} className="flex-1">
          Next
        </GradientButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create step-preview component**

```tsx
// src/components/onboarding/step-preview.tsx
"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface StepPreviewProps {
  name: string;
  bio: string;
  socials: Record<string, string>;
  onBack: () => void;
  onPublish: () => void;
  loading: boolean;
}

export function StepPreview({ name, bio, socials, onBack, onPublish, loading }: StepPreviewProps) {
  const filledSocials = Object.entries(socials).filter(([, v]) => v);

  return (
    <div className="flex flex-col gap-y-6">
      {/* Mini preview */}
      <div className="rounded-2xl border border-border/50 bg-background p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-lg text-white">
              {name?.charAt(0)?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 font-cal text-xl">{name || "Your Name"}</h3>
          {bio && <p className="mt-1 text-sm text-muted-foreground">{bio}</p>}
        </div>

        {filledSocials.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {filledSocials.map(([platform, username]) => (
              <span key={platform} className="rounded-full bg-muted px-3 py-1 text-xs">
                {platform}: @{username}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-x-3">
        <Button variant="ghost" onClick={onBack} className="flex-1 rounded-full">
          Back
        </Button>
        <GradientButton onClick={onPublish} disabled={loading} className="flex-1">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
        </GradientButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite create-link page as wizard**

Read the current `src/app/create-link/page.tsx` and `src/components/forms/setup-link.tsx`. Rewrite the page to use the 3-step wizard components. The page should manage the wizard state (currentStep, form data) and call the existing tRPC `profileLink.create` mutation on publish.

The create-link page should:
1. Require auth (redirect if no session) — keep existing logic
2. Require `?link=` param — keep existing logic
3. Render wizard with progress bar + current step component
4. On publish: call `api.profileLink.create.useMutation()` with the collected data, then redirect to `/${link}`

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/ src/app/create-link/page.tsx
git commit -m "feat: add multi-step onboarding wizard with profile, socials, preview"
```

---

### Task 9: Dashboard Redesign

**Files:**
- Create: `src/components/dashboard/link-card.tsx`
- Create: `src/components/dashboard/empty-state.tsx`
- Modify: `src/app/app/(dashboard)/page.tsx`
- Modify: `src/app/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create empty state component**

```tsx
// src/components/dashboard/empty-state.tsx
import { GradientButton } from "@/components/ui/gradient-button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 p-4">
        <Sparkles className="h-8 w-8 text-violet-600" />
      </div>
      <h3 className="font-cal text-xl">No pages yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Create your first link-in-bio page</p>
      <Link href="/claim-link" className="mt-6">
        <GradientButton>Create your page</GradientButton>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create redesigned link card**

```tsx
// src/components/dashboard/link-card.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RouterOutputs } from "@/trpc/react";
import { Eye, ExternalLink, QrCode, Trash2 } from "lucide-react";
import Link from "next/link";

type ProfileLink = NonNullable<RouterOutputs["profileLink"]["getAll"]>[number];

export function DashboardLinkCard({ link }: { link: ProfileLink }) {
  return (
    <div className="group rounded-2xl border border-border/50 bg-card shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      {/* Gradient header with avatar */}
      <div className="flex h-24 items-center justify-center rounded-t-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10">
        <Avatar className="h-14 w-14 ring-4 ring-card">
          <AvatarImage src={link.image ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-lg text-white">
            {link.name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-cal text-lg">{link.name}</h3>
        <p className="text-sm text-muted-foreground">openbio.app/{link.link}</p>

        <div className="mt-3 flex items-center gap-x-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-x-1">
            <Eye className="h-3.5 w-3.5" />
            Views
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-border/50 px-2 py-2">
        <Link href={`/${link.link}`} target="_blank" className="flex-1">
          <Button variant="ghost" size="sm" className="w-full gap-x-1.5 rounded-lg text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Visit
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="flex-1 gap-x-1.5 rounded-lg text-xs">
          <QrCode className="h-3.5 w-3.5" />
          QR
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 gap-x-1.5 rounded-lg text-xs text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite dashboard page**

Read current `src/app/app/(dashboard)/page.tsx`, then rewrite to use the new components. Replace the tabs with a single-page layout: "Your pages" section with grid of DashboardLinkCards (or EmptyState), then a "Settings" section below with the existing UserSettings.

- [ ] **Step 4: Update dashboard layout**

Read current `src/app/app/(dashboard)/layout.tsx`, ensure it uses AppNavbar and has `pt-24` for the fixed navbar offset.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ src/app/app/\(dashboard\)/
git commit -m "feat: redesign dashboard with link cards, empty state, user menu"
```

---

### Task 10: Public Profile Page Refinement

**Files:**
- Modify: `src/app/[link]/page.tsx`
- Modify: `src/app/[link]/_components/header.tsx`
- Modify: `src/components/bento/link.tsx`

- [ ] **Step 1: Update profile header styling**

Read `src/app/[link]/_components/header.tsx`. Update the avatar to use `rounded-full shadow-lg ring-4 ring-background` at 96px. Update name to Cal Sans `text-3xl`. Update bio to `text-muted-foreground`. Keep the tiptap inline editing for owners.

- [ ] **Step 2: Update bento card styling**

Read `src/components/bento/link.tsx`. Update card wrappers to use `rounded-2xl bg-card shadow-md border border-border/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`.

- [ ] **Step 3: Add "Made with OpenBio" footer**

At the bottom of `src/app/[link]/page.tsx`, add:
```tsx
<footer className="py-8 text-center">
  <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
    Made with OpenBio
  </Link>
</footer>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[link\]/ src/components/bento/
git commit -m "feat: refine public profile page with rounded cards, better header"
```

---

### Task 11: 404 Page + Final Polish

**Files:**
- Modify: `src/app/not-found.tsx`

- [ ] **Step 1: Redesign 404 page**

```tsx
// src/app/not-found.tsx
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="animate-fade-up text-center">
        <span className="text-6xl">😢</span>
        <h1 className="mt-6 font-cal text-4xl">Page not found</h1>
        <p className="mt-2 text-muted-foreground">This page doesn&apos;t exist or has been removed</p>
        <Link href="/" className="mt-8 inline-block">
          <GradientButton>Go home</GradientButton>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: redesign 404 page with emoji and gradient button"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run lint**

```bash
bun run lint:fix
```

- [ ] **Step 2: Typecheck**

```bash
SKIP_ENV_VALIDATION=1 bun run typecheck 2>&1 | head -30
```

Fix any type errors from the UI changes.

- [ ] **Step 3: Visual review**

Start dev server and manually verify each page:
- `/` — Hero, features grid, pricing, footer
- `/app/sign-in` — Card with logo, form, gradient button
- `/app/sign-up` — Same style, name field added
- `/claim-link` — Centered card with inline URL input
- `/create-link?link=test` — 3-step wizard
- `/app` — Dashboard with link cards or empty state
- `/:link` — Public profile with refined cards

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: lint fixes and final polish"
```
