---
status: done
epic: 3
story: 4
story_key: "3-4-n8n-workflow-configuration-and-pipeline-validation"
created: 2026-06-22
baseline_commit: 14f8c7f9a6d0fba554171f3b88ad727b081c65a2
---

# Story 3.4: n8n Workflow Configuration & End-to-End Pipeline Validation

**Status:** done

## Story

As a retail investor,
I want the platform to automatically collect and analyze news without any manual triggering,
So that fresh, AI-analyzed articles appear in the feed within 30 minutes of publication.

## Acceptance Criteria

### AC1 — n8n news ingestion workflow scheduling

**Given** the n8n news ingestion workflow
**When** it is configured
**Then** it runs every 30 minutes during 09:00–18:00 Bangkok time (UTC+7) and every 2 hours outside market hours (FR-N01)
**And** the webhook URL for `POST /webhooks/news-ingest` is stored in an n8n environment variable — never hardcoded in the workflow definition

### AC2 — n8n AI analysis workflow triggered per article

**Given** the n8n AI analysis workflow
**When** a new article is ingested
**Then** it triggers the Claude analysis pipeline within 5 minutes at p90 (FR-A02)
**And** the webhook URL for `POST /webhooks/ai-analysis` is stored in an n8n environment variable — never hardcoded

### AC3 — `docs/n8n-setup.md` setup guide created

**Given** `docs/n8n-setup.md`
**When** it is created
**Then** it documents:
  - Workflow import/export instructions
  - All required environment variables (webhook URLs, Claude API key reference)
  - The scheduling configuration (cron expressions for both market-hours and off-hours schedules)
  - How to rotate webhook UUIDs without a code deploy

### AC4 — End-to-end validation script created

**Given** `docs/e2e-validation.md`
**When** it is created
**Then** it documents a manual or scripted end-to-end test that verifies:
  - A test article submitted to `POST /webhooks/news-ingest` appears in `GET /news` within 60 seconds
  - `GET /news/{id}` returns a non-null `ai_analysis` within 5 minutes
  - The `sentiment` value is one of the three valid strings — not a freeform value from Claude
  - n8n retry idempotency: a duplicate delivery produces no extra record (references Stories 3.1 and 3.2 idempotency tests)

---

## Tasks / Subtasks

- [x] Task 1: Create `docs/n8n-setup.md` — full n8n setup and environment variable guide (AC1, AC2, AC3)
  - [x] Document the two required n8n workflows: News Ingestion and AI Analysis
  - [x] Document all required environment variables: `ASK_NEWS_INGEST_WEBHOOK_URL`, `ASK_AI_ANALYSIS_WEBHOOK_URL`, `ANTHROPIC_API_KEY` (or Claude API credential reference)
  - [x] Document news ingestion schedule: cron `*/30 2-11 * * 1-5` (UTC, = 09:00–18:00 BKK Mon–Fri every 30 min) and off-hours `0 */2 * * *`
  - [x] Document the `POST /webhooks/news-ingest` payload schema (all fields from `NewsIngestPayload`)
  - [x] Document the `POST /webhooks/ai-analysis` payload schema (all fields from `AIAnalysisPayload`)
  - [x] Document the `SYSTEM_PROMPT` pass-through: n8n reads `backend/app/ai/prompts.py`'s content and passes it as the `system` field to Claude
  - [x] Document webhook UUID rotation process: generate new UUID, update environment variable, no code deploy needed
  - [x] Document how to import/export n8n workflow JSON files

- [x] Task 2: Create `docs/e2e-validation.md` — end-to-end pipeline validation guide (AC4)
  - [x] Document Step 1: submit a test article to `POST /webhooks/news-ingest` (include example curl command with all required fields)
  - [x] Document Step 2: poll `GET /news` within 60 seconds — assert the article appears (check by `source_url`)
  - [x] Document Step 3: wait up to 5 minutes, poll `GET /news/{id}` — assert `ai_analysis` is non-null
  - [x] Document Step 4: assert `ai_analysis.sentiment` is one of `"bullish"`, `"bearish"`, `"neutral"` — never a freeform string
  - [x] Document Step 5: submit the same test article again — assert `GET /news` count does not increase (idempotency, references Story 3.1 dedup)
  - [x] Include a `bash` script block (`e2e_validate.sh`) that automates Steps 1–5 using `curl` and `jq`

- [x] Task 3: No code changes — verify existing backend tests still pass
  - [x] Run `cd backend && pytest` — confirm 112/112 still pass (no regressions from doc-only story)

### Review Findings

- [x] [Review][Patch] Cron prose says 09:00–18:00 BKK but `*/30 2-11 * * 1-5` fires at 18:30 BKK — updated heading and added note explaining 18:30 BKK behavior [`docs/n8n-setup.md` cron section]
- [x] [Review][Patch] `curl -sf` in polling loops aborts script under `set -e` on any 4xx/5xx — dropped `-f` from Steps 2, 3, 4 polling calls; kept `-f` on ingest/retry POSTs [`docs/e2e-validation.md` lines 221, 233, 244, 254, 268]
- [x] [Review][Patch] `GET /news` no-limit poll only returns 20 items — added `?limit=50` to all GET /news polling calls (manual + automated) [`docs/e2e-validation.md` lines 63, 134, 151, 221, 254, 268]
- [x] [Review][Defer] `fail()` after Step 2 doesn't abort automated script — Step 3 runs 5 min unnecessarily [`docs/e2e-validation.md` automated script] — deferred, UX tradeoff not a correctness bug
- [x] [Review][Defer] Step 5 count comparison has TOCTOU race under concurrent writes [`docs/e2e-validation.md` lines 134, 254] — deferred, inherent limitation; partially mitigated by limit=50 patch
- [x] [Review][Defer] `ASK_BASE_URL` is a 4th env var beyond spec's three required [`docs/n8n-setup.md` env vars table] — deferred, correctly scoped to E2E validation tooling, not n8n workflow config

---

## Dev Notes

### Story Nature: Documentation + Ops

Story 3.4 is **documentation only** — no new FastAPI endpoints, no new Python files, no schema changes. The webhook endpoints (`POST /webhooks/news-ingest` and `POST /webhooks/ai-analysis`) were implemented in Stories 3.1 and 3.2. Story 3.3 established the system prompt. Story 3.4 documents how to wire it all together in n8n and validates the full pipeline end-to-end.

**No changes to `backend/` code.** All deliverables are Markdown documents in `docs/`.

### Existing Docs Structure

```
docs/
  BMAD_INSTALL_GUIDE.md         ← pre-existing
  bmad-workflow-guide.md         ← pre-existing
  ai-quality-checklist.md        ← added by Story 3.3
  n8n-setup.md                   ← NEW (Task 1)
  e2e-validation.md              ← NEW (Task 2)
```

### Endpoint Reference (for doc accuracy)

**`POST /webhooks/news-ingest`** — `NewsIngestPayload`:
```json
{
  "headline": "string (min_length=1)",
  "source": "string (min_length=1)",
  "source_url": "https://... (must be http/https)",
  "published_at": "2026-06-22T09:00:00+00:00 (timezone-aware ISO 8601)",
  "category": "ดอกเบี้ยโลก | พลังงาน | หุ้นไทย | เทคโนโลยี | ตลาดโลก",
  "content": "string (min_length=1)",
  "summary": "string (optional, defaults to empty string)",
  "featured": false
}
```
Response: `{"event_id": "<uuid>", "status": "created" | "duplicate"}`

**`POST /webhooks/ai-analysis`** — `AIAnalysisPayload`:
```json
{
  "news_id": "<event_id from news-ingest response>",
  "summary": "string (min_length=1)",
  "affected_sectors": ["Banking", "Finance"],
  "affected_stocks": ["SCB", "KBANK"],
  "sentiment": "bullish | bearish | neutral",
  "analysis_at": "2026-06-22T09:05:00+00:00 (timezone-aware ISO 8601)"
}
```
Response: `{"status": "attached" | "updated"}`

**`GET /news`** — returns `NewsListResponse`:
- `items`: list of `NewsItem` (filtered by retention window, max 50 per call)
- `last_updated`: timestamp of most recent item

**`GET /news/{id}`** — returns single `NewsItem` (bypasses retention filter)

### Cron Schedule Reference (Bangkok time = UTC+7)

| Schedule | Bangkok time | UTC cron |
|----------|-------------|----------|
| Market hours (Mon–Fri 09:00–18:00 BKK) every 30 min | 09:00, 09:30, ..., 17:30 | `*/30 2-11 * * 1-5` |
| Off-hours every 2 hours | any time outside above | `0 */2 * * *` |

n8n uses **UTC** for all cron expressions. Bangkok is UTC+7, so 09:00 BKK = 02:00 UTC and 18:00 BKK = 11:00 UTC.

**Important:** n8n Schedule Trigger node uses the expression `*/30 2-11 * * 1-5` in UTC. The exact expression format depends on n8n version — some versions use `0 */30 2-11 * * 1-5` (with seconds as the first field). Document both and note the n8n version where each applies.

### Environment Variables

| Variable | Purpose | Example value |
|----------|---------|---------------|
| `ASK_NEWS_INGEST_WEBHOOK_URL` | `POST /webhooks/news-ingest` full URL | `https://ask.example.com/webhooks/news-ingest` |
| `ASK_AI_ANALYSIS_WEBHOOK_URL` | `POST /webhooks/ai-analysis` full URL | `https://ask.example.com/webhooks/ai-analysis` |
| `ANTHROPIC_API_KEY` | Claude API key for AI analysis node | `sk-ant-...` |

### Webhook UUID Rotation (no code deploy)

The webhook URLs use a stable path (`/webhooks/news-ingest`, `/webhooks/ai-analysis`) — there is no UUID in the path itself. "Rotating webhook UUIDs" in this project means:
- If using a reverse proxy or API gateway in front of FastAPI with UUID-based routing, update the gateway route and environment variable
- If using direct FastAPI URLs, UUID rotation is not applicable — document that instead as "rotating the base URL"
- The key principle: webhook URLs live in `ASK_NEWS_INGEST_WEBHOOK_URL` / `ASK_AI_ANALYSIS_WEBHOOK_URL` environment variables in n8n — changing the URL requires only updating the env var, not redeploying code

### System Prompt Pass-Through to Claude

n8n passes the system prompt to Claude via the AI node's `system` field. The canonical content is `backend/app/ai/prompts.py → SYSTEM_PROMPT`. Document that n8n operators should copy the current prompt text from that file when configuring or updating the Claude node — the file is the source of truth (NFR-AI01).

### E2E Validation Script (`e2e_validate.sh`)

The script should use `curl` and `jq`. Key steps:

```bash
# Step 1: Ingest test article
RESPONSE=$(curl -s -X POST "$ASK_NEWS_INGEST_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"headline":"E2E Test Article","source":"Test Source",...}')
NEWS_ID=$(echo $RESPONSE | jq -r '.event_id')
STATUS=$(echo $RESPONSE | jq -r '.status')

# Step 2: Poll GET /news within 60s
# Step 3: Wait up to 5 min, poll GET /news/{id} for non-null ai_analysis
# Step 4: Assert sentiment is one of bullish/bearish/neutral
# Step 5: Re-submit same article, assert count unchanged (idempotency)
```

Use `ASK_BASE_URL` as the base URL env var for `GET /news` and `GET /news/{id}` calls.

### Previous Story Context

- **Story 3.1** (`3-1-news-ingestion-webhook-endpoint.md`): Implemented `POST /webhooks/news-ingest`. Dedup by `source_url` and content hash. Idempotency: same `source_url` returns `"duplicate"`.
- **Story 3.2** (`3-2-ai-analysis-delivery-webhook-endpoint.md`): Implemented `POST /webhooks/ai-analysis`. Idempotency: same `news_id` returns `"updated"`, not a duplicate record.
- **Story 3.3** (`3-3-ai-system-prompt-version-controlled-constraints.md`): `SYSTEM_PROMPT` in `backend/app/ai/prompts.py`. Four constraints: no price predictions, no security recommendations, sentiment enum, disclaimer phrase.

### What This Story Does NOT Touch

- Any `backend/` Python files — no changes
- Any `frontend/` files — no changes
- FastAPI `main.py`, routers, schemas, services — no changes
- `backend/tests/` — no new tests needed (docs only); Task 3 just verifies existing suite still passes

### Test Count

No new tests. Pre-existing 112 tests must all still pass after the doc additions.

### References

- Story AC source: `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.4
- FR-N01: News collection every 30 min market hours, every 2 hours off-hours (Bangkok time)
- FR-A02: AI analysis triggered within 5 minutes of ingestion (p90)
- NFR-R01: All n8n webhooks idempotent — no duplicates on retry
- Endpoint schemas: `backend/app/models/schemas.py` (`NewsIngestPayload`, `AIAnalysisPayload`)
- System prompt: `backend/app/ai/prompts.py`
- Previous stories: 3-1, 3-2, 3-3 implementation artifacts

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers. Documentation-only story; no code changes.

### Completion Notes List

- Created `docs/n8n-setup.md`: env vars, cron schedule table (UTC ↔ Bangkok), both workflow payload schemas, system prompt pass-through note, import/export instructions, URL rotation pattern, troubleshooting table
- Created `docs/e2e-validation.md`: 5-step manual validation guide with curl examples + `e2e_validate.sh` bash script automating all 5 steps; run history table
- Confirmed 112/112 tests still pass (no regressions from doc-only additions)
- AC1/AC2: scheduling and env var patterns documented in `n8n-setup.md` — webhook URLs always via `$env.ASK_NEWS_INGEST_WEBHOOK_URL` / `$env.ASK_AI_ANALYSIS_WEBHOOK_URL`
- AC3: `n8n-setup.md` covers all four required topics: import/export, env vars, cron schedule, URL rotation
- AC4: `e2e-validation.md` covers all four required checks: 60s article visibility, 5min AI analysis, sentiment enum assertion, idempotency

### File List

**New files:**
- `docs/n8n-setup.md`
- `docs/e2e-validation.md`

**Modified files:**
- `_bmad-output/implementation-artifacts/3-4-n8n-workflow-configuration-and-pipeline-validation.md` (story file — status, tasks, dev record)

### Change Log

- 2026-06-22: Story 3.4 implemented — created `docs/n8n-setup.md` and `docs/e2e-validation.md`. No backend/frontend changes. 112/112 tests pass.
