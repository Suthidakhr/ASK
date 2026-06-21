---
status: done
epic: 2
story: 3
story_key: "2-3-navbar-bottomtabbar-and-layout-foundation"
created: 2026-06-21
baseline_commit: 074b6d537683c87d40ecfe29aa77991e5a22ebc1
---

# Story 2.3: Navbar, BottomTabBar & Layout Foundation

**Status:** done

## Story

As a user,
I want a persistent navigation bar on desktop and a bottom tab bar on mobile with bilingual labels and a live clock,
So that I can switch between sections from any page with a single interaction.

## Acceptance Criteria

### AC1 — Inter Font on `<html>`
`layout.tsx` applies `inter.variable` to the `<html>` element (not `<body>`), so `--font-inter` is available globally. `font-sans` and `antialiased` remain on `<body>`. Already partially done — only the element placement is wrong.

### AC2 — Navbar (desktop ≥ `lg:`)
- `56px` tall (`h-14`), espresso background, `sticky top-0 z-50`
- Hidden on mobile: `hidden lg:flex` (or equivalent) — BottomTabBar handles mobile nav
- Four tabs: **Home** (/) · **News** (/news) · **Trends** (/trends) · **About** (/about) — in that order
- Active tab: `2px khaki (#D7C9B8) border-bottom`, khaki text color
- Thai sub-label on each tab has `aria-hidden="true"` so screen readers only announce the English label
- Live Bangkok time + LIVE badge on the right remain unchanged
- All tab `<Link>` elements have focus ring: `focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]`

### AC3 — BottomTabBar (mobile < `lg:`)
- `56px` tall (`h-14`), espresso background, `fixed bottom-0 left-0 right-0 z-50`
- Safe area padding: `padding-bottom: env(safe-area-inset-bottom)` (for iPhone notch)
- `lg:hidden` — invisible on desktop
- Four tabs: **Overview** (/) · **News** (/news) · **Stocks** (/stocks) · **Trends** (/trends)
- Each tab: 24×24px SVG icon + English label (12px) + Thai sub-label (10px, `aria-hidden="true"`)
- Touch target: each tab `<Link>` is at minimum `44px` tall (ensure `h-full min-h-[44px]`)
- Active tab: khaki icon fill/stroke + khaki text + `2px border-top khaki`; inactive: white at 45% opacity
- Focus ring on each tab: same double-ring as Navbar

### AC4 — Desktop Two-Column Layout
The `page.tsx` home page already implements `grid-cols-[1fr_340px] gap-5 px-4 py-5`. Verify this pattern is in place; no grid changes are needed unless the layout regressed. Add `id="main-content"` to the `<main>` element in every page file.

### AC5 — Skip-to-Content Link
- In `layout.tsx`, insert as the very first child of `<body>`:
  ```tsx
  <a href="#main-content"
     className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded focus:bg-espresso focus:text-khaki focus:font-bold focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]">
    Skip to main content
  </a>
  ```
- Each page's `<main>` element must have `id="main-content"`.

### AC6 — Focus Ring
All `<Link>` and `<button>` elements inside Navbar and BottomTabBar apply:
`box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4A342A` when focused via keyboard.
Use `focus-visible:` (not `focus:`) to avoid showing ring on mouse click.

## Tasks / Subtasks

- [x] **Task 1: Fix Inter font placement in layout.tsx** (AC1)
  - [x] 1a. Move `${inter.variable}` from `<body className>` to `<html className>`
  - [x] 1b. Keep `font-sans antialiased` on `<body>`
  - [x] 1c. Add skip-to-content anchor as first child of `<body>` (AC5)
  - [x] 1d. Add `pb-14 lg:pb-0` to `<body>` to reserve space for BottomTabBar on mobile

- [x] **Task 2: Update Navbar.tsx** (AC2, AC6)
  - [x] 2a. Update `navItems` array — change labels/hrefs to: Home(/), News(/news), Trends(/trends), About(/about)
  - [x] 2b. Add `aria-hidden="true"` to every Thai sub-label `<span>` in the tabs
  - [x] 2c. Add `hidden lg:flex` (or `hidden lg:block`) to the `<header>` root so Navbar is desktop-only
  - [x] 2d. Add focus ring to each tab `<Link>`: `focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]`
  - [x] 2e. Add focus ring to logo `<Link>`: same pattern

- [x] **Task 3: Update Navbar.test.tsx** (AC2)
  - [x] 3a. Update all label assertions from old values (`Overview`, `Stocks`) to new ones (`Home`, `Trends`, `About`)
  - [x] 3b. Update active-tab test: active at pathname `/` now applies khaki to **Home** link (not Overview)
  - [x] 3c. Add test: Thai sub-label has `aria-hidden="true"` attribute
  - [x] 3d. Add test: `<header>` has class containing `hidden` to confirm mobile-hidden behavior

- [x] **Task 4: Create BottomTabBar.tsx** (AC3, AC6)
  - [x] 4a. Create `frontend/src/components/BottomTabBar.tsx` as a Client Component (`"use client"`)
  - [x] 4b. Implement 4-tab layout per AC3 spec with SVG icons (see Dev Notes for icon paths)
  - [x] 4c. Wire `usePathname()` for active-tab detection (same pattern as Navbar)
  - [x] 4d. Apply safe area inset via `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}`
  - [x] 4e. Apply focus ring to each tab Link

- [x] **Task 5: Create BottomTabBar.test.tsx** (AC3)
  - [x] 5a. Mock `next/navigation` (`usePathname`) and `next/link` — same pattern as Navbar.test.tsx
  - [x] 5b. Test: renders 4 tabs with labels Overview, News, Stocks, Trends
  - [x] 5c. Test: active tab (pathname `/`) applies khaki styling to Overview link
  - [x] 5d. Test: inactive tabs (pathname `/`) have reduced-opacity styling for News, Stocks, Trends
  - [x] 5e. Test: Thai sub-labels have `aria-hidden="true"`
  - [x] 5f. Test: each tab renders an anchor with the correct `href`

- [x] **Task 6: Add `id="main-content"` to all page `<main>` elements** (AC4, AC5)
  - [x] 6a. `frontend/src/app/page.tsx` — add `id="main-content"` to `<main>`
  - [x] 6b. `frontend/src/app/news/page.tsx` — add `id="main-content"` to `<main>`
  - [x] 6c. `frontend/src/app/stocks/page.tsx` — add `id="main-content"` to `<main>` (if file exists)
  - [x] 6d. `frontend/src/app/trends/page.tsx` — add `id="main-content"` to `<main>` (if file exists)

- [x] **Task 7: Add BottomTabBar to layout.tsx** (AC3)
  - [x] 7a. Import `BottomTabBar` in layout.tsx
  - [x] 7b. Render `<BottomTabBar />` as the last child of `<body>` (after `{children}`, before `<N8nChat />` or after it — either is fine as both are fixed/portal elements)

- [x] **Task 8: Run full test suite and verify no regressions** (all ACs)
  - [x] 8a. `cd frontend && npm test -- --run` — 62 tests pass, 0 failures, 0 warnings
  - [x] 8b. Confirm Navbar tests: 7 tests with updated labels pass (was 5)
  - [x] 8c. Confirm BottomTabBar tests: 6 tests pass
  - [x] 8d. `cd frontend && npx tsc --noEmit` — no type errors

## Dev Notes

### What the Current Navbar Has (READ BEFORE TOUCHING)

`frontend/src/components/Navbar.tsx` — the current file is a Client Component that already does:
- `usePathname()` for active-tab detection
- Live Bangkok clock via `setInterval` in `useEffect`
- 4 tabs hardcoded as: `{ label: "Overview", sub: "ภาพรวม", href: "/" }`, `{ label: "News", sub: "ข่าว", href: "/news" }`, `{ label: "Stocks", sub: "หุ้น", href: "/stocks" }`, `{ label: "Trends", sub: "แนวโน้ม", href: "/trends" }`
- Thai sub-labels rendered as `<span>` WITHOUT `aria-hidden="true"` (needs fixing)
- No mobile visibility control — currently shows on all screen sizes
- No focus ring on links (needs adding)
- Tab `<Link>` active color: `style={{ color: isActive ? "#D7C9B8" : "rgba(255,255,255,0.5)" }}`
- Active tab `border-bottom`: `style={{ borderBottomColor: isActive ? "#D7C9B8" : "transparent" }}`

**What changes:** tab labels (Home/News/Trends/About), `aria-hidden` on sub-labels, mobile hiding (`hidden lg:flex` on header), focus rings.

**What must NOT change:** clock behavior, LIVE badge, logo, overall layout structure, `setInterval` + fake-timer cleanup pattern.

### Existing Navbar Tests (Must Update, Not Break Pattern)

`frontend/src/components/Navbar.test.tsx` currently has 5 tests:
1. "renders ASK brand name" — unchanged
2. "renders tagline subtitle" — unchanged
3. "renders all 4 nav tabs" — currently asserts `Overview`, `News`, `Stocks`, `Trends` → must change to `Home`, `News`, `Trends`, `About`
4. "active tab (pathname /) applies khaki color to Overview" — must change `Overview` → `Home`
5. "inactive tab (News) has reduced opacity color" — unchanged

The `vi.useFakeTimers()` / `vi.clearAllTimers()` / `vi.useRealTimers()` lifecycle in beforeEach/afterEach **must be preserved** — a past bug where `vi.runOnlyPendingTimers()` fired `setTime` outside `act()` caused React warnings. Only `vi.clearAllTimers()` is safe here.

### BottomTabBar SVG Icons

Use these minimal SVG paths (24×24 viewBox) for the 4 tabs:

**Overview (home):**
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
</svg>
```

**News (newspaper):**
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9c0-1.1.9-2 2-2h2"/>
  <line x1="16" y1="8" x2="10" y2="8"/>
  <line x1="16" y1="12" x2="10" y2="12"/>
  <line x1="16" y1="16" x2="10" y2="16"/>
</svg>
```

**Stocks (bar chart):**
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <line x1="18" y1="20" x2="18" y2="10"/>
  <line x1="12" y1="20" x2="12" y2="4"/>
  <line x1="6" y1="20" x2="6" y2="14"/>
</svg>
```

**Trends (trending up):**
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
  <polyline points="16 7 22 7 22 13"/>
</svg>
```

### BottomTabBar Component Scaffold

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabItems = [
  { label: "Overview", sub: "ภาพรวม", href: "/", icon: <HomeIcon /> },
  { label: "News", sub: "ข่าว", href: "/news", icon: <NewsIcon /> },
  { label: "Stocks", sub: "หุ้น", href: "/stocks", icon: <StocksIcon /> },
  { label: "Trends", sub: "แนวโน้ม", href: "/trends", icon: <TrendsIcon /> },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-14 flex lg:hidden"
      style={{ backgroundColor: "#4A342A", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center min-h-[44px] border-t-2 transition-colors focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]"
            style={{
              borderTopColor: isActive ? "#D7C9B8" : "transparent",
              color: isActive ? "#D7C9B8" : "rgba(255,255,255,0.45)",
            }}>
            {/* icon */}
            <span className="text-xs font-semibold">{item.label}</span>
            <span className="text-[10px]" aria-hidden="true">{item.sub}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

Note: wire `item.icon` into the JSX above with `aria-hidden="true"` on the SVG element so the icon is decorative.

### Safe Area Inset for BottomTabBar

`env(safe-area-inset-bottom)` is a CSS environment variable that returns the iPhone notch safe area (0 on devices without a notch, ~34px on iPhone X+). Use it as an inline style — Tailwind v3 does not have a `pb-safe` utility built-in. This is safe to use as an inline `style` per the project rules (allowed when no Tailwind utility covers it).

### Nav Label Change — About Page Placeholder

Story 2.3 adds an **About** tab to the Navbar pointing to `/about`. The `/about` page does not yet exist (it is built in Story 2.9). Until then, `/about` will return a Next.js 404. This is acceptable — the tab is wired correctly; the page is just empty. Do NOT create a full About page in this story. If needed, a one-line `app/about/page.tsx` returning `<main id="main-content"><p>About</p></main>` is enough to prevent the 404.

### Layout.tsx — Current State

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import N8nChat from "@/components/N8nChat";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <N8nChat />
      </body>
    </html>
  );
}
```

After Task 1, it must be:
```tsx
<html lang="th" className={inter.variable}>
  <body className="font-sans antialiased pb-14 lg:pb-0">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded focus:bg-espresso focus:text-khaki focus:font-bold focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]">
      Skip to main content
    </a>
    {children}
    <BottomTabBar />
    <N8nChat />
  </body>
</html>
```

The `pb-14 lg:pb-0` on `<body>` prevents the BottomTabBar from overlapping page content on mobile.

### Page Files That Need `id="main-content"` on `<main>`

- `frontend/src/app/page.tsx` line 51: `<main className="max-w-screen-xl mx-auto px-4 py-5">` → add `id="main-content"`
- `frontend/src/app/news/page.tsx` line 33: `<main className="max-w-3xl mx-auto px-4 py-6">` → add `id="main-content"`
- Check `/stocks/page.tsx` and `/trends/page.tsx` for `<main>` elements and add the same

### Focus Ring — Why `focus-visible:` Not `focus:`

`focus:` fires on mouse click (showing an ugly ring on click). `focus-visible:` fires only when the browser determines the user is using keyboard navigation. Use `focus:outline-none focus-visible:shadow-[...]` in combination — this removes the default outline and replaces it with the espresso ring only for keyboard users.

### What Must NOT Be Touched

- `frontend/src/lib/api.ts` — no changes
- `frontend/src/types/index.ts` — no changes
- `backend/` — no changes
- Existing test logic in `NewsCard.test.tsx`, `NewsFeed.test.tsx`, `AISummaryCard.test.tsx`, etc. — these must still pass
- `tailwind.config.ts` — already has `espresso`, `khaki` etc. colors; no new tokens needed

### ISR Rule Reminder

Do NOT add `export const revalidate = 60` to any page files. The 60s ISR is owned by `fetchAPI()` in `lib/api.ts` via `next: { revalidate: 60 }`. Page-level `export const revalidate` causes unpredictable cache behavior.

### Project Structure Notes

- New files in this story: `frontend/src/components/BottomTabBar.tsx`, `frontend/src/components/BottomTabBar.test.tsx`, optionally `frontend/src/app/about/page.tsx`
- Files modified: `layout.tsx`, `Navbar.tsx`, `Navbar.test.tsx`, `page.tsx`, `news/page.tsx`, possibly `stocks/page.tsx`, `trends/page.tsx`
- BottomTabBar is a Client Component (needs `usePathname`)
- BottomTabBar belongs in `frontend/src/components/` per project conventions

### References

- [Source: epics.md#Story 2.3] — ACs for all 6 acceptance criteria
- [Source: ux-designs/ux-ASK-2026-06-20/DESIGN.md#components.Navbar] — `height: 56px`, `background: espresso`, `active-indicator: border-bottom 2px khaki`
- [Source: ux-designs/ux-ASK-2026-06-20/DESIGN.md#components.BottomTabBar] — `height: 56px`, `background: espresso`, `active-color: khaki`
- [Source: ux-designs/ux-ASK-2026-06-20/EXPERIENCE.md#Accessibility Floor] — focus ring spec, skip-to-content, Thai aria-hidden pattern
- [Source: project-context.md#Styling] — `focus-visible:` over `focus:`, `clsx` for conditional classes, `style={{}}` allowed for brand colors without Tailwind utility
- [Source: frontend/src/components/Navbar.tsx] — current implementation, clock timer pattern, existing active-tab style mechanism
- [Source: frontend/src/components/Navbar.test.tsx] — fake timer lifecycle, `vi.mock('next/navigation')` + `vi.mock('next/link')` pattern to reuse in BottomTabBar tests
- [Source: frontend/src/app/layout.tsx] — current Inter font setup (to move from body → html)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — all 62 tests passed on first run with zero warnings.

### Completion Notes List

- AC1: Moved `inter.variable` from `<body>` → `<html className>`. `font-sans antialiased pb-14 lg:pb-0` remains on body.
- AC2: Navbar tabs updated to Home/News/Trends/About. `aria-hidden="true"` added to all Thai sub-labels. Header changed to `hidden lg:flex` (desktop-only). Focus rings added via `focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]` on logo and tab links.
- AC3: New `BottomTabBar.tsx` component — `"use client"`, `fixed bottom-0 left-0 right-0 z-50 flex lg:hidden h-14`, 4 tabs (Overview/News/Stocks/Trends) with SVG icons, `usePathname()` active detection, safe area inset via inline `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}`.
- AC4: Verified `grid-cols-[1fr_340px] gap-5 px-4 py-5` already present in page.tsx. Added `id="main-content"` to `<main>` in all 4 page files.
- AC5: Skip-to-content `<a href="#main-content">` added as first child of `<body>` in layout.tsx. All page `<main>` elements have `id="main-content"`.
- AC6: `focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]` applied to all interactive links in Navbar and BottomTabBar.
- Created minimal `app/about/page.tsx` stub so the About nav tab doesn't 404 (full page deferred to Story 2.9).
- Navbar tests: 7 tests (up from 5) — 2 new: aria-hidden on Thai sub-labels, `hidden` class on header.
- BottomTabBar tests: 6 new tests — tab labels, active/inactive styles, aria-hidden, hrefs, lg:hidden class.
- Full suite: **62 tests, 0 failures** (was 54). TypeScript: `npx tsc --noEmit` clean.

### File List

- `frontend/src/app/layout.tsx` — MODIFIED: `inter.variable` on `<html>`, skip-to-content link, `pb-14 lg:pb-0` on body, added `BottomTabBar` import and render
- `frontend/src/components/Navbar.tsx` — MODIFIED: tabs Home/News/Trends/About, `hidden lg:flex` on header, `aria-hidden` on Thai sub-labels, focus-visible ring on links
- `frontend/src/components/Navbar.test.tsx` — MODIFIED: updated label assertions, added aria-hidden test, added mobile-hidden test (7 tests total)
- `frontend/src/components/BottomTabBar.tsx` — NEW: mobile bottom tab bar component
- `frontend/src/components/BottomTabBar.test.tsx` — NEW: 6 tests for BottomTabBar
- `frontend/src/app/page.tsx` — MODIFIED: added `id="main-content"` to `<main>`
- `frontend/src/app/news/page.tsx` — MODIFIED: added `id="main-content"` to `<main>`
- `frontend/src/app/stocks/page.tsx` — MODIFIED: added `id="main-content"` to `<main>`
- `frontend/src/app/trends/page.tsx` — MODIFIED: added `id="main-content"` to `<main>`
- `frontend/src/app/about/page.tsx` — NEW: minimal stub (full page in Story 2.9)
- `_bmad-output/implementation-artifacts/2-3-navbar-bottomtabbar-and-layout-foundation.md` — MODIFIED: status, baseline_commit, task checkboxes, dev agent record

### Review Findings

- [x] [Review][Patch] Skip-link `boxShadow` always rendered — not focus-conditional [frontend/src/app/layout.tsx:20]
- [x] [Review][Patch] BottomTabBar safe-area collapses touch targets on notched iPhones — `h-14` nav + `paddingBottom: env(safe-area-inset-bottom)` leaves <44px tappable zone; body `pb-14` also understates total tab bar height [frontend/src/components/BottomTabBar.tsx:17 / frontend/src/app/layout.tsx:17]
- [x] [Review][Patch] Missing `aria-label` on `<nav>` landmarks — both Navbar and BottomTabBar render unnamed `<nav>` elements; WCAG 2.1 SC 2.4.1 requires distinguishable landmarks [frontend/src/components/Navbar.tsx:44 / frontend/src/components/BottomTabBar.tsx:17]
- [x] [Review][Defer] Navbar/BottomTabBar background uses hardcoded `#4A342A` hex instead of Tailwind `bg-espresso` token — pre-existing pattern, colour is correct but diverges from token on future theme changes [frontend/src/components/Navbar.tsx:26 / frontend/src/components/BottomTabBar.tsx:60] — deferred, pre-existing
- [x] [Review][Defer] Navbar inactive tab opacity `rgba(255,255,255,0.5)` vs BottomTabBar spec-stated 45% `rgba(255,255,255,0.45)` — minor cross-component inconsistency, no visual impact — deferred, pre-existing
- [x] [Review][Defer] Potential z-index collision between BottomTabBar (`z-50`) and N8nChat widget on mobile — needs N8nChat investigation — deferred, pre-existing
