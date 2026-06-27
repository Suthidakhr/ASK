import { MarketSnapshot } from "@/types";

interface Props {
  snapshot: MarketSnapshot | null;
}

const DIR_COLOR: Record<string, string> = {
  positive: "text-green-200",
  negative: "text-red-200",
  neutral: "text-white/70",
};

const DIR_ARROW: Record<string, string> = {
  positive: "▲",
  negative: "▼",
  neutral: "–",
};

export default function TickerBar({ snapshot }: Props) {
  if (snapshot === null) {
    return (
      <div
        aria-hidden="true"
        className="h-10 flex items-center px-6 text-sm border-b"
        style={{
          backgroundColor: "#B2967D",
          borderColor: "rgba(207,187,153,0.15)",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        Market data unavailable
      </div>
    );
  }

  const doubled = [...snapshot.tickers, ...snapshot.tickers];

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden h-10 flex items-center border-b"
      style={{ backgroundColor: "#B2967D", borderColor: "rgba(207,187,153,0.15)" }}
    >
      <div
        className="px-3 py-1 text-xs font-bold whitespace-nowrap h-full flex items-center flex-shrink-0"
        style={{ backgroundColor: "#7D5A44", color: "#D7C9B8", letterSpacing: "0.5px" }}
      >
        ตลาดวันนี้
      </div>
      {!snapshot.market_open && (
        <div className="px-3 text-xs font-semibold flex-shrink-0 text-staleness">
          Market closed
        </div>
      )}
      <div className="overflow-hidden flex-1 ticker-scroll-container">
        <div className="flex ticker-animate whitespace-nowrap">
          {doubled.map((item, i) => {
            const pct = isFinite(item.change_pct)
              ? `${item.change_pct >= 0 ? "+" : ""}${item.change_pct.toFixed(2)}%`
              : "—";
            return (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-6 text-sm border-r"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
              >
                <span className="font-bold text-white font-mono">{item.symbol}</span>
                <span className={DIR_COLOR[item.direction] ?? "text-white/70"}>
                  {DIR_ARROW[item.direction] ?? "–"} {pct}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
