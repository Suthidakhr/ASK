import { SectorPerformance } from "@/types";
import clsx from "clsx";

const DIR_STYLES: Record<string, { cell: string; pct: string }> = {
  positive: { cell: "bg-[#dcfce7]", pct: "text-[#15803d]" },
  neutral:  { cell: "bg-[#f5f5f4]", pct: "text-[#6b6560]" },
  negative: { cell: "bg-[#fee2e2]", pct: "text-[#dc2626]" },
};

interface Props { sectors: SectorPerformance[] }

export default function SectorHeatmap({ sectors }: Props) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(74,52,42,0.1)" }}>
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(74,52,42,0.08)", backgroundColor: "#F5F1EA" }}>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#7D5A44" }}>
          Sector Heatmap
        </span>
        <span className="text-xs" style={{ color: "#B2967D" }}>กลุ่มอุตสาหกรรม</span>
      </div>
      <div className="p-3 grid grid-cols-3 gap-1.5">
        {sectors.map((sector) => {
          const s = DIR_STYLES[sector.direction] ?? DIR_STYLES.neutral;
          const pctText = isFinite(sector.change_pct)
            ? `${sector.change_pct > 0 ? "+" : ""}${sector.change_pct.toFixed(2)}%`
            : "—";
          return (
            <div key={sector.sector_name} className={clsx("rounded-lg p-2.5 text-center", s.cell)}>
              <div className="text-xs font-semibold mb-0.5" style={{ color: "#4A342A" }}>{sector.sector_name}</div>
              <div className={clsx("text-sm font-bold font-mono", s.pct)}>
                {pctText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
