# Deferred Work Log

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
