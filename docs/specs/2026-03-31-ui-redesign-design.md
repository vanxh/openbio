# OpenBio UI Redesign — Bento-Inspired Playful Design

**Date:** 2026-03-31
**Style:** Bold/playful, inspired by Bento.me
**Scope:** Full redesign — every user-facing page

---

## 1. Design System

### Typography
- **Headings**: Cal Sans, bold, large sizes (3xl-6xl)
- **Body**: Geist Sans, regular/medium, sm-lg
- **Mono**: Geist Mono for usernames, URLs, code-like content
- Fun copy with casual tone and emoji where appropriate

### Colors
- **Background**: Warm off-white `oklch(0.99 0.005 80)` — not pure white
- **Cards**: Pure white, `shadow-md`, `border border-border/50`
- **Primary gradient**: `from-violet-500 to-pink-500` (CTAs, primary buttons)
- **Warm gradient**: `from-orange-400 to-pink-400` (page backgrounds, highlights)
- **Social colors**: Each platform gets its brand color on icons
- **Text**: Near-black for headings, muted gray for secondary
- **Dark mode**: Dark navy bg, lighter cards, same gradient accents

### Cards
- `rounded-2xl` (16px) everywhere
- `shadow-md` default, `shadow-lg` on hover
- `p-6` internal padding
- White bg, `border border-border/50`
- Hover: `scale-[1.02]` + `shadow-lg` transition (200ms ease)

### Buttons
- **Primary**: Gradient bg (`from-violet-500 to-pink-500`), white text, `rounded-full`, `px-6 py-3`
- **Secondary**: White bg, border, `rounded-full`
- **Ghost**: No bg, text only
- All: `transition-all duration-200 hover:scale-105 active:scale-95`

### Spacing
- Sections: `py-20` between major sections
- Content max-width: `max-w-5xl` (landing), `max-w-6xl` (dashboard)
- Card gaps: `gap-4` in grids

### Animations
- Page load: staggered fade-up on elements (CSS keyframes + animation-delay)
- Card hover: scale + shadow lift
- Button press: scale down
- Tab switch: smooth fade
- Skeleton loaders for async content

---

## 2. Landing Page (`/`)

### Navbar
- Sticky, blurred backdrop (`backdrop-blur-lg bg-background/80`), `h-16`, `max-w-5xl` centered
- Left: OpenBio logo + "OpenBio" text
- Right: "Sign in" text link + "Get Started" gradient pill button

### Hero
- Centered, `pt-32 pb-20`
- Pill badge: "Open source & free forever" with border, `rounded-full`
- Heading: Cal Sans `text-5xl md:text-7xl` — "Create your internet home page"
- Subheading: Geist `text-lg text-muted-foreground`
- Two buttons: "Claim your page" gradient pill + "Star on GitHub" white pill
- Inline claim form below: `openbio.app/` + input + "Claim" button in one `rounded-2xl` card row

### Social Proof
- "See it in action" heading
- 3 example profile cards, `rounded-2xl`, mini bento previews
- Cards tilt on hover (CSS perspective + rotateY)

### Features Grid
- 2x3 grid of feature cards, `rounded-2xl`, icon + title + description each
- Features: Bento grid, Analytics, Custom links, Social integration, Dark mode, Open source
- Staggered fade-in on scroll

### Pricing
- Refreshed with new card style — `rounded-2xl`, `shadow-md`
- Free: white bg, standard border
- Pro: gradient border (violet-to-pink), "Popular" badge
- Feature list with checkmarks/crosses

### Footer
- Logo + "Built by @vanxh" + GitHub/Twitter links
- `border-t`, muted text, `py-8`

---

## 3. Auth Pages (`/app/sign-in`, `/app/sign-up`)

### Layout
- Full screen, centered vertically + horizontally
- Subtle warm gradient background
- No navbar — OpenBio logo above card, clickable to home

### Card
- `max-w-md`, `rounded-2xl`, white bg, `shadow-lg`, `p-8`
- Logo + "OpenBio" at top center
- Cal Sans `text-2xl` heading
- Muted `text-sm` subheading

### Form
- Inputs: `rounded-xl`, `h-11`, violet focus ring
- Labels: `text-sm font-medium`
- Password: toggle visibility icon (eye/eye-off)
- `gap-y-5` between fields

### Social Auth
- "or continue with" divider (horizontal line + text)
- Google, GitHub buttons — white pills with brand icons
- Only shows when social providers configured

### Submit
- Full width gradient pill
- Loading spinner during submission
- `active:scale-95`

### Footer Link
- "Don't have an account? **Sign up**" / "Already have an account? **Sign in**"

---

## 4. Onboarding Flow

### Claim Link (`/claim-link`)
- Same centered card layout as auth pages
- Logo at top
- Heading: Cal Sans `text-3xl` — "Claim your page"
- Inline URL input: `rounded-xl` card with `openbio.app/` label + text input fused
- Real-time availability check (green checkmark / red X)
- "Claim" gradient pill button
- "Already have an account? Sign in" link

### Create Link (`/create-link`) — 3-Step Wizard

**Progress Bar** (top of card)
- 3 dots + connecting line
- Active: gradient-filled, Completed: checkmark, Upcoming: gray outline
- Labels: "Profile" → "Socials" → "Preview"

**Step 1: Profile**
- Avatar upload — `rounded-full` 120px circle, camera icon overlay
- Name input
- Bio textarea (`rounded-xl`, 3 rows)
- "Next" gradient button

**Step 2: Socials**
- 2-col grid of social platform cards
- Each: platform icon + name + input field, `rounded-xl`
- Platforms: Twitter, GitHub, LinkedIn, Instagram, Telegram, Discord, YouTube, Twitch
- Only filled ones become bento cards
- "Back" ghost + "Next" gradient buttons

**Step 3: Preview**
- Live mini-preview of bento page in a `rounded-2xl` container
- Shows profile as it will appear
- "Back" ghost + "Publish" gradient button
- Confetti on publish, redirect to live page

---

## 5. Dashboard (`/app`)

### Navbar
- Same sticky blurred navbar as landing
- Left: Logo + "OpenBio"
- Right: User avatar circle + dropdown (Settings, Sign out)

### Page Layout
- `max-w-6xl` centered, `pt-24 pb-12`
- No tabs — sections on one page

### My Links Section
- Heading: Cal Sans `text-3xl` "Your pages" + "Create new" gradient pill (right-aligned)
- Empty state: large `rounded-2xl` card, centered emoji/illustration, "Create your first page" gradient button
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### Link Cards (redesigned)
- `rounded-2xl`, white bg, `shadow-md`, hover lift
- Top: preview thumbnail or gradient placeholder with avatar
- Body `p-4`: name (Cal Sans bold), URL (muted), stats row (views + clicks)
- Footer: action icons — Visit, Edit, QR, Delete (red, confirmation dialog)

### Settings Section
- Below links, subtle divider
- Profile card: avatar + name + email, "Edit" button
- Plan card: current plan badge + upgrade/manage CTA
- Pricing cards inline (redesigned)

---

## 6. Public Profile Page (`/:link`)

### Layout
- Full width, warm off-white bg, content `max-w-3xl` centered
- No navbar — clean, distraction-free

### Header
- `pt-16 pb-8`, centered
- Avatar: `rounded-full` 96px, `shadow-lg`, `ring-4 ring-background`
- Name: Cal Sans `text-3xl`, `mt-4`
- Bio: Geist `text-base text-muted-foreground`, max 2 lines
- Owner-only: floating edit pencil icon

### Bento Grid (refined)
- Same react-grid-layout, 2 cols mobile / 4 cols desktop
- All cards: `rounded-2xl`, white bg, `shadow-md`
- Hover: `scale-[1.02]`, `shadow-lg`, 200ms
- **Link cards**: colored platform icon, site title bold, URL muted, optional thumbnail bg
- **Note cards**: clean text, left-aligned
- **Image cards**: image fills with `rounded-2xl object-cover`, caption overlay
- **Video cards**: thumbnail + play button overlay

### Owner Action Bar
- Floating bottom center, `rounded-full`, white bg, `shadow-xl`, `backdrop-blur`
- Icons: Add (+), Edit layout, Share, QR, Settings
- `hover:scale-110` on each icon

### Footer
- "Made with OpenBio" + logo, `text-xs text-muted-foreground`, `py-8`

### 404 Profile
- Centered card with sad emoji, "This page doesn't exist", "Claim this username" gradient button
