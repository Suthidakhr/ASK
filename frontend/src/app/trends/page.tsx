import { Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MarketThemeSummary, TickerItem } from "@/types";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import ThemeCard, { ThemeCardSkeleton } from "@/components/ThemeCard";

async function ThemesServer() {
  let themes: MarketThemeSummary[] = [];
  let fetchError: string | null = null;

  try {
    themes = await api.getTrends();
  } catch {
    fetchError = new Date().toISOString();
  }

  if (fetchError !== null) {
    const time = new Date(fetchError).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
    return (
      <p className="text-sm" style={{ color: "#6b6560" }}>
        Market Trends temporarily unavailable · Last attempted {time} BKK
      </p>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm mb-3" style={{ color: "#6b6560" }}>
          No active themes right now. Themes refresh daily.
        </p>
        <p className="text-sm" style={{ color: "#6b6560" }}>
          Check back after market hours (18:00 Bangkok time) or{" "}
          <Link
            href="/news"
            className="underline hover:no-underline focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A] rounded"
            style={{ color: "#B2967D" }}
          >
            view latest news
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {themes.map((theme) => (
        <ThemeCard key={theme.theme_id} theme={theme} />
      ))}
    </div>
  );
}

export default async function TrendsPage() {
  let ticker: TickerItem[] = [];
  try {
    ticker = await api.getTicker();
  } catch {
    // ticker stays empty on failure
  }

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />

      <div
        className="border-b px-6 py-3"
        style={{
          backgroundColor: "#F5F1EA",
          borderColor: "rgba(74,52,42,0.1)",
        }}
      >
        <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
          Market Trends{" "}
          <span
            className="font-normal text-sm ml-1"
            aria-hidden="true"
            style={{ color: "#B2967D" }}
          >
            แนวโน้มตลาด
          </span>
        </h1>
      </div>

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <Suspense fallback={<ThemeCardSkeleton />}>
          <ThemesServer />
        </Suspense>
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
