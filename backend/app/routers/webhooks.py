from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    AIAnalysisPayload,
    AIAnalysisResponse,
    NewsIngestPayload,
    WebhookIngestResponse,
)
from app.services.news_store import news_store

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
