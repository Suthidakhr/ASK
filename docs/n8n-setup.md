# n8n Setup Guide — ASK Pipeline

This guide covers how to configure n8n to drive the ASK (Aware Signals & Knowledge) news ingestion and AI analysis pipeline.

**Reference requirements:** FR-N01 (news ingestion schedule), FR-A02 (AI analysis within 5 minutes p90), NFR-R01 (idempotent webhooks).

---

## Overview

Two n8n workflows power the live data pipeline:

| Workflow | Purpose | Trigger |
|---------|---------|---------|
| **News Ingestion** | Fetches articles from sources, POSTs each to `/webhooks/news-ingest` | Schedule (cron) |
| **AI Analysis** | Calls Claude API with `SYSTEM_PROMPT`, POSTs result to `/webhooks/ai-analysis` | Triggered per article after ingestion |

Both workflows use environment variables for all webhook URLs — never hardcoded values.

---

## Environment Variables

Configure these in n8n's **Settings → Variables** (or your deployment's environment):

| Variable | Description | Example |
|----------|-------------|---------|
| `ASK_NEWS_INGEST_WEBHOOK_URL` | Full URL for `POST /webhooks/news-ingest` | `https://ask.example.com/webhooks/news-ingest` |
| `ASK_AI_ANALYSIS_WEBHOOK_URL` | Full URL for `POST /webhooks/ai-analysis` | `https://ask.example.com/webhooks/ai-analysis` |
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

The ASK webhook endpoints use stable URL paths (`/webhooks/news-ingest`, `/webhooks/ai-analysis`) — there are no UUID tokens in the paths. URL rotation means changing the base domain or path prefix:

1. Update `ASK_NEWS_INGEST_WEBHOOK_URL` and/or `ASK_AI_ANALYSIS_WEBHOOK_URL` in n8n's environment variables
2. Save the variable — n8n picks up the new value on the next workflow execution
3. No FastAPI code deploy, no workflow JSON change, no restart required

If you use a reverse proxy or API gateway in front of FastAPI with token-based routing, update the gateway route and then update the n8n env var to the new URL.

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
