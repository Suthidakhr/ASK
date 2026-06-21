import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import NewsFeed from "@/components/NewsFeed";

export default async function NewsPage() {
  const [newsResponse, ticker] = await Promise.all([api.getNews(), api.getTicker()]);

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />

      <div className="border-b px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: "#F5F1EA", borderColor: "rgba(74,52,42,0.1)" }}>
        <div>
          <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
            Financial News <span className="font-normal text-sm ml-1" style={{ color: "#B2967D" }}>ข่าวการเงิน</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <div className="font-bold font-mono" style={{ color: "#4A342A" }}>{newsResponse.items.length}</div>
            <div className="tracking-widest" style={{ color: "#B2967D" }}>STORIES TODAY</div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono" style={{ color: "#4A342A" }}>15 MIN</div>
            <div className="tracking-widest" style={{ color: "#B2967D" }}>REFRESH RATE</div>
          </div>
        </div>
      </div>

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-6">
        <NewsFeed news={newsResponse.items} />
      </main>

      <footer className="border-t mt-8 px-6 py-5 flex items-center justify-between text-xs"
        style={{ backgroundColor: "#4A342A", borderColor: "rgba(215,201,184,0.1)", color: "rgba(215,201,184,0.4)" }}>
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
