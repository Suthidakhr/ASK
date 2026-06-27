import { Suspense } from "react";
import { api } from "@/lib/api";
import { MarketOverview, NewsItem, SectorPerformance, TickerItem } from "@/types";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import NewsFeed from "@/components/NewsFeed";
import MarketOverviewWidget from "@/components/MarketOverviewWidget";
import SectorHeatmap from "@/components/SectorHeatmap";
import TrendSummary from "@/components/TrendSummary";
import DailyBriefServer from "@/components/DailyBriefServer";
import { DailyBriefCardSkeleton } from "@/components/DailyBriefCard";
import SkeletonCard from "@/components/SkeletonCard";

async function HomeFeedServer() {
  let items: NewsItem[] = [];
  let last_updated: string | null = null;
  let fetchError: string | null = null;
  try {
    const result = await api.getNews();
    items = result.items;
    last_updated = result.last_updated;
  } catch {
    fetchError = new Date().toISOString();
  }
  return (
    <NewsFeed
      news={items}
      last_updated={last_updated}
      activeCategory="All"
      error={fetchError}
    />
  );
}

async function MarketSidebarServer() {
  let overview: MarketOverview | null = null;
  let sectors: SectorPerformance[] = [];
  try {
    overview = await api.getMarketOverview();
  } catch {
    // sidebar stays empty on failure
  }
  try {
    sectors = await api.getMarketSectors();
  } catch {
    // sectors stay empty on failure
  }
  return (
    <div className="space-y-4">
      {overview && <MarketOverviewWidget indices={overview.indices} />}
      {sectors.length > 0 && <SectorHeatmap sectors={sectors} />}
      {overview && <TrendSummary trends={overview.trends} />}
    </div>
  );
}

export default async function HomePage() {
  let tickers: TickerItem[] = [];
  try {
    const snapshot = await api.getMarketSnapshot();
    tickers = snapshot.tickers;
  } catch {
    // no snapshot yet — TickerBar renders empty gracefully
  }

  return (
    <>
      <Navbar />
      <TickerBar items={tickers} />

      {/* Page header bar */}
      <div
        className="border-b px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: "#F5F1EA", borderColor: "rgba(74,52,42,0.1)" }}
      >
        <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
          Market Overview{" "}
          <span className="font-normal text-sm ml-1" style={{ color: "#B2967D" }}>
            ภาพรวมตลาด
          </span>
        </h1>
        <div
          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded"
          style={{ backgroundColor: "#4A342A", color: "#D7C9B8" }}
        >
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          LIVE
        </div>
      </div>

      <main id="main-content" className="max-w-screen-xl mx-auto px-4 py-5">
        {/* Search */}
        <div
          className="bg-white rounded-lg border flex items-center gap-3 px-4 py-2.5 mb-5"
          style={{ borderColor: "rgba(74,52,42,0.12)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D7C9B8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search news, stocks, sectors... / ค้นหาข่าว หุ้น กลุ่มอุตสาหกรรม"
            className="flex-1 outline-none text-sm bg-transparent"
            style={{ color: "#4A342A" }}
            aria-label="Search news, stocks, sectors"
          />
          <span
            className="text-xs hidden md:block font-mono"
            style={{ color: "#D7C9B8" }}
          >
            PTT · KBANK · FED · OIL
          </span>
        </div>

        {/* Two-column content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* Right: sidebar — first in DOM so DailyBriefCard appears above news feed on mobile */}
          {/* lg:order-last restores right-column placement on desktop */}
          <div className="space-y-4 order-first lg:order-last">
            <Suspense fallback={<DailyBriefCardSkeleton />}>
              <DailyBriefServer />
            </Suspense>
            <Suspense fallback={<SkeletonCard />}>
              <MarketSidebarServer />
            </Suspense>
          </div>

          {/* Left: news feed — second in DOM on mobile, restored to left column on desktop */}
          <div className="order-last lg:order-first">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ backgroundColor: "#B2967D" }}
                />
                <span className="text-sm font-bold" style={{ color: "#4A342A" }}>
                  Financial News
                </span>
                <span className="text-sm" style={{ color: "#B2967D" }}>
                  · ข่าวการเงิน
                </span>
              </div>
              <a
                href="/news"
                className="text-xs font-bold tracking-widest uppercase hover:underline focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]"
                style={{ color: "#B2967D" }}
              >
                View All →
              </a>
            </div>
            <Suspense fallback={<SkeletonCard />}>
              <HomeFeedServer />
            </Suspense>
          </div>
        </div>
      </main>

      <footer
        className="border-t mt-8 px-6 py-5 flex items-center justify-between text-xs"
        style={{
          backgroundColor: "#4A342A",
          borderColor: "rgba(215,201,184,0.1)",
          color: "rgba(215,201,184,0.4)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: "#D7C9B8" }}>
            ASK
          </span>
          <span>·</span>
          <span>AI Financial Research Assistant</span>
        </div>
        <div>For educational purposes only. Not investment advice.</div>
      </footer>
    </>
  );
}
