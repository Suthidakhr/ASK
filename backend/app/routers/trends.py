from fastapi import APIRouter, HTTPException

from app.models.schemas import MarketTheme, MarketThemeSummary
from app.services.news_store import news_store
from app.services.theme_store import theme_store

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("/", response_model=list[MarketThemeSummary])
async def get_themes() -> list[MarketThemeSummary]:
    return [MarketThemeSummary(**t) for t in theme_store.get_active()]


@router.get("/{theme_id}", response_model=MarketTheme)
async def get_theme(theme_id: str) -> MarketTheme:
    theme = theme_store.get_by_id(theme_id)
    if theme is None:
        raise HTTPException(status_code=404, detail="Theme not found")
    if theme_store.is_archived(theme):
        raise HTTPException(status_code=410, detail="Theme archived")

    article_ids: list[str] = theme.get("constituent_article_ids", [])
    articles = [
        item for aid in article_ids
        if (item := news_store.get_by_id(aid)) is not None
    ]
    articles.sort(key=lambda a: a["published_at"], reverse=True)

    return MarketTheme(**{**theme, "constituent_articles": articles})
