"use client";
import { NewsItem } from "@/types";
import NewsCard from "@/components/NewsCard";

interface Props {
  news: NewsItem[];
  last_updated: string | null;
  activeCategory: string;
  error: string | null;
}

function isMarketHours(): boolean {
  const bangkokHour = (new Date().getUTCHours() + 7) % 24;
  return bangkokHour >= 9 && bangkokHour < 18;
}

function isStale(lastUpdated: string | null): boolean {
  if (!lastUpdated || !isMarketHours()) return false;
  const minutesOld = Math.floor(
    Math.max(0, Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60)
  );
  return minutesOld > 60;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NewsFeed({ news, last_updated, activeCategory, error }: Props) {
  const stale = isStale(last_updated);

  return (
    <>
      <input
        type="search"
        aria-label="Search news, stocks, and sectors"
        placeholder="Search news, stocks, and sectors"
        className="w-full px-4 py-2 rounded-lg border text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A342A] focus-visible:ring-offset-2"
        style={{ borderColor: "rgba(74,52,42,0.2)", color: "#4A342A" }}
      />

      {stale && last_updated && (
        <div
          role="alert"
          className="mb-3 px-3 py-2 rounded text-sm font-medium"
          style={{
            backgroundColor: "#fef3c7",
            color: "#d97706",
            border: "1px solid #d97706",
          }}
        >
          Last updated {formatTime(last_updated)} · New articles may be delayed
        </div>
      )}

      {error ? (
        <div
          role="alert"
          className="px-4 py-6 text-center text-sm rounded-xl"
          style={{
            backgroundColor: "#fff7ed",
            color: "#9a3412",
            border: "1px solid rgba(154,52,18,0.2)",
          }}
        >
          Market data temporarily unavailable · Last attempted {formatTime(error)}
        </div>
      ) : news.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm" style={{ color: "#6b6560" }}>
          <p>No new articles in {activeCategory} today.</p>
          <p className="mt-1" style={{ color: "#B2967D" }}>
            Check back during market hours (09:00–18:00 Bangkok time).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}
    </>
  );
}
