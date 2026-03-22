# Steadfast Design System — MASTER REFERENCE

> **Always read this document before making any UI changes.**
> This is the single source of truth for all visual and interaction design decisions.

---

## 1. Core Principles

- **Permanent dark mode only.** The `<html>` element always carries `class="dark"`. Never add light-mode conditionals, `dark:` variant overrides intended to toggle back to light, or `prefers-color-scheme` media queries for light themes.
- **Mobile-first.** All layouts start at 375px and scale up. Desktop enhancements are progressive.
- **No emojis in production UI.** Icons only (Lucide or inline SVG). Emojis are reserved for user-generated content.
- **Accessibility first.** Every interactive element must have an explicit label, appropriate ARIA attributes, and a visible `focus-visible` ring.

---

## 2. Typography

| Role | Font Family | Tailwind Class |
|------|-------------|----------------|
| Body / UI text | Sora | `font-sans` (mapped to Sora) |
| Headings / Display | Chakra Petch | `font-heading` (custom utility) |
| Code / Monospace | Geist Mono | `font-mono` |

### Scale

```
text-xs   — 0.75rem  — minimum for labels, captions, metadata
text-sm   — 0.875rem — secondary body, table cells
text-base — 1rem     — default body
text-lg   — 1.125rem — card titles, section headers
text-xl   — 1.25rem  — page sub-titles
text-2xl  — 1.5rem   — page titles (mobile)
text-3xl  — 1.875rem — page titles (desktop)
text-4xl+ — display  — hero / onboarding splash
```

### Base font size

- Mobile (≤640px): `112.5%` on `<html>` (18px equivalent base) — set via CSS, not Tailwind
- Desktop: `100%` (16px base)

### Input font size rule

All `<input>`, `<textarea>`, and `<select>` elements must use:

```css
font-size: max(1rem, 16px);
```

This prevents iOS Safari from zooming on focus. Apply via Tailwind `text-base` plus explicit CSS override in global styles if needed.

---

## 3. Color Palette

All colors reference Tailwind's generated CSS variables or hardcoded hex where noted.

### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-[#0a0f1e]` | `#0a0f1e` | Page/root background — deepest navy |
| `bg-[#0a1224]` | `#0a1224` | Card/surface background |
| `bg-zinc-900` | — | Elevated surface (modals, dropdowns) |
| `bg-zinc-800` | — | Input backgrounds, hover states |
| `bg-zinc-700/50` | — | Subtle hover on list items |

### Text

| Token | Usage |
|-------|-------|
| `text-white` | Primary headings, high-emphasis labels |
| `text-zinc-100` | Primary body text |
| `text-zinc-300` | Secondary text, descriptions |
| `text-zinc-400` | Tertiary, placeholders, metadata |
| `text-zinc-500` | Disabled text |

### Interactive / Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-blue-600` / `text-blue-600` | — | Primary CTA buttons, active state accents |
| `hover:bg-blue-700` | — | Primary button hover |
| `ring-blue-500` | — | Focus rings on primary controls |

### Semantic

| State | Background | Text / Border |
|-------|-----------|---------------|
| Success | `bg-emerald-500/10` | `text-emerald-400` / `border-emerald-500/30` |
| Warning | `bg-amber-500/10` | `text-amber-400` / `border-amber-500/30` |
| Error | `bg-red-500/10` | `text-red-400` / `border-red-500/30` |
| Info | `bg-blue-500/10` | `text-blue-400` / `border-blue-500/30` |

### Borders / Dividers

```
border-white/[0.06]   — subtle card/section dividers (default)
border-white/[0.12]   — emphasized dividers, active card outlines
border-zinc-700       — input borders
border-zinc-600       — input focus borders
```

---

## 4. Spacing

Follow Tailwind's default spacing scale. Key conventions:

- **Page padding:** `px-4` mobile → `px-6` sm → `px-8` lg
- **Section gap:** `gap-6` between major sections, `gap-4` within cards
- **Card padding:** `p-5` mobile → `p-6` desktop
- **Form field gap:** `gap-4` between fields, `gap-1.5` between label and input

---

## 5. Component Patterns

### Cards

```
rounded-2xl bg-[#0a1224] border border-white/[0.06] p-5
```

Optional hover state for interactive cards:
```
hover:border-white/[0.12] transition-colors
```

### Buttons

Minimum height: **48px** (`min-h-12` or `h-12`). All buttons: `rounded-xl font-semibold`.

| Variant | Classes |
|---------|---------|
| Primary | `bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 rounded-xl font-semibold transition-colors` |
| Secondary | `bg-zinc-800 hover:bg-zinc-700 text-zinc-100 h-12 px-6 rounded-xl font-semibold transition-colors` |
| Ghost | `hover:bg-zinc-800 text-zinc-300 h-12 px-4 rounded-xl font-medium transition-colors` |
| Danger | `bg-red-600 hover:bg-red-700 text-white h-12 px-6 rounded-xl font-semibold transition-colors` |
| Outline | `border border-white/[0.12] hover:bg-zinc-800 text-zinc-100 h-12 px-6 rounded-xl font-semibold transition-colors` |

All buttons must include:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]
```

### Inputs / Textareas / Selects

```
bg-zinc-800 border border-zinc-700 focus:border-zinc-600 rounded-xl px-4 h-12
text-zinc-100 placeholder:text-zinc-500
focus:outline-none focus:ring-2 focus:ring-blue-500/30
transition-colors w-full
[font-size:max(1rem,16px)]
```

Labels: `text-sm font-medium text-zinc-300 mb-1.5 block` (minimum `text-xs`)

### Badges / Status Pills

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
```

Use semantic color tokens (emerald/amber/red/blue) from Section 3.

### Dividers

```html
<hr class="border-white/[0.06]" />
```

### Empty States

Structure:
```html
<div class="flex flex-col items-center justify-center py-16 text-center gap-3">
  <!-- Icon: 40px, text-zinc-600 -->
  <p class="text-zinc-400 text-sm max-w-xs">Descriptive message</p>
  <!-- Optional primary CTA button -->
</div>
```

### Focus Rings (global rule)

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
```

Never use `:focus` alone — always `focus-visible` to avoid showing rings on click.

---

## 6. Tap Targets

Every interactive element (buttons, links, icon buttons, checkboxes, radio inputs) must have a minimum **48×48px** touch target. For visually smaller elements, use padding or a wrapper:

```html
<button class="p-3">  <!-- 24px icon + 12px padding each side = 48px -->
  <SomeIcon class="w-6 h-6" />
</button>
```

---

## 7. Motion / Animation

Keep animations subtle and purposeful. Use Tailwind's `transition-colors`, `transition-opacity`, `transition-transform` with default duration (150ms). For page transitions and mounting, use `duration-200`. Avoid `animate-spin` except for explicit loading states.

Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

---

## 8. Icons

Use Lucide React icons. Standard sizes:

| Context | Size | Class |
|---------|------|-------|
| Inline text icon | 16px | `w-4 h-4` |
| Button icon | 20px | `w-5 h-5` |
| Card / section header | 24px | `w-6 h-6` |
| Empty state illustration | 40px | `w-10 h-10` |
| Hero / splash | 48–64px | `w-12 h-12` to `w-16 h-16` |

All icons: `aria-hidden="true"` when decorative. Provide `<span class="sr-only">` label when icon is the sole content of an interactive element.

---

## 9. Accessibility Checklist (applies globally)

- [ ] Every `<input>` has an associated `<label>` (via `htmlFor`) or `aria-label`
- [ ] Every icon-only button has `aria-label`
- [ ] Color is never the sole differentiator — use icons or text alongside
- [ ] Focus order follows visual reading order
- [ ] Loading states announce to screen readers via `aria-live="polite"` or `aria-busy`
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Modal/dialog traps focus, closes on Escape, restores focus on close
- [ ] Contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text

---

## 10. Page-Specific Overrides

---

### 10.1 `/coach/leads` — Pipeline Lead List

**Layout:** Single column, full-width list. No sidebar on mobile. Optional sidebar filter panel at `md:` breakpoint.

**Structure:**
```
Page header (title + "New Lead" CTA)
Filter / sort bar
Lead list (vertical stack of cards)
```

**Primary CTA:** "Add Lead" or "New Lead" — top-right of page header. `bg-blue-600` button, `h-12`, fixed position on mobile (bottom-right FAB pattern optional).

**Lead cards:** `rounded-2xl bg-[#0a1224] border border-white/[0.06] p-5` with:
- Client name (`text-white font-semibold text-lg`)
- Pipeline stage badge (semantic color pill)
- Last activity timestamp (`text-zinc-400 text-xs`)
- Quick-action row (icon buttons, 48px tap targets)

**Pipeline stage colors:**
| Stage | Badge color |
|-------|-------------|
| New inquiry | `text-blue-400 bg-blue-500/10 border-blue-500/30` |
| Intake sent | `text-amber-400 bg-amber-500/10 border-amber-500/30` |
| Intake complete | `text-emerald-400 bg-emerald-500/10 border-emerald-500/30` |
| Proposal sent | `text-purple-400 bg-purple-500/10 border-purple-500/30` |
| Active client | `text-emerald-400 bg-emerald-500/10 border-emerald-500/30` |
| Declined | `text-zinc-400 bg-zinc-500/10 border-zinc-500/30` |

**Empty state:** Icon (UserSearch, 40px, `text-zinc-600`), "No leads yet", sub-text "Add your first lead to get started", primary CTA button.

**Mobile:** Full-width cards, no horizontal scroll. Filter bar collapses to a single "Filter" button that opens a bottom sheet.

**Accessibility:** Card links use `<a>` wrapping the card or `role="link"` with keyboard handler. Stage filters use `role="group"` + `aria-label="Filter by stage"`.

---

### 10.2 `/coach/leads/[requestId]` — Lead Detail + Pipeline Bar

**Layout:** Single column on mobile, `lg:grid lg:grid-cols-[1fr_320px]` on desktop (main content + sticky sidebar).

**Pipeline bar:** Horizontal step indicator at top of page (below page header). Steps are pill-shaped, connected by a line. Active step: `bg-blue-600 text-white`. Completed steps: `bg-emerald-500/20 text-emerald-400`. Future steps: `bg-zinc-800 text-zinc-500`.

**Primary CTA:** Context-dependent action button (e.g. "Send Intake", "Review Intake", "Convert to Client") — sticky at bottom on mobile (`fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 backdrop-blur`), inline in sidebar on desktop.

**Content sections (cards):**
1. Lead info (name, email, phone, source)
2. Notes / activity log
3. Intake status
4. Pipeline action

**Mobile:** Pipeline bar scrolls horizontally if too many steps (`overflow-x-auto scrollbar-none`). CTA is sticky bottom bar.

**Accessibility:** Pipeline steps use `role="list"` + `role="listitem"`. Active step: `aria-current="step"`. CTA button: descriptive `aria-label` reflecting current action.

---

### 10.3 `/onboarding/intake/[token]` — Prospect-Facing Conversational Intake

**Critical:** Public route — no authentication required. Must render correctly on any mobile browser.

**Layout:** Full-screen single column. No sidebar, no nav bar, minimal chrome. Center-aligned on desktop (`max-w-lg mx-auto px-4`).

**Visual style:** Slightly more elevated — `bg-[#0a0f1e]` page, cards use `bg-zinc-900` for a slightly lighter feel that still reads dark.

**Structure:**
```
Steadfast logo / wordmark (top, centered)
Progress indicator (step X of N, thin progress bar)
Question / form step (card)
Navigation buttons (Back / Continue)
```

**Progress bar:** `h-1 bg-zinc-800 rounded-full` track, `bg-blue-500` fill, `transition-all duration-300`.

**Conversational tone:** One question or concept per screen. Large question text (`text-2xl font-heading text-white`). Supporting text (`text-zinc-400 text-base`).

**Inputs:** Follow global input pattern. All text inputs and selects enforce `[font-size:max(1rem,16px)]` — critical on this page since it's used on mobile.

**Navigation buttons:** Back (`ghost` variant, left-aligned or icon-only) + Continue/Submit (`primary` variant, full-width `w-full` on mobile). Both `h-12`.

**Invalid token state:** Render a centered error card — `bg-zinc-900 border border-red-500/30 rounded-2xl p-8`. Heading "Invalid or expired link", description text, no retry action (contact coach). Not a crash — a graceful error.

**Empty state:** N/A — every step has content.

**Mobile-specific:**
- No viewport zoom — `meta viewport` includes `maximum-scale=1` (but do NOT disable user zoom entirely; use input font-size fix instead)
- Keyboard avoidance: avoid fixed footers that cover inputs on mobile keyboards; use `pb-safe` (`padding-bottom: env(safe-area-inset-bottom)`)
- Autofocus first input on each step

**Accessibility:** Progress bar uses `role="progressbar" aria-valuenow aria-valuemax`. Each step's question is an `<h1>`. Navigation buttons have descriptive labels. Form errors use `aria-describedby`.

---

### 10.4 `/coach/leads/[requestId]/review` — Coach Intake Review Document

**Layout:** Single column, document-style. `max-w-3xl mx-auto` with generous padding. Resembles a formatted document the coach can read top-to-bottom.

**Structure:**
```
Page header (client name, intake date, "Convert to Client" CTA)
Section: Personal Info
Section: Goals & Motivation
Section: Current Habits
Section: Health History
Section: Availability & Preferences
Section: Photos (if any)
Sticky footer: action bar (Accept / Request Changes / Decline)
```

**Section cards:** `rounded-2xl bg-[#0a1224] border border-white/[0.06] p-6 mb-4`

**Field rows:** Label (`text-xs text-zinc-500 uppercase tracking-wide mb-0.5`) + Value (`text-zinc-100 text-base`). Use `grid grid-cols-2 gap-4` for short fields, single column for long-form text.

**Primary CTA:** "Convert to Client" — `bg-blue-600`, placed top-right in page header AND in sticky bottom action bar on mobile.

**Action bar (mobile sticky):** `fixed bottom-0 left-0 right-0 bg-[#0a0f1e]/95 backdrop-blur border-t border-white/[0.06] p-4 flex gap-3`

**Empty state:** N/A — if no intake data, show "Intake not yet completed" message card.

**Mobile:** All sections stack vertically. Section headers collapse into `<details>` elements optionally for long intakes. Photos in a 2-column grid (`grid grid-cols-2 gap-2`).

**Accessibility:** Sections use `<section aria-labelledby>`. Each section heading is a distinct heading level. Print-friendly: the document should be readable when printed (CSS print media query optional).

---

### 10.5 `/coach/templates` — Templates Hub

**Layout:** Two-column tab layout on desktop (`lg:grid lg:grid-cols-[200px_1fr]` with a vertical nav + content area). Single column with horizontal tab bar on mobile.

**Tab categories:** Workout Templates, Meal Plan Templates, Onboarding Templates, Check-in Questionnaires.

**Template cards:** `rounded-2xl bg-[#0a1224] border border-white/[0.06] p-5` with:
- Template name (`text-white font-semibold`)
- Type badge
- Last modified date (`text-zinc-500 text-xs`)
- Quick actions: Edit, Duplicate, Delete (icon buttons, 48px)

**Primary CTA:** "New Template" button — top-right of content area header, `bg-blue-600`.

**Empty state (per category):** Icon (FileText, 40px), "No [category] templates yet", "Create your first template to get started", CTA button.

**Mobile:** Horizontal scrollable tab bar (`overflow-x-auto scrollbar-none flex gap-2 pb-2`). Cards full-width.

**Accessibility:** Tab bar uses `role="tablist"`, each tab `role="tab" aria-selected aria-controls`. Content panel `role="tabpanel" aria-labelledby`.

---

### 10.6 `/coach/settings` — Account Settings

**Layout:** Single column, `max-w-2xl mx-auto`. Vertically stacked setting sections.

**Structure:**
```
Page title: "Settings"
Section: Profile (name, photo, bio)
Section: Coaching Info (specialty, certifications)
Section: Notifications
Section: Billing / Subscription
Section: Danger Zone (delete account)
```

**Section cards:** Standard card pattern. Each section has a heading (`text-lg font-semibold font-heading text-white mb-4`) + content.

**Save button:** Per-section (not global). `bg-blue-600` primary, placed at bottom of each section card. On success: brief emerald success message inline.

**Danger Zone:** `border-red-500/30 bg-red-500/5` card. Destructive actions require confirmation dialog.

**Empty state:** N/A.

**Mobile:** Full-width inputs. Stacked labels above inputs (never side-by-side on mobile). Profile photo upload tap target ≥ 48px.

**Accessibility:** All form fields have explicit `<label>`. Settings sections use `<fieldset>` + `<legend>` where grouping radio/checkbox sets. Destructive dialogs use `role="alertdialog"`.

---

### 10.7 `/coach/dashboard` — Client Roster List

**Layout:** Single column. Page header with title + search + "Add Client" CTA. Roster as a list of cards (not a table on mobile).

**Structure:**
```
Page header
Search / filter bar
Client roster list
```

**Client cards:** `rounded-2xl bg-[#0a1224] border border-white/[0.06] p-5 flex items-center gap-4`
- Avatar (initials fallback, `w-12 h-12 rounded-full bg-zinc-700`)
- Client name + email
- Check-in status badge for current week
- "View" link (full card is clickable)

**Check-in status colors:** Submitted → emerald, Pending → amber, Overdue → red, No check-in → zinc.

**Primary CTA:** "Add Client" — `bg-blue-600`, top-right of page header.

**Empty state:** Icon (Users, 40px), "No clients yet", CTA.

**Mobile:** Cards full-width. Avatar left-aligned. Status badge below name. No horizontal overflow.

**Accessibility:** List uses `<ul role="list">`. Each card `<li>`. Clickable cards: entire `<a>` wraps content. Search input has `aria-label="Search clients"`.

---

### 10.8 `/client/dashboard` — Client-Facing Dashboard

**Layout:** Single column, `max-w-xl mx-auto`. Optimized for mobile — this is the primary client experience.

**Structure:**
```
Welcome header (Coach name, week label)
Check-in status card (CTA if not submitted)
Current meal plan card (SimpleMealPlan)
Progress card (recent metrics)
Messages card (unread count badge)
```

**Primary CTA:** "Submit Check-in" — when check-in is pending, this should be prominent. Full-width `bg-blue-600` button inside the check-in card, or a sticky floating bar if overdue.

**Tone:** Warm and encouraging — use larger text, softer hierarchy. `text-2xl font-heading` welcome message.

**Cards:** Standard card pattern. Spacing between cards: `gap-4`.

**Check-in card states:**
- Not submitted: `border-amber-500/30 bg-amber-500/5` — prominent CTA
- Submitted, awaiting review: `border-zinc-700` — neutral, confirmation message
- Reviewed: `border-emerald-500/30 bg-emerald-500/5` — success state with feedback link

**Empty states:**
- No meal plan: "Your coach hasn't set a meal plan yet. Check back soon." (no CTA for client)
- No messages: "No messages yet." (no CTA for client)

**Mobile:** This is the primary breakpoint. No horizontal scroll anywhere. Large tap targets on all actions. Bottom-of-screen-safe padding for iOS home indicator.

**Accessibility:** Welcome heading is `<h1>`. Cards use `<section aria-label>`. Unread message badge: `aria-label="X unread messages"`. Progress metrics include accessible labels, not just numbers.

---

## 11. Tailwind CSS v4 Notes

Use `@import "tailwindcss"` syntax (not `@tailwind base/components/utilities`). Custom utilities and CSS variables go in the same CSS file after the import:

```css
@import "tailwindcss";

:root {
  --font-sans: 'Sora', sans-serif;
  --font-heading: 'Chakra Petch', sans-serif;
  --font-mono: 'Geist Mono', monospace;
}

html {
  background-color: #0a0f1e;
  font-size: 100%;
}

@media (max-width: 640px) {
  html {
    font-size: 112.5%;
  }
}

input, textarea, select {
  font-size: max(1rem, 16px);
}
```

Custom font utilities:
```css
@utility font-heading {
  font-family: var(--font-heading);
}
```

---

## 12. Quick Reference Checklist

Before shipping any UI change:

- [ ] Dark mode only — no `light:` or `prefers-color-scheme: light` conditionals
- [ ] All inputs have `[font-size:max(1rem,16px)]`
- [ ] All interactive elements ≥ 48px tap target
- [ ] All text ≥ `text-xs` (0.75rem)
- [ ] No emojis in production UI
- [ ] Buttons have `focus-visible` ring classes
- [ ] Inputs have explicit `<label>` or `aria-label`
- [ ] Empty states present for all list/collection views
- [ ] Cards use `rounded-2xl bg-[#0a1224] border border-white/[0.06]`
- [ ] Primary CTAs use `bg-blue-600 hover:bg-blue-700`
- [ ] Border color for dividers: `border-white/[0.06]`
