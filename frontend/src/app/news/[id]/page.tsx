import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { NewsItem, TickerItem } from "@/types";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import SkeletonCard from "@/components/SkeletonCard";
import NewsDetailContent from "@/components/NewsDetailContent";

async function NewsDetailServer({ id }: { id: string }) {
  let news: NewsItem;
  try {
    news = await api.getNewsById(id);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      notFound();
    }
    throw err;
  }
  return <NewsDetailContent news={news} />;
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
      <div
        className="border-b"
        style={{
          backgroundColor: "#F5F1EA",
          borderColor: "rgba(74,52,42,0.1)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-2">
          <Link
            href="/news"
            className="text-sm hover:underline focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A] rounded"
            style={{ color: "#B2967D" }}
          >
            ← Financial News
          </Link>
        </div>
      </div>
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <Suspense fallback={<SkeletonCard />}>
          <NewsDetailServer id={id} />
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
