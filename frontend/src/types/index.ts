export interface StockImpact {
  symbol: string;
  direction: "positive" | "negative" | "neutral";
  reason: string | null;
}

export interface AIAnalysis {
  summary: string;
  affected_sectors: string[];
  affected_stocks: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  analysis_at: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source_url: string | null;
  content: string;
  category: "ดอกเบี้ยโลก" | "พลังงาน" | "หุ้นไทย" | "เทคโนโลยี" | "ตลาดโลก";
  published_at: string;
  source: string;
  ai_analysis: AIAnalysis | null;
  stock_impacts: StockImpact[];
  featured: boolean;
}

export interface NewsListResponse {
  items: NewsItem[];
  last_updated: string | null;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  market: string;
}

export interface SectorPerformance {
  name: string;
  change_pct: number;
  level: "strong_up" | "up" | "flat" | "down" | "strong_down";
}

export interface TrendItem {
  rank: number;
  title: string;
  description: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

export interface AISummary {
  date: string;
  overview: string;
  key_points: string[];
  watch_sectors: string[];
  avoid_sectors: string[];
  set_range_low: number;
  set_range_high: number;
}

export interface MarketOverview {
  indices: MarketIndex[];
  sectors: SectorPerformance[];
  trends: TrendItem[];
  ai_summary: AISummary;
  last_updated: string;
  news_count: number;
}

export interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
}

export interface DailyBrief {
  overall_sentiment: "bullish" | "bearish" | "neutral";
  key_developments: string[];
  opportunities: string[];
  risks: string[];
  generated_at: string;
  brief_date: string;
  is_fallback: boolean;
}

export interface MarketThemeSummary {
  theme_id: string;
  name: string;
  description: string;
  overall_sentiment: "bullish" | "bearish" | "neutral";
  article_count: number;
  last_article_at: string;
  created_at: string;
}

export interface MarketTheme extends MarketThemeSummary {
  constituent_articles: NewsItem[];
}
