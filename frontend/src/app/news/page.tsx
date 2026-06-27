import { Suspense } from "react";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { MarketSnapshot, NewsItem } from "@/types";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import NewsFeed from "@/components/NewsFeed";
import CategoryFilterBar, { CategoryTab } from "@/components/CategoryFilterBar";
import SkeletonCard from "@/components/SkeletonCard";

const CATEGORY_TABS: readonly CategoryTab[] = [
  { slug: "all",    label: "All",    thaiName: null },
  { slug: "rates",  label: "Rates",  thaiName: "ดอกเบี้ยโลก" },
  { slug: "energy", label: "Energy", thaiName: "พลังงาน" },
  { slug: "set",    label: "SET",    thaiName: "หุ้นไทย" },
  { slug: "tech",   label: "Tech",   thaiName: "เทคโนโลยี" },
  { slug: "global", label: "Global", thaiName: "ตลาดโลก" },
];

const SLUG_TO_THAI: Record<string, string> = {
  rates:  "ดอกเบี้ยโลก",
  energy: "พลังงาน",
  set:    "หุ้นไทย",
  tech:   "เทคโนโลยี",
  global: "ตลาดโลก",
};

async function NewsFeedServer({
  thaiCategory,
  activeLabel,
}: {
  thaiCategory: string | undefined;
  activeLabel: string;
}) {
  let items: NewsItem[] = [];
  let last_updated: string | null = null;
  let fetchError: string | null = null;

  try {
    const result = await api.getNews(thaiCategory);
    items = result.items;
    last_updated = result.last_updated;
  } catch {
    fetchError = new Date().toISOString();
  }

  return (
    <NewsFeed
      news={items}
      last_updated={last_updated}
      activeCategory={activeLabel}
      error={fetchError}
    />
  );
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  if (category && !SLUG_TO_THAI[category]) {
    redirect("/news");
  }

  const thaiCategory = category ? SLUG_TO_THAI[category] : undefined;
  const activeLabel =
    CATEGORY_TABS.find((c) => c.slug === category)?.label ?? "All";

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
        className="border-b px-6 py-3"
        style={{ backgroundColor: "#F5F1EA", borderColor: "rgba(74,52,42,0.1)" }}
      >
        <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
          Financial News{" "}
          <span className="font-normal text-sm ml-1" style={{ color: "#B2967D" }}>
            ข่าวการเงิน
          </span>
        </h1>
      </div>

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <CategoryFilterBar categories={CATEGORY_TABS} activeSlug={category ?? "all"} />
        <Suspense fallback={<SkeletonCard />}>
          <NewsFeedServer thaiCategory={thaiCategory} activeLabel={activeLabel} />
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
          <span className="font-bold text-sm" style={{ color: "#D7C9B8" }}>ASK</span>
          <span>·</span>
          <span>AI Financial Research Assistant</span>
        </div>
        <div>For educational purposes only. Not investment advice.</div>
      </footer>
    </>
  );
}
