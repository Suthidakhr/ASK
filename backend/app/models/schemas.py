from datetime import date
from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator

NewsCategory = Literal["ดอกเบี้ยโลก", "พลังงาน", "หุ้นไทย", "เทคโนโลยี", "ตลาดโลก"]


class StockImpact(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    direction: Literal["positive", "negative", "neutral"]
    reason: str | None = None


class AIAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    summary: str
    affected_sectors: list[str]
    affected_stocks: list[str]
    sentiment: Literal["bullish", "bearish", "neutral"]
    analysis_at: AwareDatetime


class NewsItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    headline: str
    summary: str
    source_url: str
    content: str
    category: NewsCategory
    published_at: AwareDatetime
    source: str
    ai_analysis: AIAnalysis | None = None
    stock_impacts: list[StockImpact]
    featured: bool = False


class NewsListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[NewsItem]
    last_updated: AwareDatetime | None


class MarketIndex(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    symbol: str
    price: float
    change: float
    change_pct: float
    market: str


class SectorPerformance(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    change_pct: float
    level: str


class TrendItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int
    title: str
    description: str
    sentiment: str


class AISummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: str
    overview: str
    key_points: list[str]
    watch_sectors: list[str]
    avoid_sectors: list[str]
    set_range_low: float
    set_range_high: float


class MarketOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    indices: list[MarketIndex]
    sectors: list[SectorPerformance]
    trends: list[TrendItem]
    ai_summary: AISummary
    last_updated: str
    news_count: int


class NewsIngestPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    headline: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    source_url: str
    published_at: AwareDatetime
    category: NewsCategory
    content: str = Field(..., min_length=1)
    summary: str = ""
    featured: bool = False

    @field_validator("source_url")
    @classmethod
    def validate_source_url(cls, v: str) -> str:
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("source_url must be a valid HTTP or HTTPS URL")
        return v


class WebhookIngestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    status: Literal["created", "duplicate"]


class AIAnalysisPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    news_id: str
    summary: str = Field(..., min_length=1)
    affected_sectors: list[str]
    affected_stocks: list[str]
    sentiment: Literal["bullish", "bearish", "neutral"]
    analysis_at: AwareDatetime


class AIAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: Literal["attached", "updated"]


class DailyBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    overall_sentiment: Literal["bullish", "bearish", "neutral"]
    key_developments: list[str]
    opportunities: list[str]
    risks: list[str]
    generated_at: AwareDatetime
    brief_date: date
    is_fallback: bool


class DailyBriefIngestPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    overall_sentiment: Literal["bullish", "bearish", "neutral"]
    key_developments: list[str]
    opportunities: list[str]
    risks: list[str]
    generated_at: AwareDatetime
    brief_date: date


class DailyBriefWebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: Literal["created", "updated"]


class MarketThemeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme_id: str
    name: str
    description: str
    overall_sentiment: Literal["bullish", "bearish", "neutral"]
    article_count: int
    last_article_at: AwareDatetime
    created_at: AwareDatetime


class MarketTheme(MarketThemeSummary):
    constituent_articles: list[NewsItem]
