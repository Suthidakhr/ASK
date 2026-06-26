---
status: done
epic: 5
story: 1
story_key: "5-1-market-themes-schema-and-api-endpoints"
created: 2026-06-25
baseline_commit: feef326f20b963e6e561a7e0f13ac3b1b5f4963c
---

# Story 5.1: Market Themes Schema & API Endpoints

**Status:** done

## Story

As a developer,
I want the `MarketThemeSummary` and `MarketTheme` Pydantic schemas defined and two API endpoints — list and detail — with 48-hour auto-archiving applied at query time,
So that subsequent stories (ThemeCard, Theme Detail page, Theme Clustering Webhook) have a reliable data contract and the themes feed always reflects only active clusters.

## Acceptance Criteria

### AC1 — `MarketThemeSummary` Pydantic schema defined

**Given** `MarketThemeSummary` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains exactly:
- `theme_id: str`
- `name: str`
- `description: str`
- `overall_sentiment: Literal["bullish", "bearish", "neutral"]`
- `article_count: int`
- `last_article_at: AwareDatetime`
- `created_at: AwareDatetime`
**And** it does NOT contain `constituent_articles` — the list view stays compact

### AC2 — `MarketTheme` Pydantic schema defined

**Given** `MarketTheme` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it extends `MarketThemeSummary` with one additional field:
- `constituent_articles: list[NewsItem]` — full `NewsItem` objects including `ai_analysis` (populated or null)

### AC3 — TypeScript types defined

**Given** `frontend/src/types/index.ts`
**When** `MarketThemeSummary` and `MarketTheme` are defined
**Then** they mirror the Pydantic schemas exactly:
- `MarketThemeSummary`: `theme_id: string`, `name: string`, `description: string`, `overall_sentiment: "bullish" | "bearish" | "neutral"`, `article_count: number`, `last_article_at: string`, `created_at: string`
- `MarketTheme extends MarketThemeSummary`: adds `constituent_articles: NewsItem[]`
- `overall_sentiment` is typed as the union literal — NOT `string`
- `ai_analysis` on constituent articles is typed as `AIAnalysis | null`

### AC4 — `GET /trends/` returns active themes list

**Given** `GET /trends/` with themes in the store
**When** called
**Then** it returns `HTTP 200` with a JSON array of `MarketThemeSummary`, sorted by `last_article_at` descending (FR-T02)
**And** themes where `last_article_at` is older than 48 hours are excluded — filtered at query time (FR-T04)
**And** the endpoint name in the router is `get_themes` (not `get_trends` — avoids confusion with old TrendItem data)

### AC5 — `GET /trends/` returns empty list when all themes archived

**Given** `GET /trends/` and all stored themes have `last_article_at` older than 48 hours
**When** called
**Then** it returns `HTTP 200` with `[]` — not HTTP 404, not an error

### AC6 — `GET /trends/{theme_id}` returns theme detail

**Given** `GET /trends/{theme_id}` with a valid, active theme ID
**When** called
**Then** it returns `HTTP 200` with a `MarketTheme`
**And** `constituent_articles` are the full `NewsItem` objects resolved from the news store
**And** constituent articles are sorted by `published_at` descending

### AC7 — `GET /trends/{theme_id}` returns 410 for archived themes

**Given** `GET /trends/{theme_id}` where the theme exists but `last_article_at` is older than 48 hours
**When** called
**Then** it returns `HTTP 410 Gone` — archived, not missing
**And** the response body is `{"detail": "Theme archived"}` — not HTTP 404

### AC8 — `GET /trends/{theme_id}` returns 404 for non-existent themes

**Given** `GET /trends/{theme_id}` with a theme_id that has never existed
**When** called
**Then** it returns `HTTP 404`

### AC9 — `api.ts` methods added

**Given** `frontend/src/lib/api.ts`
**When** `getTrends` and `getTheme` are added
**Then** `getTrends: () => fetchAPI<MarketThemeSummary[]>("/trends/")`
**And** `getTheme: (id: string) => fetchAPI<MarketTheme>(`/trends/${id}`)`
**And** both use the global `fetchAPI` wrapper which applies `next: { revalidate: 60 }` automatically

### AC10 — Integration tests verify 48h filter and edge cases

**Given** integration tests for `GET /trends/` and `GET /trends/{theme_id}`
**When** they run
**Then** the 48h filter is tested: a theme with `last_article_at` 47h59m ago appears; one 48h1m ago does not appear in the list and returns 410 on detail
**And** all `overall_sentiment` values in responses are always one of the three valid strings
**And** all `AwareDatetime` fields parse as timezone-aware ISO 8601 strings
**And** `constituent_articles` in `GET /trends/{id}` response are sorted `published_at` descending

---

## Dev Notes

### This Story Is Backend-Heavy + Two Small Frontend Additions

**New files:**
- `backend/app/services/theme_store.py`

**Modified files:**
- `backend/app/models/schemas.py` — add `MarketThemeSummary`, `MarketTheme`
- `backend/app/routers/trends.py` — FULL REPLACEMENT of existing implementation
- `backend/tests/routers/test_trends.py` — FULL REPLACEMENT of existing tests
- `frontend/src/types/index.ts` — add `MarketThemeSummary`, `MarketTheme`
- `frontend/src/lib/api.ts` — add `getTrends`, `getTheme`

**No changes to:**
- `backend/app/main.py` — `app.include_router(trends.router)` already present
- `backend/app/models/schemas.py` existing classes — `TrendItem`, `AISummary` must be PRESERVED (used by `MarketOverview`)

---

### Critical: Existing `trends.py` Uses OLD Schema — Full Replacement Required

The current `backend/app/routers/trends.py` is:

```python
from fastapi import APIRouter
from app.models.schemas import TrendItem, AISummary
from app.services.mock_data import TRENDS, AI_SUMMARY

router = APIRouter(prefix="/trends", tags=["trends"])

@router.get("/", response_model=list[TrendItem])
async def get_trends():
    return TRENDS

@router.get("/summary", response_model=AISummary)
async def get_ai_summary():
    return AI_SUMMARY
```

This serves OLD mock data for `TrendItem` (sidebar trends) and `AISummary` — completely different from Epic 5's `MarketThemeSummary`. **Replace this entire file** with the new implementation below. The old endpoints are safe to remove because:
- `api.ts` has NO `getTrends()` method yet — the frontend never calls `/trends/` or `/trends/summary`
- `TrendItem` data is served via `GET /market/overview` (the `MarketOverview.trends` field) — the sidebar `TrendSummary` component is NOT affected
- The existing `test_trends.py` tests test the OLD endpoints — they must also be replaced

**`TrendItem` and `AISummary` in `schemas.py` must stay** — they are used by `MarketOverview` and `GET /market/overview`. Only ADD new classes; do not remove existing ones.

---

### New Service: `backend/app/services/theme_store.py`

Model after `DailyBriefStore` — same thread-safe dict + Lock pattern:

```python
from datetime import datetime, timedelta, timezone
from threading import Lock

ARCHIVE_HOURS = 48


class ThemeStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._themes: dict[str, dict] = {}

    def upsert(self, payload_dict: dict) -> str:
        with self._lock:
            key = payload_dict["theme_id"]
            status = "created" if key not in self._themes else "updated"
            self._themes[key] = dict(payload_dict)
            return status

    def get_active(self) -> list[dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=ARCHIVE_HOURS)
        with self._lock:
            active = [t for t in self._themes.values() if t["last_article_at"] > cutoff]
        return sorted(active, key=lambda t: t["last_article_at"], reverse=True)

    def get_by_id(self, theme_id: str) -> dict | None:
        with self._lock:
            return dict(self._themes[theme_id]) if theme_id in self._themes else None

    def is_archived(self, theme: dict) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=ARCHIVE_HOURS)
        return theme["last_article_at"] <= cutoff

    def reset(self) -> None:
        with self._lock:
            self._themes = {}


theme_store = ThemeStore()
```

**Key design decisions:**
- `last_article_at` stored as Python `datetime` (timezone-aware) — Pydantic `AwareDatetime` deserializes to `datetime` in Python, so `t["last_article_at"] > cutoff` works
- `get_active()` acquires lock only once for the filter pass, then releases before sorting (safe — sorted() works on a local copy)
- `ARCHIVE_HOURS = 48` as module-level constant for tests to reference when constructing boundary datetimes
- `get_active()` returns only themes with `last_article_at > cutoff` (strictly greater — a theme exactly at cutoff boundary is archived)
- `is_archived()` returns `True` for `last_article_at <= cutoff` — consistent with `get_active()` exclusion

**What the store persists per theme** (set by the webhook in Story 5.4, created here for testability):
```python
{
    "theme_id": str,
    "name": str,
    "description": str,
    "overall_sentiment": "bullish" | "bearish" | "neutral",
    "article_count": int,
    "last_article_at": datetime (aware),
    "created_at": datetime (aware),
    "constituent_article_ids": list[str],  # used by router to resolve NewsItems
}
```

For testing Story 5.1, tests will directly call `theme_store.upsert({...})` to seed data, just as `test_daily_brief.py` calls `daily_brief_store.upsert({...})`.

---

### New `backend/app/routers/trends.py`

```python
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException

from app.models.schemas import MarketTheme, MarketThemeSummary
from app.services.news_store import news_store
from app.services.theme_store import theme_store

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("/", response_model=list[MarketThemeSummary])
async def get_themes() -> list[MarketThemeSummary]:
    return [MarketThemeSummary(**t) for t in theme_store.get_active()]


@router.get("/{theme_id}", response_model=MarketTheme)
async def get_theme(theme_id: str) -> MarketTheme:
    theme = theme_store.get_by_id(theme_id)
    if theme is None:
        raise HTTPException(status_code=404, detail="Theme not found")
    if theme_store.is_archived(theme):
        raise HTTPException(status_code=410, detail="Theme archived")

    article_ids: list[str] = theme.get("constituent_article_ids", [])
    articles = [
        item for aid in article_ids
        if (item := news_store.get_by_id(aid)) is not None
    ]
    articles.sort(key=lambda a: a["published_at"], reverse=True)

    return MarketTheme(**{**theme, "constituent_articles": articles})
```

**Notes on the router:**
- `get_themes()` — no routing conflict with old code because we're replacing the whole file
- The walrus operator (`:=`) in the list comprehension is Python 3.8+ — confirmed safe in this project
- `constituent_article_ids` missing from store dict → defaults to `[]` (safe: `theme.get("constituent_article_ids", [])`)
- Articles resolved at query time (no pre-joining). Acceptable because: (a) the store is in-memory, (b) themes have 2–8 articles per FR-T01, (c) `news_store.get_by_id()` is O(n) scan but n is small
- Articles from `constituent_article_ids` that don't exist in `news_store` are silently dropped (the ID is skipped if `get_by_id()` returns `None`). Story 5.4's webhook will enforce referential integrity.

---

### Pydantic Schemas to Add to `backend/app/models/schemas.py`

Add AFTER the existing `DailyBriefWebhookResponse` class at the END of the file:

```python
class MarketThemeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme_id: str
    name: str
    description: str
    overall_sentiment: Literal["bullish", "bearish", "neutral"]
    article_count: int
    last_article_at: AwareDatetime
    created_at: AwareDatetime


class MarketTheme(MarketThemeSummary):
    constituent_articles: list[NewsItem]
```

**`MarketTheme` extends `MarketThemeSummary`** — inherits all fields + `model_config`. No need to repeat `ConfigDict` since Pydantic v2 inherits it.

---

### TypeScript Types to Add to `frontend/src/types/index.ts`

Add AFTER the `DailyBrief` interface at the END of the file:

```typescript
export interface MarketThemeSummary {
  theme_id: string;
  name: string;
  description: string;
  overall_sentiment: "bullish" | "bearish" | "neutral";
  article_count: number;
  last_article_at: string;
  created_at: string;
}

export interface MarketTheme extends MarketThemeSummary {
  constituent_articles: NewsItem[];
}
```

- `last_article_at` and `created_at` are `string` (ISO 8601) — same pattern as `NewsItem.published_at` and `AIAnalysis.analysis_at`
- `MarketTheme extends MarketThemeSummary` — TypeScript interface extension, mirroring the Pydantic inheritance

---

### `api.ts` Additions

Add `MarketThemeSummary`, `MarketTheme` to the import line, then add two methods to the `api` object:

```typescript
// Updated import:
import { NewsItem, NewsListResponse, MarketOverview, TickerItem, DailyBrief, MarketThemeSummary, MarketTheme } from "@/types";

// Add to api object:
getTrends: () => fetchAPI<MarketThemeSummary[]>("/trends/"),
getTheme: (id: string) => fetchAPI<MarketTheme>(`/trends/${id}`),
```

**Note on the trailing slash:** `GET /trends/` has a trailing slash to match FastAPI's router prefix + `"/"` path. `GET /trends/${id}` has no trailing slash. This matches how `getDailyBrief()` calls `/daily-brief/` (with slash) and `getNewsById()` calls `/news/${id}` (without slash).

---

### Tests: Replace `backend/tests/routers/test_trends.py`

The old test file tests 7 tests against the OLD endpoints (`TrendItem`, `AISummary`). Replace entirely.

**Test setup pattern** (same as `test_daily_brief.py`):

```python
from datetime import datetime, timedelta, timezone
import pytest
from app.services.theme_store import theme_store, ARCHIVE_HOURS

BKK_TZ = timezone(timedelta(hours=7))

SAMPLE_THEME = {
    "theme_id": "theme-001",
    "name": "Fed Rate Cut Sentiment",
    "description": "Markets anticipate rate cuts following softer CPI data.",
    "overall_sentiment": "bullish",
    "article_count": 2,
    "last_article_at": datetime.now(timezone.utc) - timedelta(hours=1),
    "created_at": datetime.now(timezone.utc) - timedelta(hours=2),
    "constituent_article_ids": ["news-001", "news-002"],
}

@pytest.fixture(autouse=True)
async def reset_store():
    theme_store.reset()
    yield
    theme_store.reset()
```

**Required tests (≥ 10):**

| # | AC | Test name |
|---|---|---|
| 1 | AC4 | `test_get_themes_returns_200_empty_list_when_no_themes` |
| 2 | AC4 | `test_get_themes_returns_active_theme` |
| 3 | AC5 | `test_get_themes_excludes_archived_themes` |
| 4 | AC10 | `test_get_themes_48h_boundary_appears` — theme at 47h59m shows |
| 5 | AC10 | `test_get_themes_48h_boundary_excluded` — theme at 48h1m absent |
| 6 | AC4 | `test_get_themes_sorted_by_last_article_at_descending` — two themes, verify order |
| 7 | AC6 | `test_get_theme_by_id_returns_200_with_constituent_articles` |
| 8 | AC7 | `test_get_theme_by_id_returns_410_when_archived` |
| 9 | AC8 | `test_get_theme_by_id_returns_404_for_unknown_id` |
| 10 | AC10 | `test_get_theme_sentiment_is_valid_enum` |
| 11 | AC10 | `test_get_theme_datetimes_are_timezone_aware` |
| 12 | AC6 | `test_get_theme_constituent_articles_sorted_descending` |

**Boundary datetime construction:**
```python
# 47h59m ago — should appear in GET /trends/
almost_expired = datetime.now(timezone.utc) - timedelta(hours=ARCHIVE_HOURS) + timedelta(minutes=1)
# 48h1m ago — should NOT appear / should return 410
just_archived = datetime.now(timezone.utc) - timedelta(hours=ARCHIVE_HOURS) - timedelta(minutes=1)
```

**Note on `constituent_article_ids`:** The test mock data references `"news-001"` and `"news-002"` which ARE in the `NewsStore` (seeded from `mock_data.NEWS_DATA`). The `autouse` reset_store fixture resets `theme_store` but NOT `news_store` — the news store always starts with mock data and should NOT be reset between tests (it's a singleton with pre-seeded data, same as in `test_webhooks_news.py`).

---

### 48h Archive Filter — Boundary Semantics

Per AC10: "a theme with `last_article_at` 47h 59m ago appears; one 48h 1m ago does not."

The filter is `last_article_at > cutoff` where `cutoff = datetime.now(UTC) - timedelta(hours=48)`. A theme at exactly 48h is archived (use strict `>` not `>=`). This matches the spec's "older than 48 hours" language.

---

### Test Reset Pattern — Critical

```python
@pytest.fixture(autouse=True)
async def reset_store():
    theme_store.reset()  # reset BEFORE test
    yield
    theme_store.reset()  # reset AFTER test
```

Same double-reset pattern as `test_webhooks_daily_brief.py`. The BEFORE reset is critical: if a previous test's teardown was skipped (e.g., due to test failure mid-yield), the BEFORE reset guarantees a clean state.

**Do NOT reset `news_store` in these tests** — the news store starts with mock data (`NEWS_DATA`) and is designed to be seeded from the start. The `test_news.py` and `test_webhooks_news.py` tests also rely on this.

---

### Backend Test Baseline

Before this story: **128 backend tests**

After this story:
- Remove old `test_trends.py` → -7 tests
- Add new `test_trends.py` → +12 tests (minimum)
- Expected total: **≥ 133 backend tests**

Run: `source venv/bin/activate && python -m pytest tests/ -v` from `backend/` directory

---

### Frontend Test Baseline

Before this story: **136 frontend tests** (no change expected)

`api.ts` changes are not directly unit-tested (integration tested via component tests). No new frontend component tests in this story. TypeScript type additions are compile-time verified.

Run: `cd frontend && npx vitest run`

---

### Previous Story Intelligence (Story 4.1 parallel)

Story 4.1 is the closest precedent — same pattern: schema + store + API endpoint. Key things that worked:
- Adding schemas at END of `schemas.py` (avoids merge conflicts with existing classes)
- Store pattern: `DailyBriefStore` with `threading.Lock` — use the same here
- Router pattern: `from app.services.X_store import x_store` at the top
- `ConfigDict(from_attributes=True)` on every Pydantic model
- `autouse=True` on `reset_store` fixture with double-reset (before AND after)
- Test isolation: never reset stores that have pre-seeded mock data (`news_store`)

The key difference: `MarketTheme.constituent_articles` requires joining across `theme_store` + `news_store` at query time. No equivalent in Story 4.1 — this is the novel part.

---

### Git History

```
feef326 feat(story-4.4): wire DailyBriefCard into home page as primary entry point
19a9276 feat(story-4.3): add POST /webhooks/daily-brief ingestion endpoint and n8n scheduling
3de19d1 feat(story-4.2): add DailyBriefCard component with skeleton and error states
7422803 feat(story-4.1): add DailyBrief schema and GET /daily-brief endpoint
```

---

### Common Mistakes to Avoid

1. **Do NOT remove `TrendItem` or `AISummary` from `schemas.py`** — they are used by `MarketOverview` and `GET /market/overview`. Only ADD new classes.
2. **Do NOT leave `GET /trends/summary` in the new `trends.py`** — that endpoint is gone. The `AISummary` is served by `GET /market/overview` as part of `MarketOverview`.
3. **Do NOT import from old router** — the new router imports `MarketTheme`, `MarketThemeSummary` (NOT `TrendItem`, `AISummary`).
4. **Do NOT use `datetime.utcnow()` anywhere** — always use `datetime.now(timezone.utc)`. The former is naive (deprecated in Python 3.12+).
5. **Do NOT reset `news_store` in tests** — it has pre-seeded mock data that `test_get_theme_by_id_returns_200_with_constituent_articles` depends on.
6. **Do NOT forget trailing slash on `getTrends`** — the FastAPI router serves at `/trends/` (not `/trends`). Check that `fetchAPI<MarketThemeSummary[]>("/trends/")` has the slash.
7. **`MarketTheme` inherits from `MarketThemeSummary`** — do NOT duplicate the base fields. Just: `class MarketTheme(MarketThemeSummary): constituent_articles: list[NewsItem]`
8. **TypeScript `MarketTheme extends MarketThemeSummary`** — same inheritance pattern as Python side.
9. **The walrus operator (`:=`) requires Python 3.8+** — confirmed by other code in this project (no compatibility concern).

---

## Tasks / Subtasks

- [x] Task 1: Add schemas to `backend/app/models/schemas.py`
  - [x] 1a: Add `MarketThemeSummary` class with all 7 required fields + `ConfigDict(from_attributes=True)`
  - [x] 1b: Add `MarketTheme(MarketThemeSummary)` class with `constituent_articles: list[NewsItem]`

- [x] Task 2: Create `backend/app/services/theme_store.py`
  - [x] 2a: `ThemeStore` class with `threading.Lock`, `_themes: dict[str, dict]`
  - [x] 2b: `upsert(payload_dict)` → `"created"` or `"updated"`
  - [x] 2c: `get_active()` → 48h filter + sort by `last_article_at` desc
  - [x] 2d: `get_by_id(theme_id)` → `dict | None`
  - [x] 2e: `is_archived(theme)` → `bool`
  - [x] 2f: `reset()` method
  - [x] 2g: `ARCHIVE_HOURS = 48` module constant
  - [x] 2h: `theme_store = ThemeStore()` singleton at module level

- [x] Task 3: Replace `backend/app/routers/trends.py`
  - [x] 3a: Import `MarketTheme`, `MarketThemeSummary`, `news_store`, `theme_store`
  - [x] 3b: `GET /` (`get_themes()`) → `list[MarketThemeSummary]` from `theme_store.get_active()`
  - [x] 3c: `GET /{theme_id}` (`get_theme()`) → `MarketTheme` with 404/410 handling and articles resolved from `news_store`

- [x] Task 4: Replace `backend/tests/routers/test_trends.py` with ≥ 12 tests
  - [x] 4a: Setup: import `theme_store`, `ARCHIVE_HOURS`, define `SAMPLE_THEME`, `reset_store` autouse fixture (double-reset)
  - [x] 4b: `GET /trends/` tests: empty list, active theme appears, archived excluded, 48h boundary (both sides), sort order
  - [x] 4c: `GET /trends/{id}` tests: 200 with articles, 410 archived, 404 unknown, sentiment enum valid, datetimes tz-aware, articles sorted desc

- [x] Task 5: Add TypeScript types to `frontend/src/types/index.ts`
  - [x] 5a: `MarketThemeSummary` interface
  - [x] 5b: `MarketTheme extends MarketThemeSummary` interface

- [x] Task 6: Add API methods to `frontend/src/lib/api.ts`
  - [x] 6a: Add `MarketThemeSummary`, `MarketTheme` to import
  - [x] 6b: Add `getTrends()` and `getTheme(id)` to `api` object

- [x] Task 7: Run backend tests and confirm no regressions
  - [x] All ≥ 133 tests pass — actual: 135 passed (128 baseline − 7 old trends tests + 14 new = 135)
  - [x] Run: `source venv/bin/activate && python -m pytest tests/ -v` from `backend/`

- [x] Task 8: Run frontend type check
  - [x] No TypeScript errors: `cd frontend && npx tsc --noEmit` — zero errors
  - [x] Frontend test suite still 136/136: `npx vitest run` — 136 passed

### Review Findings

- [x] [Review][Defer] TOCTOU: `get_by_id` + `is_archived` use separate `datetime.now()` calls — at exact 48h boundary a client may receive 410 while GET /trends/ still shows the theme as active [backend/app/routers/trends.py:17-21] — deferred, inherent to time-based filtering design
- [x] [Review][Defer] `get_active()` would crash with `TypeError` if a naive (tz-unaware) datetime enters the store via `upsert` [backend/app/services/theme_store.py:21] — deferred, will be guarded by `AwareDatetime` Pydantic validation in Story 5.4 webhook
- [x] [Review][Defer] `articles.sort()` would crash if `published_at` is a string in some store dicts [backend/app/routers/trends.py:28] — deferred, latent risk only if Story 5.4 webhook calls `model_dump(mode="json")` rather than the default `datetime` output

---

## Dev Agent Record

### Implementation Plan

RED-GREEN-REFACTOR cycle:
1. Wrote `test_trends.py` (14 tests) first — confirmed RED (import error on missing `theme_store`)
2. Implemented Task 1 (`schemas.py`) + Task 2 (`theme_store.py`) + Task 3 (`trends.py`) in parallel
3. All 14 tests GREEN immediately, no iteration needed
4. Tasks 5-6: TypeScript types and api.ts additions; zero TS errors on first run
5. Full backend suite: 135/135; frontend: 136/136

Key implementation choices:
- Router uses walrus operator `:=` in list comprehension for clean inline null-guard on `news_store.get_by_id()`
- `get_active()` releases the lock before `sorted()` call — safe because sorted() operates on a local copy
- `ARCHIVE_HOURS` exported as module constant so tests import it for deterministic boundary construction

### Debug Log

No debugging required — all tests passed on first run.

### Completion Notes

- Backend: 128 → 135 tests (−7 old TrendItem/AISummary tests + 14 new MarketTheme tests)
- Frontend: 136/136 unchanged; `npx tsc --noEmit` zero errors
- `TrendItem` and `AISummary` in `schemas.py` preserved — MarketOverview sidebar unaffected
- `GET /trends/summary` endpoint removed (not used by any frontend code)
- All 10 ACs verified by tests

---

## File List

### New Files
- `backend/app/services/theme_store.py`

### Modified Files
- `backend/app/models/schemas.py`
- `backend/app/routers/trends.py` (FULL REPLACEMENT)
- `backend/tests/routers/test_trends.py` (FULL REPLACEMENT)
- `frontend/src/types/index.ts`
- `frontend/src/lib/api.ts`

### Unchanged Files
- `backend/app/main.py` — `app.include_router(trends.router)` already correct
- All other files

---

## Change Log

| Date | Change |
|------|--------|
| 2026-06-25 | Story created |
| 2026-06-26 | Implementation complete — all 8 tasks done, 135 backend + 136 frontend tests passing |
