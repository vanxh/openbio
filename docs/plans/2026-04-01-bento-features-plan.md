# Bento Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add note cards, image cards, theme system with dark mode, custom bio styling, and verified badge to OpenBio.

**Architecture:** 4 groups shipped sequentially. Group 1 adds new card types (note + image) with their own components, upload route, and action bar buttons. Group 2 adds theme/dark mode as new DB columns on the `link` table with a theme settings modal and CSS variable injection. Group 3 extends the tiptap editor with pro-gated extensions. Group 4 adds the verified badge derived from `isPremium`.

**Tech Stack:** Next.js 15 (App Router), Drizzle ORM (Neon Postgres), tRPC 11, Tailwind CSS 4 (OKLCH), Tiptap, Vercel Blob, react-grid-layout, react-dropzone

**Spec:** `docs/specs/2026-04-01-bento-features-design.md`

---

## File Structure

### New files
- `src/components/bento/note.tsx` — Note card component with inline tiptap editor
- `src/components/bento/image.tsx` — Image card component with dropzone upload
- `src/app/api/upload/bento-image/route.ts` — Bento image upload API route
- `src/lib/themes.ts` — Theme preset definitions (10 themes, OKLCH colors)
- `src/app/[link]/_components/theme-wrapper.tsx` — CSS variable injector for profile themes
- `src/components/modals/theme-settings.tsx` — Theme/dark mode/accent color settings modal
- `src/app/[link]/_components/bio-toolbar.tsx` — Tiptap formatting toolbar with pro gates
- `src/components/verified-badge.tsx` — Pro verified badge with tooltip

### Modified files
- `src/components/bento/card.tsx` — Add note + image card dispatch
- `src/app/[link]/_components/action-bar.tsx` — Replace disabled buttons with note/image/theme actions
- `src/server/db/schema/link.ts` — Add theme, accentColor, darkMode columns
- `src/types.ts` — Relax AssetBentoSchema url validation
- `src/server/api/schemas/profile-link.ts` — Add theme fields to UpdateLinkSchema
- `src/server/db/utils/link.ts` — Add theme fields to updateProfileLink type
- `src/app/[link]/page.tsx` — Wrap content with ThemeWrapper
- `src/app/[link]/_components/header.tsx` — Add bio toolbar + verified badge
- `src/lib/stripe/plans.ts` — Update feature lists

---

## Group 1: Note Cards + Image Cards

### Task 1: Note Card Component

**Files:**
- Create: `src/components/bento/note.tsx`
- Modify: `src/components/bento/card.tsx`

- [ ] **Step 1: Create NoteCard component**

Create `src/components/bento/note.tsx` — a card that renders an inline tiptap editor in edit mode and sanitized HTML in view mode. Uses StarterKit + Placeholder extensions. Saves on blur via `updateBento` mutation. Supports 3 sizes: 2x2, 4x1, 4x2. The view mode renders HTML using tiptap's read-only editor (not dangerouslySetInnerHTML) to avoid XSS. The component follows the same pattern as LinkCard: wraps content in a div with the standard card classes, renders `CardOverlay` with `allowedSizes={NOTE_CARD_SIZES}` in edit mode.

Key details:
- Export `NOTE_CARD_SIZES = ['2x2', '4x1', '4x2'] as const`
- In edit mode: `useEditor` with `editable: true`, `onBlur` saves HTML via `updateBento`
- In view mode: `useEditor` with `editable: false`, content from `bento.text`
- Banner (4x1): `px-4 py-2` padding, compact. Default: `p-5` padding.
- Prose classes: `prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-p:text-xs prose-headings:text-sm prose-headings:font-cal`

- [ ] **Step 2: Update card.tsx to dispatch note cards**

In `src/components/bento/card.tsx`, import `NoteCard` and add:
```tsx
if (bento.type === 'note') {
  return <NoteCard bento={bento} editable={editable} />;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `bun run typecheck 2>&1 | grep "bento/note"` — should show no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/bento/note.tsx src/components/bento/card.tsx
git commit -m "feat: add note card component with inline tiptap editor"
```

---

### Task 2: Image Card Component

**Files:**
- Create: `src/components/bento/image.tsx`
- Modify: `src/components/bento/card.tsx`

- [ ] **Step 1: Create ImageCard component**

Create `src/components/bento/image.tsx`. Key behavior:
- Export `IMAGE_CARD_SIZES = ['2x2', '4x1', '4x2', '2x4', '4x4'] as const`
- When `bento.url` is empty and `editable`: show a dropzone (react-dropzone) with `ImagePlus` icon and "Drop image here" text, dashed border
- When `bento.url` is set: render `<Image>` with `fill` and `object-cover`. If `bento.caption` exists and not banner size, overlay caption at bottom with `bg-gradient-to-t from-black/60` scrim
- Upload flow on drop: POST to `/api/upload/bento-image` with FormData containing the file. On success, set local `imgUrl` state and call `updateBento` mutation with new url. Show `opacity-50` during upload.
- In edit mode with existing image: clicking image triggers re-upload (spread `getRootProps()` on the image container)
- `CardOverlay` with `allowedSizes={IMAGE_CARD_SIZES}`

- [ ] **Step 2: Update card.tsx to dispatch image cards**

Add import and dispatch for `bento.type === 'image'` → `<ImageCard>`. Remove the `return <div>TODO</div>` fallback, replace with `return null`.

- [ ] **Step 3: Commit**

```bash
git add src/components/bento/image.tsx src/components/bento/card.tsx
git commit -m "feat: add image card component with dropzone upload"
```

---

### Task 3: Bento Image Upload Route

**Files:**
- Create: `src/app/api/upload/bento-image/route.ts`

- [ ] **Step 1: Create the upload route**

Create `src/app/api/upload/bento-image/route.ts`:
- Auth check via `auth.api.getSession({ headers: request.headers })`
- Extract `file` from FormData
- Upload to Vercel Blob at path `bento-images/${session.user.id}/${crypto.randomUUID()}-${file.name}` with `access: 'public'`
- Return `{ url: blob.url }`
- No need to update DB directly — the client calls `updateBento` mutation after getting the URL

- [ ] **Step 2: Commit**

```bash
git add src/app/api/upload/bento-image/route.ts
git commit -m "feat: add bento image upload API route"
```

---

### Task 4: Fix AssetBentoSchema + Action Bar

**Files:**
- Modify: `src/types.ts`
- Modify: `src/app/[link]/_components/action-bar.tsx`

- [ ] **Step 1: Relax URL validation in AssetBentoSchema**

In `src/types.ts` line 51, change `url: z.string().url()` to `url: z.string()` to allow empty strings for the initial image card state before upload.

- [ ] **Step 2: Rewrite action bar with note, image, and theme buttons**

Replace `src/app/[link]/_components/action-bar.tsx`:
- Import `Link, Type, ImagePlus, Palette` from lucide-react
- Import `CreateLinkBentoModal`, `api` from trpc/react, `useParams`, `useRouter`
- Use `api.profileLink.createBento.useMutation` for note/image creation
- Button 1: `<CreateLinkBentoModal>` wrapping Link icon button (existing)
- Button 2: Type icon → `createBento({ link, bento: { id: crypto.randomUUID(), type: 'note', text: '' } })`
- Button 3: ImagePlus icon → `createBento({ link, bento: { id: crypto.randomUUID(), type: 'image', url: '' } })`
- Button 4: Palette icon → disabled for now (wired up in Task 10)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/app/[link]/_components/action-bar.tsx
git commit -m "feat: add note and image card buttons to action bar"
```

---

## Group 2: Theme System + Dark Mode

### Task 5: Database Schema — Theme Fields

**Files:**
- Modify: `src/server/db/schema/link.ts`

- [ ] **Step 1: Add theme columns to link table**

In `src/server/db/schema/link.ts`:
- Add `boolean` to the import from `drizzle-orm/pg-core`
- Add 3 columns after `bento` and before `createdAt`:
  - `theme: text('theme').default('default').notNull()`
  - `accentColor: text('accent_color')`
  - `darkMode: boolean('dark_mode').default(false).notNull()`

- [ ] **Step 2: Generate and push migration**

```bash
bun run db:generate
bun run db:push
```

- [ ] **Step 3: Commit**

```bash
git add src/server/db/schema/link.ts drizzle/
git commit -m "feat: add theme, accentColor, darkMode columns to link table"
```

---

### Task 6: Theme Presets Definition

**Files:**
- Create: `src/lib/themes.ts`

- [ ] **Step 1: Create theme presets**

Create `src/lib/themes.ts` with:
- `ThemePreset` type: `{ name, label, pro, colors: { light: Record<string,string>, dark: Record<string,string> } }`
- `THEME_PRESETS` array with 10 presets. Each defines CSS variable values in OKLCH:
  - Free (3): `default` (warm white), `slate` (cool gray), `stone` (warm neutral)
  - Pro (7): `midnight` (navy), `ocean` (teal), `sunset` (amber), `forest` (green), `rose` (pink), `lavender` (purple), `noir` (black/white)
- Each preset has `light` and `dark` variants with keys: `--background`, `--foreground`, `--card`, `--card-foreground`, `--border`, `--muted`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`
- Export `getThemePreset(name: string): ThemePreset` that finds by name with fallback to `THEME_PRESETS[0]`

- [ ] **Step 2: Commit**

```bash
git add src/lib/themes.ts
git commit -m "feat: add 10 theme presets with light and dark OKLCH variants"
```

---

### Task 7: Theme Wrapper + Profile Page Integration

**Files:**
- Create: `src/app/[link]/_components/theme-wrapper.tsx`
- Modify: `src/app/[link]/page.tsx`

- [ ] **Step 1: Create ThemeWrapper**

Create `src/app/[link]/_components/theme-wrapper.tsx`:
- Client component that reads `profileLink.theme`, `profileLink.darkMode`, `profileLink.accentColor` from `api.profileLink.getByLink.useSuspenseQuery`
- Gets the preset via `getThemePreset(profileLink.theme)`
- Builds a `style` object from `isDark ? theme.colors.dark : theme.colors.light`
- If `accentColor` is set, overrides `--primary` and `--accent` in the style
- Renders `<div className={isDark ? "dark" : ""} style={style}>{children}</div>`

- [ ] **Step 2: Wrap profile page**

In `src/app/[link]/page.tsx`, import `ThemeWrapper` and wrap the returned JSX:
```tsx
<ThemeWrapper>
  <div className="h-full w-full max-w-3xl">...</div>
</ThemeWrapper>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[link]/_components/theme-wrapper.tsx src/app/[link]/page.tsx
git commit -m "feat: add theme wrapper to profile page for CSS variable injection"
```

---

### Task 8: tRPC Schema + DB Util for Theme Fields

**Files:**
- Modify: `src/server/api/schemas/profile-link.ts`
- Modify: `src/server/db/utils/link.ts`

- [ ] **Step 1: Add theme fields to UpdateLinkSchema**

In `src/server/api/schemas/profile-link.ts`, add to `UpdateLinkSchema`:
```ts
theme: z.string().optional(),
accentColor: z.string().nullable().optional(),
darkMode: z.boolean().optional(),
```

- [ ] **Step 2: Update updateProfileLink type**

In `src/server/db/utils/link.ts`, update the `updateProfileLink` function parameter type to include:
```ts
theme?: string;
accentColor?: string | null;
darkMode?: boolean;
```

The function body (`db.update(link).set(data)`) already handles extra fields.

- [ ] **Step 3: Commit**

```bash
git add src/server/api/schemas/profile-link.ts src/server/db/utils/link.ts
git commit -m "feat: add theme fields to profile link update schema and DB util"
```

---

### Task 9: Theme Settings Modal + Action Bar Wiring

**Files:**
- Create: `src/components/modals/theme-settings.tsx`
- Modify: `src/app/[link]/_components/action-bar.tsx`

- [ ] **Step 1: Create ThemeSettingsModal**

Create `src/components/modals/theme-settings.tsx`:
- Uses `Sheet` (shadcn) as the container
- Props: `children` (trigger), `isPremium` (boolean)
- Reads current profileLink via `useSuspenseQuery`
- Local state for `theme`, `darkMode`, `accentColor`
- Theme picker: grid of preset swatches (3 columns). Each shows two color circles (primary + background). Active preset has `border-primary`. Locked presets (`preset.pro && !isPremium`) show a Lock icon and trigger a pro upsell toast on click.
- Dark mode: `Switch` component, disabled for non-pro. Lock icon next to label.
- Accent color: `<input type="color">` + hex text input. Disabled for non-pro. "Clear" button to reset.
- Save button: calls `updateLink` mutation with `{ id, theme, darkMode, accentColor }`
- Pro upsell: `toast({ title: "Pro feature", description: "Upgrade to Pro to unlock this feature." })`

- [ ] **Step 2: Wire Palette button in action bar**

In `src/app/[link]/_components/action-bar.tsx`:
- Import `ThemeSettingsModal`
- Add `useSuspenseQuery` for profileLink to get `isPremium`
- Replace disabled Palette button with `<ThemeSettingsModal isPremium={!!profileLink?.isPremium}>` wrapping the Palette button

- [ ] **Step 3: Commit**

```bash
git add src/components/modals/theme-settings.tsx src/app/[link]/_components/action-bar.tsx
git commit -m "feat: add theme settings modal with preset picker, dark mode, accent color"
```

---

## Group 3: Custom Bio Styling

### Task 10: Pro Tiptap Extensions + Toolbar

**Files:**
- Create: `src/app/[link]/_components/bio-toolbar.tsx`
- Modify: `src/app/[link]/_components/header.tsx`

- [ ] **Step 1: Install tiptap extensions**

```bash
bun add @tiptap/extension-link @tiptap/extension-underline @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-highlight
```

- [ ] **Step 2: Create BioToolbar component**

Create `src/app/[link]/_components/bio-toolbar.tsx`:
- Props: `editor: Editor`, `isPremium: boolean`
- Small pill-shaped bar with icon buttons
- Free buttons (always active): Bold, Italic, Heading2, BulletList — call `editor.chain().focus().toggle*().run()`
- Pro buttons (visible but locked for free): Underline, Link, Highlight, Color (Palette icon)
  - Each shows a `Lock` icon overlay when `!isPremium`
  - Clicking triggers a `proGuard` function that shows upsell toast for non-pro, otherwise runs the editor command
  - Link: `window.prompt("Enter URL:")` then `editor.chain().focus().setLink({ href: url }).run()`
  - Color: `window.prompt("Enter color hex:")` then `editor.chain().focus().setColor(color).run()`
- Visual separator (`div` with `h-4 w-px bg-border`) between free and pro sections

- [ ] **Step 3: Update header.tsx**

In `src/app/[link]/_components/header.tsx`:
- Import the 5 new tiptap extensions + BioToolbar
- Add extensions to the array: `TiptapLink.configure({ openOnClick: false })`, `TiptapUnderline`, `TextStyle`, `Color`, `Highlight.configure({ multicolor: true })`
- Render `<BioToolbar>` above `<EditorContent>` only when `profileLink.isOwner && editor`

- [ ] **Step 4: Commit**

```bash
git add src/app/[link]/_components/bio-toolbar.tsx src/app/[link]/_components/header.tsx
git commit -m "feat: add pro-gated bio styling toolbar"
```

---

## Group 4: Verified Badge

### Task 11: Verified Badge Component + Header Integration

**Files:**
- Create: `src/components/verified-badge.tsx`
- Modify: `src/app/[link]/_components/header.tsx`

- [ ] **Step 1: Create VerifiedBadge**

Create `src/components/verified-badge.tsx`:
- Uses `Tooltip` from shadcn + `BadgeCheck` from lucide-react
- Renders `BadgeCheck` with `fill-primary text-primary-foreground` at `h-5 w-5`
- Tooltip: "Verified Pro member"

- [ ] **Step 2: Add badge to profile header**

In `src/app/[link]/_components/header.tsx`:
- Import `VerifiedBadge`
- Wrap the name `<input>` in a `<div className="flex items-center gap-x-2">`
- After the input, render `{profileLink.isPremium && <VerifiedBadge />}`

- [ ] **Step 3: Commit**

```bash
git add src/components/verified-badge.tsx src/app/[link]/_components/header.tsx
git commit -m "feat: add verified badge for pro members"
```

---

### Task 12: Update Pricing Plans + Final Cleanup

**Files:**
- Modify: `src/lib/stripe/plans.ts`

- [ ] **Step 1: Update plan features**

In `src/lib/stripe/plans.ts`, update the Free plan features:
```ts
features: [
  { text: "1 link" },
  { text: "Link, note & image cards" },
  { text: "3 basic themes" },
  { text: "Analytics" },
  { text: "Dark mode", notAvailable: true },
  { text: "Advanced bio styling", notAvailable: true },
  { text: "All themes + custom accent", notAvailable: true },
  { text: "Verified badge", notAvailable: true },
],
```

Update the Pro plan features:
```ts
features: [
  { text: "Unlimited links" },
  { text: "All card types" },
  { text: "All 10 themes + custom accent" },
  { text: "Dark mode" },
  { text: "Advanced bio styling" },
  { text: "Verified badge" },
  { text: "Advanced analytics" },
  { text: "Priority support" },
],
```

- [ ] **Step 2: Run lint fix**

```bash
npx biome check --fix --unsafe
```

- [ ] **Step 3: Verify typecheck**

```bash
bun run typecheck 2>&1 | grep -E "bento|theme|bio-toolbar|verified|action-bar|upload" | head -20
```

- [ ] **Step 4: Final commit**

```bash
git add -u
git commit -m "feat: update pricing plans and fix lint for new features"
```
