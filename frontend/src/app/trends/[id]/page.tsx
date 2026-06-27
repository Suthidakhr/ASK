import { Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MarketSnapshot, MarketTheme } from "@/types";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import SkeletonCard from "@/components/SkeletonCard";
import ThemeDetailContent from "@/components/ThemeDetailContent";

async function ThemeDetailServer({ id }: { id: string }) {
  let theme: MarketTheme;
  try {
    theme = await api.getTheme(id);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("API error: 410 ")) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm mb-3" style={{ color: "#6b6560" }}>
            This theme has expired. Themes with no new articles in 48 hours are
            archived.
          </p>
          <Link
            href="/trends"
            className="text-sm underline hover:no-underline focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A] rounded"
            style={{ color: "#B2967D" }}
          >
            Browse current themes
          </Link>
        </div>
      );
    }
    if (err instanceof Error && err.message.startsWith("API error: 404 ")) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm mb-3" style={{ color: "#6b6560" }}>
            Theme not found.
          </p>
          <Link
            href="/trends"
            className="text-sm underline hover:no-underline focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A] rounded"
            style={{ color: "#B2967D" }}
          >
            Browse current themes
          </Link>
        </div>
      );
    }
    throw err;
  }
  return <ThemeDetailContent theme={theme} />;
}

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let snapshot: MarketSnapshot | null = null;
  try {
    snapshot = await api.getMarketSnapshot();
  } catch {
    // snapshot stays null — TickerBar renders "Market data unavailable"
  }

  return (
    <>
      <Navbar />
      <TickerBar snapshot={snapshot} />
      <div
        className="border-b"
        style={{
          backgroundColor: "#F5F1EA",
          borderColor: "rgba(74,52,42,0.1)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-2">
          <Link
            href="/trends"
            className="text-sm hover:underline focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A] rounded"
            style={{ color: "#B2967D" }}
          >
            ← Market Trends
          </Link>
        </div>
      </div>
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          }
        >
          <ThemeDetailServer id={id} />
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
