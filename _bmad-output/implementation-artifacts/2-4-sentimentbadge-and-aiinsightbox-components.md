---
status: done
epic: 2
story: 4
story_key: "2-4-sentimentbadge-and-aiinsightbox-components"
created: 2026-06-21
baseline_commit: 355bf12bdbba78d6d39334c5699d3f85487e2750
---

# Story 2.4: SentimentBadge & AIInsightBox Components

**Status:** done

## Story

As a retail investor,
I want AI sentiment shown with both a color dot and a text label, and AI analysis in a visually distinct inset box,
So that I understand market sentiment at a glance regardless of color vision.

## Acceptance Criteria

### AC1 — SentimentBadge: three states, dot + label, accessible

**Given** `SentimentBadge` receives `sentiment: "bullish" | "bearish" | "neutral"`
**When** it renders
**Then** it shows a colored dot (`●`) AND a text label (`BULLISH` / `BEARISH` / `NEUTRAL`) — never color alone
**And** `aria-label="Market sentiment: bullish"` (or bearish/neutral) is on the badge element
**And** badge text uses `positive` (#15803d) / `negative` (#dc2626) / `neutral-text` (#6b6560) — all verified ≥ 4.5:1 against their respective badge backgrounds

### AC2 — AIInsightBox: loaded state styling

**Given** `AIInsightBox` renders with loaded analysis
**When** it renders
**Then** it shows: linen background (`#F5F1EA`), `2px camel (#B2967D) left border`, `6px border-radius`, no visible label
**And** the container has `aria-label="AI market analysis"` for screen readers

### AC3 — AIInsightBox: pending state

**Given** `AIInsightBox` renders in pending state (`ai_analysis === null`)
**When** it renders
**Then** it shows "Analysis in progress" in `cocoa` (`#7D5A44`) at full opacity, `400` font-weight
**And** a small animated CSS dot renders alongside — when `prefers-reduced-motion: reduce` is active, the dot is static

### AC4 — AIInsightBox: stale state

**Given** `AIInsightBox` renders in stale state (`analysis_at` > 24 hours ago)
**When** it renders
**Then** an amber inline indicator appears: clock icon + "Analysis from [relative time]"
**And** the clock icon has `aria-hidden="true"` and the readable time description is visible text
**And** the indicator uses `staleness` token (`#d97706`)

### AC5 — Tests pass for all states

**Given** component tests for `SentimentBadge` and `AIInsightBox`
**When** they run
**Then** all three sentiment states render the correct dot + label
**And** pending state uses `cocoa` at full opacity — no `camel` at reduced opacity anywhere
**And** stale state renders the amber indicator for `analysis_at` values > 24h ago

## Tasks / Subtasks

- [x] Task 1: Create `SentimentBadge` component (AC: 1)
  - [x] 1.1 Create `frontend/src/components/SentimentBadge.tsx` — Server Component, no `"use client"`, inline styles for color tokens
  - [x] 1.2 Verify `aria-label` attribute carries the full `"Market sentiment: bullish/bearish/neutral"` string on the badge element itself
  - [x] 1.3 Confirm dot character `●` is present in the JSX alongside the label text
- [x] Task 2: Create `SentimentBadge` tests (AC: 5)
  - [x] 2.1 Create `frontend/src/components/SentimentBadge.test.tsx`
  - [x] 2.2 Write test: bullish renders `●`, `BULLISH` label, `aria-label="Market sentiment: bullish"`, text color `#15803d`
  - [x] 2.3 Write test: bearish renders `●`, `BEARISH` label, `aria-label="Market sentiment: bearish"`, text color `#dc2626`
  - [x] 2.4 Write test: neutral renders `●`, `NEUTRAL` label, `aria-label="Market sentiment: neutral"`, text color `#6b6560`
  - [x] 2.5 Run full test suite — confirm all existing tests still pass
- [x] Task 3: Create `AIInsightBox` component (AC: 2, 3, 4)
  - [x] 3.1 Create `frontend/src/components/AIInsightBox.tsx` — Server Component, no `"use client"`
  - [x] 3.2 Implement `null` branch (pending state): flex row with animated dot + "Analysis in progress" text in cocoa `#7D5A44`, font-weight 400
  - [x] 3.3 Implement animated dot using `motion-safe:animate-pulse` Tailwind variant (NOT the `live-dot` CSS class, which has no built-in `prefers-reduced-motion` override); dot background color `#7D5A44`; `aria-hidden="true"` on dot span
  - [x] 3.4 Implement loaded branch: linen bg `#F5F1EA`, `2px solid #B2967D` left border, `6px` border-radius, summary text in cocoa
  - [x] 3.5 Implement staleness check: compute `isStale = (Date.now() - new Date(analysis.analysis_at).getTime()) > 24 * 60 * 60 * 1000`
  - [x] 3.6 Implement stale indicator: SVG clock icon `aria-hidden="true"` + span "Analysis from [relative time]" in `#d97706`
  - [x] 3.7 Implement private `relativeTime(isoString: string): string` helper in the same file — no external date library needed
  - [x] 3.8 Verify `aria-label="AI market analysis"` is on the outer container `<div>` in all three render paths (pending / loaded-fresh / loaded-stale)
- [x] Task 4: Create `AIInsightBox` tests (AC: 5)
  - [x] 4.1 Create `frontend/src/components/AIInsightBox.test.tsx`
  - [x] 4.2 Write test: pending state shows "Analysis in progress" text in cocoa (#7D5A44) — verify color via `toHaveStyle`
  - [x] 4.3 Write test: pending state has an `aria-hidden="true"` animated dot element present
  - [x] 4.4 Write test: container has `aria-label="AI market analysis"` in pending state
  - [x] 4.5 Write test: loaded fresh state shows summary text
  - [x] 4.6 Write test: loaded fresh state does NOT show stale indicator text
  - [x] 4.7 Write test: stale state shows "Analysis from" text with staleness color `#d97706` — use `vi.useFakeTimers()` + `vi.setSystemTime()` to control "now"
  - [x] 4.8 Write test: fresh analysis (exactly at fake "now") does NOT trigger stale indicator
  - [x] 4.9 Run full test suite — confirm all existing tests pass and new tests pass

### Review Findings

- [x] [Review][Patch] `relativeTime` is not defensively clamped — returns negative strings for future `analysis_at` timestamps (latent; currently unreachable because call site guards `isStale = true`) [frontend/src/components/AIInsightBox.tsx:3-9]
- [x] [Review][Defer] No runtime defense in SentimentBadge for unknown sentiment values — `SENTIMENT_STYLES[unexpected_value]` → undefined destructure → crash [frontend/src/components/SentimentBadge.tsx:14] — deferred, TypeScript compile-time enforcement sufficient; pre-existing pattern
- [x] [Review][Defer] `analysis_at` malformed or empty string → `new Date()` → NaN → `isStale` silently false [frontend/src/components/AIInsightBox.tsx:44] — deferred, API boundary concern; no other component validates either
- [x] [Review][Defer] Missing `aria-live="polite"` on AIInsightBox container — screen readers not notified when analysis loads [frontend/src/components/AIInsightBox.tsx:24-41] — deferred, moot in current SSR/ISR architecture; defer to Story 2.9 WCAG audit
- [x] [Review][Defer] Clock skew at 24h boundary — client/server time difference may cause stale indicator to flip [frontend/src/components/AIInsightBox.tsx:44] — deferred, acceptable edge case; tolerance buffer would add complexity

## Dev Notes

### Component overview

Story 2.4 creates **two new standalone components only**. Neither `NewsCard.tsx` nor any existing file is modified — that integration happens in Story 2.5. This is a component library build step: write, test, ship.

### File locations

All new files under `frontend/src/components/`:
- `SentimentBadge.tsx` (NEW)
- `SentimentBadge.test.tsx` (NEW)
- `AIInsightBox.tsx` (NEW)
- `AIInsightBox.test.tsx` (NEW)

### Server Components — no "use client" needed

Both components are pure presentational. Neither uses browser APIs, React hooks, or event handlers. Do NOT add `"use client"` directives. Server Components are the default in Next.js 15 App Router.

For `AIInsightBox`, `Date.now()` is called at render time on the server side. This is correct for ISR with 60s revalidation — the staleness check is accurate to within one minute, which is well within the 24h window.

### Type import

`AIAnalysis` is already defined in `frontend/src/types/index.ts`:
```ts
interface AIAnalysis {
  summary: string;
  affected_sectors: string[];
  affected_stocks: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  analysis_at: string; // ISO 8601
}
```
Import from `@/types`. Do NOT redeclare locally.

### SentimentBadge: exact implementation pattern

Use **inline `style`** for color tokens (not Tailwind text-color classes). This is required so tests can use `toHaveStyle({ color: '#15803d' })` to verify the correct token is applied. Tailwind CSS classes are not evaluated in jsdom.

The `aria-label` goes on the outer `<span>` (the badge element itself). Because `aria-label` overrides the accessible name, screen readers will say "Market sentiment: bullish" and skip the inner `●` and `BULLISH` characters — so no need to add `aria-hidden` to the dot character, but it doesn't hurt.

```tsx
const SENTIMENT_STYLES: Record<Sentiment, { text: string; bg: string; label: string }> = {
  bullish:  { text: "#15803d", bg: "#dcfce7", label: "BULLISH"  },
  bearish:  { text: "#dc2626", bg: "#fee2e2", label: "BEARISH"  },
  neutral:  { text: "#6b6560", bg: "#f5f5f4", label: "NEUTRAL"  },
};

// outer span: inline style for bg+color, border-radius 20px ("pill" per DESIGN.md rounded.badge)
// pill shape: className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest"
// aria-label="Market sentiment: bullish" on the outer span
// inner: <span aria-hidden="true">●</span>{" "}{styles.label}
```

Tailwind's `rounded-full` → `border-radius: 9999px`. DESIGN.md specifies `20px` for badges ("pill"); both produce the same pill visual. Use `rounded-full` for semantic clarity.

### AIInsightBox: animated dot — use `motion-safe:animate-pulse`, NOT `live-dot`

`globals.css` defines `.live-dot` with `animation: pulse-dot 2s ease-in-out infinite`. However, `.live-dot` does **not** include a `@media (prefers-reduced-motion: reduce)` override. Using `.live-dot` for the pending dot would violate AC3 without adding CSS to globals.css.

Instead, use Tailwind's `motion-safe:animate-pulse`:
```tsx
<span
  className="motion-safe:animate-pulse w-1.5 h-1.5 rounded-full flex-shrink-0"
  style={{ backgroundColor: "#7D5A44" }}
  aria-hidden="true"
/>
```

`motion-safe:animate-pulse` generates:
```css
@media (prefers-reduced-motion: no-preference) {
  .motion-safe\:animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
}
```
This means the dot animates only when the user has no motion preference — and is static when `prefers-reduced-motion: reduce` is active. Exactly what AC3 requires.

The dot background color `#7D5A44` (cocoa) matches the surrounding text, creating a cohesive "pending" state. Never use `#B2967D` (camel) here — AC5 explicitly prohibits camel at any opacity in the pending state.

### AIInsightBox: `relativeTime` helper

Keep this as a module-private function in `AIInsightBox.tsx`. Do NOT put it in a shared utils file — no other component needs it yet. If three or more components need relative time in future stories, extract then.

```ts
function relativeTime(isoString: string): string {
  const hours = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
```

Output examples: "26h ago", "1 day ago", "3 days ago". Keep it simple — no need for "yesterday" or Thai language at this stage.

### AIInsightBox: clock icon

Use an inline SVG clock icon (consistent with all existing components — no icon library used in this project). Stroke color driven by staleness token:

```tsx
<svg
  width="12" height="12" viewBox="0 0 24 24"
  fill="none" stroke="#d97706" strokeWidth="2"
  strokeLinecap="round" strokeLinejoin="round"
  aria-hidden="true"
>
  <circle cx="12" cy="12" r="10" />
  <polyline points="12 6 12 12 16 14" />
</svg>
```

### AIInsightBox: render tree structure

```
Pending (analysis === null):
  <div aria-label="AI market analysis" style={boxStyle} className="rounded-[6px] p-3 flex items-center gap-2">
    <span className="motion-safe:animate-pulse w-1.5 h-1.5 rounded-full flex-shrink-0" style={{bg: cocoa}} aria-hidden="true" />
    <p className="text-[13px] font-normal leading-relaxed" style={{color: cocoa}}>Analysis in progress</p>
  </div>

Loaded (analysis !== null):
  <div aria-label="AI market analysis" style={boxStyle} className="rounded-[6px] p-3">
    <p className="text-[13px] leading-relaxed" style={{color: cocoa}}>{analysis.summary}</p>
    {isStale && (
      <div className="flex items-center gap-1.5 mt-2">
        <svg ... aria-hidden="true" />
        <span className="text-[11px]" style={{color: "#d97706"}}>Analysis from {relativeTime(analysis.analysis_at)}</span>
      </div>
    )}
  </div>

boxStyle = { backgroundColor: "#F5F1EA", borderLeft: "2px solid #B2967D" }
```

The stale indicator renders BELOW the summary text (not instead of it). A stale analysis still shows the content — the indicator is additive, not a replacement.

### AIInsightBox: border-radius

DESIGN.md specifies `6px` for the AI insight box. Use `className="rounded-[6px]"` (Tailwind arbitrary value). Do NOT use `rounded-md` (6px is coincidentally close to 8px but the DESIGN.md value is exactly 6px).

### Testing: SentimentBadge

Query pattern for badge element (since `<span>` has no semantic ARIA role, query by aria-label using `container.querySelector`):

```tsx
it('bullish: renders dot, BULLISH label, and correct aria-label', () => {
  const { container } = render(<SentimentBadge sentiment="bullish" />)
  const badge = container.querySelector('[aria-label="Market sentiment: bullish"]') as HTMLElement
  expect(badge).toBeTruthy()
  expect(badge).toHaveTextContent('BULLISH')
  expect(badge).toHaveStyle({ color: '#15803d' })
})
```

For the dot character: `expect(badge).toHaveTextContent('●')` or `expect(screen.getByText('●')).toBeInTheDocument()`.

### Testing: AIInsightBox stale state — requires fake timers

The component calls `Date.now()` at render time. To test the stale state deterministically:

```tsx
describe('stale state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows amber stale indicator for analysis > 24h old', () => {
    const stale: AIAnalysis = {
      ...VALID_ANALYSIS,
      analysis_at: '2026-06-20T10:00:00Z', // 26h ago relative to fake "now"
    }
    render(<AIInsightBox analysis={stale} />)
    const indicator = screen.getByText(/Analysis from/)
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveStyle({ color: '#d97706' })
  })

  it('does not show stale indicator for analysis within 24h', () => {
    const fresh: AIAnalysis = {
      ...VALID_ANALYSIS,
      analysis_at: '2026-06-21T11:00:00Z', // 1h ago relative to fake "now"
    }
    render(<AIInsightBox analysis={fresh} />)
    expect(screen.queryByText(/Analysis from/)).not.toBeInTheDocument()
  })
})
```

`vi` is globally available from Vitest — no import needed (configured in `vitest.config.ts`).

### Testing: AIInsightBox pending state — color is testable

The pending text "Analysis in progress" uses `style={{ color: "#7D5A44" }}` (inline). The test can verify:
```tsx
expect(screen.getByText('Analysis in progress')).toHaveStyle({ color: '#7D5A44' })
```
This is the AC5 requirement: "pending state uses cocoa at full opacity — no camel at reduced opacity anywhere."

### Color tokens used (hex reference)

| Token | Hex | Usage in this story |
|---|---|---|
| `linen` | `#F5F1EA` | AIInsightBox background |
| `camel` | `#B2967D` | AIInsightBox left border |
| `cocoa` | `#7D5A44` | AIInsightBox text, pending dot |
| `positive` | `#15803d` | SentimentBadge bullish text |
| `positive-bg` | `#dcfce7` | SentimentBadge bullish background |
| `negative` | `#dc2626` | SentimentBadge bearish text |
| `negative-bg` | `#fee2e2` | SentimentBadge bearish background |
| `neutral-text` | `#6b6560` | SentimentBadge neutral text |
| `neutral-bg` | `#f5f5f4` | SentimentBadge neutral background |
| `staleness` | `#d97706` | AIInsightBox stale indicator |

Source: `tailwind.config.ts` and `DESIGN.md` frontmatter.

### What NOT to do

- Do NOT add `"use client"` to either component
- Do NOT modify `NewsCard.tsx` — the existing inline AI insight box in NewsCard stays untouched until Story 2.5
- Do NOT use the `.live-dot` CSS class for the pending dot (no reduced-motion override)
- Do NOT use `camel` (#B2967D) color or any reduced-opacity workaround for the pending state text — AC5 explicitly rejects this
- Do NOT use external date libraries (date-fns, dayjs) — a private helper function is sufficient
- Do NOT add a border to the SentimentBadge — per DESIGN.md, sentiment badges have no border (background + text only)

### Learnings from Story 2.3

- Always use `inline style` for colors that need to be test-verified (not Tailwind classes)
- `focus-visible:` is preferred over `focus:` for focus rings on interactive elements, but these components have no interactive elements so focus ring is not applicable here
- `vi` globals (useFakeTimers, setSystemTime, useRealTimers) work without imports in Vitest with global mode

### Project Structure Notes

- Component files: `frontend/src/components/[ComponentName].tsx` (PascalCase)
- Test files: co-located `frontend/src/components/[ComponentName].test.tsx`
- Run tests: `cd frontend && npx vitest run` (or `npx vitest` for watch mode)
- Type check: `cd frontend && npx tsc --noEmit`
- No barrel file (`index.ts`) in components — import directly by path

### References

- Color tokens: `tailwind.config.ts` + `_bmad-output/planning-artifacts/ux-designs/ux-ASK-2026-06-20/DESIGN.md#Colors`
- Component specs: `DESIGN.md#Components / SentimentBadge` and `DESIGN.md#Components / AIInsightBox`
- Type definitions: `frontend/src/types/index.ts` — `AIAnalysis` interface
- Animation: `frontend/src/app/globals.css` — `.live-dot` (do NOT use for this story; use `motion-safe:animate-pulse` instead)
- Test patterns: `frontend/src/components/AISummaryCard.test.tsx`, `frontend/src/components/NewsCard.test.tsx`
- Story 2.5 (next): will integrate both new components into `NewsCard.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- ✅ SentimentBadge created as Server Component — SENTIMENT_STYLES lookup table with inline styles for all three states (bullish/bearish/neutral); `aria-label` on outer `<span>` overrides accessible name; dot character `●` in inner `aria-hidden` span
- ✅ AIInsightBox created as Server Component — three render paths: pending (null), loaded-fresh, loaded-stale; staleness computed via `Date.now() - new Date(analysis.analysis_at).getTime() > 24h ms`; `relativeTime()` private helper (h ago / N days ago)
- ✅ Pending dot uses `motion-safe:animate-pulse` (NOT `.live-dot`) — only animates when `prefers-reduced-motion: no-preference`; cocoa #7D5A44 background; `aria-hidden="true"`
- ✅ Stale indicator: SVG clock icon (aria-hidden) + "Analysis from [relative time]" span in staleness color #d97706; renders BELOW summary text (additive, not replacement)
- ✅ 9 SentimentBadge tests pass; 12 AIInsightBox tests pass (including `vi.useFakeTimers()` stale state tests with controlled `Date.now()`)
- ✅ Full suite: 83/83 tests pass, 0 TypeScript errors — no regressions

### File List

- `frontend/src/components/SentimentBadge.tsx` (NEW)
- `frontend/src/components/SentimentBadge.test.tsx` (NEW)
- `frontend/src/components/AIInsightBox.tsx` (NEW)
- `frontend/src/components/AIInsightBox.test.tsx` (NEW)
