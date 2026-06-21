from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    AISummary,
    MarketIndex,
    MarketOverview,
    NewsItem,
    SectorPerformance,
    StockImpact,
    TrendItem,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_STOCK_IMPACT = {"symbol": "PTT", "direction": "positive"}

VALID_NEWS_ITEM = {
    "id": "news-001",
    "title": "Test headline",
    "summary": "Test summary",
    "category": "พลังงาน",
    "published_at": datetime(2026, 6, 21, 1, 15, tzinfo=timezone.utc),
    "source": "Reuters",
    "ai_analysis": "Test analysis",
    "stock_impacts": [VALID_STOCK_IMPACT],
    "featured": False,
}

VALID_MARKET_INDEX = {
    "name": "SET Index",
    "symbol": "SET",
    "price": 1384.52,
    "change": 8.21,
    "change_pct": 0.60,
    "market": "ตลาดหลักทรัพย์ไทย",
}

VALID_SECTOR = {"name": "ก่อสร้าง", "change_pct": 2.41, "level": "strong_up"}

VALID_TREND = {
    "rank": 1,
    "title": "Fed Pivot",
    "description": "ตลาดตอบรับด้วย Risk-on mode",
    "sentiment": "bullish",
}

VALID_AI_SUMMARY = {
    "date": "21 Jun 2026",
    "overview": "ตลาดบวก",
    "key_points": ["Point 1"],
    "watch_sectors": ["ท่องเที่ยว"],
    "avoid_sectors": ["สายการบิน"],
    "set_range_low": 1378.0,
    "set_range_high": 1395.0,
}

VALID_MARKET_OVERVIEW = {
    "indices": [VALID_MARKET_INDEX],
    "sectors": [VALID_SECTOR],
    "trends": [VALID_TREND],
    "ai_summary": VALID_AI_SUMMARY,
    "last_updated": "09:00",
    "news_count": 5,
}


# ---------------------------------------------------------------------------
# AC3 — AwareDatetime enforcement on NewsItem.published_at
# ---------------------------------------------------------------------------


def test_news_item_aware_datetime_accepted():
    item = NewsItem(**VALID_NEWS_ITEM)
    assert item.published_at.tzinfo is not None


def test_news_item_naive_datetime_rejected():
    data = {**VALID_NEWS_ITEM, "published_at": datetime(2026, 6, 21, 1, 15)}
    with pytest.raises(ValidationError):
        NewsItem(**data)


def test_news_item_aware_datetime_string_accepted():
    data = {**VALID_NEWS_ITEM, "published_at": "2026-06-21T01:15:00Z"}
    item = NewsItem(**data)
    assert item.published_at.tzinfo is not None


# ---------------------------------------------------------------------------
# AC4 — StockImpact validation
# ---------------------------------------------------------------------------


def test_stock_impact_valid_directions():
    for direction in ("positive", "negative", "neutral"):
        impact = StockImpact(symbol="PTT", direction=direction)
        assert impact.direction == direction


def test_stock_impact_invalid_direction_rejected():
    with pytest.raises(ValidationError):
        StockImpact(symbol="PTT", direction="up")


def test_stock_impact_reason_is_nullable():
    impact = StockImpact(symbol="PTT", direction="neutral", reason=None)
    assert impact.reason is None


def test_stock_impact_symbol_required():
    with pytest.raises(ValidationError):
        StockImpact(direction="positive")


# ---------------------------------------------------------------------------
# AC4 — NewsItem non-nullable fields
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field", ["id", "title", "summary", "category", "source", "ai_analysis"])
def test_news_item_non_nullable_string_fields(field):
    data = {**VALID_NEWS_ITEM, field: None}
    with pytest.raises(ValidationError):
        NewsItem(**data)


def test_news_item_published_at_required():
    data = {k: v for k, v in VALID_NEWS_ITEM.items() if k != "published_at"}
    with pytest.raises(ValidationError):
        NewsItem(**data)


# ---------------------------------------------------------------------------
# AC4 — MarketIndex non-nullable fields
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field", ["name", "symbol", "market"])
def test_market_index_non_nullable_string_fields(field):
    data = {**VALID_MARKET_INDEX, field: None}
    with pytest.raises(ValidationError):
        MarketIndex(**data)


@pytest.mark.parametrize("field", ["price", "change", "change_pct"])
def test_market_index_non_nullable_numeric_fields(field):
    data = {**VALID_MARKET_INDEX, field: None}
    with pytest.raises(ValidationError):
        MarketIndex(**data)


# ---------------------------------------------------------------------------
# AC4 — SectorPerformance non-nullable fields
# ---------------------------------------------------------------------------


def test_sector_performance_name_required():
    with pytest.raises(ValidationError):
        SectorPerformance(name=None, change_pct=1.0, level="up")


def test_sector_performance_change_pct_required():
    with pytest.raises(ValidationError):
        SectorPerformance(name="ก่อสร้าง", change_pct=None, level="up")


# ---------------------------------------------------------------------------
# AC4 — TrendItem non-nullable fields
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field", ["title", "description", "sentiment"])
def test_trend_item_non_nullable_fields(field):
    data = {**VALID_TREND, field: None}
    with pytest.raises(ValidationError):
        TrendItem(**data)


def test_trend_item_rank_required():
    data = {**VALID_TREND, "rank": None}
    with pytest.raises(ValidationError):
        TrendItem(**data)


# ---------------------------------------------------------------------------
# AC4 — AISummary non-nullable fields
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field", ["date", "overview"])
def test_ai_summary_non_nullable_string_fields(field):
    data = {**VALID_AI_SUMMARY, field: None}
    with pytest.raises(ValidationError):
        AISummary(**data)


# ---------------------------------------------------------------------------
# AC4 — MarketOverview non-nullable fields
# ---------------------------------------------------------------------------


def test_market_overview_valid():
    overview = MarketOverview(**VALID_MARKET_OVERVIEW)
    assert overview.news_count == 5
    assert len(overview.indices) == 1


def test_market_overview_last_updated_required():
    data = {**VALID_MARKET_OVERVIEW, "last_updated": None}
    with pytest.raises(ValidationError):
        MarketOverview(**data)
