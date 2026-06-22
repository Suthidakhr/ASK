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

  let ticker: TickerItem[] = [];
  try {
    ticker = await api.getTicker();
  } catch {
    // ticker stays empty — page still renders
  }

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />
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
            className="text-sm hover:underline"
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
    </>
  );
}
