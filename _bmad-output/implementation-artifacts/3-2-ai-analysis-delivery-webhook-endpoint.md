---
status: done
epic: 3
story: 2
story_key: "3-2-ai-analysis-delivery-webhook-endpoint"
created: 2026-06-22
baseline_commit: 4645971d6d256b05a079294a6fd86302c6208ab9
---

# Story 3.2: AI Analysis Delivery Webhook Endpoint

**Status:** done

## Story

As the n8n/Claude pipeline,
I want to push AI-generated analysis for a news article into ASK via a FastAPI webhook endpoint,
So that analysis becomes available within 5 minutes of ingestion and the UI transitions from pending state to full insight.

## Acceptance Criteria

### AC1 — Valid analysis attaches to an existing news item

**Given** `POST /webhooks/ai-analysis` receives a valid payload with `news_id`, `summary`, `affected_sectors`, `affected_stocks`, `sentiment`, and `analysis_at`
**When** called with a `news_id` that exists in the store
**Then** it returns `HTTP 200` with `{"status": "attached"}`
**And** `GET /news/{news_id}` now returns a fully populated `ai_analysis` object — no longer `null`

### AC2 — Idempotent upsert (second delivery for same news_id)

**Given** `POST /webhooks/ai-analysis` is called a second time for the same `news_id`
**When** n8n retries the delivery or the pipeline re-runs
**Then** it returns `HTTP 200` with `{"status": "updated"}` — the analysis is updated in place, not duplicated
**And** `GET /news/{news_id}` returns exactly one `ai_analysis` object (not two stacked entries)

### AC3 — Unknown `news_id` returns 404

**Given** `POST /webhooks/ai-analysis` with a `news_id` that does not exist in the store
**When** called
**Then** it returns `HTTP 404` — orphan analysis attachments are rejected

### AC4 — Sentiment type safety enforced at boundary

**Given** a payload with `sentiment` set to any value outside `"bullish" | "bearish" | "neutral"`
**When** the endpoint receives it
**Then** it returns `HTTP 422` — sentiment type safety is enforced at the webhook boundary (FR-A05)

### AC5 — Timezone-aware `analysis_at` enforced

**Given** a payload with a timezone-naive `analysis_at` (no UTC offset or `Z`)
**When** the endpoint receives it
**Then** it returns `HTTP 422` — all analysis timestamps must be timezone-aware (NFR-D03)

### AC6 — Integration verification: GET returns populated ai_analysis

**Given** integration tests for `POST /webhooks/ai-analysis`
**When** they run
**Then** upsert behavior is verified: submitting analysis twice for the same `news_id` results in one `ai_analysis` record, not two
**And** after a successful delivery, `GET /news/{news_id}` returns `ai_analysis` as a populated object with all expected fields, not `null`

---

## Tasks / Subtasks

- [x] Task 1: Add `AIAnalysisPayload` and `AIAnalysisResponse` schemas to `schemas.py` (AC1, AC2, AC4, AC5)
  - [x] Add `AIAnalysisPayload(BaseModel)` with: `news_id: str`, `summary: str = Field(..., min_length=1)`, `affected_sectors: list[str]`, `affected_stocks: list[str]`, `sentiment: Literal["bullish", "bearish", "neutral"]`, `analysis_at: AwareDatetime`
  - [x] Add `AIAnalysisResponse(BaseModel)` with: `status: Literal["attached", "updated"]`
  - [x] Add `ConfigDict(from_attributes=True)` on both new models (consistent with all existing schemas)

- [x] Task 2: Add `attach_analysis()` method to `NewsStore` in `news_store.py` (AC1, AC2, AC3)
  - [x] Implement `attach_analysis(self, news_id: str, analysis_dict: dict) -> str | None` inside the lock
  - [x] Iterate `self._items` in place; when `item["id"] == news_id`: set `item["ai_analysis"] = analysis_dict`; return `"attached"` if was `None`, `"updated"` if was already populated
  - [x] Return `None` when no item with that `news_id` exists — router will convert `None` → `HTTP 404`
  - [x] Lock must wrap the entire search + mutation (atomic)

- [x] Task 3: Add `POST /webhooks/ai-analysis` endpoint to `webhooks.py` (AC1–AC5)
  - [x] Add `from fastapi import APIRouter, HTTPException` import (add `HTTPException` alongside existing `APIRouter`)
  - [x] Add `AIAnalysisPayload, AIAnalysisResponse` to the schemas import line
  - [x] Implement endpoint: `analysis_dict = payload.model_dump(exclude={"news_id"})` — strip `news_id` before storing; `model_dump()` (no `mode="json"`) preserves `analysis_at` as Python `datetime` object
  - [x] Call `result = news_store.attach_analysis(payload.news_id, analysis_dict)` then `raise HTTPException(status_code=404)` if `result is None`
  - [x] Return `AIAnalysisResponse(status=result)`

- [x] Task 4: Write integration tests in `tests/routers/test_webhooks_ai_analysis.py` (AC1–AC6)
  - [x] Import `datetime`, `timezone` from `datetime`; import `news_store`
  - [x] Define `NEWS_INGEST_PAYLOAD` dict with all required fields and dynamic `published_at` using `datetime.now(timezone.utc).isoformat()`
  - [x] Define `VALID_ANALYSIS` dict template: `summary`, `affected_sectors`, `affected_stocks`, `sentiment="bullish"`, and dynamic `analysis_at` using `datetime.now(timezone.utc).isoformat()` — `news_id` will be injected per-test
  - [x] `autouse` `reset_store` fixture (same pattern as `test_webhooks_news.py`): reset before and after each test
  - [x] Helper: create a news item via `POST /webhooks/news-ingest` inside each test that needs a `news_id`
  - [x] Test AC1a: Valid POST with existing `news_id` → 200, `status == "attached"`
  - [x] Test AC1b: After attach, `GET /news/{news_id}` returns `ai_analysis` not null, with correct `summary` and `sentiment`
  - [x] Test AC2a: Second POST with same `news_id` → 200, `status == "updated"`
  - [x] Test AC2b (upsert): two POSTs → `GET /news/{news_id}` still returns one `ai_analysis`, contains the most recently submitted `summary`
  - [x] Test AC3: POST with `news_id` that was never ingested → 404
  - [x] Test AC4: POST with `sentiment="bearish_ish"` → 422
  - [x] Test AC5: POST with `analysis_at="2026-06-22T09:00:00"` (no timezone) → 422
  - [x] Test missing `summary` → 422 (validates `min_length=1` Field enforcement)

- [x] Task 5: Run full pytest suite and verify no regressions
  - [x] Run `cd backend && pytest` — 107/107 pass (97 pre-existing + 10 new)
  - [x] Verify `test_webhooks_news.py` (15 tests) and `test_news.py` (14 tests) are unaffected

### Review Findings

- [x] [Review][Patch] reset() shallow-copies NEWS_DATA — attach_analysis on mock items mutates module-level dict permanently across resets [`backend/app/services/news_store.py:11,60`]
- [x] [Review][Patch] analysis_at not asserted in GET /news/{id} response after attach — silent serialization drop would go undetected [`backend/tests/routers/test_webhooks_ai_analysis.py:58-62`]
- [x] [Review][Defer] Module-level timestamps in test constants evaluated once at import — antipattern but harmless for CI timescales [`backend/tests/routers/test_webhooks_ai_analysis.py:10,23`] — deferred, pre-existing
- [x] [Review][Defer] O(n) linear scan in attach_analysis under _lock blocks concurrent readers — performance, not correctness; negligible at mock-data scale [`backend/app/services/news_store.py:51-55`] — deferred, pre-existing
- [x] [Review][Defer] No test coverage for attach_analysis on pre-seeded mock-data IDs (news-001 through news-005) — nice-to-have; would expose the shallow-copy bug if F1 were not fixed [`backend/tests/routers/test_webhooks_ai_analysis.py`] — deferred, pre-existing

---

## Dev Notes

### Architecture Context

Story 3.2 is **the second write path** into ASK — the first being Story 3.1's `POST /webhooks/news-ingest`. Story 3.2 completes the two-step ingestion loop:

1. n8n scrapes and pushes news → `POST /webhooks/news-ingest` → `ai_analysis: null`
2. n8n triggers Claude → Claude returns analysis → n8n pushes analysis → `POST /webhooks/ai-analysis` → `ai_analysis` populated

After Story 3.2, `GET /news/{id}` can return a fully populated `NewsItem` including AI analysis — no longer always `null` for ingested items.

**Idempotency requirement (NFR-R01):** n8n retries on transient delivery failure. The endpoint must handle "same analysis for same news_id" gracefully — upsert by `news_id`, return `"updated"`. Never create two `ai_analysis` entries for the same item.

### Current State of Relevant Files (READ BEFORE CODING)

**`backend/app/models/schemas.py`** — already has `AIAnalysis(BaseModel)` (the READ-side schema embedded in `NewsItem`):
```python
class AIAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    summary: str
    affected_sectors: list[str]
    affected_stocks: list[str]
    sentiment: Literal["bullish", "bearish", "neutral"]
    analysis_at: AwareDatetime
```

`AIAnalysisPayload` (the WRITE-side webhook schema) is NOT the same as `AIAnalysis`. It has the same analysis fields PLUS `news_id: str`. The endpoint receives `AIAnalysisPayload`, strips `news_id` via `model_dump(exclude={"news_id"})`, and stores the remaining dict as `item["ai_analysis"]`. The stored dict then maps to `AIAnalysis` when Pydantic validates the GET response.

**`backend/app/services/news_store.py`** — existing `NewsStore` class with `__init__`, `get_all`, `get_by_id`, `ingest`, `reset`. Story 3.2 adds `attach_analysis` to this class. The existing `get_by_id` returns `dict(item)` (shallow copy). The `attach_analysis` method must mutate `self._items[i]` **in place** — NOT the shallow copy returned by `get_by_id`. Always iterate `self._items` directly inside the lock.

**`backend/app/routers/webhooks.py`** — existing file with `POST /webhooks/news-ingest`. Story 3.2 adds `POST /webhooks/ai-analysis` to the same router. The existing import is `from fastapi import APIRouter` — add `HTTPException` to the import.

**`backend/app/main.py`** — no changes needed; `webhooks.router` is already registered (`app.include_router(webhooks.router)`).

### `AIAnalysisPayload` Schema (Task 1)

```python
class AIAnalysisPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    news_id: str
    summary: str = Field(..., min_length=1)
    affected_sectors: list[str]
    affected_stocks: list[str]
    sentiment: Literal["bullish", "bearish", "neutral"]
    analysis_at: AwareDatetime


class AIAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: Literal["attached", "updated"]
```

**`affected_sectors` and `affected_stocks`** are `list[str]` — raw string labels, not typed objects. This matches `AIAnalysis.affected_sectors` and `AIAnalysis.affected_stocks`. The `stock_impacts: list[StockImpact]` field on `NewsItem` is a separate structured field (with `symbol`, `direction`, `reason`) that is populated by a different path and is out of scope for Story 3.2.

### `attach_analysis()` Implementation (Task 2)

```python
def attach_analysis(self, news_id: str, analysis_dict: dict) -> str | None:
    with self._lock:
        for item in self._items:
            if item["id"] == news_id:
                status = "attached" if item["ai_analysis"] is None else "updated"
                item["ai_analysis"] = analysis_dict
                return status
        return None
```

**Critical:** The method mutates `item` directly from `self._items` — not from a copy. `get_by_id` returns `dict(item)` (a shallow copy) which is fine for reads, but `attach_analysis` must find and mutate the original dict in `self._items`. Do NOT call `get_by_id` inside `attach_analysis` and try to mutate the copy — the mutation would be lost.

**Thread safety:** The entire search + mutation happens inside a single `with self._lock:` block. This prevents a race where two concurrent n8n retries both see `ai_analysis is None` and both return `"attached"` instead of one `"attached"` + one `"updated"`.

### Webhook Endpoint Implementation (Task 3)

```python
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    AIAnalysisPayload,
    AIAnalysisResponse,
    NewsIngestPayload,
    WebhookIngestResponse,
)
from app.services.news_store import news_store

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/news-ingest", response_model=WebhookIngestResponse)
async def ingest_news(payload: NewsIngestPayload) -> WebhookIngestResponse:
    payload_dict = payload.model_dump()
    event_id, status = news_store.ingest(payload_dict)
    return WebhookIngestResponse(event_id=event_id, status=status)


@router.post("/ai-analysis", response_model=AIAnalysisResponse)
async def attach_ai_analysis(payload: AIAnalysisPayload) -> AIAnalysisResponse:
    analysis_dict = payload.model_dump(exclude={"news_id"})
    result = news_store.attach_analysis(payload.news_id, analysis_dict)
    if result is None:
        raise HTTPException(status_code=404, detail="News item not found")
    return AIAnalysisResponse(status=result)
```

### `model_dump(exclude={"news_id"})` and Datetime Preservation

`payload.model_dump(exclude={"news_id"})` returns a dict like:
```python
{
    "summary": "...",
    "affected_sectors": ["Banking", "Finance"],
    "affected_stocks": ["SCB", "KBANK"],
    "sentiment": "bullish",
    "analysis_at": datetime(2026, 6, 22, 9, 0, 0, tzinfo=timezone.utc),  # Python datetime, NOT a string
}
```

This dict is stored directly as `item["ai_analysis"]`. When FastAPI later serializes a `GET /news/{id}` response with `response_model=NewsItem`, Pydantic validates the nested `ai_analysis` dict as `AIAnalysis`. The `analysis_at` value is a Python `datetime` with `tzinfo` — this is a valid `AwareDatetime`, so validation passes.

**Do NOT use `model_dump(mode="json")`** — that would serialize `analysis_at` to a string `"2026-06-22T09:00:00+00:00"`, and while Pydantic can re-parse a string as `AwareDatetime`, it adds unnecessary round-tripping. Keep all datetimes as Python objects inside the store, consistent with how `NEWS_DATA` stores them.

### Test Isolation (Task 4)

The `news_store` singleton persists across tests in the same pytest process. Use the same autouse fixture pattern as `test_webhooks_news.py`:

```python
@pytest.fixture(autouse=True)
async def reset_store():
    news_store.reset()
    yield
    news_store.reset()
```

`reset()` restores the store to the 5 mock items from `NEWS_DATA`. Any items ingested by `POST /webhooks/news-ingest` during a test are lost after reset. Any `ai_analysis` attached to mock items is also cleared (they re-initialize from `NEWS_DATA` which has pre-populated `ai_analysis` objects on the mock items).

**Test flow for AC1 and AC2:**

```python
async def test_attach_analysis_returns_attached(client):
    # Step 1: ingest a news item to get a news_id
    ingest = await client.post("/webhooks/news-ingest", json=NEWS_INGEST_PAYLOAD)
    assert ingest.status_code == 200
    news_id = ingest.json()["event_id"]

    # Step 2: attach analysis
    analysis = {**VALID_ANALYSIS, "news_id": news_id}
    response = await client.post("/webhooks/ai-analysis", json=analysis)
    assert response.status_code == 200
    assert response.json()["status"] == "attached"
```

The `ingest` step runs AFTER `reset_store` initializes the store, so the ingested item exists for the duration of the test, and is cleared by the post-yield reset.

### Dynamic Timestamps in Tests

Both `NEWS_INGEST_PAYLOAD["published_at"]` and `VALID_ANALYSIS["analysis_at"]` must be dynamic:

```python
from datetime import datetime, timezone

NEWS_INGEST_PAYLOAD = {
    ...
    "published_at": datetime.now(timezone.utc).isoformat(),
    ...
}

VALID_ANALYSIS = {
    ...
    "analysis_at": datetime.now(timezone.utc).isoformat(),
    ...
}
```

Hardcoded dates expire when they fall outside the 7-day retention window. The module-level dict is evaluated once at import time; since tests run promptly, `datetime.now(timezone.utc).isoformat()` at module level is fine for the test session duration (unlike VALID_PAYLOAD in Story 3.1 which was hardcoded and would expire days later).

### `GET /news/{id}` Verification After Analysis Attachment

After attaching, the test must call `GET /news/{news_id}` and verify `ai_analysis` is populated:

```python
async def test_get_news_returns_populated_ai_analysis(client):
    # Step 1: ingest
    ingest = await client.post("/webhooks/news-ingest", json=NEWS_INGEST_PAYLOAD)
    news_id = ingest.json()["event_id"]

    # Step 2: attach analysis
    analysis = {**VALID_ANALYSIS, "news_id": news_id}
    await client.post("/webhooks/ai-analysis", json=analysis)

    # Step 3: verify GET returns populated analysis
    response = await client.get(f"/news/{news_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["ai_analysis"] is not None
    assert data["ai_analysis"]["summary"] == VALID_ANALYSIS["summary"]
    assert data["ai_analysis"]["sentiment"] == "bullish"
    assert "SCB" in data["ai_analysis"]["affected_stocks"]
```

Note: `GET /news/{id}` is at `/news/{news_id}` (not `/api/news/{news_id}`) — the router prefix is `/news`, no `/api/` prefix. Consistent with existing test_news.py patterns.

### `affected_stocks` vs `stock_impacts` — Scope Boundary

`AIAnalysis.affected_stocks` (list[str]) and `NewsItem.stock_impacts` (list[StockImpact]) are different fields serving different purposes:
- `affected_stocks`: raw ticker strings from Claude, displayed in "Affected Stocks" text list
- `stock_impacts`: structured objects with `symbol`, `direction`, `reason` used for direction badges (▲/▼/–)

Story 3.2 populates `ai_analysis.affected_stocks` only. The `stock_impacts` field on the news item remains `[]` for items ingested via Story 3.1 — that structured field is populated by a separate workflow (outside current scope). Do NOT attempt to derive `stock_impacts` from `affected_stocks` in this story.

### What This Story Does NOT Touch

- `backend/app/routers/news.py` — no changes; `GET /news/{id}` already calls `news_store.get_by_id()` which returns the dict with `ai_analysis`; once the dict has a populated `ai_analysis`, the existing endpoint returns it correctly
- `backend/app/main.py` — no changes; `webhooks.router` is already registered
- `frontend/` — no changes; Story 3.2 is backend-only
- `backend/tests/routers/test_webhooks_news.py` — no changes; existing 15 tests must still pass
- `backend/tests/routers/test_news.py` — no changes; existing 14 tests must still pass

### Test Count Target

Story 3.1 added 13 new tests. Story 3.2 should add approximately 8–10 integration tests covering all 5 ACs plus a couple integration verifications. Final total should be ≥ 105 tests.

### `asyncio_mode = "auto"` — Confirmed

`backend/pyproject.toml` already contains `asyncio_mode = "auto"`. No `@pytest.mark.asyncio` decorators needed. All `async def test_*` functions and `async def reset_store()` fixtures work automatically.

### File Structure

**New files:**
- `backend/tests/routers/test_webhooks_ai_analysis.py`

**Modified files:**
- `backend/app/models/schemas.py` — add `AIAnalysisPayload`, `AIAnalysisResponse`
- `backend/app/services/news_store.py` — add `attach_analysis()` method
- `backend/app/routers/webhooks.py` — add `POST /webhooks/ai-analysis` endpoint + `HTTPException` import + updated schemas import

### References

- Story AC source: `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.2
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — NFR-R01 (idempotency), NFR-D03 (timezone-aware datetimes), FR-A05 (sentiment type safety)
- Previous story learnings: `_bmad-output/implementation-artifacts/3-1-news-ingestion-webhook-endpoint.md`
- Existing schemas: `backend/app/models/schemas.py` (AIAnalysis, NewsItem, NewsIngestPayload)
- Existing store: `backend/app/services/news_store.py`
- Existing webhook router: `backend/app/routers/webhooks.py`
- Existing test patterns: `backend/tests/conftest.py`, `backend/tests/routers/test_webhooks_news.py`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Pytest must be run from `backend/` directory (not project root) — project root collects `_bmad/scripts/tests/` which contains a sync test that breaks async event loop setup for subsequent router tests. `pyproject.toml` `testpaths = ["tests"]` only takes effect when pytest runs from `backend/`.

### Completion Notes List

- Added `AIAnalysisPayload` and `AIAnalysisResponse` schemas to `schemas.py` — `AIAnalysisPayload` has `news_id` + all `AIAnalysis` fields; `AIAnalysisResponse` returns `Literal["attached", "updated"]`
- Added `attach_analysis(news_id, analysis_dict) -> str | None` to `NewsStore` — mutates `_items` in place (not the shallow copy from `get_by_id`); thread-safe via `_lock`; returns `"attached"` (first time), `"updated"` (upsert), or `None` (not found)
- Extended `webhooks.py` with `POST /webhooks/ai-analysis` — strips `news_id` via `model_dump(exclude={"news_id"})` preserving datetime objects; raises `HTTPException(404)` on unknown `news_id`
- 10 new integration tests covering all 5 ACs plus upsert verification, full round-trip, and two additional validation tests (empty summary, missing news_id)
- Full suite: 107/107 pass (97 pre-existing + 10 new); no regressions

### File List

**New files:**
- `backend/tests/routers/test_webhooks_ai_analysis.py`

**Modified files:**
- `backend/app/models/schemas.py`
- `backend/app/services/news_store.py`
- `backend/app/routers/webhooks.py`

### Change Log

- 2026-06-22: Implemented Story 3.2 — AI Analysis Delivery Webhook Endpoint. Added AIAnalysisPayload/AIAnalysisResponse schemas, attach_analysis() method to NewsStore, POST /webhooks/ai-analysis endpoint, 10 integration tests. 107/107 pass.
