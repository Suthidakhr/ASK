# n8n Setup Guide — ASK Pipeline

This guide covers how to configure n8n to drive the ASK (Aware Signals & Knowledge) news ingestion and AI analysis pipeline.

**Reference requirements:** FR-N01 (news ingestion schedule), FR-A02 (AI analysis within 5 minutes p90), NFR-R01 (idempotent webhooks).

---

## Overview

Five n8n workflows power the live data pipeline:

| Workflow | Purpose | Trigger |
|---------|---------|---------|
| **News Ingestion** | Fetches articles from sources, POSTs each to `/webhooks/news-ingest` | Schedule (cron) |
| **AI Analysis** | Calls Claude API with `SYSTEM_PROMPT`, POSTs result to `/webhooks/ai-analysis` | Triggered per article after ingestion |
| **Daily Brief** | Generates AI market summary, POSTs to `/webhooks/daily-brief` | Daily at 07:00 Bangkok time |
| **Theme Clustering** | Receives AI-identified theme clusters, POSTs to `/webhooks/themes` | Daily after AI analysis batch |
| **Market Data** | Fetches index/ticker snapshot and sector performance, POSTs to market webhooks | Every 15 min during market hours (Mon–Fri) |

All workflows use environment variables for all webhook URLs — never hardcoded values.

---

## Environment Variables

Configure these in n8n's **Settings → Variables** (or your deployment's environment):

| Variable | Description | Example |
|----------|-------------|---------|
| `ASK_NEWS_INGEST_WEBHOOK_URL` | Full URL for `POST /webhooks/news-ingest` | `https://ask.example.com/webhooks/news-ingest` |
| `ASK_AI_ANALYSIS_WEBHOOK_URL` | Full URL for `POST /webhooks/ai-analysis` | `https://ask.example.com/webhooks/ai-analysis` |
| `ASK_DAILY_BRIEF_WEBHOOK_URL` | Full URL for `POST /webhooks/daily-brief` | `https://ask.example.com/webhooks/daily-brief` |
| `ASK_THEME_WEBHOOK_URL` | Full URL for `POST /webhooks/themes` | `https://ask.example.com/webhooks/themes` |
| `ASK_MARKET_SNAPSHOT_WEBHOOK_URL` | Full URL for `POST /webhooks/market-snapshot` | `https://ask.example.com/webhooks/market-snapshot` |
| `ASK_SECTOR_PERFORMANCE_WEBHOOK_URL` | Full URL for `POST /webhooks/sector-performance` | `https://ask.example.com/webhooks/sector-performance` |
| `ANTHROPIC_API_KEY` | Claude API key for the AI analysis node | `sk-ant-api03-...` |
| `ASK_BASE_URL` | Base URL used for polling in E2E validation | `https://ask.example.com` |

In n8n workflow nodes, reference these as `{{ $env.ASK_NEWS_INGEST_WEBHOOK_URL }}`.

---

## Workflow 1: News Ingestion

### Schedule Configuration (FR-N01)

Bangkok time is UTC+7. All cron expressions below are in **UTC**.

#### Market hours schedule (Mon–Fri, 09:00–18:30 Bangkok)

```
*/30 2-11 * * 1-5
```

This fires every 30 minutes during 02:00–11:30 UTC (= 09:00–18:30 Bangkok) on weekdays. Note: the last fire of the day is 11:30 UTC = 18:30 Bangkok — 30 minutes past the nominal 18:00 market close. This extra ingestion is harmless; the alternative (changing to `2-10`) would miss the 18:00 BKK fire.

#### Off-hours schedule

```
0 */2 * * *
```

This fires every 2 hours around the clock.

**n8n version note:** Some n8n versions prefix cron expressions with a seconds field. If your Schedule Trigger node shows 6 fields, use:

```
0 */30 2-11 * * 1-5   ← market hours (with seconds prefix)
0 0 */2 * * *         ← off-hours (with seconds prefix)
```

Configure **two separate Schedule Trigger nodes** in the same workflow, both connected to the ingestion logic, to handle both schedules.

### Ingestion Webhook Payload

The workflow must POST one item at a time to `POST {{ $env.ASK_NEWS_INGEST_WEBHOOK_URL }}` with `Content-Type: application/json`.

**Required fields:**

```json
{
  "headline": "Article headline (non-empty string)",
  "source": "Publisher name, e.g. Bangkok Post (non-empty string)",
  "source_url": "https://... (must be http or https)",
  "published_at": "2026-06-22T09:00:00+07:00",
  "category": "หุ้นไทย",
  "content": "Full article body text (non-empty string)",
  "summary": "",
  "featured": false
}
```

**`category` must be exactly one of:**
- `ดอกเบี้ยโลก` — Global interest rates
- `พลังงาน` — Energy
- `หุ้นไทย` — Thai stocks
- `เทคโนโลยี` — Technology
- `ตลาดโลก` — Global markets

**`published_at`** must be a timezone-aware ISO 8601 datetime. Always include the offset (e.g., `+07:00` or `+00:00`) — never a naive datetime string.

**Response:**
```json
{ "event_id": "<uuid>", "status": "created" }
```
or, if the article was already ingested (idempotent):
```json
{ "event_id": "<uuid>", "status": "duplicate" }
```

Store `event_id` — it is needed to trigger the AI analysis workflow.

### Idempotency (NFR-R01)

The endpoint deduplicates by `source_url`. If n8n retries a failed delivery, the second call returns `"status": "duplicate"` with the same `event_id` and no duplicate record is created. Always pass the same `source_url` for the same article.

---

## Workflow 2: AI Analysis

This workflow runs **per article**, triggered immediately after a successful ingestion (status `"created"` or `"duplicate"`).

### Steps

1. Receive `event_id` and article `content` from Workflow 1 output
2. Call Claude API (`POST https://api.anthropic.com/v1/messages`) with:
   - `model`: `claude-opus-4-8` (or latest available)
   - `system`: contents of `SYSTEM_PROMPT` (see below)
   - `user` message: the article content
   - `max_tokens`: `1024`
3. Parse the JSON response from Claude
4. POST to `{{ $env.ASK_AI_ANALYSIS_WEBHOOK_URL }}`

### System Prompt

The canonical system prompt is version-controlled in `backend/app/ai/prompts.py` as `SYSTEM_PROMPT`. When configuring the Claude node in n8n, copy the current value of `SYSTEM_PROMPT` verbatim into the **System** field of the Claude API node.

> **Important:** `backend/app/ai/prompts.py` is the source of truth (NFR-AI01). If the prompt is updated in that file (committed to git), update the Claude node in n8n to match. Do not edit the prompt only in n8n — it must also be updated in the Python file.

### AI Analysis Webhook Payload

POST to `{{ $env.ASK_AI_ANALYSIS_WEBHOOK_URL }}` with `Content-Type: application/json`:

```json
{
  "news_id": "<event_id from ingestion response>",
  "summary": "2-4 sentence summary from Claude output",
  "affected_sectors": ["Banking", "Energy"],
  "affected_stocks": ["SCB", "PTT"],
  "sentiment": "bullish",
  "analysis_at": "2026-06-22T09:05:00+00:00"
}
```

**`sentiment`** must be exactly one of: `"bullish"`, `"bearish"`, `"neutral"`.

**`affected_sectors`** must use standardized names: `Banking`, `Finance`, `Energy`, `Technology`, `Materials`, `Healthcare`, `Consumer`, `Industrial`, `Real Estate`, `Utilities`.

**`analysis_at`** should be the UTC datetime when Claude produced the analysis — not the article's `published_at`.

**Response:**
```json
{ "status": "attached" }
```
or, if analysis was already present (idempotent update):
```json
{ "status": "updated" }
```

### P90 Latency Target (FR-A02)

The AI analysis workflow must complete within **5 minutes of article ingestion at p90**. Claude API latency is typically under 30 seconds for `claude-opus-4-8` at `max_tokens: 1024`. The dominant factor is n8n's trigger delay and any queue depth. Monitor n8n execution logs for workflows exceeding 5 minutes.

---

## Workflow Import / Export

### Exporting a workflow

1. Open the workflow in n8n
2. Click the **⋮** menu (top-right) → **Download**
3. Save the JSON file as `n8n-workflows/news-ingestion.json` or `ai-analysis.json` in the project repo

### Importing a workflow

1. In n8n, go to **Workflows** → **Import from file**
2. Select the JSON file
3. Review environment variable references — all webhook URLs and API keys must be env vars, not hardcoded strings
4. Activate the workflow

### Version control

Commit exported workflow JSON files to the repo alongside code. This allows rollback when a prompt or pipeline change causes regressions.

---

## Rotating Webhook URLs (No Code Deploy Required)

The ASK webhook endpoints use stable URL paths (`/webhooks/news-ingest`, `/webhooks/ai-analysis`, `/webhooks/daily-brief`) — there are no UUID tokens in the paths. URL rotation means changing the base domain or path prefix:

1. Update `ASK_NEWS_INGEST_WEBHOOK_URL`, `ASK_AI_ANALYSIS_WEBHOOK_URL`, `ASK_DAILY_BRIEF_WEBHOOK_URL`, `ASK_THEME_WEBHOOK_URL`, `ASK_MARKET_SNAPSHOT_WEBHOOK_URL`, and/or `ASK_SECTOR_PERFORMANCE_WEBHOOK_URL` in n8n's environment variables
2. Save the variable — n8n picks up the new value on the next workflow execution
3. No FastAPI code deploy, no workflow JSON change, no restart required

If you use a reverse proxy or API gateway in front of FastAPI with token-based routing, update the gateway route and then update the n8n env var to the new URL.

---

## Workflow 3: Daily Brief

Generates the AI market summary once per day and pushes it to ASK before users open the app.

**Reference requirements:** FR-D04 (daily brief available by 07:00 Bangkok time), NFR-D03 (timezone-aware datetime required).

### Schedule Configuration (FR-D04)

Bangkok time is UTC+7. The cron expression below is in **UTC**.

```
0 0 * * *
```

This fires at 00:00 UTC = 07:00 Bangkok time, every day including weekends.

**n8n version note:** For 6-field cron (with seconds prefix): `0 0 0 * * *`

### Trigger Node

- **Type:** Schedule Trigger
- **Cron:** `0 0 * * *` (UTC) — or use "At a specific time" set to 00:00 UTC
- **Timezone:** Set to UTC (not Bangkok — the cron expression already accounts for the offset)

### AI Generation Node

Configure an HTTP Request node calling the Claude API. Instruct the model to return JSON matching the `DailyBriefIngestPayload` schema:

```json
{
  "overall_sentiment": "bullish",
  "key_developments": ["string", "string", "string"],
  "opportunities": ["string"],
  "risks": ["string"],
  "generated_at": "2026-06-22T00:05:00Z",
  "brief_date": "2026-06-22"
}
```

**Important:** `is_fallback` is **not** part of the payload — the ASK backend computes it at read time. Do not include it.

- `generated_at` must be timezone-aware (include `Z` or `+00:00`). Naive datetimes return `422`.
- `brief_date` is the Bangkok calendar date (YYYY-MM-DD). Use the Bangkok date at trigger time: trigger fires at 00:00 UTC = 07:00 BKK, so use today's Bangkok date.
- `overall_sentiment` must be exactly `"bullish"`, `"bearish"`, or `"neutral"`. Any other value returns `422`.

### Webhook Delivery Node

- **Method:** POST
- **URL:** `{{ $env.ASK_DAILY_BRIEF_WEBHOOK_URL }}`
- **Content-Type:** `application/json`
- **Body:** Parsed JSON from the AI generation node

**Success responses:**
- `{"status": "created"}` — first brief for this date
- `{"status": "updated"}` — brief updated (n8n retry or re-generation)

Both are treated as success — n8n should not retry on either.

### Error Handling

- **On AI generation failure:** n8n logs the error. The GET endpoint serves yesterday's brief as fallback (`is_fallback: true`) until today's brief arrives.
- **On webhook 422:** Fix the AI prompt. The endpoint enforces the schema contract at the boundary — check `overall_sentiment`, `generated_at` timezone, and required fields.
- **On webhook delivery failure:** n8n retries automatically. The endpoint is idempotent — retries for the same `brief_date` return `{"status": "updated"}` and never duplicate data.

---

## Workflow 4: Theme Clustering

Receives AI-identified market theme clusters from the clustering pipeline and pushes them into ASK, making them available on the Trends page.

**Reference requirements:** FR-T01 (themes available each morning), NFR-D03 (timezone-aware datetime required).

### Schedule Configuration

Theme clustering runs once daily **after** Workflow 2 (AI Analysis) has completed processing the day's articles. Configure the trigger time to be at least 30 minutes after the last AI Analysis job typically finishes.

The exact trigger time is configurable in n8n without a code deploy — change the schedule node and save.

### Trigger Node

- **Type:** Schedule Trigger
- **Cron:** `0 2 * * *` (UTC) — or any time after AI analysis batch completes. Adjust as needed.
- **Timezone:** Set to UTC

### AI Theme Generation Node

Configure an HTTP Request node calling the clustering AI model. It should return a payload matching `ThemeIngestPayload`:

```json
{
  "theme_id": "theme-2026-06-26-001",
  "name": "Fed Rate Cut Sentiment",
  "description": "Markets anticipate rate cuts following softer CPI data published this week.",
  "overall_sentiment": "bullish",
  "article_count": 3,
  "last_article_at": "2026-06-26T10:00:00Z",
  "created_at": "2026-06-26T02:00:00Z",
  "constituent_article_ids": ["news-uuid-001", "news-uuid-002", "news-uuid-003"]
}
```

**Important constraints:**
- `overall_sentiment` must be exactly `"bullish"`, `"bearish"`, or `"neutral"`. Any other value returns `422`.
- `last_article_at` and `created_at` must be timezone-aware (include `Z` or `+00:00`). Naive datetimes return `422`.
- `constituent_article_ids` must contain IDs of articles that already exist in ASK's news store. Any unknown ID returns `422` naming the missing article. Ensure Workflow 2 (AI Analysis) completes before Theme Clustering runs.

### Webhook Delivery Node

- **Method:** POST
- **URL:** `{{ $env.ASK_THEME_WEBHOOK_URL }}`
- **Content-Type:** `application/json`
- **Body:** JSON payload from the AI theme generation node

**Success responses:**
- `{"status": "created"}` — new theme (first time this `theme_id` is seen)
- `{"status": "updated"}` — theme updated (n8n retry or re-clustering)

Both are treated as success — n8n should not retry on either.

### Error Handling

- **On webhook 422 with `"Article not found: <id>"`:** The `constituent_article_ids` list contains an ID not yet in ASK. Either the news ingestion hasn't completed yet (retry later) or the article ID is wrong. Check Workflow 1 has run and articles exist.
- **On webhook 422 (other):** Check `overall_sentiment` value and that all datetime fields include timezone offsets.
- **On webhook delivery failure:** n8n retries automatically. The endpoint is idempotent — retries for the same `theme_id` return `{"status": "updated"}` and never duplicate data.

---

## Workflow 5: Market Data

Fetches live index/ticker prices and sector performance from a market data source, then pushes the data into ASK via two separate webhook calls. Runs during SET trading hours so the TickerBar and Sector Heatmap stay current throughout the session.

**Reference requirements:** AC-6.1-05 (market snapshot ingestion), AC-6.1-06 (sector performance ingestion), AC-6.1-09 (webhook response `{"status": "updated"}`).

### Schedule Configuration

Bangkok time is UTC+7. The cron expression below is in **UTC**.

```
*/15 2-11 * * 1-5
```

This fires every 15 minutes from 02:00–11:45 UTC (= 09:00–18:45 Bangkok) on weekdays, covering the SET trading session (09:00–17:00 BKK) with buffer.

**n8n version note:** For 6-field cron (with seconds prefix): `0 */15 2-11 * * 1-5`

### Trigger Node

- **Type:** Schedule Trigger
- **Cron:** `*/15 2-11 * * 1-5` (UTC)
- **Timezone:** Set to UTC

### Step 1 — Fetch Market Data

Configure an HTTP Request node to call your market data provider (e.g., SET API, Yahoo Finance, or an internal aggregator). The response must supply:

- One or more index values (e.g., SET, mai)
- Ticker prices with percentage change
- Sector-level performance

### Step 2 — POST Market Snapshot

**Method:** POST  
**URL:** `{{ $env.ASK_MARKET_SNAPSHOT_WEBHOOK_URL }}`  
**Content-Type:** `application/json`

**Payload shape:**

```json
{
  "indices": [
    { "name": "SET", "value": 1384.52, "change_pct": 0.60, "direction": "positive" },
    { "name": "mai", "value": 589.10, "change_pct": -0.15, "direction": "negative" }
  ],
  "tickers": [
    { "symbol": "PTT",   "price": 32.50, "change_pct": -0.76, "direction": "negative" },
    { "symbol": "KBANK", "price": 143.00, "change_pct": 1.06, "direction": "positive" }
  ],
  "market_open": true,
  "snapshot_at": "2026-06-27T04:15:00+07:00"
}
```

**`direction`** must be exactly `"positive"`, `"negative"`, or `"neutral"`.  
**`snapshot_at`** must be timezone-aware (include `+07:00` or `Z`). Naive datetimes return `422`.  
**`market_open`** should be `true` during SET trading hours, `false` otherwise.

**Success response:**
```json
{ "status": "updated" }
```

### Step 3 — POST Sector Performance

**Method:** POST  
**URL:** `{{ $env.ASK_SECTOR_PERFORMANCE_WEBHOOK_URL }}`  
**Content-Type:** `application/json`

**Payload shape — a JSON array:**

```json
[
  { "sector_name": "ธนาคาร",      "change_pct": 1.12, "direction": "positive", "top_article_id": "news-uuid-001", "updated_at": "2026-06-27T04:15:00+07:00" },
  { "sector_name": "พลังงาน",     "change_pct": -0.54, "direction": "negative", "top_article_id": null,           "updated_at": "2026-06-27T04:15:00+07:00" },
  { "sector_name": "ก่อสร้าง",    "change_pct": 0.02,  "direction": "neutral",  "top_article_id": null,           "updated_at": "2026-06-27T04:15:00+07:00" }
]
```

**`direction`** must be exactly `"positive"`, `"negative"`, or `"neutral"`.  
**`top_article_id`** is optional — use the UUID of a recently ingested article if the sector's movement has a corresponding news story, otherwise `null`.  
**`updated_at`** must be timezone-aware.  

Each POST **replaces** the full sector list. Send all active sectors in a single call.

**Success response:**
```json
{ "status": "updated" }
```

### Error Handling

- **On webhook 422:** Check that all `direction` values are one of the three allowed strings and all datetime fields include a timezone offset.
- **On webhook delivery failure:** n8n retries automatically. Both endpoints are idempotent — retries overwrite with the same data.
- **On market data source failure:** Log the error in n8n and skip this cycle. The ASK frontend displays the last successfully stored snapshot until the next successful push.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `422 Unprocessable Entity` from ingest webhook | Missing required field or invalid `category` value | Check payload fields match schema; `category` must be one of the 5 Thai strings |
| `422` on `published_at` | Naive datetime (no timezone offset) | Always include `+07:00` or `+00:00` suffix |
| `404` from AI analysis webhook | `news_id` doesn't exist | Ensure ingestion completed successfully before triggering analysis |
| `"status": "duplicate"` on every ingest | Same `source_url` submitted twice | Expected behavior — idempotent. Only the first call creates a record |
| Articles appear but `ai_analysis` stays null | AI analysis workflow not triggering | Check Workflow 2 is activated and connected to Workflow 1's output |
| Claude returns non-JSON output | System prompt not set correctly | Verify Claude node System field matches `SYSTEM_PROMPT` from `prompts.py` exactly |
