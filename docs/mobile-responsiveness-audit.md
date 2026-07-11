# Steadfast — Mobile Responsiveness Audit

> **Audited**: 2026-07-10
> **Remediated**: 2026-07-11 (see Resolution Log below)
> **Scope**: Every page, layout, and shared component in the web app
> **Focus**: Mobile screens (320px–428px), touch targets, overflow, bottom nav conflicts, theme consistency
> **Severity**: 🔴 Critical (broken/unusable) · 🟡 Moderate (poor UX) · 🟢 Minor (cosmetic)

---

## Resolution Log (2026-07-11)

All actionable findings were either fixed or determined stale. Status key:
**FIXED** = remediated 2026-07-11 · **STALE** = code was rewritten after the audit and the issue no longer exists · **DEFERRED** = intentionally not done (reason given).

### Systemic

| ID | Finding | Status |
|----|---------|--------|
| S1 | Light components in dark app | **FIXED** — `today-adherence`, `client-email-settings`, `intake-stepper`, `become-coach-form`, `saved-coaches`, `intake/page`, `coach/[id]/review/page`, `testimonial-form`, `connect-coach-banner` all converted to dark theme |
| S2 | `min-h-screen` / `100vh` | **FIXED** — all replaced with `min-h-[100dvh]` (15+ files); modals `90vh` → `90dvh` |
| S3 | Touch targets < 44px | **FIXED** — delete check-in (44px), send button (44px), stars (44px), cancel request, sign-out ×2, landing nav, about CTA, check-in ratings (`min-h-[48px]`) |
| S4 | Empty state padding | **FIXED** — `px-5 py-14` mobile / original padding restored at `sm:` (meal-plan, training, plan, messages, saved-coaches, coach dashboard, leads) |
| S5 | Coach pages missing bottom-nav padding | **STALE** — `app/coach/layout.tsx` already had `pb-24 sm:pb-8`, identical to client layout |

### Notable page/component items

| Finding | Status |
|---------|--------|
| Messages page missing `-mb-24` | **FIXED** |
| Hardcoded 56px nav height in `calc()` | **FIXED** — extracted to `--nav-height` CSS var (globals.css), used by landing hero + all 3 message views |
| Coach client detail (header stack / tab overflow / action wrap) | Mostly **STALE** (page was rebuilt); back button 32→44px, name/badge wrap, email `break-all`, intake banner wrap **FIXED** |
| Coach dashboard badge overflow | **STALE** — inbox cards rebuilt with `min-w-0` + `shrink-0`; filter bar has `overflow-x-auto` + 44px targets |
| Marketplace profile stacking / portfolio grid | **STALE** — page rebuilt mobile-first |
| Template/workout/meal-plan table editors | **STALE** — no `<table>` editors exist; all card-based now |
| Leads kanban scroll indicator | **STALE** — leads page is now vertical stacked pipeline groups |
| `recent-check-ins` backwards max-width | **FIXED** — `max-w-[180px] sm:max-w-[280px]` |
| Profile modal `90vh` + missing safe area | **FIXED** — `90dvh` + real `env(safe-area-inset-bottom)` (the `pb-safe` class was an undefined no-op) |
| Footer hidden behind bottom nav | **FIXED** — `pb-16 sm:pb-0` |
| Cert truncation `max-w-[140px]` on mobile | **FIXED** — `max-w-[60%] lg:max-w-[140px]` |
| Testimonial photo-remove hover-only button | **FIXED** — always visible on touch, hover-reveal kept on `sm:`+ |
| Coach review comparison photos | **STALE** — lightbox grid is `grid-cols-2 sm:grid-cols-3` with 44px controls |
| Sign-in/up left panel `text-gray-900` fragility | **DEFERRED** — works via CSS override; cosmetic risk only |
| Glassmorphism performance review | **DEFERRED** — needs device testing, not a code fix |
| Charts axis/tooltip overflow | **DEFERRED** — uses `ResponsiveContainer`; revisit only if real overlap observed |

### Related fixes beyond the audit (2026-07-11)

- `<a>` → `<Link>` for internal nav in `leads-page-header.tsx` and `leads/[requestId]/error.tsx` (full page reloads → client transitions)
- `signature-page.tsx`: `hasDrawnRef` read during render → converted to state (submit button previously could stay disabled after drawing a signature)
- `review-session.tsx`: setState-in-effect for missing-fields banner → render-time derivation
- Coach-side legacy light-theme sweep (see git history for file list)

---

## Original Audit (2026-07-10)

### Issue Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 11 |
| 🟡 Moderate | 38 |
| 🟢 Minor | 18 |

> [!NOTE]
> The codebase demonstrates strong mobile-first practices overall — consistent `px-5 sm:px-8` padding, proper `flex-col sm:flex-row` patterns, iOS-safe input font sizing, safe-area-inset handling, and `prefers-reduced-motion` support. The most impactful category of issues is **theme mismatch** — several client-side components use light-mode colors (`bg-white`, `text-zinc-900`) while being rendered inside a dark-themed layout.

### Systemic Issues (App-Wide)

**🔴 S1 — Theme Mismatch: Light Components in Dark App.** Components using `bg-white`, `text-zinc-900`, `border-zinc-200` rendered inside the dark client layout: `components/client/today-adherence.tsx`, `components/client/client-email-settings.tsx`, `components/client/intake/intake-stepper.tsx`, `app/client/intake/page.tsx`, `app/client/coach/[coachId]/review/page.tsx`, `app/client/saved-coaches/page.tsx`, `components/client/become-coach-form.tsx`, `components/client/testimonial-form.tsx`, `components/client/connect-coach-banner.tsx`.

**🟡 S2 — `min-h-screen` / `100vh` on mobile browsers.** `100vh` includes the area behind the browser chrome on iOS Safari / Android Chrome. Fix: `min-h-[100dvh]`. Affected: root layout, sign-in/up, invite, account-deletion-pending, client/coach layouts, onboarding, coaches marketplace, landing hero.

**🟡 S3 — Touch targets below 44×44px.** Delete check-in (32px), message send (40px), star ratings (~34px), cancel request / sign-out (`px-3 py-1.5 text-xs`), landing nav buttons (~32px).

**🟡 S4 — Empty-state padding.** `px-8 py-20` / `p-12` leaves ~279px usable width on 375px screens. Affected: meal-plan, training, plan, messages, saved-coaches (+ coach dashboard, leads).

**🟡 S5 — Coach-side bottom nav padding.** *(Found stale — layout already had `pb-24`.)*

### Page-level findings (abridged)

- **Landing (`app/page.tsx`)**: hero `calc(100vh-56px)` → dvh; nav buttons small. Strong: responsive text scale, `w-full sm:w-auto` CTAs.
- **Coach marketplace (`app/coaches/page.tsx`)**: 3-col stat grid with `text-[9px]` labels tight on 320px (open). Strong: mobile filter block, `truncate`/`line-clamp-2`, `flex-wrap` tags.
- **Coach profile (`app/coaches/[slug]/page.tsx`)**: cert truncation `max-w-[140px]` too aggressive when sidebar stacks. Strong: mobile sticky CTA bar.
- **Sign-in/up**: `min-h-screen`; left panel `text-gray-900` on dark gradient relies on CSS override.
- **Client messages (`app/client/messages/page.tsx`)**: missing `-mb-24` compensation (critical); hardcoded 56px nav height; fragile negative-margin breakout.
- **Client profile**: sign-out button small.
- **Saved coaches / intake / coach review pages**: light-on-dark text (critical).
- **Client components**: `today-adherence` fully light-themed (critical); `intake-stepper` light + iOS zoom risk; `client-profile-form` modal `90vh` + no safe area; `recent-check-ins` backwards max-width; `testimonial-form` small stars; `simple-meal-plan` 4-col macro grid tight (open); `photo-upload` 3-col grid small thumbs (open).
- **Coach pages** *(audit noted line refs were approximate — most findings proved stale after the UI revamp)*: dashboard badge overflow, client-detail header stacking/tab overflow, marketplace profile stacking, template table editors, leads kanban, missing bottom padding.
- **Shared**: `mobile-bottom-nav` and `nav-bar` excellent; footer hidden behind bottom nav; `globals.css` has strong iOS-zoom/touch/reduced-motion practices; mobile `font-size: 112.5%` bump affects hardcoded px values (informational).
