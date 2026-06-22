---
status: done
epic: 2
story: 8
story_key: "2-8-home-page-layout-and-isr-configuration"
created: 2026-06-22
baseline_commit: 09830bb50e7dc13c10f8e24ed4bac55964f4ade8
---

# Story 2.8: Home Page Layout & ISR Configuration

**Status:** ready-for-dev

## Story

As a retail investor,
I want the home page to load quickly with server-rendered content and the correct two-column layout ready for subsequent epics' widgets,
So that my morning session starts immediately with fresh news.

## Acceptance Criteria

### AC1 — Two-column desktop layout with non-throwing placeholder sidebar

**Given** the home page `/` on desktop (≥ 1024px)
**When** it renders
**Then** the layout is: Navbar (sticky top) → Ticker Bar slot → two-column grid (left: page header + search + news feed; right: sidebar column with placeholder cards for unreleased widgets)
**And** placeholder sidebar cards do not throw errors — they render empty/skeleton state gracefully

### AC2 — ISR revalidation on news endpoint (pre-satisfied)

**Given** the news feed data fetch on the home page
**When** it is implemented
**Then** `src/lib/api.ts` uses `next: { revalidate: 60 }` for the news endpoint — the same value used in Stories 2.2 and 2.6

> **NOTE:** AC2 is already satisfied. `fetchAPI` in `src/lib/api.ts` already applies `next: { revalidate: 60 }` to every endpoint including `getNews()`. No code change needed — just verify.

### AC3 — Suspense boundaries on every async Server Component

**Given** every async Server Component on the home page
**When** it is present
**Then** it is wrapped in `<Suspense fallback={<SkeletonCard />}>` — no missing boundaries

### AC4 — LCP under 2.5 seconds

**Given** the home page measured with Lighthouse on a broadband connection
**When** LCP is measured
**Then** LCP is under 2.5 seconds — all primary content renders server-side via Server Components with no client-side data fetching on initial load

---

## Tasks / Subtasks

- [x] Task 1: Write `DailyBriefPlaceholder.test.tsx` with failing tests (AC: 1)
  - [x] 1.1 Test: renders without throwing
  - [x] 1.2 Test: renders "AI Daily Brief" heading text
  - [x] 1.3 Test: renders "Today's brief is being prepared" subtitle text

- [x] Task 2: Create `DailyBriefPlaceholder.tsx` (AC: 1)
  - [x] 2.1 Static component — no props, no API call, no imports from `next/`
  - [x] 2.2 Espresso header: "AI Daily Brief" label + "Today's brief is being prepared" subtitle
  - [x] 2.3 White body: three `animate-pulse` skeleton rows in linen background
  - [x] 2.4 Visually matches the existing `AISummaryCard` shell (espresso header + white body) so the slot looks intentional

- [x] Task 3: Refactor `frontend/src/app/page.tsx` (AC: 1, 3, 4)
  - [x] 3.1 Extract private `HomeFeedServer` inner async component:
    - `try { result = await api.getNews() } catch { fetchError = ... }`
    - Returns `<NewsFeed news={items} last_updated={last_updated} activeCategory="All" error={fetchError} />`
  - [x] 3.2 Extract private `MarketSidebarServer` inner async component:
    - `try { overview = await api.getMarketOverview() } catch { return null }`
    - Returns `<MarketOverviewWidget>` + `<SectorHeatmap>` + `<TrendSummary>` wrapped in a `space-y-4` div
  - [x] 3.3 Outer `HomePage` fetches ONLY `api.getTicker()` with try/catch (stays `[]` on failure)
  - [x] 3.4 Replace `AISummaryCard` in sidebar with `DailyBriefPlaceholder` (static, first in sidebar)
  - [x] 3.5 Wrap `HomeFeedServer` in `<Suspense fallback={<SkeletonCard />}>`
  - [x] 3.6 Wrap `MarketSidebarServer` in `<Suspense fallback={<SkeletonCard />}>`
  - [x] 3.7 Simplify page header bar: remove MarketOverview-dependent stats (news_count, last_updated) — keep title + LIVE badge only
  - [x] 3.8 Remove `Promise.all` and all related import of `MarketOverview`, `AISummaryCard` from outer component

- [x] Task 4: Run full test suite and TypeScript check (AC: all)
  - [x] 4.1 `npx vitest run` → 123/123 tests GREEN (was 120; +3 new)
  - [x] 4.2 `npx tsc --noEmit` → zero errors

---

## Dev Notes

### Architecture: Why Refactor to Inner Server Components

The current `page.tsx` uses `Promise.all([api.getNews(), api.getMarketOverview(), api.getTicker()])`. This is an **atomic failure pattern** — if any single endpoint fails, the entire page renders empty. This was acceptable as an early scaffold but violates the resilience requirement for production.

The fix follows the exact pattern established in Story 2.6 (`news/page.tsx`) and Story 2.7 (`news/[id]/page.tsx`): private inner async Server Components that own their own data fetching and error recovery.

### The Inner Component Pattern (DO NOT DEVIATE)

```tsx
// PRIVATE — not exported. Lives at module top-level, not inside HomePage.
async function HomeFeedServer() {
  let items: NewsItem[] = [];
  let last_updated: string | null = null;
  let fetchError: string | null = null;
  try {
    const result = await api.getNews();
    items = result.items;
    last_updated = result.last_updated;
  } catch {
    fetchError = new Date().toISOString();
  }
  return (
    <NewsFeed
      news={items}
      last_updated={last_updated}
      activeCategory="All"
      error={fetchError}
    />
  );
}

async function MarketSidebarServer() {
  let overview: MarketOverview | null = null;
  try {
    overview = await api.getMarketOverview();
  } catch {
    // sidebar stays empty on failure — graceful degradation
  }
  if (!overview) return null;
  return (
    <div className="space-y-4">
      <MarketOverviewWidget indices={overview.indices} />
      <SectorHeatmap sectors={overview.sectors} />
      <TrendSummary trends={overview.trends} />
    </div>
  );
}
```

These components are **async** — this is what makes `<Suspense>` actually work. A sync component wrapped in Suspense does NOT suspend. Only async components trigger the fallback.

### DailyBriefPlaceholder — Purpose and Future Replacement

This is a **completely static** placeholder card occupying the top of the right sidebar column. It previews the visual slot that Story 4.4's `DailyBriefCard` will replace. It must:
- Render without any API call or prop
- Show the espresso header + white body shell matching the `AISummaryCard` visual language
- Use `animate-pulse` skeleton lines to convey "content loading / coming soon"
- Never be conditional — it renders always

Story 4.4 explicitly says DailyBriefCard "replaces the sidebar placeholder card added in Story 2.8."

### AISummaryCard — Keep File, Remove from Home Page

`AISummaryCard.tsx` and `AISummaryCard.test.tsx` are **NOT deleted**. The component file stays in the codebase (it passes its own tests). Only its import and usage in `app/page.tsx` are removed. This avoids breaking `AISummaryCard.test.tsx` and keeps the component available if needed by other pages.

### Page Header Bar Simplification

The current header shows `overview.news_count` and `overview.last_updated` from `api.getMarketOverview()`. Since `getMarketOverview()` is now deferred to the private inner component `MarketSidebarServer`, these values are no longer available at the outer page level.

**Solution:** Remove the stats row from the header. Keep only the title + LIVE badge. This simplifies the outer page (no MarketOverview fetch needed) and avoids prop-drilling or context complexity.

Simplified header:
```tsx
<div className="border-b px-6 py-3 flex items-center justify-between"
  style={{ backgroundColor: "#F5F1EA", borderColor: "rgba(74,52,42,0.1)" }}>
  <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
    Market Overview{" "}
    <span className="font-normal text-sm ml-1" style={{ color: "#B2967D" }}>ภาพรวมตลาด</span>
  </h1>
  <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded"
    style={{ backgroundColor: "#4A342A", color: "#D7C9B8" }}>
    <span className="live-dot w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
    LIVE
  </div>
</div>
```

### ISR: Already Satisfied

`src/lib/api.ts` `fetchAPI` function:
```ts
const res = await fetch(`${BASE_URL}${path}`, {
  next: { revalidate: 60 },
});
```

This applies to ALL endpoints including `getNews()`. AC2 requires exactly this. Zero code change needed — just confirm it exists.

### What NOT to Do

- Do NOT add `export const revalidate = 60` to `app/page.tsx` — ISR is managed at `fetchAPI` level
- Do NOT make `HomeFeedServer` or `MarketSidebarServer` exported — they are private inner components
- Do NOT use `async` for `DailyBriefPlaceholder` — it is a pure sync component (no data, no suspense)
- Do NOT use `"use client"` anywhere in this story's new files
- Do NOT test `app/page.tsx` directly — Next.js Server Component page testing requires a test environment that is not set up in this project; inner components are private and not testable in isolation
- Do NOT add `AISummaryCard` to any new Suspense or component; it is removed from the home page entirely

### TypeScript Imports for `app/page.tsx`

After refactor, imports should be:
```tsx
import { Suspense } from "react";
import { api } from "@/lib/api";
import { MarketOverview, NewsItem, TickerItem } from "@/types";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import NewsFeed from "@/components/NewsFeed";
import MarketOverviewWidget from "@/components/MarketOverviewWidget";
import SectorHeatmap from "@/components/SectorHeatmap";
import TrendSummary from "@/components/TrendSummary";
import DailyBriefPlaceholder from "@/components/DailyBriefPlaceholder";
import SkeletonCard from "@/components/SkeletonCard";
```

Removed from current: `import MarketOverview ... AISummaryCard ... Promise.all`.

### `DailyBriefPlaceholder.test.tsx` Pattern

No external mocks needed — the component is fully static. Use standard render + `screen.getByText`:

```tsx
import { render, screen } from "@testing-library/react";
import DailyBriefPlaceholder from "./DailyBriefPlaceholder";

describe("DailyBriefPlaceholder", () => {
  it("renders without throwing", () => {
    expect(() => render(<DailyBriefPlaceholder />)).not.toThrow();
  });
  it("renders AI Daily Brief heading", () => {
    render(<DailyBriefPlaceholder />);
    expect(screen.getByText("AI Daily Brief")).toBeInTheDocument();
  });
  it("renders preparing subtitle", () => {
    render(<DailyBriefPlaceholder />);
    expect(screen.getByText(/Today's brief is being prepared/i)).toBeInTheDocument();
  });
});
```

### Pattern Reference: `news/page.tsx` and `news/[id]/page.tsx` (Stories 2.6, 2.7)

The `HomeFeedServer` inner component follows the exact same shape as `NewsFeedServer` in `news/page.tsx`. Read that file — it is the template.

---

## Dev Agent Record

### Implementation Plan

1. `DailyBriefPlaceholder.test.tsx` — 3 failing tests (RED)
2. `DailyBriefPlaceholder.tsx` — static espresso-header + skeleton body (GREEN; 3/3 pass)
3. `app/page.tsx` — full refactor: private `HomeFeedServer` + `MarketSidebarServer` inner async components, Suspense boundaries, `DailyBriefPlaceholder` in sidebar, simplified header, `Promise.all` removed

### Completion Notes

- 2 new files, 1 file refactored
- 3 new Vitest tests; 123/123 total tests pass (was 120)
- `npx tsc --noEmit` — zero errors
- AC1: two-column `lg:grid-cols-[1fr_340px]` layout, `DailyBriefPlaceholder` is fully static (cannot throw) ✅
- AC2: `api.ts` `fetchAPI` already has `next: { revalidate: 60 }` — pre-satisfied, no code change ✅
- AC3: `HomeFeedServer` wrapped in `<Suspense fallback={<SkeletonCard />}>`, `MarketSidebarServer` wrapped in `<Suspense fallback={<SkeletonCard />}>` ✅
- AC4: all content SSR via Server Components; outer page only fetches ticker; no `"use client"` ✅
- `AISummaryCard` removed from home page; file and tests untouched (still passes 4/4 own tests)
- Header simplified: title + LIVE badge only (no MarketOverview stats dependency at outer page level)

### Review Findings

- [x] [Review][Defer] Duplicate non-functional search inputs on home page [frontend/src/app/page.tsx:106 + frontend/src/components/NewsFeed.tsx:38] — deferred, pre-existing; old page.tsx also rendered the decorative input alongside NewsFeed's own `<input type="search">`; UX/a11y cleanup belongs in a dedicated story
- [x] [Review][Defer] `/trends` page calls `api.getMarketOverview()` without try/catch [frontend/src/app/trends/page.tsx] — deferred, pre-existing inconsistency not introduced by this diff; harden in a future story alongside Story 2.9 or a dedicated hardening pass

---

## File List

**New files:**
- `frontend/src/components/DailyBriefPlaceholder.tsx`
- `frontend/src/components/DailyBriefPlaceholder.test.tsx`

**Modified files:**
- `frontend/src/app/page.tsx`
