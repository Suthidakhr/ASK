from datetime import datetime, timezone

import pytest

from app.services.market_snapshot_store import market_snapshot_store
from app.services.sector_performance_store import sector_performance_store

VALID_SNAPSHOT = {
    "indices": [
        {"name": "SET Index", "value": 1384.52, "change_pct": 0.60, "direction": "positive"},
        {"name": "S&P 500", "value": 5541.20, "change_pct": 0.44, "direction": "positive"},
    ],
    "tickers": [
        {"symbol": "PTT", "price": 32.50, "change_pct": -0.76, "direction": "negative"},
        {"symbol": "AOT", "price": 64.75, "change_pct": 1.97, "direction": "positive"},
    ],
    "market_open": True,
    "snapshot_at": datetime.now(timezone.utc).isoformat(),
}

VALID_SECTORS = [
    {
        "sector_name": "ก่อสร้าง",
        "change_pct": 2.41,
        "direction": "positive",
        "top_article_id": "news-001",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "sector_name": "พลังงาน",
        "change_pct": -0.74,
        "direction": "negative",
        "top_article_id": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
]


@pytest.fixture(autouse=True)
async def reset_stores():
    market_snapshot_store.reset()
    sector_performance_store.reset()
    yield
    market_snapshot_store.reset()
    sector_performance_store.reset()


# --- POST /webhooks/market-snapshot ---

async def test_market_snapshot_valid_returns_200(client):
    response = await client.post("/webhooks/market-snapshot", json=VALID_SNAPSHOT)
    assert response.status_code == 200


async def test_market_snapshot_valid_returns_updated_status(client):
    response = await client.post("/webhooks/market-snapshot", json=VALID_SNAPSHOT)
    assert response.json()["status"] == "updated"


async def test_market_snapshot_idempotent_always_updated(client):
    first = await client.post("/webhooks/market-snapshot", json=VALID_SNAPSHOT)
    second = await client.post("/webhooks/market-snapshot", json=VALID_SNAPSHOT)
    assert first.json()["status"] == "updated"
    assert second.json()["status"] == "updated"


async def test_market_snapshot_naive_snapshot_at_returns_422(client):
    bad = {**VALID_SNAPSHOT, "snapshot_at": "2026-06-27T03:00:00"}
    response = await client.post("/webhooks/market-snapshot", json=bad)
    assert response.status_code == 422


async def test_market_snapshot_invalid_direction_in_ticker_returns_422(client):
    bad = {
        **VALID_SNAPSHOT,
        "tickers": [{"symbol": "PTT", "price": 32.50, "change_pct": -0.76, "direction": "up"}],
    }
    response = await client.post("/webhooks/market-snapshot", json=bad)
    assert response.status_code == 422


async def test_market_snapshot_invalid_direction_in_index_returns_422(client):
    bad = {
        **VALID_SNAPSHOT,
        "indices": [{"name": "SET", "value": 1384.52, "change_pct": 0.60, "direction": "up"}],
    }
    response = await client.post("/webhooks/market-snapshot", json=bad)
    assert response.status_code == 422


# --- POST /webhooks/sector-performance ---

async def test_sector_performance_valid_returns_200(client):
    response = await client.post("/webhooks/sector-performance", json=VALID_SECTORS)
    assert response.status_code == 200


async def test_sector_performance_valid_returns_updated_status(client):
    response = await client.post("/webhooks/sector-performance", json=VALID_SECTORS)
    assert response.json()["status"] == "updated"


async def test_sector_performance_empty_list_returns_200(client):
    response = await client.post("/webhooks/sector-performance", json=[])
    assert response.status_code == 200


async def test_sector_performance_naive_updated_at_returns_422(client):
    bad = [{**VALID_SECTORS[0], "updated_at": "2026-06-27T03:00:00"}]
    response = await client.post("/webhooks/sector-performance", json=bad)
    assert response.status_code == 422


async def test_sector_performance_invalid_direction_returns_422(client):
    bad = [{**VALID_SECTORS[0], "direction": "up"}]
    response = await client.post("/webhooks/sector-performance", json=bad)
    assert response.status_code == 422


# --- Integration: POST then GET ---

async def test_post_snapshot_then_get_returns_data(client):
    await client.post("/webhooks/market-snapshot", json=VALID_SNAPSHOT)
    response = await client.get("/market/snapshot")
    assert response.status_code == 200
    data = response.json()
    assert data["market_open"] is True
    assert len(data["tickers"]) == 2


async def test_post_sectors_then_get_returns_data(client):
    await client.post("/webhooks/sector-performance", json=VALID_SECTORS)
    response = await client.get("/market/sectors")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["sector_name"] == "ก่อสร้าง"


async def test_get_snapshot_returns_404_when_empty(client):
    response = await client.get("/market/snapshot")
    assert response.status_code == 404


async def test_get_sectors_returns_empty_list_when_empty(client):
    response = await client.get("/market/sectors")
    assert response.status_code == 200
    assert response.json() == []
