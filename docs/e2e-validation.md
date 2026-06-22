# End-to-End Pipeline Validation

This guide verifies that the full ASK pipeline works correctly: article ingestion → AI analysis → API response, on live infrastructure.

**Run this before every public launch and after any pipeline configuration change.**

---

## Prerequisites

- The FastAPI backend is running and accessible
- The n8n workflows are configured and activated (see `docs/n8n-setup.md`)
- `curl` and `jq` are installed
- Set environment variables:

```bash
export ASK_BASE_URL="https://ask.example.com"
export ASK_NEWS_INGEST_WEBHOOK_URL="$ASK_BASE_URL/webhooks/news-ingest"
export ASK_AI_ANALYSIS_WEBHOOK_URL="$ASK_BASE_URL/webhooks/ai-analysis"
```

---

## Manual Validation Steps

### Step 1: Ingest a test article

POST a test article to the ingestion webhook:

```bash
INGEST_RESPONSE=$(curl -s -X POST "$ASK_NEWS_INGEST_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "E2E Test: SET Index Rises on Banking Sector Gains",
    "source": "ASK E2E Test",
    "source_url": "https://e2e-test.ask.internal/articles/e2e-validation-001",
    "published_at": "'"$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"'",
    "category": "หุ้นไทย",
    "content": "The Stock Exchange of Thailand (SET) index rose 0.8% today, led by gains in the banking sector. SCB and KBANK both advanced as investors responded positively to the Bank of Thailand keeping interest rates steady. Analysts noted broad-based buying across financial stocks.",
    "summary": "",
    "featured": false
  }')

echo "Ingest response: $INGEST_RESPONSE"
NEWS_ID=$(echo "$INGEST_RESPONSE" | jq -r '.event_id')
STATUS=$(echo "$INGEST_RESPONSE" | jq -r '.status')
echo "news_id: $NEWS_ID"
echo "status: $STATUS"
```

**Expected:** `status` is `"created"`. `event_id` is a UUID string.

If `status` is `"duplicate"`, the test URL was already ingested — change the `source_url` to a unique value and retry.

---

### Step 2: Verify the article appears in `GET /news` within 60 seconds

```bash
echo "Polling GET /news for up to 60 seconds..."
FOUND=false
for i in $(seq 1 12); do
  ITEMS=$(curl -s "$ASK_BASE_URL/news?limit=50" | jq -r '.items[].id')
  if echo "$ITEMS" | grep -q "$NEWS_ID"; then
    echo "✅ Article $NEWS_ID found in GET /news after $((i * 5)) seconds"
    FOUND=true
    break
  fi
  echo "  Not yet... ($((i * 5))s)"
  sleep 5
done

if [ "$FOUND" = false ]; then
  echo "❌ FAIL: Article not found in GET /news after 60 seconds"
  exit 1
fi
```

**Expected:** Article appears within 60 seconds (should be immediate — ingestion is synchronous).

---

### Step 3: Wait for AI analysis — `GET /news/{id}` returns non-null `ai_analysis` within 5 minutes

```bash
echo "Waiting for AI analysis (up to 5 minutes)..."
ANALYSIS_FOUND=false
for i in $(seq 1 30); do
  ITEM=$(curl -s "$ASK_BASE_URL/news/$NEWS_ID")
  AI_ANALYSIS=$(echo "$ITEM" | jq '.ai_analysis')
  if [ "$AI_ANALYSIS" != "null" ] && [ -n "$AI_ANALYSIS" ]; then
    echo "✅ AI analysis received after $((i * 10)) seconds"
    echo "$ITEM" | jq '.ai_analysis'
    ANALYSIS_FOUND=true
    break
  fi
  echo "  Waiting for AI analysis... ($((i * 10))s)"
  sleep 10
done

if [ "$ANALYSIS_FOUND" = false ]; then
  echo "❌ FAIL: No AI analysis after 5 minutes (FR-A02 p90 target missed)"
  exit 1
fi
```

**Expected:** `ai_analysis` is non-null within 5 minutes (FR-A02 p90 target).

---

### Step 4: Assert sentiment is a valid enum value

```bash
SENTIMENT=$(curl -s "$ASK_BASE_URL/news/$NEWS_ID" | jq -r '.ai_analysis.sentiment')
echo "AI sentiment: $SENTIMENT"

if [[ "$SENTIMENT" == "bullish" || "$SENTIMENT" == "bearish" || "$SENTIMENT" == "neutral" ]]; then
  echo "✅ Sentiment is valid: $SENTIMENT"
else
  echo "❌ FAIL: Sentiment '$SENTIMENT' is not one of bullish/bearish/neutral"
  exit 1
fi
```

**Expected:** `sentiment` is exactly `"bullish"`, `"bearish"`, or `"neutral"` — never a freeform value from Claude.

If this fails, review the Claude node's System prompt against `backend/app/ai/prompts.py` and run the `docs/ai-quality-checklist.md` spot-check.

---

### Step 5: Verify idempotency — duplicate delivery produces no new record

```bash
BEFORE_COUNT=$(curl -s "$ASK_BASE_URL/news?limit=50" | jq '.items | length')

# Submit the same article again (same source_url)
RETRY_RESPONSE=$(curl -s -X POST "$ASK_NEWS_INGEST_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "E2E Test: SET Index Rises on Banking Sector Gains",
    "source": "ASK E2E Test",
    "source_url": "https://e2e-test.ask.internal/articles/e2e-validation-001",
    "published_at": "'"$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"'",
    "category": "หุ้นไทย",
    "content": "The Stock Exchange of Thailand (SET) index rose 0.8% today, led by gains in the banking sector. SCB and KBANK both advanced as investors responded positively to the Bank of Thailand keeping interest rates steady. Analysts noted broad-based buying across financial stocks.",
    "summary": "",
    "featured": false
  }')

RETRY_STATUS=$(echo "$RETRY_RESPONSE" | jq -r '.status')
AFTER_COUNT=$(curl -s "$ASK_BASE_URL/news?limit=50" | jq '.items | length')

echo "Retry status: $RETRY_STATUS"
echo "Article count before: $BEFORE_COUNT, after: $AFTER_COUNT"

if [ "$RETRY_STATUS" = "duplicate" ] && [ "$BEFORE_COUNT" = "$AFTER_COUNT" ]; then
  echo "✅ Idempotency confirmed: duplicate delivery produced no new record"
else
  echo "❌ FAIL: Duplicate delivery changed state (status=$RETRY_STATUS, count $BEFORE_COUNT → $AFTER_COUNT)"
  exit 1
fi
```

**Expected:** `status` is `"duplicate"`, and the article count does not increase (NFR-R01).

---

## Automated Script (`e2e_validate.sh`)

Save this file to `docs/e2e_validate.sh` and run it against any environment:

```bash
#!/usr/bin/env bash
# ASK End-to-End Pipeline Validation Script
# Usage: ASK_BASE_URL=https://ask.example.com ./e2e_validate.sh

set -euo pipefail

: "${ASK_BASE_URL:?ASK_BASE_URL must be set}"
ASK_NEWS_INGEST_WEBHOOK_URL="$ASK_BASE_URL/webhooks/news-ingest"
TEST_SOURCE_URL="https://e2e-test.ask.internal/articles/e2e-$(date +%s)"

PASS=0
FAIL=0
pass() { echo "✅ $1"; PASS=$((PASS+1)); }
fail() { echo "❌ FAIL: $1"; FAIL=$((FAIL+1)); }

echo "=== ASK E2E Validation ==="
echo "Target: $ASK_BASE_URL"
echo ""

# Step 1: Ingest
echo "Step 1: Ingest test article..."
INGEST=$(curl -sf -X POST "$ASK_NEWS_INGEST_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"headline\": \"E2E Test: SET Index Gains\",
    \"source\": \"ASK E2E Test\",
    \"source_url\": \"$TEST_SOURCE_URL\",
    \"published_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S+00:00)\",
    \"category\": \"หุ้นไทย\",
    \"content\": \"The SET index rose today led by banking sector gains. SCB and KBANK advanced.\",
    \"summary\": \"\",
    \"featured\": false
  }") || { fail "Ingest request failed (HTTP error)"; exit 1; }

NEWS_ID=$(echo "$INGEST" | jq -r '.event_id')
INGEST_STATUS=$(echo "$INGEST" | jq -r '.status')

if [ "$INGEST_STATUS" = "created" ] && [ -n "$NEWS_ID" ] && [ "$NEWS_ID" != "null" ]; then
  pass "Article ingested (id=$NEWS_ID)"
else
  fail "Unexpected ingest response: $INGEST"
  exit 1
fi

# Step 2: Article visible in GET /news within 60s
echo "Step 2: Polling GET /news (60s timeout)..."
FOUND=false
for i in $(seq 1 12); do
  if curl -s "$ASK_BASE_URL/news?limit=50" | jq -r '.items[].id' | grep -q "$NEWS_ID"; then
    pass "Article visible in GET /news ($((i*5))s)"
    FOUND=true; break
  fi
  sleep 5
done
[ "$FOUND" = false ] && fail "Article not in GET /news after 60s"

# Step 3: AI analysis within 5 minutes
echo "Step 3: Waiting for AI analysis (300s timeout)..."
ANALYSIS_FOUND=false
for i in $(seq 1 30); do
  AI=$(curl -s "$ASK_BASE_URL/news/$NEWS_ID" | jq '.ai_analysis')
  if [ "$AI" != "null" ] && [ -n "$AI" ]; then
    pass "AI analysis received ($((i*10))s)"
    ANALYSIS_FOUND=true; break
  fi
  sleep 10
done
[ "$ANALYSIS_FOUND" = false ] && fail "No AI analysis after 300s (FR-A02 p90 miss)"

# Step 4: Sentiment is valid enum
if [ "$ANALYSIS_FOUND" = true ]; then
  SENTIMENT=$(curl -s "$ASK_BASE_URL/news/$NEWS_ID" | jq -r '.ai_analysis.sentiment')
  if [[ "$SENTIMENT" == "bullish" || "$SENTIMENT" == "bearish" || "$SENTIMENT" == "neutral" ]]; then
    pass "Sentiment is valid enum: $SENTIMENT"
  else
    fail "Invalid sentiment: '$SENTIMENT' (expected bullish/bearish/neutral)"
  fi
fi

# Step 5: Idempotency
echo "Step 5: Idempotency check..."
BEFORE=$(curl -s "$ASK_BASE_URL/news?limit=50" | jq '.items | length')
RETRY=$(curl -sf -X POST "$ASK_NEWS_INGEST_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"headline\": \"E2E Test: SET Index Gains\",
    \"source\": \"ASK E2E Test\",
    \"source_url\": \"$TEST_SOURCE_URL\",
    \"published_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S+00:00)\",
    \"category\": \"หุ้นไทย\",
    \"content\": \"The SET index rose today led by banking sector gains. SCB and KBANK advanced.\",
    \"summary\": \"\",
    \"featured\": false
  }")
RETRY_STATUS=$(echo "$RETRY" | jq -r '.status')
AFTER=$(curl -s "$ASK_BASE_URL/news?limit=50" | jq '.items | length')

if [ "$RETRY_STATUS" = "duplicate" ] && [ "$BEFORE" = "$AFTER" ]; then
  pass "Idempotency confirmed (NFR-R01)"
else
  fail "Duplicate delivery changed state (status=$RETRY_STATUS, count $BEFORE→$AFTER)"
fi

# Summary
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
```

### Usage

```bash
chmod +x docs/e2e_validate.sh
ASK_BASE_URL=https://ask.example.com ./docs/e2e_validate.sh
```

---

## Validation Checklist

Complete this checklist after each run and record the result below.

- [ ] Step 1 — Ingest returns `"created"` with a valid `event_id`
- [ ] Step 2 — Article visible in `GET /news` within 60 seconds
- [ ] Step 3 — `GET /news/{id}` returns non-null `ai_analysis` within 5 minutes
- [ ] Step 4 — `ai_analysis.sentiment` is one of `"bullish"`, `"bearish"`, `"neutral"`
- [ ] Step 5 — Duplicate delivery returns `"duplicate"`, article count unchanged

### Run History

| Date | Environment | Steps Passed | Result | Notes |
|------|-------------|--------------|--------|-------|
| _(fill in)_ | _(staging / prod)_ | _ / 5 | Pass / Fail | |

---

## If Validation Fails

| Failure | Likely cause | Action |
|---------|-------------|--------|
| Step 1: HTTP 422 | Invalid payload field | Check `category` value and `published_at` format |
| Step 2: Article not found | Webhook not reachable | Check `ASK_NEWS_INGEST_WEBHOOK_URL` and backend connectivity |
| Step 3: No AI analysis | n8n AI workflow not triggered | Check Workflow 2 is activated; check n8n execution logs |
| Step 4: Invalid sentiment | System prompt mismatch | Compare Claude node System field with `backend/app/ai/prompts.py`; run `docs/ai-quality-checklist.md` |
| Step 5: Duplicate created | Dedup not working | Check `source_url` dedup in `backend/app/services/news_store.py` |
