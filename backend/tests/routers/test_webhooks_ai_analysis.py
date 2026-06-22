from datetime import datetime, timezone

import pytest
from app.services.news_store import news_store

NEWS_INGEST_PAYLOAD = {
    "headline": "AI Analysis Test Article",
    "source": "Test Source",
    "source_url": "https://example.com/ai-test-001",
    "published_at": datetime.now(timezone.utc).isoformat(),
    "category": "หุ้นไทย",
    "content": "This content is for AI analysis delivery testing purposes only.",
    "summary": "AI test summary.",
    "featured": False,
}

VALID_ANALYSIS = {
    "news_id": "PLACEHOLDER",
    "summary": "This article signals a potential shift in Thai banking sector sentiment.",
    "affected_sectors": ["Banking", "Finance"],
    "affected_stocks": ["SCB", "KBANK"],
    "sentiment": "bullish",
    "analysis_at": datetime.now(timezone.utc).isoformat(),
}


@pytest.fixture(autouse=True)
async def reset_store():
    news_store.reset()
    yield
    news_store.reset()


async def _ingest_article(client) -> str:
    response = await client.post("/webhooks/news-ingest", json=NEWS_INGEST_PAYLOAD)
    assert response.status_code == 200
    return response.json()["event_id"]


# AC1 — Valid analysis attaches to existing news item

async def test_attach_analysis_returns_200_and_attached(client):
    news_id = await _ingest_article(client)
    analysis = {**VALID_ANALYSIS, "news_id": news_id}
    response = await client.post("/webhooks/ai-analysis", json=analysis)
    assert response.status_code == 200
    assert response.json()["status"] == "attached"


async def test_get_news_returns_populated_ai_analysis(client):
    news_id = await _ingest_article(client)
    analysis = {**VALID_ANALYSIS, "news_id": news_id}
    await client.post("/webhooks/ai-analysis", json=analysis)

    response = await client.get(f"/news/{news_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["ai_analysis"] is not None
    assert data["ai_analysis"]["summary"] == VALID_ANALYSIS["summary"]
    assert data["ai_analysis"]["sentiment"] == "bullish"
    assert "SCB" in data["ai_analysis"]["affected_stocks"]
    assert "Banking" in data["ai_analysis"]["affected_sectors"]
    assert data["ai_analysis"]["analysis_at"] is not None


# AC2 — Idempotent upsert

async def test_second_delivery_returns_updated(client):
    news_id = await _ingest_article(client)
    analysis = {**VALID_ANALYSIS, "news_id": news_id}

    first = await client.post("/webhooks/ai-analysis", json=analysis)
    assert first.json()["status"] == "attached"

    second = await client.post("/webhooks/ai-analysis", json=analysis)
    assert second.status_code == 200
    assert second.json()["status"] == "updated"


async def test_upsert_updates_summary_not_duplicates(client):
    news_id = await _ingest_article(client)

    first_analysis = {**VALID_ANALYSIS, "news_id": news_id, "summary": "Initial summary."}
    await client.post("/webhooks/ai-analysis", json=first_analysis)

    updated_analysis = {**VALID_ANALYSIS, "news_id": news_id, "summary": "Updated summary."}
    await client.post("/webhooks/ai-analysis", json=updated_analysis)

    response = await client.get(f"/news/{news_id}")
    assert response.status_code == 200
    assert response.json()["ai_analysis"]["summary"] == "Updated summary."


# AC3 — Unknown news_id returns 404

async def test_unknown_news_id_returns_404(client):
    analysis = {**VALID_ANALYSIS, "news_id": "nonexistent-id-00000"}
    response = await client.post("/webhooks/ai-analysis", json=analysis)
    assert response.status_code == 404


# AC4 — Invalid sentiment returns 422

async def test_invalid_sentiment_returns_422(client):
    news_id = await _ingest_article(client)
    analysis = {**VALID_ANALYSIS, "news_id": news_id, "sentiment": "very_bullish"}
    response = await client.post("/webhooks/ai-analysis", json=analysis)
    assert response.status_code == 422


# AC5 — Timezone-naive analysis_at returns 422

async def test_timezone_naive_analysis_at_returns_422(client):
    news_id = await _ingest_article(client)
    analysis = {**VALID_ANALYSIS, "news_id": news_id, "analysis_at": "2026-06-22T09:00:00"}
    response = await client.post("/webhooks/ai-analysis", json=analysis)
    assert response.status_code == 422


# Additional validation

async def test_empty_summary_returns_422(client):
    news_id = await _ingest_article(client)
    analysis = {**VALID_ANALYSIS, "news_id": news_id, "summary": ""}
    response = await client.post("/webhooks/ai-analysis", json=analysis)
    assert response.status_code == 422


async def test_missing_news_id_returns_422(client):
    analysis = {k: v for k, v in VALID_ANALYSIS.items() if k != "news_id"}
    response = await client.post("/webhooks/ai-analysis", json=analysis)
    assert response.status_code == 422


async def test_news_ingest_then_attach_full_round_trip(client):
    # Full round-trip: ingest → attach → read, verify fields match
    news_id = await _ingest_article(client)

    # Verify pending state before analysis
    before = await client.get(f"/news/{news_id}")
    assert before.json()["ai_analysis"] is None

    # Attach analysis
    analysis = {**VALID_ANALYSIS, "news_id": news_id}
    attach = await client.post("/webhooks/ai-analysis", json=analysis)
    assert attach.status_code == 200
    assert attach.json()["status"] == "attached"

    # Verify populated state after analysis
    after = await client.get(f"/news/{news_id}")
    assert after.status_code == 200
    item = after.json()
    assert item["ai_analysis"] is not None
    assert item["ai_analysis"]["sentiment"] == "bullish"
    assert set(item["ai_analysis"]["affected_stocks"]) == {"SCB", "KBANK"}
    assert set(item["ai_analysis"]["affected_sectors"]) == {"Banking", "Finance"}
