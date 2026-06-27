import { TickerItem } from "@/types";

interface Props {
  items: TickerItem[];
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

export default function TickerBar({ items }: Props) {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden h-10 flex items-center border-b"
      style={{ backgroundColor: "#B2967D", borderColor: "rgba(207,187,153,0.15)" }}>
      <div className="px-3 py-1 text-xs font-bold whitespace-nowrap h-full flex items-center flex-shrink-0"
        style={{ backgroundColor: "#7D5A44", color: "#D7C9B8", letterSpacing: "0.5px" }}>
        ตลาดวันนี้
      </div>
      <div className="overflow-hidden flex-1">
        <div className="flex ticker-animate whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6 text-sm border-r"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              <span className="font-bold text-white">{item.symbol}</span>
              <span className="text-white/80">{item.price.toLocaleString()}</span>
              <span className={DIR_COLOR[item.direction] ?? "text-white/70"}>
                {DIR_ARROW[item.direction] ?? "–"}{" "}
                {isFinite(item.change_pct) ? Math.abs(item.change_pct).toFixed(2) : "—"}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
