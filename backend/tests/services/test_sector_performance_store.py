from datetime import datetime, timezone

import pytest

from app.services.sector_performance_store import SectorPerformanceStore

VALID_SECTORS = [
    {"sector_name": "ก่อสร้าง", "change_pct": 2.41, "direction": "positive", "top_article_id": "news-001", "updated_at": datetime(2026, 6, 27, 3, 0, tzinfo=timezone.utc)},
    {"sector_name": "พลังงาน", "change_pct": -0.74, "direction": "negative", "top_article_id": None, "updated_at": datetime(2026, 6, 27, 3, 0, tzinfo=timezone.utc)},
]


@pytest.fixture(autouse=True)
def fresh_store():
    return SectorPerformanceStore()


def test_get_all_returns_empty_list_initially(fresh_store):
    assert fresh_store.get_all() == []


def test_set_all_then_get_all_returns_sectors(fresh_store):
    fresh_store.set_all(VALID_SECTORS)
    result = fresh_store.get_all()
    assert len(result) == 2
    assert result[0]["sector_name"] == "ก่อสร้าง"


def test_set_all_replaces_all_sectors(fresh_store):
    fresh_store.set_all(VALID_SECTORS)
    fresh_store.set_all([VALID_SECTORS[1]])
    result = fresh_store.get_all()
    assert len(result) == 1
    assert result[0]["sector_name"] == "พลังงาน"


def test_get_all_returns_copy_not_reference(fresh_store):
    fresh_store.set_all(VALID_SECTORS)
    result = fresh_store.get_all()
    result[0]["sector_name"] = "mutated"
    assert fresh_store.get_all()[0]["sector_name"] == "ก่อสร้าง"


def test_set_all_stores_copies_not_references(fresh_store):
    sectors = [dict(VALID_SECTORS[0])]
    fresh_store.set_all(sectors)
    sectors[0]["sector_name"] = "mutated"
    assert fresh_store.get_all()[0]["sector_name"] == "ก่อสร้าง"


def test_reset_clears_all_sectors(fresh_store):
    fresh_store.set_all(VALID_SECTORS)
    fresh_store.reset()
    assert fresh_store.get_all() == []


def test_set_all_with_empty_list_clears_sectors(fresh_store):
    fresh_store.set_all(VALID_SECTORS)
    fresh_store.set_all([])
    assert fresh_store.get_all() == []
