import pytest

from app.services.market_snapshot_store import market_snapshot_store
from app.services.sector_performance_store import sector_performance_store


@pytest.fixture(autouse=True)
async def reset_market_stores():
    market_snapshot_store.reset()
    sector_performance_store.reset()
    yield
    market_snapshot_store.reset()
    sector_performance_store.reset()


async def test_get_market_overview_returns_200(client):
    response = await client.get("/market/overview")
    assert response.status_code == 200


async def test_get_market_overview_has_required_fields(client):
    response = await client.get("/market/overview")
    data = response.json()
    required_fields = {"indices", "sectors", "trends", "ai_summary", "last_updated", "news_count"}
    assert required_fields.issubset(data.keys())


async def test_get_market_overview_no_null_non_nullable_fields(client):
    response = await client.get("/market/overview")
    data = response.json()
    for field in ["last_updated", "news_count"]:
        assert data[field] is not None


async def test_get_market_overview_indices_structure(client):
    response = await client.get("/market/overview")
    indices = response.json()["indices"]
    assert isinstance(indices, list)
    assert len(indices) > 0
    for idx in indices:
        for field in ["name", "symbol", "price", "change", "change_pct", "market"]:
            assert field in idx
            assert idx[field] is not None


async def test_get_ticker_returns_200(client):
    response = await client.get("/market/ticker")
    assert response.status_code == 200


async def test_get_ticker_has_ticker_key(client):
    response = await client.get("/market/ticker")
    data = response.json()
    assert "ticker" in data
    assert isinstance(data["ticker"], list)
    assert len(data["ticker"]) > 0


async def test_get_indices_returns_200(client):
    response = await client.get("/market/indices")
    assert response.status_code == 200


async def test_get_indices_returns_list(client):
    response = await client.get("/market/indices")
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


# GET /market/sectors now serves from sector_performance_store (starts empty)

async def test_get_sectors_returns_200(client):
    response = await client.get("/market/sectors")
    assert response.status_code == 200


async def test_get_sectors_returns_list(client):
    response = await client.get("/market/sectors")
    data = response.json()
    assert isinstance(data, list)


# GET /market/snapshot

async def test_get_snapshot_returns_404_when_empty(client):
    response = await client.get("/market/snapshot")
    assert response.status_code == 404


async def test_get_snapshot_returns_200_after_data_stored(client):
    from datetime import datetime, timezone
    market_snapshot_store.set({
        "indices": [{"name": "SET", "value": 1384.52, "change_pct": 0.60, "direction": "positive"}],
        "tickers": [{"symbol": "PTT", "price": 32.50, "change_pct": -0.76, "direction": "negative"}],
        "market_open": True,
        "snapshot_at": datetime(2026, 6, 27, 3, 0, tzinfo=timezone.utc),
    })
    response = await client.get("/market/snapshot")
    assert response.status_code == 200
    data = response.json()
    assert data["market_open"] is True
    assert "snapshot_at" in data
