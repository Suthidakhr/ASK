from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    AIAnalysis,
    AISummary,
    IndexItem,
    LegacySectorItem,
    MarketIndex,
    MarketOverview,
    MarketSnapshot,
    NewsItem,
    NewsListResponse,
    SectorPerformance,
    StockImpact,
    TickerItem,
    TrendItem,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_STOCK_IMPACT = {"symbol": "PTT", "direction": "positive"}

VALID_AI_ANALYSIS = {
    "summary": "Test analysis summary",
    "affected_sectors": ["พลังงาน", "ธนาคาร"],
    "affected_stocks": ["PTT", "KBANK"],
    "sentiment": "bullish",
    "analysis_at": datetime(2026, 6, 21, 1, 30, tzinfo=timezone.utc),
}

VALID_NEWS_ITEM = {
    "id": "news-001",
    "headline": "Test headline",
    "summary": "Test summary",
    "source_url": "https://reuters.com/test-article",
    "content": "Full article content goes here.",
    "category": "พลังงาน",
    "published_at": datetime(2026, 6, 21, 1, 15, tzinfo=timezone.utc),
    "source": "Reuters",
    "ai_analysis": VALID_AI_ANALYSIS,
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
# AC1 — AIAnalysis model
# ---------------------------------------------------------------------------


def test_ai_analysis_valid_construction():
    obj = AIAnalysis(**VALID_AI_ANALYSIS)
    assert obj.sentiment == "bullish"
    assert obj.analysis_at.tzinfo is not None


def test_ai_analysis_aware_datetime_accepted():
    obj = AIAnalysis(**VALID_AI_ANALYSIS)
    assert obj.analysis_at.tzinfo is not None


def test_ai_analysis_naive_datetime_rejected():
    data = {**VALID_AI_ANALYSIS, "analysis_at": datetime(2026, 6, 21, 1, 30)}
    with pytest.raises(ValidationError):
        AIAnalysis(**data)


@pytest.mark.parametrize("sentiment", ["bullish", "bearish", "neutral"])
def test_ai_analysis_valid_sentiments(sentiment):
    data = {**VALID_AI_ANALYSIS, "sentiment": sentiment}
    obj = AIAnalysis(**data)
    assert obj.sentiment == sentiment


def test_ai_analysis_invalid_sentiment_rejected():
    data = {**VALID_AI_ANALYSIS, "sentiment": "up"}
    with pytest.raises(ValidationError):
        AIAnalysis(**data)


def test_ai_analysis_summary_required():
    data = {**VALID_AI_ANALYSIS, "summary": None}
    with pytest.raises(ValidationError):
        AIAnalysis(**data)


# ---------------------------------------------------------------------------
# AC2/AC3 — NewsItem category Literal enforcement
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("cat", ["ดอกเบี้ยโลก", "พลังงาน", "หุ้นไทย", "เทคโนโลยี", "ตลาดโลก"])
def test_news_item_valid_category_values(cat):
    data = {**VALID_NEWS_ITEM, "category": cat}
    item = NewsItem(**data)
    assert item.category == cat


def test_news_item_invalid_category_rejected():
    data = {**VALID_NEWS_ITEM, "category": "Technology"}
    with pytest.raises(ValidationError):
        NewsItem(**data)


# ---------------------------------------------------------------------------
# AC2 — NewsItem ai_analysis nullable
# ---------------------------------------------------------------------------


def test_news_item_ai_analysis_nullable():
    data = {**VALID_NEWS_ITEM, "ai_analysis": None}
    item = NewsItem(**data)
    assert item.ai_analysis is None


def test_news_item_ai_analysis_with_object():
    item = NewsItem(**VALID_NEWS_ITEM)
    assert item.ai_analysis is not None
    assert item.ai_analysis.sentiment == "bullish"


# ---------------------------------------------------------------------------
# AC5 — AwareDatetime enforcement on NewsItem.published_at
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
# AC2 — StockImpact validation
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
# AC2 — NewsItem non-nullable fields
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field", ["id", "headline", "summary", "source_url", "content", "category", "source"])
def test_news_item_non_nullable_string_fields(field):
    data = {**VALID_NEWS_ITEM, field: None}
    with pytest.raises(ValidationError):
        NewsItem(**data)


def test_news_item_published_at_required():
    data = {k: v for k, v in VALID_NEWS_ITEM.items() if k != "published_at"}
    with pytest.raises(ValidationError):
        NewsItem(**data)


# ---------------------------------------------------------------------------
# AC2 — MarketIndex non-nullable fields
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
# AC2 — LegacySectorItem non-nullable fields (legacy /market/overview sectors)
# ---------------------------------------------------------------------------


def test_legacy_sector_item_name_required():
    with pytest.raises(ValidationError):
        LegacySectorItem(name=None, change_pct=1.0, level="strong_up")


def test_legacy_sector_item_change_pct_required():
    with pytest.raises(ValidationError):
        LegacySectorItem(name="ก่อสร้าง", change_pct=None, level="strong_up")


# ---------------------------------------------------------------------------
# AC2 — TrendItem non-nullable fields
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
# AC2 — AISummary non-nullable fields
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field", ["date", "overview"])
def test_ai_summary_non_nullable_string_fields(field):
    data = {**VALID_AI_SUMMARY, field: None}
    with pytest.raises(ValidationError):
        AISummary(**data)


# ---------------------------------------------------------------------------
# AC2 — MarketOverview non-nullable fields
# ---------------------------------------------------------------------------


def test_market_overview_valid():
    overview = MarketOverview(**VALID_MARKET_OVERVIEW)
    assert overview.news_count == 5
    assert len(overview.indices) == 1


def test_market_overview_last_updated_required():
    data = {**VALID_MARKET_OVERVIEW, "last_updated": None}
    with pytest.raises(ValidationError):
        MarketOverview(**data)


# ---------------------------------------------------------------------------
# Story 2.2 — NewsListResponse
# ---------------------------------------------------------------------------


def test_news_list_response_valid_construction():
    news_item = NewsItem(**VALID_NEWS_ITEM)
    response = NewsListResponse(
        items=[news_item],
        last_updated=datetime(2026, 6, 21, 5, 30, tzinfo=timezone.utc),
    )
    assert len(response.items) == 1
    assert response.last_updated.tzinfo is not None


def test_news_list_response_last_updated_naive_rejected():
    news_item = NewsItem(**VALID_NEWS_ITEM)
    with pytest.raises(ValidationError):
        NewsListResponse(
            items=[news_item],
            last_updated=datetime(2026, 6, 21, 5, 30),
        )


def test_news_list_response_empty_items_valid():
    response = NewsListResponse(
        items=[],
        last_updated=datetime(2026, 6, 21, 5, 30, tzinfo=timezone.utc),
    )
    assert response.items == []


# ---------------------------------------------------------------------------
# AC1 — TickerItem schema (Epic 6)
# ---------------------------------------------------------------------------

VALID_TICKER_ITEM = {
    "symbol": "PTT",
    "price": 32.50,
    "change_pct": -0.76,
    "direction": "negative",
}


def test_ticker_item_valid_construction():
    item = TickerItem(**VALID_TICKER_ITEM)
    assert item.symbol == "PTT"
    assert item.price == 32.50
    assert item.change_pct == -0.76
    assert item.direction == "negative"


@pytest.mark.parametrize("direction", ["positive", "negative", "neutral"])
def test_ticker_item_valid_directions(direction):
    item = TickerItem(**{**VALID_TICKER_ITEM, "direction": direction})
    assert item.direction == direction


def test_ticker_item_invalid_direction_rejected():
    with pytest.raises(ValidationError):
        TickerItem(**{**VALID_TICKER_ITEM, "direction": "up"})


def test_ticker_item_symbol_required():
    with pytest.raises(ValidationError):
        TickerItem(**{k: v for k, v in VALID_TICKER_ITEM.items() if k != "symbol"})


def test_ticker_item_price_required():
    with pytest.raises(ValidationError):
        TickerItem(**{**VALID_TICKER_ITEM, "price": None})


# ---------------------------------------------------------------------------
# AC2 — IndexItem schema (Epic 6)
# ---------------------------------------------------------------------------

VALID_INDEX_ITEM = {
    "name": "SET Index",
    "value": 1384.52,
    "change_pct": 0.60,
    "direction": "positive",
}


def test_index_item_valid_construction():
    item = IndexItem(**VALID_INDEX_ITEM)
    assert item.name == "SET Index"
    assert item.value == 1384.52
    assert item.direction == "positive"


@pytest.mark.parametrize("direction", ["positive", "negative", "neutral"])
def test_index_item_valid_directions(direction):
    item = IndexItem(**{**VALID_INDEX_ITEM, "direction": direction})
    assert item.direction == direction


def test_index_item_invalid_direction_rejected():
    with pytest.raises(ValidationError):
        IndexItem(**{**VALID_INDEX_ITEM, "direction": "down"})


def test_index_item_name_required():
    with pytest.raises(ValidationError):
        IndexItem(**{**VALID_INDEX_ITEM, "name": None})


# ---------------------------------------------------------------------------
# AC3 — MarketSnapshot schema (Epic 6)
# ---------------------------------------------------------------------------

VALID_MARKET_SNAPSHOT = {
    "indices": [VALID_INDEX_ITEM],
    "tickers": [VALID_TICKER_ITEM],
    "market_open": True,
    "snapshot_at": datetime(2026, 6, 27, 3, 0, tzinfo=timezone.utc),
}


def test_market_snapshot_valid_construction():
    snap = MarketSnapshot(**VALID_MARKET_SNAPSHOT)
    assert snap.market_open is True
    assert len(snap.indices) == 1
    assert len(snap.tickers) == 1
    assert snap.snapshot_at.tzinfo is not None


def test_market_snapshot_naive_datetime_rejected():
    data = {**VALID_MARKET_SNAPSHOT, "snapshot_at": datetime(2026, 6, 27, 3, 0)}
    with pytest.raises(ValidationError):
        MarketSnapshot(**data)


def test_market_snapshot_empty_indices_valid():
    snap = MarketSnapshot(**{**VALID_MARKET_SNAPSHOT, "indices": []})
    assert snap.indices == []


def test_market_snapshot_market_open_required():
    with pytest.raises(ValidationError):
        MarketSnapshot(**{**VALID_MARKET_SNAPSHOT, "market_open": None})


# ---------------------------------------------------------------------------
# AC4 — SectorPerformance schema (new shape, Epic 6)
# ---------------------------------------------------------------------------

VALID_SECTOR_PERFORMANCE = {
    "sector_name": "ก่อสร้าง",
    "change_pct": 2.41,
    "direction": "positive",
    "top_article_id": "news-001",
    "updated_at": datetime(2026, 6, 27, 3, 0, tzinfo=timezone.utc),
}


def test_sector_performance_valid_construction():
    sp = SectorPerformance(**VALID_SECTOR_PERFORMANCE)
    assert sp.sector_name == "ก่อสร้าง"
    assert sp.direction == "positive"
    assert sp.top_article_id == "news-001"
    assert sp.updated_at.tzinfo is not None


def test_sector_performance_top_article_id_nullable():
    sp = SectorPerformance(**{**VALID_SECTOR_PERFORMANCE, "top_article_id": None})
    assert sp.top_article_id is None


@pytest.mark.parametrize("direction", ["positive", "negative", "neutral"])
def test_sector_performance_valid_directions(direction):
    sp = SectorPerformance(**{**VALID_SECTOR_PERFORMANCE, "direction": direction})
    assert sp.direction == direction


def test_sector_performance_invalid_direction_rejected():
    with pytest.raises(ValidationError):
        SectorPerformance(**{**VALID_SECTOR_PERFORMANCE, "direction": "up"})


def test_sector_performance_naive_updated_at_rejected():
    data = {**VALID_SECTOR_PERFORMANCE, "updated_at": datetime(2026, 6, 27, 3, 0)}
    with pytest.raises(ValidationError):
        SectorPerformance(**data)


def test_sector_performance_sector_name_required():
    with pytest.raises(ValidationError):
        SectorPerformance(**{**VALID_SECTOR_PERFORMANCE, "sector_name": None})
