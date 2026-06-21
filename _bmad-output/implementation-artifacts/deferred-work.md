# Deferred Work Log

## Deferred from: code review of 2-4-sentimentbadge-and-aiinsightbox-components (2026-06-21)

- **D1: No runtime defense in SentimentBadge for unknown sentiment values** — `SENTIMENT_STYLES[unexpected]` returns `undefined`; destructuring throws a runtime crash if the API ever sends an unrecognized value (e.g. `"mixed"` or casing mismatch). TypeScript compile-time enforcement is currently the only guard. Add a `?? SENTIMENT_STYLES.neutral` fallback when the component is touched in a future token/cleanup pass.
- **D2: `analysis_at` malformed or empty string → NaN → silent staleness suppression** — `new Date("").getTime()` returns `NaN`; `NaN > 86400000` is `false`, hiding the stale indicator. Pre-existing pattern — no other component validates API string fields. Address at the API boundary (Pydantic response schema) rather than in UI components.
- **D3: Missing `aria-live="polite"` on AIInsightBox container** — Screen readers receive no announcement when the analysis transitions from pending to loaded. Currently moot because the component is a Server Component rendered via ISR — no client-side state transition occurs. If the component is ever refactored to use client-side polling/SWR, add `aria-live="polite"` to the container. Track in Story 2.9 WCAG audit.
- **D4: Clock skew at 24h staleness boundary** — `Date.now()` is the client clock; `analysis_at` originates from the server. A small discrepancy could cause an analysis at exactly 24h to flip between stale/fresh on successive renders. Acceptable edge case for the current financial research use case. Resolve by adding a 5-minute tolerance buffer if this becomes a user-reported issue.

## Deferred from: code review of 2-3-navbar-bottomtabbar-and-layout-foundation (2026-06-21)

- **D1: Hardcoded brand hex instead of Tailwind token** — `Navbar.tsx` and `BottomTabBar.tsx` use `style={{ backgroundColor: "#4A342A" }}` instead of `className="bg-espresso"`. The token exists in `tailwind.config.ts`; colour is visually correct but will diverge from the theme on future token changes. Migrate to `bg-espresso` when doing a broader component token audit.
- **D2: Navbar inactive tab opacity mismatch** — `Navbar.tsx` uses `rgba(255,255,255,0.5)` (50%) for inactive tabs; AC3 for BottomTabBar explicitly specifies 45% (`rgba(255,255,255,0.45)`). Minor visual inconsistency between nav surfaces. Align in a future design-token cleanup pass.
- **D3: Potential z-index collision between BottomTabBar and N8nChat** — Both are `fixed` with `z-50`; the chat widget button could overlap the Trends tab on mobile. Requires checking `N8nChat` component's z-index and position before resolving.

## Deferred from: code review of 2-2-news-api-endpoints (2026-06-21)

- **D1: Mock data expiry** — All `NEWS_DATA` items have hardcoded `published_at` dates around 2026-06-21; after 2026-06-28 the retention filter will silently return an empty list. Fix by anchoring mock dates relative to `datetime.now()` or using dynamic dates.
- **D2: `GET /categories` missing `response_model`** — The endpoint returns a raw dict with no Pydantic validation. Add a `CategoriesResponse` schema or `response_model=dict[str, list[str]]`.
- **D3: `GET /categories` / `GET /news/` category inconsistency** — `GET /categories` is built from full `NEWS_DATA` at import time; `GET /news/` filters by retention window. A category with only stale items appears in `/categories` but returns 0 items from `/news/`. Fix by computing categories dynamically from the retention-filtered dataset.
- **D4: "STORIES TODAY" widget misleading count** — `newsResponse.items.length` in `news/page.tsx` shows the filtered/paginated count (max 20), not actual stories published today. Rename label or add a `total` field to `NewsListResponse` pre-slice.
- **D5: "15 MIN REFRESH RATE" label mismatch** — `news/page.tsx` displays "15 MIN" but the actual ISR interval is 60 seconds (set in `fetchAPI`). Update the label to match reality.
- **D6: `NEWS_RETENTION_DAYS` module-level parse** — Parsed as `int(os.getenv(...))` at import time; tests cannot override the value without patching the module global. Migrate to Pydantic `BaseSettings` or a per-request `os.getenv()` call when test isolation becomes necessary.

## Deferred from: code review of 1-2-frontend-testing-infrastructure (2026-06-21)

- **D1: api.test.ts error assertion imprecise** — `toThrow('API error: 500')` is a substring match; the actual throw includes the path (`API error: 500 /news/`). The assertion will catch status-code regressions but not message-format changes. Tighten to `toThrow(/^API error: 500/)` when test precision is prioritised.
- **D2: AISummaryCard no edge-case data tests** — All four tests use a fully-populated `VALID_SUMMARY` fixture. Edge cases (empty `key_points: []`, empty `watch_sectors`, missing `set_range_low`/`set_range_high`) are untested. Add edge-case tests when AISummaryCard component is expected to be stable.
- **D3: TickerBar single-item doubling logic not tested** — The component doubles the items array for the CSS marquee; a single-item input should yield 2 DOM nodes. This doubling is untested. Add a test when TickerBar is confirmed stable.
- **D4: TickerBar zero-change boundary (change===0) not tested** — `change === 0` renders a `▲` arrow (positive branch). If the condition changes to `> 0`, the boundary flip goes undetected.
- **D5: Navbar non-root pathname active-tab path never tested** — Only `usePathname: () => '/'` is mocked, covering the Overview active state. No test verifies a different tab (e.g. `/news`) becomes active. Add when Navbar is stable.
- **D6: Coverage thresholds: only lines:80 enforced** — `branches`, `functions`, and `statements` thresholds are not configured. For a financial data app where conditional rendering (null analysis, featured flag, direction badges) is core behavior, branch coverage is more meaningful. Upgrade thresholds when the component suite is stable.
- **D7: Vitest alias manually duplicated from tsconfig** — `vitest.config.ts` manually mirrors the `@/*` alias from `tsconfig.json`. Consider adding `vite-tsconfig-paths` as a devDependency to auto-sync, eliminating the drift risk.
