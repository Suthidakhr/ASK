from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AIAnalysisPayload,
    AIAnalysisResponse,
    DailyBriefIngestPayload,
    DailyBriefWebhookResponse,
    MarketSnapshot,
    MarketWebhookResponse,
    NewsIngestPayload,
    SectorPerformance,
    ThemeIngestPayload,
    ThemeWebhookResponse,
    WebhookIngestResponse,
)
from app.services.daily_brief_store import daily_brief_store
from app.services.market_snapshot_store import market_snapshot_store
from app.services.news_store import news_store
from app.services.sector_performance_store import sector_performance_store
from app.services.theme_store import theme_store

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/news-ingest", response_model=WebhookIngestResponse)
async def ingest_news(payload: NewsIngestPayload) -> WebhookIngestResponse:
    payload_dict = payload.model_dump()
    event_id, status = news_store.ingest(payload_dict)
    return WebhookIngestResponse(event_id=event_id, status=status)


@router.post("/ai-analysis", response_model=AIAnalysisResponse)
async def attach_ai_analysis(payload: AIAnalysisPayload) -> AIAnalysisResponse:
    analysis_dict = payload.model_dump(exclude={"news_id"})
    result = news_store.attach_analysis(payload.news_id, analysis_dict)
    if result is None:
        raise HTTPException(status_code=404, detail="News item not found")
    return AIAnalysisResponse(status=result)


@router.post("/daily-brief", response_model=DailyBriefWebhookResponse)
async def ingest_daily_brief(payload: DailyBriefIngestPayload) -> DailyBriefWebhookResponse:
    status = daily_brief_store.upsert(payload.model_dump())
    return DailyBriefWebhookResponse(status=status)


@router.post("/themes", response_model=ThemeWebhookResponse)
async def ingest_theme(payload: ThemeIngestPayload) -> ThemeWebhookResponse:
    for aid in payload.constituent_article_ids:
        if news_store.get_by_id(aid) is None:
            raise HTTPException(status_code=422, detail=f"Article not found: {aid}")
    status = theme_store.upsert(payload.model_dump())
    return ThemeWebhookResponse(status=status)


@router.post("/market-snapshot", response_model=MarketWebhookResponse)
async def ingest_market_snapshot(payload: MarketSnapshot) -> MarketWebhookResponse:
    market_snapshot_store.set(payload.model_dump())
    return MarketWebhookResponse(status="updated")


@router.post("/sector-performance", response_model=MarketWebhookResponse)
async def ingest_sector_performance(payload: list[SectorPerformance]) -> MarketWebhookResponse:
    sector_performance_store.set_all([s.model_dump() for s in payload])
    return MarketWebhookResponse(status="updated")
