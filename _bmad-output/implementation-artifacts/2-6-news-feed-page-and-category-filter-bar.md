---
status: done
epic: 2
story: 5
story_key: "2-6-news-feed-page-and-category-filter-bar"
created: 2026-06-21
baseline_commit: 5c7086ed81b3614beaee68a1853d196af04b8d69
---

# Story 2.6: News Feed Page & Category Filter Bar

**Status:** done

## Story

As a retail investor,
I want to browse and filter news by category with clear loading, staleness, and error feedback,
So that I always know whether the content I see is current and can find articles relevant to my interests.

## Acceptance Criteria

### AC1 — Default render: "All" selected, articles sorted by date

**Given** the `/news` page loads
**When** it renders
**Then** the Category Filter Bar appears above the feed with "All" selected by default
**And** news items are sorted by `published_at` descending, each rendered as a `NewsCard`

### AC2 — Category Filter Bar ARIA and keyboard navigation

**Given** the Category Filter Bar
**When** it renders
**Then** the container has `role="tablist"`, each tab has `role="tab"` + `aria-selected="true/false"`
**And** left/right arrow keys move focus between tabs without leaving the tab group
**And** each tab is at least `44px` tall

### AC3 — URL-driven category filter with back navigation

**Given** the user activates the "Energy" tab
**When** the tab is clicked or activated via Enter/Space
**Then** the URL updates to `/news?category=energy`
**And** the feed re-renders server-side to show only Energy articles
**And** navigating back restores the "Energy" filter from the URL param

### AC4 — Staleness banner (60 min during market hours)

**Given** the most recent article in the active category is > 60 minutes old during 09:00–18:00 Bangkok time
**When** the feed renders
**Then** an amber banner appears above the feed: "Last updated [time] · New articles may be delayed"
**And** the banner uses `staleness` color (`#d97706`)
**And** the banner does NOT appear outside market hours even if articles are old

### AC5 — Suspense skeleton (no spinner, no text)

**Given** all async data-fetching components on `/news`
**When** the page loads
**Then** each is wrapped in `<Suspense fallback={<SkeletonCard />}>`
**And** `SkeletonCard` shows `animate-pulse` linen (`#F5F1EA`) blocks at approximate content dimensions
**And** there is NO spinner and NO "Loading..." text

### AC6 — Error state: timestamped, never silent

**Given** the news API returns an error
**When** the feed renders
**Then** it shows: "Market data temporarily unavailable · Last attempted [time]" with a timestamp
**And** no empty list or silent blank space is shown

### AC7 — Empty category state

**Given** a category with no articles
**When** the feed renders
**Then** it shows: "No new articles in [Category] today. · Check back during market hours (09:00–18:00 Bangkok time)."
**And** it is never an empty `<ul>` or blank space

### AC8 — Search input accessibility

**Given** the Search input
**When** it renders
**Then** it has `aria-label="Search news, stocks, and sectors"` (never placeholder-only)
**And** the espresso double-ring focus indicator is visible on focus (`outline: 2px solid #4A342A`, `outline-offset: 2px`)

## Tasks / Subtasks

- [x] Task 1: Create `SkeletonCard.tsx` component (AC: 5)
  - [x] 1.1 Create `frontend/src/components/SkeletonCard.tsx` — renders linen `animate-pulse` blocks mimicking a news card: a tall headline block, a shorter insight block, two narrow badge blocks, an `<hr>`, and a footer row
  - [x] 1.2 Use Tailwind classes only: `animate-pulse`, `bg-linen` (`#F5F1EA`), `rounded`, `h-*`, `w-*` — no inline styles needed
  - [x] 1.3 Wrap in `<div role="status" aria-label="Loading news">` for screen reader announcement
  - [x] 1.4 Create `frontend/src/components/SkeletonCard.test.tsx` — tests: renders without throwing, has role="status"

- [x] Task 2: Create `CategoryFilterBar.tsx` component (AC: 2, 3)
  - [x] 2.1 Create `frontend/src/components/CategoryFilterBar.tsx` as a `"use client"` component
  - [x] 2.2 Props: `{ categories: readonly CategoryTab[], activeSlug: string }` where `CategoryTab = { slug: string; label: string; thaiName: string | null }`
  - [x] 2.3 Use `useRouter()` from `next/navigation` and `useSearchParams()` to read current category
  - [x] 2.4 Container: `<div role="tablist" aria-label="News categories" className="flex gap-1 overflow-x-auto py-1 mb-4">`
  - [x] 2.5 Each tab: `<button role="tab" aria-selected={isActive} onClick={() => handleSelect(slug)}` — style matches current `NewsFeed` pill buttons but now with tablist semantics
  - [x] 2.6 Keyboard: `onKeyDown` handler — `ArrowRight` moves focus to next tab, `ArrowLeft` moves to previous, wrapping at ends. `Enter`/`Space` activate the focused tab (already handled by button default for Space; add Enter explicitly)
  - [x] 2.7 Tab height minimum 44px: `className="min-h-[44px] px-4 py-2 ..."`
  - [x] 2.8 `handleSelect(slug)`: if slug is "all" → `router.push('/news')`, else → `router.push('/news?category=' + slug)`
  - [x] 2.9 Active tab style: `backgroundColor: "#4A342A", color: "#D7C9B8", borderColor: "#4A342A"` — same as current NewsFeed active style
  - [x] 2.10 Inactive tab style: `backgroundColor: "white", color: "#4A342A", borderColor: "rgba(74,52,42,0.2)"` — same as current
  - [x] 2.11 Create `frontend/src/components/CategoryFilterBar.test.tsx` with `vi.mock('next/navigation', ...)` — tests: renders tablist, aria-selected correct, keyboard navigation moves focus, Enter/Space activates tab

- [x] Task 3: Update `frontend/src/app/news/page.tsx` (AC: 1, 3, 4, 5, 6)
  - [x] 3.1 Change signature to async page with searchParams: `export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string }> })`
  - [x] 3.2 `const { category } = await searchParams;` — Next.js 15 requires awaiting searchParams
  - [x] 3.3 Map URL slug → Thai category name using `CATEGORY_SLUG_TO_THAI` constant (see Dev Notes)
  - [x] 3.4 Call `api.getNews(thaiCategory)` — pass Thai name if slug present, `undefined` if "all"
  - [x] 3.5 Wrap the news section in `<Suspense fallback={<SkeletonCard />}>` (import SkeletonCard)
  - [x] 3.6 Render `<CategoryFilterBar categories={CATEGORY_TABS} activeSlug={category ?? 'all'} />` above the Suspense boundary
  - [x] 3.7 Remove the old static "STORIES TODAY" / "15 MIN REFRESH RATE" header widgets (deferred as inaccurate in deferred-work.md D4/D5 — replace with a cleaner category context header)
  - [x] 3.8 Pass `newsResponse.items` and `newsResponse.last_updated` to `NewsFeed`
  - [x] 3.9 Wrap data fetch in try/catch: on API error, pass `error` prop to `NewsFeed` with `new Date().toISOString()` as error timestamp

- [x] Task 4: Update `NewsFeed.tsx` (AC: 1, 4, 6, 7, 8)
  - [x] 4.1 REMOVE: internal category filter state (`useState`, category buttons, filtered array logic) — filtering is now server-side/URL-driven
  - [x] 4.2 REMOVE: empty message `<p>ไม่พบข่าวในหมวดนี้</p>` — replaced by English empty state
  - [x] 4.3 UPDATE props interface: `{ news: NewsItem[], last_updated: string | null, activeCategory: string, error: string | null }`
  - [x] 4.4 Keep `"use client"` directive (search input interaction will need it)
  - [x] 4.5 Add staleness banner: compute `isStale(last_updated)` using `isMarketHours()` helper (see Dev Notes) — if stale, render amber banner above the feed
  - [x] 4.6 Staleness banner markup: `<div role="alert" ...>Last updated [formattedTime] · New articles may be delayed</div>`
  - [x] 4.7 Add search input above the cards: `<input type="search" aria-label="Search news, stocks, and sectors" .../>`
  - [x] 4.8 Error state (when `error` prop is non-null): render `<div role="alert">Market data temporarily unavailable · Last attempted [formattedTime(error)]</div>` instead of cards
  - [x] 4.9 Empty state (when `news.length === 0` and no error): render English empty message with activeCategory name
  - [x] 4.10 Cards: `<div className="space-y-4">{news.map((item) => <NewsCard key={item.id} news={item} />)}</div>`

- [x] Task 5: Update `NewsFeed.test.tsx` (AC: 1, 4, 6, 7, 8)
  - [x] 5.1 Update props in all `render(<NewsFeed ... />)` calls to include `last_updated`, `activeCategory`, `error`
  - [x] 5.2 REMOVE tests for internal category filtering (those behaviors move to `CategoryFilterBar.test.tsx`)
  - [x] 5.3 Keep: renders all news cards, renders with empty array
  - [x] 5.4 UPDATE: empty message test — now expects English "No new articles in [Category] today."
  - [x] 5.5 ADD: staleness banner appears when `last_updated` is >60 min ago during market hours
  - [x] 5.6 ADD: staleness banner does NOT appear outside market hours
  - [x] 5.7 ADD: error state renders "Market data temporarily unavailable" message
  - [x] 5.8 ADD: search input has `aria-label="Search news, stocks, and sectors"`
  - [x] 5.9 Full test suite: 108/108 pass, no regressions

### Review Findings

- [x] [Review][Patch] P1: Promise.all atomically discards fetched news when ticker fails — fix with Promise.allSettled or independent try/catch [`src/app/news/page.tsx:42`]
- [x] [Review][Patch] P2: Suspense fallback never renders — SkeletonCard is dead code; NewsFeed receives resolved props and never suspends, AC5 violated [`src/app/news/page.tsx:74`]
- [x] [Review][Patch] P3: Unknown category slug silently shows all news — no slug allowlist guard before API call, confusing UX [`src/app/news/page.tsx:33`]
- [x] [Review][Patch] P4: Search input missing espresso focus ring — browser default only; AC8 "espresso double-ring focus indicator" not satisfied [`src/components/NewsFeed.tsx:38`]
- [x] [Review][Defer] formatTime(error) invalid date risk — error: string|null has no ISO constraint; non-ISO value renders "Invalid Date" [`src/components/NewsFeed.tsx:70`] — deferred, pre-existing type contract
- [x] [Review][Defer] tabRefs.current stale on categories length change — stale DOM refs; categories is currently static constant [`src/components/CategoryFilterBar.tsx:18`] — deferred, pre-existing
- [x] [Review][Defer] isMarketHours() client-side SSR/hydration mismatch near market open/close boundary [`src/components/NewsFeed.tsx:13`] — deferred, very narrow window
- [x] [Review][Defer] app/page.tsx has no error handling around Promise.all — pre-existing, out of Story 2.6 scope [`src/app/page.tsx:11`] — deferred, pre-existing
- [x] [Review][Defer] isMarketHours() ignores weekends — spec says "09:00–18:00 Bangkok" without weekday qualification [`src/components/NewsFeed.tsx:13`] — deferred, spec ambiguity

## Dev Notes

### Architecture: Server-side filtering via URL → no client state for categories

This is a **Next.js 15 App Router** pattern. Category selection is **URL-driven**, not useState-driven:

1. User clicks "Energy" tab → `router.push('/news?category=energy')`
2. Next.js performs a soft navigation (client-side routing)
3. `page.tsx` re-runs on the server with `searchParams.category = 'energy'`
4. Server calls `api.getNews('พลังงาน')` — returns only Energy articles
5. `<Suspense fallback={<SkeletonCard />}>` shows skeleton during streaming
6. `NewsFeed` renders the pre-filtered array

**Why this beats client-side filtering:** Per-category error isolation, bookmark/share support, back navigation works natively, no hydration mismatch.

### Next.js 15: `searchParams` is a Promise — MUST await

```tsx
// page.tsx
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  // ...
}
```

In Next.js 14, `searchParams` was a plain object. **In Next.js 15, it is a Promise.** Missing `await` causes a runtime error. This is a common mistake.

### Category slug ↔ Thai name mapping

Define this constant in BOTH `page.tsx` and `CategoryFilterBar.tsx` (only 2 callers — below 3-caller extraction threshold):

```ts
const CATEGORY_TABS = [
  { slug: "all",      label: "All",          thaiName: null },
  { slug: "rates",    label: "Rates",        thaiName: "ดอกเบี้ยโลก" },
  { slug: "energy",   label: "Energy",       thaiName: "พลังงาน" },
  { slug: "set",      label: "SET",          thaiName: "หุ้นไทย" },
  { slug: "tech",     label: "Tech",         thaiName: "เทคโนโลยี" },
  { slug: "global",   label: "Global",       thaiName: "ตลาดโลก" },
] as const;

type CategoryTab = typeof CATEGORY_TABS[number];

// Reverse map: slug → Thai name (for API call)
const SLUG_TO_THAI: Record<string, string> = {
  rates:  "ดอกเบี้ยโลก",
  energy: "พลังงาน",
  set:    "หุ้นไทย",
  tech:   "เทคโนโลยี",
  global: "ตลาดโลก",
};
```

The backend `NewsCategory` type is Thai: `"ดอกเบี้ยโลก" | "พลังงาน" | "หุ้นไทย" | "เทคโนโลยี" | "ตลาดโลก"`. The URL uses lowercase English slugs. The mapping is the only translation layer.

### Staleness logic: market hours + 60-minute threshold

```ts
function isMarketHours(): boolean {
  const now = new Date();
  const bangkokHour = (now.getUTCHours() + 7) % 24;
  return bangkokHour >= 9 && bangkokHour < 18;
}

function isStale(lastUpdated: string | null): boolean {
  if (!lastUpdated || !isMarketHours()) return false;
  const minutesOld = Math.floor(
    Math.max(0, Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60)
  );
  return minutesOld > 60;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

The staleness banner text: `Last updated ${formatTime(last_updated)} · New articles may be delayed`

`last_updated` comes from `NewsListResponse.last_updated` — the `published_at` of the most recent article in the filtered set. Already in `types/index.ts` as `string | null`.

### SkeletonCard: approximate NewsCard proportions

```tsx
export default function SkeletonCard() {
  return (
    <div role="status" aria-label="Loading news"
      className="bg-white rounded-xl p-5 animate-pulse"
      style={{ border: "1px solid rgba(74,52,42,0.1)" }}>
      {/* headline block */}
      <div className="h-5 bg-linen rounded w-3/4 mb-2" />
      <div className="h-5 bg-linen rounded w-1/2 mb-4" />
      {/* insight block */}
      <div className="h-16 bg-linen rounded mb-3" />
      {/* badge row */}
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-linen rounded w-14" />
        <div className="h-5 bg-linen rounded w-14" />
      </div>
      <hr style={{ borderColor: "rgba(74,52,42,0.1)" }} className="my-2" />
      {/* footer */}
      <div className="flex justify-between">
        <div className="h-3 bg-linen rounded w-24" />
        <div className="h-3 bg-linen rounded w-12" />
      </div>
    </div>
  );
}
```

`bg-linen` maps to `#F5F1EA` via `tailwind.config.ts`. Use the Tailwind token, not an inline hex.

### CategoryFilterBar: keyboard navigation pattern

```tsx
"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';

export default function CategoryFilterBar({ categories, activeSlug }: Props) {
  const router = useRouter();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % categories.length;
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + categories.length) % categories.length;
      tabRefs.current[prev]?.focus();
    }
  };

  const handleSelect = (slug: string) => {
    if (slug === 'all') router.push('/news');
    else router.push(`/news?category=${slug}`);
  };

  return (
    <div role="tablist" aria-label="News categories" className="flex gap-1 overflow-x-auto py-1 mb-4">
      {categories.map((cat, i) => (
        <button
          key={cat.slug}
          ref={(el) => { tabRefs.current[i] = el; }}
          role="tab"
          aria-selected={cat.slug === activeSlug}
          onClick={() => handleSelect(cat.slug)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="flex-shrink-0 min-h-[44px] px-4 py-2 rounded-full text-sm font-medium border transition-colors"
          style={
            cat.slug === activeSlug
              ? { backgroundColor: "#4A342A", color: "#D7C9B8", borderColor: "#4A342A" }
              : { backgroundColor: "white", color: "#4A342A", borderColor: "rgba(74,52,42,0.2)" }
          }
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
```

### page.tsx structure after update

```tsx
import { Suspense } from 'react';
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import NewsFeed from "@/components/NewsFeed";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import SkeletonCard from "@/components/SkeletonCard";

const CATEGORY_TABS = [...] as const; // same as above
const SLUG_TO_THAI: Record<string, string> = {...};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const thaiCategory = category ? SLUG_TO_THAI[category] : undefined;

  let newsResponse;
  let fetchError: string | null = null;
  try {
    newsResponse = await api.getNews(thaiCategory);
  } catch {
    fetchError = new Date().toISOString();
    newsResponse = { items: [], last_updated: null };
  }

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />  {/* keep TickerBar */}

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <CategoryFilterBar categories={CATEGORY_TABS} activeSlug={category ?? 'all'} />
        <Suspense fallback={<SkeletonCard />}>
          <NewsFeed
            news={newsResponse.items}
            last_updated={newsResponse.last_updated}
            activeCategory={category ? (CATEGORY_TABS.find(c => c.slug === category)?.label ?? category) : 'all'}
            error={fetchError}
          />
        </Suspense>
      </main>
      {/* footer unchanged */}
    </>
  );
}
```

Note: `TickerBar` still needs its own `api.getTicker()` call. Keep that. Don't drop TickerBar from the page.

### NewsFeed.tsx: "use client" stays, filter state removed

The current `NewsFeed.tsx` has `"use client"` and internal `useState` for category filtering. This story:
- REMOVES the `useState(ALL)` category state
- REMOVES the filter buttons loop
- REMOVES the `filtered` array computation
- REMOVES the Thai empty message
- KEEPS `"use client"` (search input may need it; also needed to call Date.now() for staleness)
- ADDS staleness banner, search input, error/empty states in English

The `categories` local array and `const ALL = "ทั้งหมด"` are deleted entirely — category filtering is now `CategoryFilterBar`'s concern.

### Test mocks for Next.js navigation

In `CategoryFilterBar.test.tsx`, mock `next/navigation`:

```tsx
const mockPush = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));
```

Same pattern used in `Navbar.test.tsx` for `usePathname`.

In `NewsFeed.test.tsx`, the component no longer calls any Next.js navigation hooks, so no mock needed there.

### Staleness test: freeze time to Bangkok market hours

```tsx
it('shows staleness banner when last_updated is >60 min ago during market hours', () => {
  // Thursday 10:00 Bangkok time = 03:00 UTC
  const now = new Date('2026-06-18T03:00:00Z').getTime();
  vi.useFakeTimers({ now });
  const staleTime = new Date(now - 90 * 60 * 1000).toISOString(); // 90 min ago
  render(<NewsFeed news={NEWS} last_updated={staleTime} activeCategory="All" error={null} />)
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText(/New articles may be delayed/)).toBeInTheDocument();
  vi.useRealTimers();
});
```

```tsx
it('does NOT show staleness banner outside market hours', () => {
  // 20:00 Bangkok time = 13:00 UTC
  const now = new Date('2026-06-18T13:00:00Z').getTime();
  vi.useFakeTimers({ now });
  const staleTime = new Date(now - 90 * 60 * 1000).toISOString();
  render(<NewsFeed news={NEWS} last_updated={staleTime} activeCategory="All" error={null} />)
  expect(screen.queryByRole('alert')).toBeNull();
  vi.useRealTimers();
});
```

### What NOT to do

- Do NOT read `searchParams` from `useSearchParams()` in `NewsFeed.tsx` — pass active category as a prop from `page.tsx`
- Do NOT add `"use client"` to `page.tsx` — it is a Server Component
- Do NOT use `<a>` tags for category tabs — use `<button>` with `onClick` → `router.push()`
- Do NOT use a spinner or "Loading..." text in `SkeletonCard` — violates AC5
- Do NOT render Thai text in empty/error states — AC6/AC7 spec English text
- Do NOT forget `await searchParams` in `page.tsx` — this will cause a Next.js 15 runtime error
- Do NOT delete the TickerBar from the page — it was added in Story 2.3 and must be preserved

### Preserved behaviors (do NOT regress)

- `<Navbar />` and `<TickerBar>` at the top of the page
- Footer (espresso background, disclaimer)
- `max-w-3xl mx-auto px-4 py-6` main content padding from Story 2.3
- `id="main-content"` skip-link target on `<main>` from Story 2.3
- All 88 tests from Stories 2.1–2.5 still pass

### Files involved

| File | Type | Change |
|---|---|---|
| `frontend/src/components/SkeletonCard.tsx` | NEW | Skeleton loading card |
| `frontend/src/components/SkeletonCard.test.tsx` | NEW | Tests for SkeletonCard |
| `frontend/src/components/CategoryFilterBar.tsx` | NEW | Tablist with keyboard nav + URL push |
| `frontend/src/components/CategoryFilterBar.test.tsx` | NEW | Tests for CategoryFilterBar |
| `frontend/src/components/NewsFeed.tsx` | UPDATE | Remove filter state, add staleness/error/empty/search |
| `frontend/src/components/NewsFeed.test.tsx` | UPDATE | Remove filter tests, add staleness/error/empty tests |
| `frontend/src/app/news/page.tsx` | UPDATE | Async searchParams, Suspense, CategoryFilterBar |

### Test run commands

```bash
cd frontend && npx vitest run
cd frontend && npx tsc --noEmit
```

### References

- `frontend/src/components/NewsFeed.tsx` (current, to be gutted)
- `frontend/src/components/NewsFeed.test.tsx` (current, to be updated)
- `frontend/src/app/news/page.tsx` (current, to be updated)
- `frontend/src/components/NewsCard.tsx` (Story 2.5 — preserved unchanged)
- `frontend/src/lib/api.ts` — `api.getNews(category?: string)` already supports optional category
- `frontend/src/types/index.ts` — `NewsListResponse.last_updated: string | null` already typed
- `frontend/tailwind.config.ts` — `linen: "#F5F1EA"`, `staleness: "#d97706"`, `espresso: "#4A342A"` tokens
- Story 2.3 dev notes: layout, skip-link, BottomTabBar — preserved
- Story 2.5 dev notes: NewsCard ARIA patterns — replicated in CategoryFilterBar

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed `typeof import("@/types").NewsItem` inline type annotation → proper `import { NewsItem, TickerItem }` at top of page.tsx
- Fixed `src/app/page.tsx` (home page) NewsFeed call to pass new required props `last_updated`, `activeCategory`, `error`

### Completion Notes List

- Created `SkeletonCard.tsx`: linen `animate-pulse` blocks, `role="status" aria-label="Loading news"`, no spinner/text
- Created `CategoryFilterBar.tsx` ("use client"): `role="tablist"`, `role="tab"` + `aria-selected`, `min-h-[44px]`, ArrowLeft/ArrowRight keyboard nav with wrapping, Enter activates tab, `router.push('/news?category=slug')` or `/news` for All
- Updated `news/page.tsx`: `await searchParams` (Next.js 15 pattern), `SLUG_TO_THAI` mapping, `api.getNews(thaiCategory)`, try/catch for error state, `<Suspense fallback={<SkeletonCard />}>`, `<CategoryFilterBar>` above Suspense, removed inaccurate STORIES TODAY/15 MIN REFRESH RATE widgets
- Updated `NewsFeed.tsx`: removed internal filter state/buttons, added `isMarketHours()` + `isStale()` helpers, staleness banner with Bangkok time format, search input with `aria-label`, error state with timestamp, English empty state with `activeCategory` name
- Fixed `app/page.tsx` (home page): updated NewsFeed call with new required props
- Test count: 108/108 (was 88; +16 new: 4 SkeletonCard + 12 CategoryFilterBar; NewsFeed kept 10 tests replacing old 5)
- TypeScript: `npx tsc --noEmit` clean

### File List

- `frontend/src/components/SkeletonCard.tsx` (NEW)
- `frontend/src/components/SkeletonCard.test.tsx` (NEW)
- `frontend/src/components/CategoryFilterBar.tsx` (NEW)
- `frontend/src/components/CategoryFilterBar.test.tsx` (NEW)
- `frontend/src/components/NewsFeed.tsx` (UPDATE — full rebuild)
- `frontend/src/components/NewsFeed.test.tsx` (UPDATE)
- `frontend/src/app/news/page.tsx` (UPDATE)
- `frontend/src/app/page.tsx` (UPDATE — NewsFeed prop fix)

### Change Log

- 2026-06-21: Story 2.6 implemented — URL-driven category filtering, SkeletonCard, CategoryFilterBar with ARIA tablist + keyboard nav, staleness banner, search input, error/empty states
