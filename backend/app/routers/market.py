from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    LegacySectorItem,
    MarketIndex,
    MarketOverview,
    MarketSnapshot,
    SectorPerformance,
    TrendItem,
    AISummary,
)
from app.services.market_snapshot_store import market_snapshot_store
from app.services.mock_data import AI_SUMMARY, MARKET_INDICES, NEWS_DATA, SECTORS, TICKER_DATA, TRENDS
from app.services.sector_performance_store import sector_performance_store

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/overview", response_model=MarketOverview)
async def get_market_overview():
    return {
        "indices": MARKET_INDICES,
        "sectors": SECTORS,
        "trends": TRENDS,
        "ai_summary": AI_SUMMARY,
        "last_updated": datetime.now().strftime("%H:%M"),
        "news_count": len(NEWS_DATA),
    }


@router.get("/ticker")
async def get_ticker():
    return {"ticker": TICKER_DATA}


@router.get("/indices", response_model=list[MarketIndex])
async def get_indices():
    return MARKET_INDICES


@router.get("/snapshot", response_model=MarketSnapshot)
async def get_market_snapshot() -> MarketSnapshot:
    snapshot_dict = market_snapshot_store.get()
    if snapshot_dict is None:
        raise HTTPException(status_code=404, detail="No market snapshot available")
    return MarketSnapshot(**snapshot_dict)


@router.get("/sectors", response_model=list[SectorPerformance])
async def get_sectors() -> list[SectorPerformance]:
    return [SectorPerformance(**s) for s in sector_performance_store.get_all()]
