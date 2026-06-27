---
status: done
epic: 6
story: 1
story_key: "6-1-market-data-schema-api-endpoints-and-ingestion-webhooks"
created: 2026-06-27
baseline_commit: 74fa312eb49bf7b6b263dc347738486d90abb327
---

# Story 6.1: Market Data Schema, API Endpoints & Ingestion Webhooks

**Status:** review

## Story

As a developer,
I want the `MarketSnapshot` and `SectorPerformance` Pydantic schemas defined with API endpoints and idempotent ingestion webhooks,
So that all market context widgets share a single typed data contract and n8n has a clear path to push live market data.

---

## Acceptance Criteria

### AC1 — `TickerItem` schema defined

**Given** `TickerItem` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `symbol` (str), `price` (float), `change_pct` (float), `direction` (Literal["positive", "negative", "neutral"])

### AC2 — `IndexItem` schema defined

**Given** `IndexItem` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `name` (str), `value` (float), `change_pct` (float), `direction` (Literal["positive", "negative", "neutral"])

### AC3 — `MarketSnapshot` schema defined

**Given** `MarketSnapshot` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `indices` (list[IndexItem]), `tickers` (list[TickerItem]), `market_open` (bool), `snapshot_at` (AwareDatetime)

### AC4 — `SectorPerformance` schema defined (new shape)

**Given** `SectorPerformance` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `sector_name` (str), `change_pct` (float), `direction` (Literal["positive", "negative", "neutral"]), `top_article_id` (str | None), `updated_at` (AwareDatetime)

### AC5 — TypeScript types mirror Pydantic schemas exactly

**Given** TypeScript types in `frontend/src/types/index.ts`
**When** `TickerItem`, `IndexItem`, `MarketSnapshot`, and `SectorPerformance` are defined
**Then** they mirror the Pydantic schemas exactly — snake_case, no `alias=`, `direction` typed as `"positive" | "negative" | "neutral"` (not `string`)
**And** `price`, `change_pct`, and `value` are typed `number` — `isFinite()` must be applied before any `toFixed()` or `Math.abs()` call at the formatting layer (NFR-D02)

### AC6 — `GET /api/market/snapshot` returns current snapshot

**Given** `GET /api/market/snapshot`
**When** called and a snapshot exists
**Then** it returns the most recent `MarketSnapshot` — only one "current" snapshot is retained at a time in MVP
**And** the `api.ts` fetch call uses `next: { revalidate: 60 }`

**Given** `GET /api/market/snapshot` when no snapshot has been pushed yet
**When** called
**Then** it returns `HTTP 404` — the frontend renders the widget error state, not a blank card

### AC7 — `GET /api/market/sectors` returns current sector list

**Given** `GET /api/market/sectors`
**When** called
**Then** it returns the current `list[SectorPerformance]` for all sectors
**And** the `api.ts` fetch call uses `next: { revalidate: 60 }`

### AC8 — `POST /webhooks/market-snapshot` ingests market snapshot

**Given** `POST /webhooks/market-snapshot` receives a valid `MarketSnapshot` payload
**When** called
**Then** it returns `HTTP 200` with `{"status": "updated"}` — it always overwrites the single current snapshot (no history retained in MVP)
**And** a timezone-naive `snapshot_at` returns `HTTP 422`

### AC9 — `POST /webhooks/sector-performance` ingests sector list

**Given** `POST /webhooks/sector-performance` receives a valid `list[SectorPerformance]`
**When** called
**Then** it returns `HTTP 200` with `{"status": "updated"}` — all sector rows are replaced atomically
**And** a timezone-naive `updated_at` on any item returns `HTTP 422`

### AC10 — Integration tests validate schema contracts

**Given** integration tests for both webhooks
**When** they run
**Then** an invalid `direction` value (e.g., `"up"`) on any item returns `HTTP 422`
**And** after a successful POST, the corresponding GET endpoint returns the updated data

---

## Dev Notes

### ⚠️ CRITICAL: Old Schema Naming Conflict — Must Read Before Touching Any File

The existing codebase has `SectorPerformance` and `TickerItem` schemas with **completely different shapes** from what Story 6.1 defines. You MUST handle this carefully or you will break compilation and runtime for existing endpoints and components.

#### Old vs New `SectorPerformance`

| Field | OLD (existing) | NEW (Story 6.1) |
|-------|---------------|----------------|
| name | `name: str` | REMOVED |
| sector_name | — | `sector_name: str` |
| change_pct | `change_pct: float` | `change_pct: float` |
| level | `level: str` (e.g., "strong_up") | REMOVED |
| direction | — | `direction: Literal["positive","negative","neutral"]` |
| top_article_id | — | `top_article_id: str \| None` |
| updated_at | — | `updated_at: AwareDatetime` |

**Resolution:** Rename the old `SectorPerformance` to `LegacySectorItem` in `backend/app/models/schemas.py`. Then update every reference to the old name:
- `MarketOverview.sectors: list[LegacySectorItem]` (was `list[SectorPerformance]`)
- `backend/app/routers/market.py` import: change `SectorPerformance` → `LegacySectorItem`
- The OLD `/market/sectors` endpoint (which served static `SECTORS` mock data) now becomes the NEW endpoint that serves from `sector_performance_store` with the new `SectorPerformance` shape.

#### Old vs New `TickerItem` (TypeScript only — no Pydantic schema existed for it)

The old frontend `TickerItem` in `frontend/src/types/index.ts`:
```typescript
interface TickerItem { symbol: string; price: number; change: number; change_pct: number; }
```

The new `TickerItem` (Story 6.1):
```typescript
interface TickerItem { symbol: string; price: number; change_pct: number; direction: "positive" | "negative" | "neutral"; }
```

**Note:** There was NO `TickerItem` Pydantic schema in the backend previously — it was only in TypeScript. The `/market/ticker` endpoint returned raw TICKER_DATA dicts. Story 6.1 defines the real `TickerItem` schema in both backend and frontend.

---

### Architecture: What This Story Does

**Backend (primary scope):**
1. `backend/app/models/schemas.py` — add 4 new schemas + rename old one
2. `backend/app/services/market_snapshot_store.py` — NEW: single-snapshot store
3. `backend/app/services/sector_performance_store.py` — NEW: sector list store
4. `backend/app/routers/market.py` — add `/snapshot` GET, rebuild `/sectors` GET
5. `backend/app/routers/webhooks.py` — add 2 POST webhook endpoints

**Frontend (compatibility fixes — required to prevent compilation errors):**
6. `frontend/src/types/index.ts` — redefine `TickerItem` + `SectorPerformance`, add `IndexItem` + `MarketSnapshot`
7. `frontend/src/lib/api.ts` — add `getMarketSnapshot()` + `getMarketSectors()`, remove `getTicker()`
8. `frontend/src/components/TickerBar.tsx` — fix `item.change` → `item.direction`
9. `frontend/src/components/TickerBar.test.tsx` — update test data to new shape
10. `frontend/src/components/SectorHeatmap.tsx` — fix `sector.name` → `sector.sector_name`, `sector.level` → `sector.direction`
11. `frontend/src/components/SectorHeatmap.test.tsx` — update test data to new shape
12. `frontend/src/app/page.tsx` — update data fetching: use `getMarketSnapshot()` for TickerBar, separate `getMarketSectors()` call for SectorHeatmap

**Docs:**
13. `docs/n8n-setup.md` — update workflow count + add Workflow 5: Market Data

---

### What Already Exists — Do NOT Reinvent

**`ThemeStore` pattern** (`backend/app/services/theme_store.py`) — the two new stores follow the same Lock + dict/list in-memory pattern. Read it before writing the new stores.

**`DailyBriefStore` pattern** (`backend/app/services/daily_brief_store.py`) — closest match for `MarketSnapshotStore` (stores a single current value, not a history). Key method: `reset()` clears back to None.

**Existing `/market/overview`** (`backend/app/routers/market.py`) — uses `MarketOverview` which has `MarketIndex`, `LegacySectorItem` (renamed), `TrendItem`. Keep this endpoint working. Do not change its response shape.

**Existing `/market/ticker`** — serves static `TICKER_DATA` mock dicts via `{"ticker": TICKER_DATA}`. After this story, it's a dead endpoint (no frontend calls it). Leave it in place; do not delete.

**Existing `/market/indices`** — serves static `MARKET_INDICES`. Untouched.

**`asyncio_mode = "auto"`** in `backend/pyproject.toml` — all async test functions work without `@pytest.mark.asyncio`. `client` fixture is in `backend/tests/conftest.py`.

**`venv/bin/pytest`** — always use `backend/venv/bin/pytest`, never system `pytest`.

---

### New Service Store Patterns

#### `MarketSnapshotStore` — single current snapshot

```python
# backend/app/services/market_snapshot_store.py
from threading import Lock

class MarketSnapshotStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._snapshot: dict | None = None

    def set(self, snapshot_dict: dict) -> None:
        with self._lock:
            self._snapshot = dict(snapshot_dict)

    def get(self) -> dict | None:
        with self._lock:
            return dict(self._snapshot) if self._snapshot is not None else None

    def reset(self) -> None:
        with self._lock:
            self._snapshot = None

market_snapshot_store = MarketSnapshotStore()
```

`GET /market/snapshot`:
- `store.get()` → None → raise `HTTPException(status_code=404, detail="No market snapshot available")`
- `store.get()` → dict → return `MarketSnapshot(**snapshot_dict)` after Pydantic coercion

#### `SectorPerformanceStore` — atomic replace of all sectors

```python
# backend/app/services/sector_performance_store.py
from threading import Lock

class SectorPerformanceStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._sectors: list[dict] = []

    def set_all(self, sectors: list[dict]) -> None:
        with self._lock:
            self._sectors = [dict(s) for s in sectors]

    def get_all(self) -> list[dict]:
        with self._lock:
            return [dict(s) for s in self._sectors]

    def reset(self) -> None:
        with self._lock:
            self._sectors = []

sector_performance_store = SectorPerformanceStore()
```

`GET /market/sectors` → `sector_performance_store.get_all()` → always returns list (may be empty). Empty list is valid — frontend renders nothing.

---

### Webhook Endpoint Design

#### `POST /webhooks/market-snapshot`

- Payload: `MarketSnapshot` (Pydantic validates `AwareDatetime` → 422 on naive)
- Response: `MarketWebhookResponse` → `{"status": "updated"}` (always, no created/updated distinction — only one snapshot exists)
- Store: `market_snapshot_store.set(payload.model_dump())`

#### `POST /webhooks/sector-performance`

- Payload: `list[SectorPerformance]` — FastAPI supports list body directly: `async def ingest_sector_performance(payload: list[SectorPerformance]) -> MarketWebhookResponse:`
- Response: `{"status": "updated"}`
- Store: `sector_performance_store.set_all([s.model_dump() for s in payload])`
- Pydantic validates every item — one invalid `direction` or naive `updated_at` → 422

#### `MarketWebhookResponse` schema

```python
class MarketWebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status: Literal["updated"]
```

Both endpoints return `MarketWebhookResponse`. No "created" state — snapshots are always overwrites.

---

### GET /market/snapshot Endpoint: 404 vs 200

```python
@router.get("/snapshot", response_model=MarketSnapshot)
async def get_market_snapshot() -> MarketSnapshot:
    snapshot_dict = market_snapshot_store.get()
    if snapshot_dict is None:
        raise HTTPException(status_code=404, detail="No market snapshot available")
    return MarketSnapshot(**snapshot_dict)
```

`AwareDatetime` stored as Python `datetime` via `model_dump()` (same as ThemeStore). `MarketSnapshot(**snapshot_dict)` reconstructs correctly from stored datetime objects — Pydantic v2 accepts both `datetime` and ISO strings for `AwareDatetime` fields.

---

### Frontend Changes

#### `frontend/src/types/index.ts` — type changes

**Remove** old `TickerItem` (had `change: number`). **Add** new:
```typescript
export interface TickerItem {
  symbol: string;
  price: number;
  change_pct: number;
  direction: "positive" | "negative" | "neutral";
}

export interface IndexItem {
  name: string;
  value: number;
  change_pct: number;
  direction: "positive" | "negative" | "neutral";
}

export interface MarketSnapshot {
  indices: IndexItem[];
  tickers: TickerItem[];
  market_open: boolean;
  snapshot_at: string;
}
```

**Replace** old `SectorPerformance` (had `name`, `level`) with:
```typescript
export interface SectorPerformance {
  sector_name: string;
  change_pct: number;
  direction: "positive" | "negative" | "neutral";
  top_article_id: string | null;
  updated_at: string;
}
```

**Keep unchanged** (these do not conflict): `MarketIndex`, `TrendItem`, `AISummary`, `MarketOverview` (they use the old LegacySectorItem concept but those fields don't affect TypeScript since `MarketOverview.sectors` still expects the old API response shape — update this after verifying the `api.getMarketOverview()` call path).

Wait — `MarketOverview` in TypeScript uses `sectors: SectorPerformance[]`. Since we're changing `SectorPerformance`, `MarketOverview.sectors` will have the wrong type after this. In `page.tsx`, `MarketSidebarServer` passes `overview.sectors` to `SectorHeatmap`. You must update `page.tsx` to NOT pass `overview.sectors` to `SectorHeatmap` anymore — instead use `getMarketSectors()`.

**Resolution:** Update `MarketOverview` TypeScript interface to use a local inline type or change `sectors` field type:
```typescript
export interface MarketOverview {
  indices: MarketIndex[];
  sectors: { name: string; change_pct: number; level: string }[];  // legacy static data
  trends: TrendItem[];
  ai_summary: AISummary;
  last_updated: string;
  news_count: number;
}
```
This keeps `MarketOverview` working without importing the new `SectorPerformance` type for the old static endpoint.

#### `frontend/src/lib/api.ts` — API client changes

**Remove** `getTicker` (dead after this story).
**Add:**
```typescript
getMarketSnapshot: () => fetchAPI<MarketSnapshot>(`/market/snapshot`),
getMarketSectors: () => fetchAPI<SectorPerformance[]>(`/market/sectors`),
```
Update imports in api.ts: add `IndexItem, MarketSnapshot` to the import from `@/types`.

#### `frontend/src/components/TickerBar.tsx` — use direction field

Change `item.change >= 0` to `item.direction !== "negative"`. The `change` field no longer exists.

```tsx
<span className={item.direction === "positive" ? "text-green-200" : item.direction === "negative" ? "text-red-200" : "text-white/70"}>
  {item.direction === "positive" ? "▲" : item.direction === "negative" ? "▼" : "–"} {Math.abs(item.change_pct).toFixed(2)}%
</span>
```

Also: `isFinite()` guard before `Math.abs(item.change_pct).toFixed(2)` → `isFinite(item.change_pct) ? Math.abs(item.change_pct).toFixed(2) : "—"` (NFR-D02).

#### `frontend/src/components/SectorHeatmap.tsx` — use new field names

- `sector.name` → `sector.sector_name`
- `sector.level` → use `sector.direction` with this mapping:
  - `direction === "positive"` → positive cell style
  - `direction === "negative"` → negative cell style
  - `direction === "neutral"` → neutral cell style
- Update `LEVEL_STYLES` to use direction keys instead of level keys:
  ```tsx
  const DIR_STYLES: Record<string, { cell: string; pct: string }> = {
    positive: { cell: "bg-[#dcfce7]", pct: "text-[#15803d]" },
    neutral:  { cell: "bg-[#f5f5f4]", pct: "text-[#6b6560]" },
    negative: { cell: "bg-[#fee2e2]", pct: "text-[#dc2626]" },
  };
  ```
  (Use design tokens from DESIGN.md frontmatter: positive-bg `#dcfce7`, negative-bg `#fee2e2`, neutral-bg `#f5f5f4`)

- `isFinite()` guard: `isFinite(sector.change_pct) ? sector.change_pct.toFixed(2) : "—"` (NFR-D02)

#### `frontend/src/app/page.tsx` — update data fetching

Replace the TickerBar data fetch:
```tsx
// OLD:
let ticker: TickerItem[] = [];
try { ticker = await api.getTicker(); } catch { ... }
// ...
<TickerBar items={ticker} />

// NEW:
let tickers: TickerItem[] = [];
try {
  const snapshot = await api.getMarketSnapshot();
  tickers = snapshot.tickers;
} catch { /* 404 or network error — TickerBar handles empty list */ }
// ...
<TickerBar items={tickers} />
```

Update `MarketSidebarServer` to separate the sectors fetch:
```tsx
async function MarketSidebarServer() {
  let overview: MarketOverview | null = null;
  let sectors: SectorPerformance[] = [];
  try { overview = await api.getMarketOverview(); } catch { /* ignore */ }
  try { sectors = await api.getMarketSectors(); } catch { /* ignore */ }
  return (
    <div className="space-y-4">
      {overview && <MarketOverviewWidget indices={overview.indices} />}
      {sectors.length > 0 && <SectorHeatmap sectors={sectors} />}
      {overview && <TrendSummary trends={overview.trends} />}
    </div>
  );
}
```

Update page.tsx imports:
```tsx
// OLD: import { MarketOverview, NewsItem, TickerItem } from "@/types";
// NEW: import { MarketOverview, NewsItem, TickerItem, SectorPerformance } from "@/types";
```

---

### Testing Strategy

#### Backend: `/backend/tests/routers/test_webhooks_market.py` (NEW)

Autouse fixture to reset both stores:
```python
@pytest.fixture(autouse=True)
async def reset_stores():
    market_snapshot_store.reset()
    sector_performance_store.reset()
    yield
    market_snapshot_store.reset()
    sector_performance_store.reset()
```

Test coverage needed:
- `POST /webhooks/market-snapshot`: 200 + `{"status": "updated"}`, naive datetime → 422, invalid direction → 422
- `POST /webhooks/sector-performance`: 200 + `{"status": "updated"}`, naive `updated_at` → 422, invalid direction → 422, empty list → 200
- Integration: POST snapshot then GET `/market/snapshot` returns data; POST sectors then GET `/market/sectors` returns data
- GET `/market/snapshot` returns 404 when no snapshot stored

#### Backend: Update `/backend/tests/routers/test_market.py`

Add tests for:
- `GET /market/snapshot` returns 404 initially
- After POST, `GET /market/snapshot` returns 200 with correct data

#### Frontend: Update test files

- `TickerBar.test.tsx`: change test data to `{ symbol: 'SET', price: 1384.52, change_pct: 0.60, direction: 'positive' }`
- `SectorHeatmap.test.tsx`: change test data to `{ sector_name: 'ก่อสร้าง', change_pct: 2.41, direction: 'positive', top_article_id: null, updated_at: '2026-06-27T00:00:00Z' }`

---

### Valid Payload Examples

```json
// POST /webhooks/market-snapshot
{
  "indices": [
    {"name": "SET Index", "value": 1384.52, "change_pct": 0.60, "direction": "positive"},
    {"name": "S&P 500", "value": 5541.20, "change_pct": 0.44, "direction": "positive"}
  ],
  "tickers": [
    {"symbol": "PTT", "price": 32.50, "change_pct": -0.76, "direction": "negative"},
    {"symbol": "AOT", "price": 64.75, "change_pct": 1.97, "direction": "positive"}
  ],
  "market_open": true,
  "snapshot_at": "2026-06-27T03:00:00Z"
}

// POST /webhooks/sector-performance (JSON array at root)
[
  {"sector_name": "ก่อสร้าง", "change_pct": 2.41, "direction": "positive", "top_article_id": "news-003", "updated_at": "2026-06-27T03:00:00Z"},
  {"sector_name": "พลังงาน", "change_pct": -0.74, "direction": "negative", "top_article_id": null, "updated_at": "2026-06-27T03:00:00Z"}
]
```

---

### n8n Setup Update

`docs/n8n-setup.md` currently says "Four n8n workflows". After this story it becomes "Five n8n workflows". Add:
- Workflow 5 row to overview table: `| **Market Data** | Pushes MarketSnapshot and SectorPerformance to ASK every 15 min during market hours | Schedule (every 15 min, Mon–Fri 09:00–18:00 Bangkok) |`
- Environment variables: `ASK_MARKET_SNAPSHOT_WEBHOOK_URL` and `ASK_SECTOR_PERFORMANCE_WEBHOOK_URL`
- Full Workflow 5 section with schedule (cron `*/15 2-11 * * 1-5` UTC = every 15 min during market hours Bangkok), two webhook nodes (one per endpoint), and error handling

---

## Tasks

### Task 1: Backend schemas + service stores

- [x] 1.1 Write failing tests for `MarketSnapshotStore.set()`, `get()`, `reset()` in `backend/tests/services/test_market_snapshot_store.py`
- [x] 1.2 Write failing tests for `SectorPerformanceStore.set_all()`, `get_all()`, `reset()` in `backend/tests/services/test_sector_performance_store.py`
- [x] 1.3 In `backend/app/models/schemas.py`: rename `SectorPerformance` → `LegacySectorItem`, update `MarketOverview.sectors: list[LegacySectorItem]`
- [x] 1.4 Add new schemas to `backend/app/models/schemas.py`: `TickerItem`, `IndexItem`, `MarketSnapshot`, new `SectorPerformance`, `MarketWebhookResponse`
- [x] 1.5 Create `backend/app/services/market_snapshot_store.py` with `MarketSnapshotStore` class and singleton `market_snapshot_store`
- [x] 1.6 Create `backend/app/services/sector_performance_store.py` with `SectorPerformanceStore` class and singleton `sector_performance_store`
- [x] 1.7 Run store tests — confirm GREEN (all pass)

### Task 2: Backend endpoints

- [x] 2.1 Write failing tests in `backend/tests/routers/test_webhooks_market.py` (webhook POST tests + GET integration tests)
- [x] 2.2 Add failing tests for `GET /market/snapshot` (404 initially) in `backend/tests/routers/test_market.py`
- [x] 2.3 Update `backend/app/routers/market.py`: fix import (`LegacySectorItem`), add `GET /snapshot` endpoint, rebuild `GET /sectors` to serve from `sector_performance_store`
- [x] 2.4 Update `backend/app/routers/webhooks.py`: add `POST /webhooks/market-snapshot` and `POST /webhooks/sector-performance` with imports
- [x] 2.5 Run backend tests — confirm GREEN (`backend/venv/bin/pytest backend/tests/`)
- [x] 2.6 Verify test count increased (baseline: 145 backend tests before this story)

### Task 3: TypeScript types

- [x] 3.1 Update `frontend/src/types/index.ts`: redefine `TickerItem` (new shape), redefine `SectorPerformance` (new shape), add `IndexItem`, add `MarketSnapshot`; update `MarketOverview.sectors` to inline legacy type `{ name: string; change_pct: number; level: string }[]`
- [x] 3.2 Update `frontend/src/lib/api.ts`: remove `getTicker`, add `getMarketSnapshot` and `getMarketSectors`, update imports

### Task 4: Fix frontend compilation breaks

- [x] 4.1 Update `frontend/src/components/TickerBar.tsx`: replace `item.change >= 0` with `item.direction !== "negative"`, add `isFinite()` guard on `change_pct`
- [x] 4.2 Update `frontend/src/components/TickerBar.test.tsx`: update `VALID_TICKER` to new shape (add `direction`, remove `change`)
- [x] 4.3 Update `frontend/src/components/SectorHeatmap.tsx`: use `sector.sector_name`, `sector.direction`, `DIR_STYLES` by direction key, `isFinite()` guard on `change_pct`
- [x] 4.4 Update `frontend/src/components/SectorHeatmap.test.tsx`: update `VALID_SECTORS` to new shape (`sector_name`, `direction`, `top_article_id`, `updated_at`)
- [x] 4.5 Update `frontend/src/app/page.tsx`: replace TickerBar data fetch with `getMarketSnapshot()`, update `MarketSidebarServer` to call `getMarketSectors()` separately, update imports
- [x] 4.6 Run `cd frontend && npx tsc --noEmit` — must compile clean (zero errors)
- [x] 4.7 Run `cd frontend && npx vitest run` — must pass all existing frontend tests

### Task 5: n8n docs update

- [x] 5.1 Update `docs/n8n-setup.md`: change "Four n8n workflows" → "Five n8n workflows", add Workflow 5 row to overview table, add `ASK_MARKET_SNAPSHOT_WEBHOOK_URL` and `ASK_SECTOR_PERFORMANCE_WEBHOOK_URL` to env vars table, add to URL rotation list, add full "Workflow 5: Market Data" section

---

## Dev Agent Record

### Debug Log
_Populated during implementation_

### Completion Notes

- Renamed old `SectorPerformance` → `LegacySectorItem` to avoid naming collision; updated `MarketOverview.sectors` and all imports.
- `stocks/page.tsx` was also using `overview.sectors` directly in `SectorHeatmap` — fixed to call `getMarketSectors()` separately and guard with `sectors.length > 0`.
- Five additional pages (`news/[id]/page.tsx`, `news/page.tsx`, `stocks/page.tsx`, `trends/page.tsx`, `trends/[id]/page.tsx`) were calling removed `api.getTicker()` — updated all to use `api.getMarketSnapshot()` with `.tickers` extraction.
- `src/lib/api.test.ts` had a test for removed `getTicker` — replaced with tests for `getMarketSnapshot` and `getMarketSectors`.
- Backend: 175 tests pass (baseline was 145; +30 new). Frontend: 161 tests pass.
- TypeScript: zero errors after fixes (`npx tsc --noEmit` clean).

---

## File List

### New Files
- `backend/app/services/market_snapshot_store.py`
- `backend/app/services/sector_performance_store.py`
- `backend/tests/services/test_market_snapshot_store.py`
- `backend/tests/services/test_sector_performance_store.py`
- `backend/tests/routers/test_webhooks_market.py`

### Modified Files
- `backend/app/models/schemas.py`
- `backend/app/routers/market.py`
- `backend/app/routers/webhooks.py`
- `frontend/src/types/index.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/components/TickerBar.tsx`
- `frontend/src/components/TickerBar.test.tsx`
- `frontend/src/components/SectorHeatmap.tsx`
- `frontend/src/components/SectorHeatmap.test.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/news/[id]/page.tsx`
- `frontend/src/app/news/page.tsx`
- `frontend/src/app/stocks/page.tsx`
- `frontend/src/app/trends/page.tsx`
- `frontend/src/app/trends/[id]/page.tsx`
- `frontend/src/lib/api.test.ts`
- `docs/n8n-setup.md`

---

## Senior Developer Review (AI)

**Review date:** 2026-06-27
**Outcome:** Changes Requested

### Review Follow-ups (AI)

#### Decision-Needed

- [x] [Review][Decision] DailyBriefServer error silencing — resolved: restored `console.error` conditional on `process.env.NODE_ENV !== "production"` to keep dev feedback without polluting production logs.
- [x] [Review][Decision] GET /market/sectors returns 200 + `[]` when store is empty — resolved: keep 200 + `[]`; sectors is a list endpoint where empty list is semantically valid; frontend guards with `sectors.length > 0`. AC7 gap noted.

#### Patch

- [x] [Review][Patch] `test_schemas.py` tests new `SectorPerformance` with old field names (`name`, `level`) — tests pass for wrong reason; AC1–AC4 have zero schema-unit-test coverage for `TickerItem`, `IndexItem`, `MarketSnapshot`, new `SectorPerformance` [backend/tests/models/test_schemas.py:13,55,252,257] — **RESOLVED**: renamed stale `SectorPerformance` tests to `LegacySectorItem`; added 28 new tests for TickerItem, IndexItem, MarketSnapshot, and SectorPerformance (new shape). 200 backend tests pass.
- [x] [Review][Patch] `price.toLocaleString()` called without `isFinite()` guard — violates NFR-D02 [frontend/src/components/TickerBar.tsx:35] — **RESOLVED**: wrapped with `isFinite(item.price) ? item.price.toLocaleString() : "—"`.
- [x] [Review][Patch] `MarketSnapshotStore.set()` and `get()` use shallow `dict()` copy — nested `indices`/`tickers` lists share references; concurrent mutation would corrupt stored state [backend/app/services/market_snapshot_store.py:9,14] — **RESOLVED**: replaced `dict()` with `deepcopy()` from `copy` module.
- [x] [Review][Patch] `NaN`/`Infinity` float values pass Pydantic validation and reach JSON serialization — `GET /market/snapshot` returns 500 if a malformed webhook payload smuggles `float('inf')` through [backend/app/routers/market.py:48, backend/app/models/schemas.py:103–118] — **RESOLVED**: added `@field_validator("price", "change_pct")` to `TickerItem` and `@field_validator("value", "change_pct")` to `IndexItem` rejecting non-finite values via shared `_finite()` helper.

#### Deferred

- [x] [Review][Defer] Unauthenticated webhook endpoints — pre-existing pattern across all webhook handlers; not introduced by this story [backend/app/routers/webhooks.py] — deferred, pre-existing
- [x] [Review][Defer] `source_url: string | null` in frontend type but non-nullable in backend schema — pre-existing mismatch [frontend/src/types/index.ts] — deferred, pre-existing
- [x] [Review][Defer] GET /trends drops deleted articles silently — article_count badge disagrees with constituent_articles length [backend/app/routers/trends.py] — deferred, pre-existing
- [x] [Review][Defer] `DailyBriefStore.upsert()` shallow-copies payload dict — list fields share references — deferred, pre-existing
- [x] [Review][Defer] `TickerBar` with empty items still renders `ticker-animate` div — cosmetic flash on cold start — deferred, pre-existing
- [x] [Review][Defer] `export const revalidate = 60` in `stocks/page.tsx` violates project-context rule (mixing page-level + fetch-level revalidate) — deferred, pre-existing before this story

---

## Change Log
_Populated during implementation_
