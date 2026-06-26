---
status: done
epic: 5
story: 2
story_key: "5-2-themecard-component-and-trends-page"
created: 2026-06-26
baseline_commit: "77b6f1a8249ecc066f6a88a95eaecfd963e11850"
---

# Story 5.2: ThemeCard Component & Trends Page

**Status:** done

## Story

As a retail investor,
I want to browse AI-identified market themes on a dedicated Trends page with clear loading, empty, and error states,
So that I can spot the macro patterns driving today's market in a single scan.

## Acceptance Criteria

### AC1 — ThemeCard renders correctly from MarketThemeSummary

**Given** a `ThemeCard` receives a `MarketThemeSummary`
**When** it renders
**Then** scan order top-to-bottom is:
1. Theme name (16px / `text-[16px]`, 700 / `font-bold`, espresso `#4A342A`) + `SentimentBadge` right-aligned in the same row
2. Article count (cocoa `#7D5A44`, 12px / `text-xs`)
3. Description (cocoa `#7D5A44`, 14px / `text-sm`)
4. Khaki divider (`rgba(74,52,42,0.1)`)
5. Footer: relative time of `last_article_at` (cocoa, 12px)

**And** the full card surface is a single clickable area navigating to `/trends/[theme_id]`
**And** the card is wrapped in an `<article>` element
**And** spacing: `px-6 py-5` padding, `rounded-xl`, white background with `1px solid rgba(74,52,42,0.1)` border

### AC2 — ThemeCard focus and hover states

**Given** keyboard focus on a `ThemeCard`
**When** focused
**Then** the espresso double-ring focus indicator is visible on the card: `focus-within:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]`
**And** `cursor-pointer` and `hover:shadow-md transition-shadow duration-200` on hover

### AC3 — ThemeCard skeleton exported alongside ThemeCard

**Given** a Suspense boundary on `/trends`
**When** themes are loading
**Then** `ThemeCardSkeleton` renders an `animate-pulse linen` block at approximate ThemeCard dimensions
**And** `ThemeCardSkeleton` has `role="status"` and `aria-label="Loading themes"`

### AC4 — `/trends` page structure

**Given** the `/trends` page loads
**When** it renders
**Then** the page contains `<Navbar />` + `<TickerBar />` + page header + `<main>` landmark containing ThemeCard components
**And** the header contains a visible `<h1>` of "Market Trends" (and `แนวโน้มตลาด` Thai sub-label)
**And** `<main>` has `id="main-content"` and `role="main"` (via `<main>` element)
**And** ThemeCard components are sorted by `last_article_at` descending with `space-y-4` (16px) gap
**And** the page layout is single-column `max-w-3xl mx-auto px-4 py-6` (same as `/news`)

### AC5 — Suspense boundary wraps the theme list

**Given** all async components on `/trends`
**When** the page loads
**Then** the async theme-fetching inner component is wrapped in `<Suspense fallback={<ThemeCardSkeleton />}>`
**And** the skeleton appears at approximate ThemeCard dimensions (not a generic spinner)

### AC6 — Empty state

**Given** `api.getTrends()` returns an empty list `[]`
**When** the page renders
**Then** it shows exactly: "No active themes right now. Themes refresh daily. Check back after market hours (18:00 Bangkok time)."
**And** that message contains a `<Link href="/news">` link (text: "Check back after market hours (18:00 Bangkok time)" or a clear CTA like "View latest news")
**And** it is never a silent empty `<ul>` — the empty state message is always visible

### AC7 — Error state

**Given** `api.getTrends()` throws an error
**When** the page renders
**Then** it shows: "Market Trends temporarily unavailable · Last attempted [time in BKK]"
**And** `<Navbar />` and `<BottomTabBar />` remain functional (i.e., error is caught inside the async inner component, not at page level)
**And** the error does not crash the entire page

### AC8 — Unit tests for ThemeCard

**Given** `ThemeCard.test.tsx`
**When** tests run
**Then** at minimum: renders name, renders SentimentBadge with correct sentiment, renders article count, renders description, renders relative time footer, card is wrapped in `<article>`, link points to `/trends/[theme_id]`, renders for all 3 sentiments (bullish/bearish/neutral)
**And** `ThemeCardSkeleton` tests: renders without throwing, has `role="status"`, no spinner
**And** 136 frontend tests remain passing (no regressions)

---

## Dev Notes

### Critical: Existing `/trends/page.tsx` Is a Full Replacement

The current `frontend/src/app/trends/page.tsx` (99 lines) renders:
- `TrendSummary` (sidebar-style trend list from `MarketOverview.trends`)
- `AISummaryCard`
- Sentiment breakdown chart (hardcoded percentages)
- Calls `api.getMarketOverview()` for data

**ALL of this must be replaced.** The new page fetches from `api.getTrends()` and renders `ThemeCard` components. There is no backward-compatibility requirement — this is a feature replacement.

**`TrendSummary.tsx` and `AISummaryCard.tsx` are NOT deleted** — they remain for potential sidebar use and are tested. They just no longer appear on `/trends`.

---

### New Files

1. `frontend/src/components/ThemeCard.tsx` — presentational component (no data fetching)
2. `frontend/src/components/ThemeCard.test.tsx` — unit tests

### Modified Files

1. `frontend/src/app/trends/page.tsx` — **FULL REPLACEMENT** (current content removed entirely)

### Unchanged Files

- `frontend/src/types/index.ts` — `MarketThemeSummary` already defined (Story 5.1)
- `frontend/src/lib/api.ts` — `api.getTrends()` already defined (Story 5.1)
- `frontend/src/components/SentimentBadge.tsx` — used inside ThemeCard
- `frontend/src/components/SkeletonCard.tsx` — existing skeleton (can be reused for other Suspense)
- `frontend/src/components/TrendSummary.tsx` — NOT touched; still used in sidebar on home page
- `frontend/src/components/AISummaryCard.tsx` — NOT touched; still tested
- `backend/**` — no changes

---

### Design Tokens (from `tailwind.config.ts`)

| Token | Hex | Usage |
|---|---|---|
| `espresso` | `#4A342A` | Theme name text, focus ring |
| `cocoa` | `#7D5A44` | Article count, description, footer text |
| `camel` | `#B2967D` | Thai sub-label in page header |
| `khaki` | `#D7C9B8` | Divider color |
| `linen` | `#F5F1EA` | Page header bg, skeleton pulse bg |

Focus ring (espresso double-ring — consistent with all other interactive cards):
```
focus-within:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]
```

---

### ThemeCard Component Implementation Guide

```tsx
// frontend/src/components/ThemeCard.tsx
import Link from "next/link";
import { MarketThemeSummary } from "@/types";
import SentimentBadge from "./SentimentBadge";

function relativeTime(isoString: string): string {
  const hours = Math.floor(
    Math.max(0, Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60)
  );
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

interface Props {
  theme: MarketThemeSummary;
}

export default function ThemeCard({ theme }: Props) {
  return (
    <article
      className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 focus-within:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]"
      style={{ border: "1px solid rgba(74,52,42,0.1)" }}
    >
      <Link href={`/trends/${theme.theme_id}`} className="block px-6 py-5 focus:outline-none">
        {/* Row 1: theme name + SentimentBadge */}
        <div className="flex items-start gap-2 mb-1">
          <h2 className="text-[16px] font-bold leading-snug flex-1" style={{ color: "#4A342A" }}>
            {theme.name}
          </h2>
          <div className="flex-shrink-0 mt-0.5">
            <SentimentBadge sentiment={theme.overall_sentiment} />
          </div>
        </div>

        {/* Article count */}
        <p className="text-xs mb-3" style={{ color: "#7D5A44" }}>
          {theme.article_count} {theme.article_count === 1 ? "article" : "articles"}
        </p>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#7D5A44" }}>
          {theme.description}
        </p>

        {/* Khaki divider */}
        <hr className="my-2" style={{ borderColor: "rgba(74,52,42,0.1)" }} />

        {/* Footer: relative time */}
        <p className="text-xs" style={{ color: "#7D5A44" }}>
          Updated {relativeTime(theme.last_article_at)}
        </p>
      </Link>
    </article>
  );
}

export function ThemeCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading themes"
      className="bg-white rounded-xl px-6 py-5 animate-pulse"
      style={{ border: "1px solid rgba(74,52,42,0.1)" }}
    >
      <div className="flex items-start gap-2 mb-1">
        <div className="h-5 bg-linen rounded w-3/4" />
        <div className="h-5 bg-linen rounded w-16" />
      </div>
      <div className="h-3 bg-linen rounded w-1/4 mb-3" />
      <div className="h-4 bg-linen rounded w-full mb-1.5" />
      <div className="h-4 bg-linen rounded w-5/6 mb-3" />
      <hr style={{ borderColor: "rgba(74,52,42,0.1)" }} className="my-2" />
      <div className="h-3 bg-linen rounded w-24" />
    </div>
  );
}
```

**Key decisions:**
- `relativeTime()` is the same helper as in `NewsCard.tsx` — copy-paste is fine; do NOT extract to a shared util (not required by this story, YAGNI)
- `<Link>` wraps the entire inner content (full-card click)
- `<article>` wraps the `<Link>` (not the other way around)
- Thai sub-label `aria-hidden="true"` is NOT needed here — ThemeCard has no Thai text

---

### `/trends` Page Implementation Guide

```tsx
// frontend/src/app/trends/page.tsx (FULL REPLACEMENT)
import { Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MarketThemeSummary, TickerItem } from "@/types";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import ThemeCard, { ThemeCardSkeleton } from "@/components/ThemeCard";

async function ThemesServer() {
  let themes: MarketThemeSummary[] = [];
  let fetchError: string | null = null;

  try {
    themes = await api.getTrends();
  } catch {
    fetchError = new Date().toISOString();
  }

  if (fetchError !== null) {
    const time = new Date(fetchError).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
    return (
      <p className="text-sm" style={{ color: "#6b6560" }}>
        Market Trends temporarily unavailable · Last attempted {time} BKK
      </p>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm mb-3" style={{ color: "#6b6560" }}>
          No active themes right now. Themes refresh daily.
        </p>
        <p className="text-sm" style={{ color: "#6b6560" }}>
          Check back after market hours (18:00 Bangkok time) or{" "}
          <Link
            href="/news"
            className="underline hover:no-underline focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A] rounded"
            style={{ color: "#B2967D" }}
          >
            view latest news
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {themes.map((theme) => (
        <ThemeCard key={theme.theme_id} theme={theme} />
      ))}
    </div>
  );
}

export default async function TrendsPage() {
  let ticker: TickerItem[] = [];
  try {
    ticker = await api.getTicker();
  } catch {
    // ticker stays empty on failure
  }

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />

      <div
        className="border-b px-6 py-3"
        style={{ backgroundColor: "#F5F1EA", borderColor: "rgba(74,52,42,0.1)" }}
      >
        <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
          Market Trends{" "}
          <span className="font-normal text-sm ml-1" aria-hidden="true" style={{ color: "#B2967D" }}>
            แนวโน้มตลาด
          </span>
        </h1>
      </div>

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <Suspense fallback={<ThemeCardSkeleton />}>
          <ThemesServer />
        </Suspense>
      </main>

      <footer
        className="border-t mt-8 px-6 py-5 flex items-center justify-between text-xs"
        style={{
          backgroundColor: "#4A342A",
          borderColor: "rgba(215,201,184,0.1)",
          color: "rgba(215,201,184,0.4)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: "#D7C9B8" }}>ASK</span>
          <span>·</span>
          <span>AI Financial Research Assistant</span>
        </div>
        <div>For educational purposes only. Not investment advice.</div>
      </footer>
    </>
  );
}
```

**Notes:**
- `ThemesServer` is an inner async function inside `page.tsx` — same pattern as `NewsFeedServer` in `news/page.tsx`
- `try/catch` inside `ThemesServer` catches the error and renders the error message inline — does NOT let the error propagate to page level (which would crash the entire page and break Navbar/BottomTabBar per AC7)
- `export const revalidate = 60` is NOT needed at page level since `api.getTrends()` uses `fetchAPI` which already applies `next: { revalidate: 60 }` globally
- `TickerItem` import is needed for the ticker try/catch variable type

---

### Testing Guide for `ThemeCard.test.tsx`

Follow the `DailyBriefCard.test.tsx` pattern: import the component, define a mock, test in describe blocks.

```tsx
// frontend/src/components/ThemeCard.test.tsx
import { render, screen } from "@testing-library/react";
import ThemeCard, { ThemeCardSkeleton } from "./ThemeCard";
import { MarketThemeSummary } from "@/types";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => <a href={href} className={className}>{children}</a>,
}));

const VALID_THEME: MarketThemeSummary = {
  theme_id: "theme-001",
  name: "Fed Rate Cut Sentiment",
  description: "Markets anticipate rate cuts following softer CPI data published this week. Banking stocks are pricing in 2 cuts by year-end. SET banking sector outperforms.",
  overall_sentiment: "bullish",
  article_count: 3,
  last_article_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
};

describe("ThemeCard", () => {
  it("renders theme name", ...);
  it("renders SentimentBadge with BULLISH label", ...);
  it("renders article count", ...);
  it("renders description", ...);
  it("renders footer with relative time", ...);
  it("card is wrapped in article element", ...);
  it("link navigates to /trends/[theme_id]", ...);
  it("renders BEARISH sentiment", ...);
  it("renders NEUTRAL sentiment", ...);
  it("article count uses singular 'article' for count of 1", ...);
});

describe("ThemeCardSkeleton", () => {
  it("renders without throwing", ...);
  it("has role='status'", ...);
  it("has aria-label 'Loading themes'", ...);
});
```

**`vi.mock('next/link')` is required** — same as `NewsCard.test.tsx`. Without it, Next.js `Link` fails in jsdom.

**Minimum tests: 13** (10 ThemeCard + 3 ThemeCardSkeleton)

---

### Pattern From Previous Stories (Story 4.4 / DailyBriefServer)

Story 4.4 established the pattern for async server component error handling:
- Wrap the API call in try/catch inside the async server component
- Return an error JSX block (not throw) so the parent page remains functional
- This is exactly the same pattern needed for `ThemesServer` in the new `/trends` page

The `ThemeCard` itself follows the `NewsCard` pattern exactly:
- Pure presentational component
- Props typed directly from a TypeScript interface
- `<article>` wrapper, `<Link>` for navigation
- `SentimentBadge` imported and used

---

### CRITICAL: What Must NOT Change in `/trends/page.tsx`

The page header and footer structure MUST match the `/news/page.tsx` pattern exactly:
- `<Navbar />` and `<TickerBar />` at the top (outside of `<main>`)
- `<main id="main-content">` for the content area
- Footer at the bottom with ASK branding

**Do NOT add `export const revalidate = 60`** at the top of the new `page.tsx` — `fetchAPI` applies ISR globally at the fetch level. Adding `export const revalidate = 60` at page level is redundant (not harmful, but the codebase pattern since Story 2.8 uses route-level ISR only when needed).

Actually, looking at `trends/page.tsx` current — it has `export const revalidate = 60`. Keep this for consistency with the current trend page. Wait, looking at news/page.tsx — it does NOT have `export const revalidate = 60`. Since `fetchAPI` already applies `revalidate: 60` at fetch level, the route-segment `export const revalidate` is not needed. Omit it.

---

### BottomTabBar — Already Has `/trends` Tab

`BottomTabBar.tsx` already has a "Trends / แนวโน้ม" tab linking to `/trends` at line 41-51. No changes needed. The tab will highlight as active when the user is on `/trends`.

---

### Anatomy Conflict: Epic vs EXPERIENCE.md

**The epic AC is authoritative.** The EXPERIENCE.md ThemeCard anatomy includes a "Latest:" article headline preview item (item 4 in the list), but:
1. `MarketThemeSummary` schema does NOT include a latest-article headline field
2. The epic AC scan order explicitly omits it: name → count → description → divider → time

**Do NOT implement the "Latest:" article headline preview** in Story 5.2. It requires a schema change not in scope here.

---

### Test Baseline

Before: **136 frontend tests**
Expected after: **≥ 149 frontend tests** (136 + 13 new ThemeCard tests)

Backend: **135 tests** — unchanged (no backend changes in this story)

Run: `npx vitest run` from `frontend/`

---

## Tasks / Subtasks

- [x] Task 1: Create `ThemeCard.tsx` with default export `ThemeCard` and named export `ThemeCardSkeleton`
  - [x] 1a: `ThemeCard` renders `<article>` → `<Link href="/trends/[theme_id]">` → 5-element layout per AC1
  - [x] 1b: Apply espresso name, cocoa count + description + footer, khaki divider
  - [x] 1c: Focus ring `focus-within:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]` + hover shadow on `<article>` (AC2)
  - [x] 1d: `ThemeCardSkeleton` with `role="status"`, `aria-label="Loading themes"`, `animate-pulse linen` blocks (AC3)
  - [x] 1e: `relativeTime()` helper function (copy from `NewsCard.tsx` — no shared util)

- [x] Task 2: Write failing tests in `ThemeCard.test.tsx` FIRST (RED phase)
  - [x] 2a: Mock `next/link` at top of file
  - [x] 2b: Define `VALID_THEME` with `MarketThemeSummary` type
  - [x] 2c: Write ≥ 10 tests for `ThemeCard` (name, badge, count, description, footer, article, link, 3 sentiments, singular count)
  - [x] 2d: Write 3 tests for `ThemeCardSkeleton` (renders, role="status", aria-label)
  - [x] 2e: Confirm RED — tests fail with "Cannot find module './ThemeCard'"

- [x] Task 3: Implement `ThemeCard.tsx` and verify GREEN
  - [x] 3a: All 13+ tests pass
  - [x] 3b: No regressions in existing 136 tests

- [x] Task 4: Replace `frontend/src/app/trends/page.tsx`
  - [x] 4a: Remove ALL existing content (TrendSummary, AISummaryCard, getMarketOverview call, sentiment chart)
  - [x] 4b: Implement `ThemesServer()` inner async function with try/catch (error + empty state per AC6/AC7)
  - [x] 4c: Implement `TrendsPage` with Navbar, TickerBar, h1 "Market Trends", `<main id="main-content">`, `<Suspense fallback={<ThemeCardSkeleton />}>`, footer
  - [x] 4d: Verify TypeScript compiles: `npx tsc --noEmit`

- [x] Task 5: Run full test suite
  - [x] 5a: `npx vitest run` — ≥ 149/149 passing
  - [x] 5b: `npx tsc --noEmit` — zero TypeScript errors

### Review Findings

- [x] [Review][Patch] `relativeTime()` no guard for invalid/null input — renders "NaN days ago" [frontend/src/components/ThemeCard.tsx:5-11]

- [x] [Review][Defer] Single `ThemeCardSkeleton` fallback — skeleton count doesn't match rendered list count on slow loads [frontend/src/app/trends/page.tsx:89] — deferred, design choice
- [x] [Review][Defer] Future timestamps clamped to "0h ago" via `Math.max(0,…)` — clock skew not indicated [frontend/src/components/ThemeCard.tsx:7] — deferred, design choice
- [x] [Review][Defer] `relativeTime()` 24h boundary — jumps from "23h ago" to "1 day ago" skipping "24h ago" state [frontend/src/components/ThemeCard.tsx:8] — deferred, minor UX
- [x] [Review][Defer] Error catch discards actual thrown error; only timestamp preserved [frontend/src/app/trends/page.tsx:14-18] — deferred, matches AC7 "Last attempted [time]" design
- [x] [Review][Defer] `toLocaleTimeString("Asia/Bangkok")` crashes on slim-ICU Node builds — deployment risk [frontend/src/app/trends/page.tsx:20-24] — deferred, environment-specific
- [x] [Review][Defer] `SentimentBadge` destructures undefined on unknown sentiment value — pre-existing [frontend/src/components/SentimentBadge.tsx:14] — deferred, pre-existing
- [x] [Review][Defer] `TickerBar` renders empty bar with no guard when `items=[]` — pre-existing [frontend/src/components/TickerBar.tsx] — deferred, pre-existing
- [x] [Review][Defer] Frontend doesn't sort themes client-side — correct only because API `get_active()` guarantees order [frontend/src/app/trends/page.tsx:56] — deferred, API contract
- [x] [Review][Defer] Empty-state copy split across two `<p>` elements; "or view latest news" extra phrase not in AC6-specified string [frontend/src/app/trends/page.tsx:35-50] — deferred, minor copy deviation

---

## Dev Agent Record

### Implementation Plan

RED-GREEN-REFACTOR cycle applied in this order:
1. Wrote `ThemeCard.test.tsx` first (13 tests covering ThemeCard + ThemeCardSkeleton) — confirmed RED via missing module error
2. Created `ThemeCard.tsx` with `relativeTime()` helper, `<article>` wrapper, espresso/cocoa/khaki design tokens, focus ring, `ThemeCardSkeleton` named export — all 13 tests GREEN
3. Replaced `trends/page.tsx` entirely: removed old `TrendSummary`/`AISummaryCard`/`getMarketOverview()` logic; added `ThemesServer` inner async function with try/catch for error/empty states; Suspense with `ThemeCardSkeleton` fallback

### Debug Log

- No issues encountered. TypeScript compiled cleanly with zero errors.
- `vi.mock("next/link")` required in test file — same pattern as `NewsCard.test.tsx`

### Completion Notes

- ✅ `frontend/src/components/ThemeCard.tsx` created (default export + `ThemeCardSkeleton` named export)
- ✅ `frontend/src/components/ThemeCard.test.tsx` created (13 tests — 10 ThemeCard, 3 ThemeCardSkeleton)
- ✅ `frontend/src/app/trends/page.tsx` replaced (old 99-line file using `api.getMarketOverview()`, `TrendSummary`, `AISummaryCard` fully removed)
- ✅ 149/149 tests passing (136 baseline + 13 new)
- ✅ `npx tsc --noEmit` — zero errors
- ✅ `TrendSummary.tsx` and `AISummaryCard.tsx` NOT deleted — preserved for potential future use

---

## File List

### New Files
- `frontend/src/components/ThemeCard.tsx`
- `frontend/src/components/ThemeCard.test.tsx`

### Modified Files
- `frontend/src/app/trends/page.tsx` (FULL REPLACEMENT)

### Unchanged Files
- `frontend/src/types/index.ts` — `MarketThemeSummary` + `MarketTheme` already present (Story 5.1)
- `frontend/src/lib/api.ts` — `getTrends()` already present (Story 5.1)
- All backend files
- All other frontend components

---

## Change Log

| Date | Change |
|------|--------|
| 2026-06-26 | Story created |
| 2026-06-26 | Implementation complete — ThemeCard.tsx + ThemeCard.test.tsx created; trends/page.tsx fully replaced; 149/149 tests passing |
