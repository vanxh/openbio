# OpenBio Feature Pack: Note Cards, Image Cards, Themes, Bio Styling, Verified Badge

## Overview

Five features shipped in 4 groups:

1. **Group 1** — Note cards + Image cards (new bento card types)
2. **Group 2** — Theme system + Dark mode toggle + Presets (visual customization)
3. **Group 3** — Custom bio styling (tiptap extensions)
4. **Group 4** — Verified badge (pro indicator)

All pro features are **visible but disabled** for free users with an upsell prompt on interaction.

---

## Database Schema Changes

### `link` table — 3 new columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `text` | `'default'` | Preset theme name |
| `accentColor` | `text` | `null` | Custom hex accent override (Pro) |
| `darkMode` | `boolean` | `false` | Owner's light/dark preference (Pro) |

No changes to `user` table. Verified badge is derived from `isPremium` at query time.

### Premium Gating

| Feature | Free | Pro |
|---------|------|-----|
| Link cards | Yes | Yes |
| Note cards | Yes | Yes |
| Image cards | 1 | Unlimited |
| Themes | 3 basic presets | All 10 presets + custom accent |
| Dark mode | Visible, locked | Yes |
| Bio styling (color, highlight, link, underline) | Visible, locked | Yes |
| Verified badge | — | Yes |

**Locked behavior:** Clicking a locked feature shows a toast or small modal with "Upgrade to Pro" CTA linking to the pricing/checkout page.

---

## Group 1: Note Cards + Image Cards

### Note Cards

**Schema:** Existing `NoteBentoSchema` — `text` field stores HTML from tiptap.

**Editor (edit mode):**
- Inline tiptap editor rendered inside the card
- Extensions: StarterKit (bold, italic, lists, headings) + Placeholder ("Write something...")
- No link/image extensions — keep it focused
- Content auto-saves on blur or debounced onChange via `updateBento` mutation

**View mode (non-owner):** Renders stored HTML with prose styling, read-only. Overflow hidden with fade-out at bottom for small cards.

**Layouts:**
- **2x2** — text fills card, small font (text-xs/text-sm), overflow hidden
- **4x1** — single line, truncated
- **4x2** — comfortable reading size, more vertical space

**Allowed sizes:** `['2x2', '4x1', '4x2']`

**Action bar:** Second button (currently disabled) becomes `Type` (lucide) icon → creates a note card with empty text.

### Image Cards

**Schema:** Existing `AssetBentoSchema` with `type: 'image'` — `url` for Blob URL, `caption` optional text.

**Upload flow:**
- Edit mode: card shows a dropzone (react-dropzone, same as avatar)
- On drop: POST to `/api/upload` with `type=bento-image` and `profileLinkId`
- Server: uploads to Vercel Blob at `bento-images/{profileLinkId}/{filename}`, returns URL
- URL stored in bento JSON via `updateBento` mutation
- After upload: image replaces dropzone, click-to-replace for re-upload

**Premium gating:** Free users can have 1 image card total. Additional image cards show the upsell prompt.

**Layouts:**
- **2x2** — image fills card (`object-cover`), rounded corners. Caption overlay at bottom with gradient scrim if present
- **4x1** — image as background, caption inline over gradient
- **4x2** — image fills card, caption overlay bottom-left
- **2x4** — tall, great for portraits
- **4x4** — large showcase

**Allowed sizes:** `['2x2', '4x1', '4x2', '2x4', '4x4']` — all sizes work since image fills the card.

**Action bar:** Third button becomes `ImagePlus` (lucide) icon → creates an image card with empty url (shows dropzone).

---

## Group 2: Theme System + Dark Mode

### Theme Architecture

Profile page reads `theme`, `accentColor`, `darkMode` from the profile link data and applies CSS variables to a wrapper `<div>` around the profile content. This does NOT affect the dashboard or app — only the public profile page (`/[link]`).

**Implementation:**
- A `ThemeWrapper` component wraps the profile page content
- It sets `style` with CSS custom properties from the selected preset
- If `accentColor` is set (Pro), it overrides `--primary` and `--accent` variables
- If `darkMode` is true, adds `dark` class to the wrapper

### Preset Themes (10 total)

Each preset defines: background, foreground, card, card-foreground, border, muted, muted-foreground, primary, primary-foreground, accent, accent-foreground. Both light and dark variants.

**Free (3):**
- `default` — current warm white / dark gray
- `slate` — cool gray tones
- `stone` — warm neutral tones

**Pro (7):**
- `midnight` — deep navy/dark blue
- `ocean` — teal/cyan
- `sunset` — warm orange/amber
- `forest` — deep green
- `rose` — soft pink
- `lavender` — purple/violet
- `noir` — pure black/white high contrast

### Theme Settings UI

A new button in the action bar (4th button, `Palette` icon) opens a sheet/modal:
- Grid of theme preset swatches (3x3 or similar)
- Pro themes show a small lock icon overlay for free users
- Below the grid: accent color picker (hex input + color picker). Locked for free users.
- Dark mode toggle switch. Locked for free users.
- Changes preview live on the profile behind the sheet
- Save on close via `updateProfileLink` mutation (new fields: theme, accentColor, darkMode)

### Dark Mode

- Per-profile setting, not per-visitor
- Owner toggles it in theme settings
- Applied by adding `.dark` class to the `ThemeWrapper` div (scoped, not global)
- Each preset has light + dark color variants
- Free users see the toggle but it's disabled with pro upsell

---

## Group 3: Custom Bio Styling

### New Tiptap Extensions

Added to the existing editor in `header.tsx`:

| Extension | What it does | Gating |
|-----------|-------------|--------|
| `Link` | Clickable links in bio | Pro |
| `Underline` | Underline text | Pro |
| `TextStyle` + `Color` | Text color picker | Pro |
| `Highlight` | Background highlight | Pro |

### Toolbar

A mini toolbar appears above the bio editor when focused (edit mode only):

**Free buttons (always active):** Bold, Italic, Heading (H2), BulletList

**Pro buttons (visible but locked for free):** Link, Underline, Color picker, Highlight. Each shows a small lock icon. Clicking triggers the pro upsell toast.

**Toolbar style:** Small pill-shaped bar with icon buttons, matches the design language (rounded, border-border/50, bg-card).

### Storage

No changes — bio is already stored as HTML. Richer tiptap extensions produce richer HTML that renders correctly with the existing prose styling.

---

## Group 4: Verified Badge

### Logic

No DB changes. `isPremium` is already computed in the `getByLink` tRPC response. The badge renders when `isPremium === true`.

### Display

A small filled-circle checkmark (16-20px) next to the profile name on:
- **Public profile page** — next to the name in the header
- **Dashboard link cards** — next to the link name

### Design

- Filled circle with white checkmark inside
- Uses the profile's accent/primary color as the fill
- Tooltip on hover: "Verified Pro member"
- Lucide `BadgeCheck` icon or custom SVG

---

## Action Bar Summary

The 4 buttons in the action bar become:

| Position | Icon | Action | Gating |
|----------|------|--------|--------|
| 1 | `Link` | Create link card | Free |
| 2 | `Type` | Create note card | Free |
| 3 | `ImagePlus` | Create image card | Free (1), Pro (unlimited) |
| 4 | `Palette` | Open theme settings | Free (basic), Pro (all) |

---

## What's NOT in Scope

- Video cards (AssetBentoSchema supports `type: 'video'` but not building UI for it now)
- Visitor dark mode toggle (owner controls, visitors see owner's choice)
- Custom fonts (sticking with Inter + Cal Sans)
- Profile background images/gradients (just solid colors from themes)
- Admin verification flow (badge is purely Pro-based)
