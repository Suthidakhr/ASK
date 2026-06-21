---
status: done
epic: 1
story: 1
story_key: "1-1-backend-testing-infrastructure"
created: 2026-06-21
completed: 2026-06-21
baseline_commit: 4df443397c58042a54debb902e859a6398ea6318
---

# Story 1.1: Backend Testing Infrastructure

Status: done

## Story

As a developer,
I want a fully configured backend test suite with proper async FastAPI testing patterns,
so that every backend story can be verified without fighting framework setup.

## Acceptance Criteria

**AC1 — Dependencies installed**
Given `pytest`, `pytest-asyncio`, and `httpx` are in `backend/requirements.txt`
When `pytest` runs from `backend/`
Then all tests pass with `asyncio_mode = "auto"` in `pyproject.toml` (no per-test `@pytest.mark.asyncio` needed)

**AC2 — Async test client works**
Given `tests/conftest.py` uses the exact client pattern:
```python
client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
```
When a test sends `GET /news/` via this client
Then the response is `HTTP 200` with a list of objects matching the `NewsItem` schema shape

**AC3 — AwareDatetime enforcement on NewsItem**
Given `backend/app/models/schemas.py` defines `NewsItem` with `published_at: AwareDatetime`
When a `NewsItem` is constructed with a timezone-naive datetime
Then Pydantic raises a `ValidationError` — timezone-aware datetimes are enforced

**AC4 — Non-nullable field validation across all schemas**
Given all Pydantic model tests in `tests/models/test_schemas.py`
When `NewsItem`, `StockImpact`, `MarketIndex`, `SectorPerformance`, `TrendItem`, `AISummary`, `MarketOverview` are instantiated with valid fixture data
Then all non-nullable fields raise `ValidationError` when set to `None`
Note: `AIAnalysis` model referenced in epics.md does not exist yet — it is introduced in Epic 2 Story 2.1.

**AC5 — Router integration tests pass**
Given the three existing routers (`news`, `market`, `trends`)
When integration tests in `tests/routers/` run for each router
Then each router returns `HTTP 200` with a response whose fields match the declared `response_model`
And no `null` values appear for non-nullable fields in any integration test response
And line coverage on `app/models/` and `app/services/` is ≥ 80%

## Tasks / Subtasks

- [x] Task 1: Add test dependencies to `backend/requirements.txt` (AC1)
  - [x] Add `pytest>=8.3.0` (latest stable as of 2026)
  - [x] Add `pytest-asyncio>=0.24.0`
  - [x] Verify `httpx==0.27.2` already present — do NOT add a duplicate
  - [x] Do NOT add `anyio` — pytest-asyncio handles it

- [x] Task 2: Create `backend/pyproject.toml` (AC1)
  - [x] Create with exactly:
    ```toml
    [tool.pytest.ini_options]
    asyncio_mode = "auto"
    testpaths = ["tests"]
    ```
  - [x] No `[build-system]` section needed — this is config only, not a package

- [x] Task 3: Update `backend/app/models/schemas.py` — AwareDatetime + type safety (AC3, AC4)
  - [x] Add `from pydantic import AwareDatetime, ConfigDict` to imports (remove `from datetime import datetime` — no longer needed directly)
  - [x] Add `from typing import Literal` to imports
  - [x] Change `StockImpact.direction: str` → `direction: Literal["positive", "negative", "neutral"]`
  - [x] Add `model_config = ConfigDict(from_attributes=True)` to `StockImpact`
  - [x] Change `NewsItem.published_at: str` → `published_at: AwareDatetime`
  - [x] Add `model_config = ConfigDict(from_attributes=True)` to `NewsItem`
  - [x] Add `model_config = ConfigDict(from_attributes=True)` to all other models: `MarketIndex`, `SectorPerformance`, `TrendItem`, `AISummary`, `MarketOverview`
  - [x] Do NOT change any other field types in this story — `TrendItem.sentiment`, `AISummary.date`, etc. remain `str` until Epic 2

- [x] Task 4: Update `backend/app/services/mock_data.py` — fix `published_at` to be AwareDatetime-compatible (AC2, AC5)
  - [x] Add `from datetime import datetime, timezone` import
  - [x] Replace all `"published_at": "HH:MM"` strings with proper UTC datetimes:
    - news-001: `datetime(2026, 6, 21, 1, 15, tzinfo=timezone.utc)` (08:15 BKK = 01:15 UTC)
    - news-002: `datetime(2026, 6, 21, 2, 42, tzinfo=timezone.utc)` (09:42 BKK = 02:42 UTC)
    - news-003: `datetime(2026, 6, 21, 3, 18, tzinfo=timezone.utc)` (10:18 BKK = 03:18 UTC)
    - news-004: `datetime(2026, 6, 21, 4, 5, tzinfo=timezone.utc)` (11:05 BKK = 04:05 UTC)
    - news-005: `datetime(2026, 6, 21, 5, 30, tzinfo=timezone.utc)` (12:30 BKK = 05:30 UTC)
  - [x] Do NOT change `AI_SUMMARY.date` (it's still a formatted date string for `AISummary.date: str`)
  - [x] Do NOT change `last_updated` in market router — it's `MarketOverview.last_updated: str`, no change needed

- [x] Task 5: Create test directory structure (AC1, AC2)
  - [x] Create `backend/tests/__init__.py` (empty)
  - [x] Create `backend/tests/models/__init__.py` (empty)
  - [x] Create `backend/tests/routers/__init__.py` (empty)
  - [x] Create `backend/tests/conftest.py` with exact pattern:
    ```python
    import pytest
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    @pytest.fixture
    async def client():
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac
    ```

- [x] Task 6: Create `backend/tests/models/test_schemas.py` (AC3, AC4)
  - [x] Test AwareDatetime enforcement (AC3): constructing `NewsItem` with `datetime.now()` (naive) must raise `ValidationError`
  - [x] Test AwareDatetime passes (AC3): constructing `NewsItem` with `datetime.now(timezone.utc)` must succeed
  - [x] Test `NewsItem` non-nullable fields (AC4): each of `id`, `title`, `summary`, `category`, `published_at`, `source`, `ai_analysis` raises `ValidationError` when set to `None`
  - [x] Test `StockImpact` direction Literal: values outside `["positive","negative","neutral"]` raise `ValidationError`
  - [x] Test `StockImpact.reason` is nullable (Optional): can be `None`
  - [x] Test `MarketIndex` non-nullable fields
  - [x] Test `SectorPerformance` non-nullable fields
  - [x] Test `TrendItem` non-nullable fields
  - [x] Test `AISummary` non-nullable fields
  - [x] Test `MarketOverview` non-nullable fields

- [x] Task 7: Create `backend/tests/routers/test_news.py` (AC2, AC5)
  - [x] `GET /news/` → 200, response is a list, each item has `id`, `title`, `source`, `published_at`, `category`, `stock_impacts`
  - [x] `GET /news/?category=พลังงาน` → 200, all returned items have `category == "พลังงาน"`
  - [x] `GET /news/news-001` → 200, response has `id == "news-001"`
  - [x] `GET /news/nonexistent-id` → 404
  - [x] `GET /news/categories` → 200, response has `categories` key as a list

- [x] Task 8: Create `backend/tests/routers/test_market.py` (AC5)
  - [x] `GET /market/overview` → 200, response has `indices`, `sectors`, `trends`, `ai_summary`, `last_updated`, `news_count`
  - [x] `GET /market/ticker` → 200, response has `ticker` key as a list
  - [x] `GET /market/indices` → 200, response is a list of market index objects
  - [x] `GET /market/sectors` → 200, response is a list of sector objects

- [x] Task 9: Create `backend/tests/routers/test_trends.py` (AC5)
  - [x] `GET /trends/` → 200, response is a list of trend items with `rank`, `title`, `description`, `sentiment`
  - [x] `GET /trends/summary` → 200, response has `date`, `overview`, `key_points`, `watch_sectors`, `avoid_sectors`

- [x] Task 10: Run tests and verify coverage (AC1, AC5)
  - [x] `cd backend && pytest --tb=short` — all tests must pass (55/55 passed)
  - [x] `cd backend && pytest --cov=app/models --cov=app/services --cov-report=term-missing` — coverage 100% (≥ 80% target met)

## Dev Notes

### ⚠️ CRITICAL: Route prefix discrepancy — epics.md vs actual code

The epics.md AC says `GET /api/news` but the **actual backend routes have NO `/api` prefix**:
- `GET /news/` (not `/api/news`)
- `GET /market/overview` (not `/api/market/overview`)
- `GET /trends/` (not `/api/trends/`)

The frontend `lib/api.ts` also calls `/news/`, `/market/overview`, `/market/ticker` directly — no `/api` prefix.

**Decision for this story:** Tests use the actual existing routes (no `/api` prefix). Adding the `/api` prefix is a separate concern and would require updating `lib/api.ts` simultaneously — out of scope here.

### ⚠️ CRITICAL: schemas.py is currently not compliant with project architecture rules

The existing `schemas.py` (read 2026-06-21) has several issues that Story 1.1 must fix:

| Field | Current state | Required state |
|---|---|---|
| `NewsItem.published_at` | `str` (bare time "08:15") | `AwareDatetime` |
| `StockImpact.direction` | `str` | `Literal["positive","negative","neutral"]` |
| All models | No `ConfigDict` | `model_config = ConfigDict(from_attributes=True)` |
| Import | `from datetime import datetime` | `from pydantic import AwareDatetime, ConfigDict` |

The TypeScript side (`types/index.ts`) already has `direction: "positive" | "negative" | "neutral"` as a union — Pydantic must match this.

### ⚠️ CRITICAL: mock_data.py must be updated to match schema change

`mock_data.py` currently stores `published_at` as a bare time string (`"08:15"`). After changing `NewsItem.published_at` to `AwareDatetime`, the router will fail at response validation when it tries to build `NewsItem` from these dicts.

You MUST update every `published_at` in `NEWS_DATA` to a proper `datetime` object with `tzinfo=timezone.utc` before the tests will pass.

### pytest-asyncio: asyncio_mode = "auto" is the only supported pattern

The project-context.md specifies `asyncio_mode = "auto"` in pyproject.toml. This means:
- **No** `@pytest.mark.asyncio` decorators on individual tests
- **No** per-test event loop fixtures
- Fixtures declared `async def` are automatically treated as async
- `conftest.py` fixture `async def client():` works without any markers

### ASGITransport pattern (exact — do not deviate)

```python
# conftest.py — exact required pattern
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
```

`ASGITransport` is in `httpx` (already installed). Do NOT use `TestClient` from `starlette` — it does not support async tests. Do NOT use `httpx.Client` — must be `AsyncClient`.

### Running pytest from the correct directory

```bash
cd backend
source venv/bin/activate
pytest --tb=short
```

Pytest must be run from `backend/`, NOT from the project root. The `testpaths = ["tests"]` in `pyproject.toml` is relative to where pytest is run.

### AIAnalysis model — does not exist yet

The epics.md AC4 references `AIAnalysis` model. This model does **not exist** in the current `schemas.py`. It will be introduced in **Epic 2, Story 2.1** (Schema Foundation). Story 1.1 tests the 7 existing models only.

### What NOT to change in this story

- Do NOT change `TrendItem.sentiment: str` → that becomes a `Literal` in Story 2.1
- Do NOT change `AISummary.date: str` → it remains a formatted date string for now
- Do NOT change `MarketOverview.last_updated: str` → it remains a string
- Do NOT add any new Pydantic models — that's Epic 2
- Do NOT touch any frontend files
- Do NOT change router logic — only add tests that call existing endpoints
- Do NOT add `/api` prefix to routers (leave that for a deliberate decision)

### Coverage target method

```bash
pip install pytest-cov  # add to requirements.txt
pytest --cov=app/models --cov=app/services --cov-report=term-missing
```

Add `pytest-cov` to `requirements.txt` alongside pytest and pytest-asyncio.

### Project Structure Notes

```
backend/
├── app/
│   ├── main.py                    # UNCHANGED
│   ├── models/
│   │   └── schemas.py             # UPDATE: AwareDatetime, ConfigDict, Literal
│   ├── routers/
│   │   ├── news.py                # UNCHANGED
│   │   ├── market.py              # UNCHANGED
│   │   └── trends.py              # UNCHANGED
│   └── services/
│       └── mock_data.py           # UPDATE: published_at → datetime objects
├── tests/                         # NEW DIRECTORY
│   ├── __init__.py                # NEW (empty)
│   ├── conftest.py                # NEW: ASGITransport fixture
│   ├── models/
│   │   ├── __init__.py            # NEW (empty)
│   │   └── test_schemas.py        # NEW: AwareDatetime + nullable tests
│   └── routers/
│       ├── __init__.py            # NEW (empty)
│       ├── test_news.py           # NEW: news router integration tests
│       ├── test_market.py         # NEW: market router integration tests
│       └── test_trends.py         # NEW: trends router integration tests
├── pyproject.toml                 # NEW: asyncio_mode = "auto"
└── requirements.txt               # UPDATE: add pytest, pytest-asyncio, pytest-cov
```

### References

- Story source: `_bmad-output/planning-artifacts/epics.md` § Epic 1, Story 1.1
- Architecture rules: `_bmad-output/project-context.md` § Framework Rules › FastAPI + Pydantic
- Architecture document: `_bmad-output/planning-artifacts/architecture.md`
- Existing schemas: `backend/app/models/schemas.py` (read 2026-06-21)
- Existing mock data: `backend/app/services/mock_data.py` (read 2026-06-21)
- Existing routers: `backend/app/routers/news.py`, `market.py`, `trends.py` (read 2026-06-21)
- TypeScript types: `frontend/src/types/index.ts` (read 2026-06-21 — confirms direction union)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (dev-story implementation, 2026-06-21)

### Debug Log References

No blockers encountered. `asyncio_mode = "auto"` worked cleanly — no per-test markers needed.

### Completion Notes List

- All 5 ACs satisfied. 55 tests, 55 passed, 0 failures.
- Coverage: 100% on `app/models/` and `app/services/` (target was ≥ 80%).
- Route prefix in epics.md says `/api/news` but actual routes have no `/api` prefix. Tests use actual routes — documented in Dev Notes.
- `AIAnalysis` model referenced in epics.md AC4 does not exist yet — deferred to Story 2.1 as documented.

### File List

- `backend/requirements.txt` — UPDATED (added pytest, pytest-asyncio, pytest-cov)
- `backend/pyproject.toml` — CREATED (asyncio_mode = auto, testpaths = tests)
- `backend/app/models/schemas.py` — UPDATED (AwareDatetime, ConfigDict, Literal direction)
- `backend/app/services/mock_data.py` — UPDATED (published_at datetime objects with UTC timezone)
- `backend/tests/__init__.py` — CREATED (empty)
- `backend/tests/conftest.py` — CREATED (AsyncClient + ASGITransport fixture)
- `backend/tests/models/__init__.py` — CREATED (empty)
- `backend/tests/models/test_schemas.py` — CREATED (30 tests covering all 7 models)
- `backend/tests/routers/__init__.py` — CREATED (empty)
- `backend/tests/routers/test_news.py` — CREATED (8 integration tests)
- `backend/tests/routers/test_market.py` — CREATED (10 integration tests)
- `backend/tests/routers/test_trends.py` — CREATED (7 integration tests)

### Change Log

| Date | Change | Files |
|---|---|---|
| 2026-06-21 | Added pytest dependencies | requirements.txt |
| 2026-06-21 | Created pyproject.toml with asyncio config | pyproject.toml |
| 2026-06-21 | Updated schemas — AwareDatetime, Literal, ConfigDict | app/models/schemas.py |
| 2026-06-21 | Updated mock data — published_at datetime objects | app/services/mock_data.py |
| 2026-06-21 | Created full test suite — 55 tests, 100% coverage | tests/ (9 files) |
