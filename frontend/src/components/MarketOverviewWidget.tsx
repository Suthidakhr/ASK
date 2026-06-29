import { MarketSnapshot } from "@/types";

interface Props {
  snapshot: MarketSnapshot | null;
}

const DIR_COLOR: Record<string, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-neutral-text",
};

const DIR_ARROW: Record<string, string> = {
  positive: "▲",
  negative: "▼",
  neutral: "–",
};

function formatBkkTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    }) + " BKK"
  );
}

const CARD_SHELL = "bg-white rounded-xl border overflow-hidden";
const CARD_BORDER = { borderColor: "rgba(74,52,42,0.1)" };
const HEADER_BORDER = { borderColor: "rgba(74,52,42,0.08)", backgroundColor: "#F5F1EA" };

function CardHeader() {
  return (
    <div
      className="px-4 py-3 border-b flex items-center justify-between"
      style={HEADER_BORDER}
    >
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#7D5A44" }}>
        Market Indices
      </span>
      <span className="text-xs" style={{ color: "#B2967D" }}>ดัชนีตลาด</span>
    </div>
  );
}

export function MarketOverviewWidgetSkeleton() {
  return (
    <div className={CARD_SHELL} style={CARD_BORDER} role="status" aria-label="Loading market indices">
      <div className="px-4 py-3 border-b animate-pulse" style={HEADER_BORDER}>
        <div className="h-3 bg-linen rounded w-28" />
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(74,52,42,0.06)" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 animate-pulse">
            <div className="h-3 bg-linen rounded w-20" />
            <div className="h-3 bg-linen rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketOverviewWidget({ snapshot }: Props) {
  if (snapshot === null) {
    const attemptedAt = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
    return (
      <div className={CARD_SHELL} style={CARD_BORDER}>
        <CardHeader />
        <div className="px-4 py-4 text-xs" style={{ color: "#6b6560" }}>
          Market data unavailable · Last attempted {attemptedAt} BKK
        </div>
      </div>
    );
  }

  return (
    <div className={CARD_SHELL} style={CARD_BORDER}>
      <CardHeader />
      {!snapshot.market_open && (
        <div
          className="px-4 py-2 text-xs text-staleness border-b"
          style={{ borderColor: "rgba(74,52,42,0.08)" }}
        >
          Market closed · As of {formatBkkTime(snapshot.snapshot_at)}
        </div>
      )}
      <div className="divide-y" style={{ borderColor: "rgba(74,52,42,0.06)" }}>
        {snapshot.indices.map((idx, i) => {
          const val = isFinite(idx.value)
            ? idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "—";
          const pct = isFinite(idx.change_pct)
            ? `${idx.change_pct >= 0 ? "+" : ""}${idx.change_pct.toFixed(2)}%`
            : "—";
          return (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 transition-colors"
            >
              <div className="text-xs font-semibold" style={{ color: "#7D5A44" }}>
                {idx.name}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono" style={{ color: "#4A342A" }}>
                  {val}
                </div>
                <div
                  className={`text-xs font-semibold font-mono flex items-center justify-end gap-1 mt-0.5 ${
                    DIR_COLOR[idx.direction] ?? "text-neutral-text"
                  }`}
                >
                  {DIR_ARROW[idx.direction] ?? "–"} {pct}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
