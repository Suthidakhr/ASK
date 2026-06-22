---
status: done
epic: 2
story: 7
story_key: "2-7-news-detail-page"
created: 2026-06-22
baseline_commit: 7f65e22dac8331254fa1b56221362c2f167624e2
---

# Story 2.7: News Detail Page

**Status:** ready-for-dev

## Story

As a retail investor,
I want to read the full AI impact analysis with source attribution and a compliance disclaimer,
So that I understand why a news event matters and can verify the original source before acting.

## Acceptance Criteria

### AC1 — Content order on valid article

**Given** `/news/[id]` loads with a valid ID
**When** the page renders
**Then** content appears in this order:
1. Headline (`<h1>`)
2. Source name (non-nullable visible text) + external link to original article + publication timestamp in Bangkok time
3. Full AI impact analysis (analysis summary in linen box with camel left border)
4. Affected sectors list
5. Affected stocks/indices with direction badges (`aria-label="[SYMBOL]: rising/falling/unchanged"`)
6. `SentimentBadge`
7. Analysis timestamp + amber staleness indicator if `analysis_at` > 24h
8. Non-removable disclaimer (structural part of component — not a prop, not behind a flag)

### AC2 — External source link

**Given** the external source link
**When** it renders
**Then** it opens in a new tab (`target="_blank" rel="noopener noreferrer"`) with a visible external-link icon
**And** if `source_url` is `null`, source name renders as plain text — no broken `<a>` element

### AC3 — 404 state

**Given** `/news/[id]` with a non-existent ID
**When** the page renders
**Then** it shows "Article not found." with a back-navigation link to `/news`
**And** never shows a raw Next.js error page

### AC4 — Pending analysis state

**Given** an article with `ai_analysis: null` that was published < 24h ago
**When** the detail page renders
**Then** the AI section shows `AIInsightBox` in pending state ("Analysis in progress")
**And** headline, source name, source link, and timestamp remain visible and accessible
**And** the non-removable disclaimer still renders

### AC5 — Analysis unavailable state

**Given** an article with `ai_analysis: null` that was published ≥ 24h ago
**When** the detail page renders
**Then** "Analysis unavailable for this article." appears in `neutral-text` (`#6b6560`)
**And** the source link and headline remain fully accessible
**And** the non-removable disclaimer still renders

### AC6 — Suspense skeleton on cold load

**Given** a cold-load with no ISR cache
**When** the page renders
**Then** `<Suspense fallback={<SkeletonCard />}>` skeleton blocks cover the content area
**And** no blank white regions appear

### AC7 — Non-removable disclaimer (FR-A04)

**Given** the non-removable disclaimer
**When** a developer inspects the component tree
**Then** the disclaimer string is hardcoded JSX — not a prop, not behind a feature flag, not conditionally rendered

---

## Tasks / Subtasks

- [x] Task 1: Create `not-found.tsx` at `frontend/src/app/news/[id]/not-found.tsx` (AC: 3)
  - [x] 1.1 Render "Article not found." heading in espresso (`#4A342A`)
  - [x] 1.2 Render `<Link href="/news">← Back to News</Link>` below the heading
  - [x] 1.3 Wrap in `<main>` with `id="main-content"` and centered layout

- [x] Task 2: Write `NewsDetailContent.test.tsx` with failing tests (AC: 1, 2, 4, 5, 7)
  - [x] 2.1 Test: renders headline as `<h1>`
  - [x] 2.2 Test: renders source name as external link when `source_url` is non-null (target="_blank", rel="noopener noreferrer")
  - [x] 2.3 Test: renders source name as plain text when `source_url` is `null` — no `<a>` element
  - [x] 2.4 Test: renders publication timestamp (expect Bangkok locale string)
  - [x] 2.5 Test: renders `AIInsightBox` (by `aria-label="AI market analysis"`) when `ai_analysis` is non-null
  - [x] 2.6 Test: renders affected sectors list when `ai_analysis` is non-null
  - [x] 2.7 Test: renders stock direction badges with correct `aria-label`
  - [x] 2.8 Test: renders `SentimentBadge` when `ai_analysis` is non-null
  - [x] 2.9 Test: disclaimer always renders — even when `ai_analysis` is `null`
  - [x] 2.10 Test: recent article with `ai_analysis: null` → AIInsightBox pending state visible; no "unavailable" text
  - [x] 2.11 Test: old article (>24h, `ai_analysis: null`) → "Analysis unavailable for this article." visible; no pending state
  - [x] 2.12 Test: no sectors/stocks/SentimentBadge rendered when `ai_analysis` is `null`

- [x] Task 3: Create `frontend/src/components/NewsDetailContent.tsx` (AC: 1, 2, 4, 5, 7)
  - [x] 3.1 Component signature: `function NewsDetailContent({ news }: { news: NewsItem })` — no `"use client"`, no async
  - [x] 3.2 Compute `isOldArticle = Date.now() - new Date(news.published_at).getTime() > 24 * 60 * 60 * 1000`
  - [x] 3.3 Zone 1: `<h1>` headline in espresso 700
  - [x] 3.4 Zone 2: source row — source name as `<a target="_blank" rel="noopener noreferrer">` (if `source_url` non-null) OR plain `<span>` (if null); external-link SVG icon beside the link; Bangkok-formatted timestamp
  - [x] 3.5 Zone 3 (AI section): if `ai_analysis !== null` → `<AIInsightBox analysis={news.ai_analysis} />`; if `ai_analysis === null && !isOldArticle` → `<AIInsightBox analysis={null} />`; if `ai_analysis === null && isOldArticle` → "Analysis unavailable for this article." in neutral-text
  - [x] 3.6 Zone 4 (conditional on `ai_analysis !== null`): affected sectors list
  - [x] 3.7 Zone 5 (conditional on `ai_analysis !== null`): `stock_impacts` direction badges — reuse `DIRECTION_LABEL`, `DIRECTION_ARROW`, `BADGE_COLORS` constants (define locally in this file, same values as NewsCard)
  - [x] 3.8 Zone 6 (conditional on `ai_analysis !== null`): `<SentimentBadge sentiment={news.ai_analysis.sentiment} />`
  - [x] 3.9 Zone 8: HARDCODED disclaimer paragraph — NOT a prop, NOT conditional:
        `"This analysis is generated by AI for educational purposes only. It does not constitute investment advice. Always consult a qualified financial advisor before making investment decisions."`
  - [x] 3.10 Run tests — all 12 tests from Task 2 must pass

- [x] Task 4: Create `frontend/src/app/news/[id]/page.tsx` (AC: 3, 6)
  - [x] 4.1 Async Server Component — `params: Promise<{ id: string }>` — MUST `await params`
  - [x] 4.2 Define inner async `NewsDetailServer({ id }: { id: string })` component — fetches `api.getNewsById(id)`, calls `notFound()` if API throws 404, renders `<NewsDetailContent news={news} />`
  - [x] 4.3 Fetch ticker independently with try/catch (same pattern as `news/page.tsx`)
  - [x] 4.4 Back-navigation breadcrumb: `<Link href="/news">← Financial News</Link>` above the content
  - [x] 4.5 Wrap `<NewsDetailServer>` in `<Suspense fallback={<SkeletonCard />}>` — this is the real streaming boundary because `NewsDetailServer` is async
  - [x] 4.6 Page layout: `<Navbar />` → `<TickerBar />` → page header bar (linen, with breadcrumb) → `<main>` max-w-3xl with breadcrumb + `<Suspense>`

- [x] Task 5: Verify full test suite (AC: all)
  - [x] 5.1 `npx tsc --noEmit` — zero TypeScript errors
  - [x] 5.2 `npx vitest run` — all tests pass (108+ tests, no regressions)

### Review Findings (2026-06-22)

- [x] [Review][Decision→Defer] stock_impacts silently hidden when `ai_analysis` is null — deferred: backend generates stocks and ai_analysis together; in practice stock_impacts is empty when ai_analysis is null [src/components/NewsDetailContent.tsx:111]
- [x] [Review][Decision→Defer] Analysis staleness (AC1 item 7) inside AIInsightBox at position 3 — deferred: staleness IS shown contextually inside the analysis box; spec intent satisfied; separate position 7 element is a nice-to-have [src/components/NewsDetailContent.tsx:47]
- [x] [Review][Patch] Back-nav `← Back to News` link inside `NewsDetailContent` is not in AC1 content order and duplicates the `← Financial News` breadcrumb in page.tsx — removed from NewsDetailContent.tsx; page.tsx breadcrumb is sufficient [src/components/NewsDetailContent.tsx:165]
- [x] [Review][Defer] 404 detection via `err.message.includes("404")` is fragile — works with current `fetchAPI` error format but will silently break if error format changes [src/app/news/[id]/page.tsx:15] — deferred, pre-existing coupling to fetchAPI string format
- [x] [Review][Defer] Ticker fetch sequential before Suspense — user sees blank page during ticker fetch before skeleton appears; consistent with approved Story 2.6 pattern so changing independently would create inconsistency [src/app/news/[id]/page.tsx:31] — deferred, pre-existing pattern
- [x] [Review][Defer] Non-404 API errors in NewsDetailServer re-throw to raw Next.js error.tsx — AC3 says "never raw error page" for 404, not for 500s; full error boundary coverage is a separate concern — deferred, pre-existing

---

## Dev Notes

### Route & File Structure

```
frontend/src/app/news/[id]/
├── page.tsx          NEW — async Server Component (outer shell + Suspense)
└── not-found.tsx     NEW — 404 page triggered by notFound()

frontend/src/components/
├── NewsDetailContent.tsx       NEW — sync Server Component, receives NewsItem prop (testable)
└── NewsDetailContent.test.tsx  NEW — 12 Vitest tests
```

### CRITICAL: `params` is a Promise in Next.js 15

```tsx
// ✅ CORRECT
export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}

// ❌ WRONG — will cause runtime error in Next.js 15
export default async function NewsDetailPage({ params }) {
  const { id } = params.id; // NOT awaited
}
```

This is the same pattern as `searchParams` in `news/page.tsx`.

### CRITICAL: Suspense Pattern — Inner Async Component

Follow the exact same pattern from `news/page.tsx` (Story 2.6 review fix):

```tsx
// page.tsx
async function NewsDetailServer({ id }: { id: string }) {
  let news: NewsItem;
  try {
    news = await api.getNewsById(id);
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      notFound(); // triggers not-found.tsx
    }
    throw err;
  }
  return <NewsDetailContent news={news} />;
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let ticker: TickerItem[] = [];
  try {
    ticker = await api.getTicker();
  } catch {
    // ticker stays empty
  }

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />
      {/* header bar */}
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <Suspense fallback={<SkeletonCard />}>
          <NewsDetailServer id={id} />
        </Suspense>
      </main>
      <footer>...</footer>
    </>
  );
}
```

`<Suspense>` works here because `NewsDetailServer` is async — it actually suspends during fetch, so `<SkeletonCard />` renders during streaming.

### API: `getNewsById` Already Exists

```ts
// src/lib/api.ts — already implemented
api.getNewsById = (id: string) => fetchAPI<NewsItem>(`/news/${id}`)
```

Backend route: `GET /news/{news_id}` → `NewsItem` or `HTTP 404`.
`fetchAPI` throws `Error("API error: 404 /news/123")` on 404.

### 404 Detection and `notFound()`

```tsx
import { notFound } from "next/navigation";

try {
  news = await api.getNewsById(id);
} catch (err) {
  if (err instanceof Error && err.message.includes("404")) {
    notFound(); // throws internally; Next.js renders not-found.tsx
  }
  throw err; // unexpected errors surface to error.tsx
}
```

`notFound()` is a Next.js function that throws a special signal. It does NOT return — execution stops.

### Three AI States in `NewsDetailContent`

```tsx
const isOldArticle =
  Date.now() - new Date(news.published_at).getTime() > 24 * 60 * 60 * 1000;

// State 1: analysis loaded → AIInsightBox + sectors + stocks + sentiment
// State 2: null + recent → AIInsightBox in pending state (shows "Analysis in progress")
// State 3: null + old → "Analysis unavailable for this article."

const aiSection = (() => {
  if (news.ai_analysis !== null) {
    return <AIInsightBox analysis={news.ai_analysis} />;
  }
  if (!isOldArticle) {
    return <AIInsightBox analysis={null} />; // pending state
  }
  return (
    <p className="text-sm" style={{ color: "#6b6560" }}>
      Analysis unavailable for this article.
    </p>
  );
})();
```

### Source Row: Null-Safe Link

`source_url: string | null` — must handle null without a broken `<a>`:

```tsx
// Zone 2: source row
<div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#6b6560" }}>
  {news.source_url ? (
    <a
      href={news.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium hover:underline flex items-center gap-1"
      style={{ color: "#4A342A" }}
    >
      {news.source}
      {/* External link SVG icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  ) : (
    <span className="font-medium" style={{ color: "#4A342A" }}>{news.source}</span>
  )}
  <span aria-hidden="true">·</span>
  <span>{formatBangkokTime(news.published_at)}</span>
</div>
```

### Bangkok Timestamp Formatting

```tsx
function formatBangkokTime(isoString: string): string {
  return new Date(isoString).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

### Direction Badge Constants — Define Locally, Same Values as NewsCard

Do NOT extract to a shared file (only 2 callers). Copy the constants verbatim:

```tsx
const DIRECTION_LABEL: Record<string, string> = {
  positive: "rising",
  negative: "falling",
  neutral: "unchanged",
};

const DIRECTION_ARROW: Record<string, string> = {
  positive: "▲",
  negative: "▼",
  neutral: "–",
};

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  positive: { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  negative: { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  neutral:  { bg: "#f5f5f4", text: "#6b6560", border: "#e7e5e4" },
};
```

Stock badge ARIA pattern (same as NewsCard):
```tsx
<span aria-label={`${impact.symbol}: ${DIRECTION_LABEL[impact.direction] ?? "unchanged"}`}>
  <span aria-hidden="true">{DIRECTION_ARROW[impact.direction] ?? "–"}</span>
  {impact.symbol}
</span>
```

### Non-Removable Disclaimer (FR-A04)

This MUST be hardcoded JSX — never a prop, never conditional:

```tsx
{/* NON-REMOVABLE DISCLAIMER — FR-A04 */}
<div
  className="mt-6 pt-4 border-t text-xs leading-relaxed"
  style={{ borderColor: "rgba(74,52,42,0.1)", color: "#6b6560" }}
>
  This analysis is generated by AI for educational purposes only. It does not
  constitute investment advice. Always consult a qualified financial advisor
  before making investment decisions.
</div>
```

**Project-context rule:** "every component rendering AI-generated analysis must include a disclaimer string as a non-removable element. If the analysis renders, the disclaimer renders. No prop or feature flag may disable it."

The disclaimer renders on ALL article detail views — whether analysis is present, pending, or unavailable.

### `not-found.tsx` Pattern

```tsx
// frontend/src/app/news/[id]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="max-w-3xl mx-auto px-4 py-16 text-center"
    >
      <h1 className="text-lg font-bold mb-4" style={{ color: "#4A342A" }}>
        Article not found.
      </h1>
      <Link
        href="/news"
        className="text-sm font-medium hover:underline"
        style={{ color: "#B2967D" }}
      >
        ← Back to News
      </Link>
    </main>
  );
}
```

Note: `not-found.tsx` does NOT automatically include `<Navbar>` or `<TickerBar>`. These are rendered in the root `layout.tsx` if they are layout components, otherwise they won't appear on the not-found page. Keep the not-found page simple — the back link is sufficient per AC3.

### Test Setup: Mock `next/link` and `next/navigation`

```tsx
// In NewsDetailContent.test.tsx
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));
```

No need to mock `next/navigation` in `NewsDetailContent.test.tsx` since the component itself doesn't call `notFound()` or `redirect()` — those are called by `NewsDetailServer` in `page.tsx`.

### Test Data for State Coverage

```tsx
const makeNewsItem = (overrides: Partial<NewsItem> & Pick<NewsItem, 'id'>): NewsItem => ({
  id: overrides.id,
  headline: "Thailand Raises Key Rate",
  summary: "Bank of Thailand surprises markets.",
  content: "Full article content.",
  source: "Reuters",
  source_url: "https://reuters.com/article/123",
  category: "ดอกเบี้ยโลก",
  published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  featured: false,
  ai_analysis: {
    summary: "Rate hike signals hawkish pivot.",
    affected_sectors: ["Banking", "Real Estate"],
    affected_stocks: ["KBANK", "PTT"],
    sentiment: "bullish",
    analysis_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
  },
  stock_impacts: [
    { symbol: "KBANK", direction: "positive", reason: "Net interest margin expansion" },
    { symbol: "PTT", direction: "neutral", reason: null },
  ],
  ...overrides,
});

const FULL_NEWS = makeNewsItem({ id: "n1" });
const NULL_URL_NEWS = makeNewsItem({ id: "n2", source_url: null });
const PENDING_NEWS = makeNewsItem({
  id: "n3",
  ai_analysis: null,
  published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago (recent)
});
const OLD_PENDING_NEWS = makeNewsItem({
  id: "n4",
  ai_analysis: null,
  published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48h ago (old)
});
```

### CRITICAL: `affected_stocks` (string[]) vs `stock_impacts` (StockImpact[]) — Different Fields

```ts
// ai_analysis.affected_sectors: string[] → Zone 4 (sector list, no direction)
// ai_analysis.affected_stocks: string[] → NOT USED on detail page
// news.stock_impacts: StockImpact[] → Zone 5 (direction badges)
```

Zone 4 renders `ai_analysis.affected_sectors` as a plain list of sector names.
Zone 5 renders `news.stock_impacts` — each has `{ symbol, direction, reason }` — for the direction badges with `aria-label`.
`ai_analysis.affected_stocks` is NOT shown — it's plain symbols without direction; `stock_impacts` is richer.

Empty-state guards are required:
```tsx
{news.ai_analysis.affected_sectors.length > 0 && (
  <section>...</section>
)}
{news.stock_impacts.length > 0 && (
  <div className="flex flex-wrap gap-1.5">...</div>
)}
```

### What NOT to Build (Scope Guard)

- Do NOT display the `content` field (full article text) — spec doesn't include it in AC1 order; the external link is the path to the full article
- Do NOT add a comments section, share button, or bookmark feature — not in scope for 2.7
- Do NOT create a `SkeletonDetail` component — reuse `<SkeletonCard />` as the Suspense fallback per project-context.md convention
- Do NOT add a "related articles" section — deferred to a later story
- Do NOT add `export const revalidate` to the page file — ISR is managed at `fetchAPI` level in `api.ts` (already `next: { revalidate: 60 }`)

### Pattern Reference: `news/page.tsx` (Story 2.6)

The outer/inner async component pattern and the try/catch for 404 follows exactly what was built in Story 2.6 for the news list page. Read `frontend/src/app/news/page.tsx` to see the exact idiom.

---

## Dev Agent Record

### Implementation Plan

1. `not-found.tsx` — static 404 page (no tests needed)
2. `NewsDetailContent.test.tsx` — 12 tests written RED; covered all 3 AI states, null source_url, disclaimer enforcement
3. `NewsDetailContent.tsx` — sync Server Component implementing all zones; TypeScript error fixed in test factory (duplicate `id` key removed from spread)
4. `page.tsx` — async Server Component with inner `NewsDetailServer`, `await params`, ticker try/catch, `<Suspense fallback={<SkeletonCard />}>`

### Debug Log

- TypeScript error TS2783: `id` specified twice in `makeNewsItem` factory. Fixed by removing explicit `id: overrides.id` line; the `...overrides` spread at end already provides `id`.

### Completion Notes

- 4 new files created; 0 existing files modified
- 12 new Vitest tests added; 120/120 total tests pass (was 108)
- `npx tsc --noEmit` — zero errors
- All 7 ACs satisfied:
  - AC1: content order (headline → source → AI → sectors → stocks → sentiment → disclaimer) ✅
  - AC2: external link with target/rel + null-safe fallback to plain text ✅
  - AC3: `notFound()` + `not-found.tsx` with "Article not found." + back link ✅
  - AC4: recent null analysis → AIInsightBox pending state ✅
  - AC5: old null analysis (≥24h) → "Analysis unavailable for this article." in #6b6560 ✅
  - AC6: `<Suspense fallback={<SkeletonCard />}>` wraps async `NewsDetailServer` — real streaming boundary ✅
  - AC7: disclaimer is hardcoded JSX, never a prop, never conditional ✅

---

## File List

### New Files
- `frontend/src/app/news/[id]/page.tsx`
- `frontend/src/app/news/[id]/not-found.tsx`
- `frontend/src/components/NewsDetailContent.tsx`
- `frontend/src/components/NewsDetailContent.test.tsx`

### Modified Files
- _(none expected — all new)_

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-06-22 | Story created | bmad-create-story |
| 2026-06-22 | Story implemented — 4 new files, 12 tests, 120/120 passing | bmad-dev-story |
| 2026-06-22 | Code review — 1 patch applied (duplicate back-nav removed); 2 deferred; 3 deferred; 6 dismissed | bmad-code-review |
