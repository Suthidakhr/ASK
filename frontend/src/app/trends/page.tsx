import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import TrendSummary from "@/components/TrendSummary";
import AISummaryCard from "@/components/AISummaryCard";

export const revalidate = 60;

export default async function TrendsPage() {
  const [overview, ticker] = await Promise.all([api.getMarketOverview(), api.getTicker()]);
  const { trends, ai_summary, sectors } = overview;

  const bullish = sectors.filter((s) => s.change_pct > 0.5).length;
  const bearish = sectors.filter((s) => s.change_pct < -0.5).length;

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />

      <div className="border-b px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: "#F5F1EA", borderColor: "rgba(74,52,42,0.1)" }}>
        <div>
          <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
            Market Trends <span className="font-normal text-sm ml-1" style={{ color: "#B2967D" }}>แนวโน้มตลาด</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <div className="font-bold font-mono text-green-600">{bullish} SECTORS</div>
            <div className="tracking-widest" style={{ color: "#B2967D" }}>BULLISH</div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono text-red-500">{bearish} SECTORS</div>
            <div className="tracking-widest" style={{ color: "#B2967D" }}>BEARISH</div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono" style={{ color: "#4A342A" }}>{trends.length} THEMES</div>
            <div className="tracking-widest" style={{ color: "#B2967D" }}>THIS WEEK</div>
          </div>
        </div>
      </div>

      <main id="main-content" className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">

          {/* Trends + sentiment breakdown */}
          <div className="space-y-5">
            <TrendSummary trends={trends} />

            {/* Sentiment overview */}
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(74,52,42,0.1)" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: "rgba(74,52,42,0.08)", backgroundColor: "#F5F1EA" }}>
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#7D5A44" }}>Sentiment Breakdown</span>
                <span className="text-xs" style={{ color: "#B2967D" }}>ความเชื่อมั่นตลาด</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: "Bullish", labelTh: "บวก", pct: 62, color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Neutral", labelTh: "เป็นกลาง", pct: 24, color: "#B2967D", bg: "#F5F1EA" },
                  { label: "Bearish", labelTh: "ลบ", pct: 14, color: "#dc2626", bg: "#fef2f2" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold" style={{ color: "#4A342A" }}>
                        {s.label} <span className="font-normal" style={{ color: "#B2967D" }}>· {s.labelTh}</span>
                      </span>
                      <span className="font-bold font-mono" style={{ color: s.color }}>{s.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F5F1EA" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, backgroundColor: s.color, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <AISummaryCard summary={ai_summary} />
          </div>
        </div>
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
