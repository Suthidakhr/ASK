from datetime import datetime, timezone

import pytest

from app.services.market_snapshot_store import MarketSnapshotStore

VALID_SNAPSHOT = {
    "indices": [
        {"name": "SET Index", "value": 1384.52, "change_pct": 0.60, "direction": "positive"}
    ],
    "tickers": [
        {"symbol": "PTT", "price": 32.50, "change_pct": -0.76, "direction": "negative"}
    ],
    "market_open": True,
    "snapshot_at": datetime(2026, 6, 27, 3, 0, tzinfo=timezone.utc),
}


@pytest.fixture(autouse=True)
def fresh_store():
    store = MarketSnapshotStore()
    return store


def test_get_returns_none_when_empty(fresh_store):
    assert fresh_store.get() is None


def test_set_then_get_returns_snapshot(fresh_store):
    fresh_store.set(VALID_SNAPSHOT)
    result = fresh_store.get()
    assert result is not None
    assert result["market_open"] is True


def test_set_overwrites_previous_snapshot(fresh_store):
    fresh_store.set(VALID_SNAPSHOT)
    fresh_store.set({**VALID_SNAPSHOT, "market_open": False})
    result = fresh_store.get()
    assert result["market_open"] is False


def test_get_returns_copy_not_reference(fresh_store):
    fresh_store.set(VALID_SNAPSHOT)
    result = fresh_store.get()
    result["market_open"] = False
    assert fresh_store.get()["market_open"] is True


def test_reset_clears_snapshot(fresh_store):
    fresh_store.set(VALID_SNAPSHOT)
    fresh_store.reset()
    assert fresh_store.get() is None


def test_set_stores_copy_not_reference(fresh_store):
    snap = dict(VALID_SNAPSHOT)
    fresh_store.set(snap)
    snap["market_open"] = False
    assert fresh_store.get()["market_open"] is True
