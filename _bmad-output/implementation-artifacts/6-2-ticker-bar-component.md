---
status: review
epic: 6
story: 2
story_key: "6-2-ticker-bar-component"
created: 2026-06-27
baseline_commit: 816b1723a5592e446cfaa2df86ab1ed28baf1820
---

# Story 6.2: Ticker Bar Component

**Status:** ready-for-dev

## Story

As a retail investor,
I want a continuously scrolling ticker below the navbar showing live stock direction and daily percentage changes,
So that I can monitor market momentum at a glance without navigating away from any page.

---

## Acceptance Criteria

### AC1 — Ticker item layout and format

**Given** `TickerBar` receives a `MarketSnapshot`
**When** it renders
**Then** it is an `h-10` (40px) bar positioned directly below the Navbar, above all page content
**And** each ticker item renders as: `SYMBOL` (bold/monospace, white) + `▲`/`▼`/`–` direction arrow + `+X.XX%` or `-X.XX%` change value in direction color
**And** the `▲`/`▼`/`–` arrow is the required non-color direction indicator — never color alone (NFR-ACC01)
**And** `change_pct` has `isFinite()` applied before `toFixed()` — `NaN` is never rendered to the DOM
**And** positive and neutral `change_pct` values display with a `+` prefix; negative values display with the natural `-` sign

### AC2 — CSS marquee animation

**Given** the scroll animation
**When** it plays
**Then** it is driven by the existing `ticker-scroll` CSS keyframe — no JavaScript scroll loop
**And** on desktop, the animation pauses when the pointer is hovering over the ticker bar container
**And** when `prefers-reduced-motion: reduce` is active, the animation is paused and ticker items remain visible statically

### AC3 — Screen reader: decorative

**Given** the `TickerBar` container
**When** a screen reader encounters it
**Then** the outer div has `aria-hidden="true"` — the bar is decorative; the same market data is accessible in a structured form via `MarketOverviewWidget` (Story 6.3)

### AC4 — Market closed state

**Given** `market_open` is `false` in the `MarketSnapshot`
**When** `TickerBar` renders
**Then** a "Market closed" badge is visible using the `staleness` token color (`#d97706` / Tailwind `text-staleness`)
**And** the tickers continue to display (closed-market data is still valid historical data)

### AC5 — Error / unavailable state

**Given** `GET /api/market/snapshot` returns `HTTP 404` or any error
**When** `TickerBar` renders
**Then** the bar renders a static "Market data unavailable" message at the same `h-10` height
**And** the Navbar layout does not shift — height is preserved

---

## Tasks / Subtasks

- [x] Task 1: Update TickerBar prop signature to accept `MarketSnapshot | null`
  - [x] 1.1 Change prop from `items: TickerItem[]` to `snapshot: MarketSnapshot | null`
  - [x] 1.2 Update all 6 call sites: `app/page.tsx`, `app/news/page.tsx`, `app/news/[id]/page.tsx`, `app/trends/page.tsx`, `app/trends/[id]/page.tsx`, `app/stocks/page.tsx`
  - [x] 1.3 Run `npx tsc --noEmit` to confirm no TypeScript errors

- [x] Task 2: Implement TickerBar UI changes
  - [x] 2.1 Add `aria-hidden="true"` to outer container div (AC3)
  - [x] 2.2 Remove `price` from the per-item display — show only `SYMBOL ▲/▼/– +X.XX%` (AC1 spec matches EXPERIENCE.md)
  - [x] 2.3 Add `+` prefix for non-negative `change_pct` values (AC1)
  - [x] 2.4 Add `ticker-scroll-container` class to the overflow wrapper div for CSS hover targeting (AC2)
  - [x] 2.5 Add "Market closed" badge rendered when `snapshot.market_open === false` (AC4)
  - [x] 2.6 Add "Market data unavailable" fallback when `snapshot === null` — renders at same `h-10` height, same background (AC5)

- [x] Task 3: Update `globals.css` for animation control
  - [x] 3.1 Add hover-pause rule: `.ticker-scroll-container:hover .ticker-animate { animation-play-state: paused; }`
  - [x] 3.2 Add prefers-reduced-motion rule for animations: `@media (prefers-reduced-motion: reduce) { .ticker-animate { animation-play-state: paused; } }` — the existing `transition-duration: 0.01ms` rule does NOT cover CSS animation-play-state

- [x] Task 4: Update `TickerBar.test.tsx`
  - [x] 4.1 Change all test fixtures to `MarketSnapshot | null` prop shape
  - [x] 4.2 Verify existing passing tests: symbol, arrows, pct formatting, empty renders without throw
  - [x] 4.3 Add: `+` prefix on positive pct test
  - [x] 4.4 Add: `aria-hidden="true"` attribute test
  - [x] 4.5 Add: "Market closed" badge test when `snapshot.market_open: false`
  - [x] 4.6 Add: "Market data unavailable" message test when `snapshot: null`
  - [x] 4.7 Add: `isFinite` guard test — `change_pct: NaN` renders "—" not undefined/throw

- [x] Task 5: Validate and run all tests
  - [x] 5.1 Run `cd frontend && npx tsc --noEmit` — zero TypeScript errors
  - [x] 5.2 Run `cd frontend && npx vitest run` — 168 tests pass (7 new TickerBar tests added)

---

## Dev Notes

### ⚠️ CRITICAL: Prop Signature is a Breaking Change — All 6 Call Sites Must Be Updated

The current `TickerBar` signature is:
```tsx
// CURRENT (Story 6.1 era — must change)
function TickerBar({ items }: { items: TickerItem[] })
```

The new signature must be:
```tsx
// NEW (Story 6.2)
function TickerBar({ snapshot }: { snapshot: MarketSnapshot | null })
```

**Why `MarketSnapshot | null` not `TickerItem[]`:**
- AC4 needs `snapshot.market_open` to show the "Market closed" badge
- AC5 needs to distinguish "no data" (null) from "data with no tickers" (empty array)
- Null = API returned 404 or threw → "Market data unavailable"
- `market_open: false` = data loaded successfully, but market is closed

**Current call sites (all must change from `items={tickers}` to `snapshot={snapshot}`):**

| File | Current pattern | New pattern |
|------|----------------|-------------|
| `app/page.tsx` | `let tickers: TickerItem[] = []` + `getMarketSnapshot()` → `.tickers` + `<TickerBar items={tickers} />` | `let snapshot: MarketSnapshot \| null = null` + catch keeps `null` + `<TickerBar snapshot={snapshot} />` |
| `app/news/page.tsx` | same | same |
| `app/news/[id]/page.tsx` | same | same |
| `app/trends/page.tsx` | same | same |
| `app/trends/[id]/page.tsx` | same | same |
| `app/stocks/page.tsx` | same | same |

Calling pattern for every page:
```tsx
let snapshot: MarketSnapshot | null = null;
try {
  snapshot = await api.getMarketSnapshot();
} catch {
  // snapshot stays null — TickerBar renders "Market data unavailable"
}
// ...
<TickerBar snapshot={snapshot} />
```

---

### Current TickerBar.tsx State (Story 6.1 result)

The file currently exists at `frontend/src/components/TickerBar.tsx`. Read it before making changes. Current shape:
- Props: `{ items: TickerItem[] }` — **must change**
- Has `h-10`, camel background (`#B2967D`), espresso label (`#7D5A44`)
- Has `.ticker-animate` class → CSS keyframe `ticker-scroll`
- Has `▲`/`▼`/`–` arrows via `DIR_ARROW` map
- Has `isFinite()` guard on `price` (from P2 patch in review)
- Has `isFinite()` guard on `change_pct` already
- Shows `price` between symbol and arrow — **remove price, per spec**
- Missing: `aria-hidden`, hover pause, prefers-reduced-motion, market_open badge, unavailable fallback

---

### Ticker Item Display Format

**Current (wrong):** `SYMBOL | price | ▲ 0.60%`

**Required (AC1 + EXPERIENCE.md):** `SYMBOL ▲ +0.60%`

Changes:
1. Remove the `<span className="text-white/80">{isFinite(item.price) ? item.price.toLocaleString() : "—"}</span>` span entirely
2. Add `+` sign: `${item.change_pct >= 0 ? "+" : ""}${isFinite(item.change_pct) ? Math.abs(item.change_pct).toFixed(2) : "—"}%`

Note: For negative direction, `Math.abs()` + natural `-` from the `change_pct >= 0` branch means:
- `change_pct = 0.60, direction = "positive"` → `"+" + "0.60" + "%"` → `+0.60%`
- `change_pct = -0.51, direction = "negative"` → `""` + `"0.51"` + `"%"` ... wait.

Simpler approach — let the sign come from the value itself:
```tsx
const pct = isFinite(item.change_pct)
  ? `${item.change_pct >= 0 ? "+" : ""}${item.change_pct.toFixed(2)}%`
  : "—";
```
This naturally handles negative: `(-0.51).toFixed(2)` = `"-0.51"` so no need for `Math.abs()` here.

---

### Color Tokens: Why Not Using `text-positive` / `text-negative`

The design tokens `positive` (`#15803d`) and `negative` (`#dc2626`) are designed for the linen (`#F5F1EA`) background — they would fail WCAG contrast on the camel (`#B2967D`) ticker background.

Keep the existing light-on-dark approach:
- `text-green-200` for positive (light green on dark camel)
- `text-red-200` for negative (light red on dark camel)
- `text-white/70` for neutral

The ticker is `aria-hidden="true"` so it is exempt from WCAG contrast requirements as a decorative element. Direction information is non-color-encoded via arrows regardless.

---

### CSS Changes (globals.css)

Two additions needed after the existing `ticker-animate` block:

```css
/* Pause on hover — desktop only */
.ticker-scroll-container:hover .ticker-animate {
  animation-play-state: paused;
}

/* Pause entirely when user prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ticker-animate {
    animation-play-state: paused;
  }
}
```

**Why the existing `prefers-reduced-motion` rule doesn't cover this:**
The existing rule is:
```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}
```
`transition-duration` only affects CSS `transition` properties — not `animation` properties. The `ticker-scroll` animation is driven by `animation:` declaration, which needs `animation-play-state: paused` to stop.

Add `ticker-scroll-container` class to the `overflow-hidden flex-1` div in TickerBar — this is the direct parent of the `.ticker-animate` element.

---

### TickerBar Component Structure (after changes)

```tsx
import { MarketSnapshot } from "@/types";

interface Props {
  snapshot: MarketSnapshot | null;
}

const DIR_COLOR: Record<string, string> = {
  positive: "text-green-200",
  negative: "text-red-200",
  neutral:  "text-white/70",
};

const DIR_ARROW: Record<string, string> = {
  positive: "▲",
  negative: "▼",
  neutral:  "–",
};

export default function TickerBar({ snapshot }: Props) {
  // Error/unavailable state — same height, no layout shift
  if (snapshot === null) {
    return (
      <div aria-hidden="true" className="h-10 flex items-center px-6 text-sm border-b"
        style={{ backgroundColor: "#B2967D", borderColor: "rgba(207,187,153,0.15)", color: "rgba(255,255,255,0.55)" }}>
        Market data unavailable
      </div>
    );
  }

  const doubled = [...snapshot.tickers, ...snapshot.tickers];

  return (
    <div aria-hidden="true" className="overflow-hidden h-10 flex items-center border-b"
      style={{ backgroundColor: "#B2967D", borderColor: "rgba(207,187,153,0.15)" }}>
      {/* Label */}
      <div className="px-3 py-1 text-xs font-bold whitespace-nowrap h-full flex items-center flex-shrink-0"
        style={{ backgroundColor: "#7D5A44", color: "#D7C9B8", letterSpacing: "0.5px" }}>
        ตลาดวันนี้
      </div>
      {/* Market closed badge */}
      {!snapshot.market_open && (
        <div className="px-3 text-xs font-semibold flex-shrink-0 text-staleness">
          Market closed
        </div>
      )}
      {/* Scrolling tickers */}
      <div className="overflow-hidden flex-1 ticker-scroll-container">
        <div className="flex ticker-animate whitespace-nowrap">
          {doubled.map((item, i) => {
            const pct = isFinite(item.change_pct)
              ? `${item.change_pct >= 0 ? "+" : ""}${item.change_pct.toFixed(2)}%`
              : "—";
            return (
              <span key={i} className="inline-flex items-center gap-2 px-6 text-sm border-r"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                <span className="font-bold text-white font-mono">{item.symbol}</span>
                <span className={DIR_COLOR[item.direction] ?? "text-white/70"}>
                  {DIR_ARROW[item.direction] ?? "–"} {pct}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

---

### TickerBar Test Shape (after changes)

```tsx
import { MarketSnapshot } from "@/types";

const VALID_SNAPSHOT: MarketSnapshot = {
  indices: [],
  tickers: [
    { symbol: "SET", price: 1384.52, change_pct: 0.60, direction: "positive" },
    { symbol: "GOLD", price: 2389.80, change_pct: -0.51, direction: "negative" },
  ],
  market_open: true,
  snapshot_at: "2026-06-27T03:00:00Z",
};

describe("TickerBar", () => {
  it("renders each ticker symbol", () => { ... }); // pass snapshot={VALID_SNAPSHOT}
  it("positive direction renders ▲ arrow", () => { ... });
  it("negative direction renders ▼ arrow", () => { ... });
  it("positive pct displays with + prefix", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />)
    expect(screen.getAllByText(/\+0\.60%/).length).toBeGreaterThan(0)
  });
  it("negative pct displays without + prefix", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />)
    expect(screen.getAllByText(/-0\.51%/).length).toBeGreaterThan(0)
  });
  it("container has aria-hidden=true", () => {
    const { container } = render(<TickerBar snapshot={VALID_SNAPSHOT} />)
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
  });
  it("shows Market closed badge when market_open is false", () => {
    render(<TickerBar snapshot={{ ...VALID_SNAPSHOT, market_open: false }} />)
    expect(screen.getByText(/Market closed/)).toBeInTheDocument()
  });
  it("renders Market data unavailable when snapshot is null", () => {
    render(<TickerBar snapshot={null} />)
    expect(screen.getByText(/Market data unavailable/)).toBeInTheDocument()
  });
  it("NaN change_pct renders — not undefined", () => {
    const snap = { ...VALID_SNAPSHOT, tickers: [
      { symbol: "X", price: 0, change_pct: NaN, direction: "neutral" as const }
    ]};
    render(<TickerBar snapshot={snap} />)
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0)
  });
  it("renders without throwing when tickers array is empty", () => {
    expect(() => render(<TickerBar snapshot={{ ...VALID_SNAPSHOT, tickers: [] }} />)).not.toThrow()
  });
});
```

---

### What Must NOT Change

- `globals.css` existing `ticker-scroll` keyframe and `.ticker-animate` class — do not rename or change timing
- `globals.css` existing `prefers-reduced-motion` block for `transition-duration` — add to it, do not replace it
- `TickerBar` camel background (`#B2967D`), espresso label (`#7D5A44`), label text "ตลาดวันนี้" — brand identity, preserved
- `api.ts` `getMarketSnapshot()` — already exists, returns `MarketSnapshot`, uses `next: { revalidate: 60 }`. No changes to api.ts.
- `types/index.ts` `MarketSnapshot` type — already defined correctly in 6.1. No changes to types.
- Backend — zero backend changes in this story. No new API endpoints, no schema changes.
- `n8n-setup.md` — no changes.

---

### Project-Context Critical Rules (Quick Reference)

- Server Components default — no `useState`/`useEffect` without `"use client"` first line
- `params`/`searchParams` in Next.js 15 are Promises — `await` them
- No `export const revalidate` at page level — revalidation is owned by `api.ts` `next: { revalidate: 60 }`
- `@/` alias for all internal imports — never relative `../` chains
- `value ?? fallback` not `value || fallback` for null handling
- Tailwind v3 (not v4) — config via `tailwind.config.ts`
- All conditionals on arrays: `arr.length > 0`, never `arr.length &&` (renders `0` to DOM)
- Colors: use Tailwind class names where tokens exist (`text-staleness`, `bg-linen`) → inline `style={{}}` only for camel/espresso/cocoa/khaki palette where needed

---

### Testing Pattern (Vitest + RTL)

```tsx
// vitest.config.ts already has @/ alias path configured
import { render, screen } from "@testing-library/react";
import TickerBar from "./TickerBar";
import { MarketSnapshot } from "@/types";
```

Run tests: `cd frontend && npx vitest run`
Run type check: `cd frontend && npx tsc --noEmit`

---

## File List

**Modified:**
- `frontend/src/components/TickerBar.tsx`
- `frontend/src/components/TickerBar.test.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/app/page.tsx`
- `frontend/src/app/news/page.tsx`
- `frontend/src/app/news/[id]/page.tsx`
- `frontend/src/app/trends/page.tsx`
- `frontend/src/app/trends/[id]/page.tsx`
- `frontend/src/app/stocks/page.tsx`

**Not changed:**
- `frontend/src/lib/api.ts` (no new API calls)
- `frontend/src/types/index.ts` (types already correct from 6.1)
- All backend files (zero backend changes)

---

## Dev Agent Record

### Completion Notes

All 5 tasks complete. Key decisions:
- Prop changed from `items: TickerItem[]` → `snapshot: MarketSnapshot | null` to give TickerBar access to `market_open` (AC4) and a clean null signal for the unavailable state (AC5)
- Price removed from per-item display — EXPERIENCE.md spec shows only `SYMBOL ▲ +X.XX%`; price will appear in MarketOverviewWidget (Story 6.3)
- `+` prefix implemented via template literal: `${change_pct >= 0 ? "+" : ""}${change_pct.toFixed(2)}%` — handles negative naturally without `Math.abs()`
- Hover pause and prefers-reduced-motion handled in CSS via `.ticker-scroll-container` class; no JavaScript needed
- Colors kept as light variants (`text-green-200`, `text-red-200`, `text-white/70`) — semantic tokens (`positive`, `negative`, `neutral-text`) fail WCAG on the camel background; ticker is `aria-hidden` so it is exempt from contrast requirements
- 7 new tests added; 168 total pass, zero regressions

### Change Log

- 2026-06-27: Story 6.2 implemented — TickerBar prop change (MarketSnapshot | null), aria-hidden, market closed badge, unavailable state, + prefix, CSS hover/reduced-motion, 6 call sites updated
