import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import SectorHeatmap from "@/components/SectorHeatmap";
import MarketOverviewWidget from "@/components/MarketOverviewWidget";

export const revalidate = 60;

export default async function StocksPage() {
  const [overview, ticker] = await Promise.all([api.getMarketOverview(), api.getTicker()]);

  return (
    <>
      <Navbar />
      <TickerBar items={ticker} />

      <div className="border-b px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: "#F5F1EA", borderColor: "rgba(74,52,42,0.1)" }}>
        <div>
          <h1 className="text-base font-bold" style={{ color: "#4A342A" }}>
            Stock Analysis <span className="font-normal text-sm ml-1" style={{ color: "#B2967D" }}>วิเคราะห์หุ้น</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <div className="font-bold font-mono" style={{ color: "#4A342A" }}>SET</div>
            <div className="tracking-widest" style={{ color: "#B2967D" }}>EXCHANGE</div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono" style={{ color: "#4A342A" }}>{overview.last_updated}</div>
            <div className="tracking-widest" style={{ color: "#B2967D" }}>LAST UPDATE</div>
          </div>
        </div>
      </div>

      <main id="main-content" className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <MarketOverviewWidget indices={overview.indices} />
          </div>
          <div className="space-y-5">
            <SectorHeatmap sectors={overview.sectors} />

            {/* Top movers table */}
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(74,52,42,0.1)" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: "rgba(74,52,42,0.08)", backgroundColor: "#F5F1EA" }}>
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#7D5A44" }}>Top Movers</span>
                <span className="text-xs" style={{ color: "#B2967D" }}>เคลื่อนไหวสูงสุด</span>
              </div>
              <div className="divide-y" style={{ "--tw-divide-color": "rgba(74,52,42,0.06)" } as React.CSSProperties}>
                {[
                  { symbol: "MINT",  name: "Minor Intl",      price: 29.75, chg: 2.59 },
                  { symbol: "AOT",   name: "Airports of TH",  price: 64.75, chg: 1.97 },
                  { symbol: "SCB",   name: "SCB X",           price: 108.50, chg: 1.88 },
                  { symbol: "KBANK", name: "Kasikorn Bank",   price: 143.00, chg: 1.06 },
                  { symbol: "PTT",   name: "PTT PCL",         price: 32.50, chg: -0.76 },
                  { symbol: "CPALL", name: "CP All",          price: 55.25, chg: -0.90 },
                ].map((s) => (
                  <div key={s.symbol} className="flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 transition-colors">
                    <div>
                      <div className="text-sm font-bold font-mono" style={{ color: "#4A342A" }}>{s.symbol}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#B2967D" }}>{s.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono" style={{ color: "#4A342A" }}>{s.price.toFixed(2)}</div>
                      <div className={`text-xs font-semibold font-mono ${s.chg >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {s.chg >= 0 ? "▲" : "▼"} {Math.abs(s.chg).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
