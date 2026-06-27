import {
  DailyBrief,
  MarketOverview,
  MarketSnapshot,
  MarketTheme,
  MarketThemeSummary,
  NewsItem,
  NewsListResponse,
  SectorPerformance,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json();
}

export const api = {
  getNews: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return fetchAPI<NewsListResponse>(`/news/${qs}`);
  },

  getNewsById: (id: string) => fetchAPI<NewsItem>(`/news/${id}`),

  getCategories: () =>
    fetchAPI<{ categories: string[] }>("/news/categories").then(
      (r) => r.categories
    ),

  getMarketOverview: () => fetchAPI<MarketOverview>("/market/overview"),

  getMarketSnapshot: () => fetchAPI<MarketSnapshot>("/market/snapshot"),

  getMarketSectors: () => fetchAPI<SectorPerformance[]>("/market/sectors"),

  getDailyBrief: () => fetchAPI<DailyBrief>("/daily-brief/"),

  getTrends: () => fetchAPI<MarketThemeSummary[]>("/trends/"),

  getTheme: (id: string) => fetchAPI<MarketTheme>(`/trends/${id}`),
};
