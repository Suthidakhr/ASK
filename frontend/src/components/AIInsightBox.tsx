import { AIAnalysis } from "@/types";

function relativeTime(isoString: string): string {
  const hours = Math.floor(
    Math.max(0, Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60)
  );
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

const BOX_STYLE = {
  backgroundColor: "#F5F1EA",
  borderLeft: "2px solid #B2967D",
};

interface Props {
  analysis: AIAnalysis | null;
}

export default function AIInsightBox({ analysis }: Props) {
  if (analysis === null) {
    return (
      <div
        className="rounded-[6px] p-3 flex items-center gap-2"
        style={BOX_STYLE}
        aria-label="AI market analysis"
      >
        <span
          className="motion-safe:animate-pulse w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: "#7D5A44" }}
          aria-hidden="true"
        />
        <p
          className="text-[13px] font-normal leading-relaxed"
          style={{ color: "#7D5A44" }}
        >
          Analysis in progress
        </p>
      </div>
    );
  }

  const isStale =
    Date.now() - new Date(analysis.analysis_at).getTime() >
    24 * 60 * 60 * 1000;

  return (
    <div
      className="rounded-[6px] p-3"
      style={BOX_STYLE}
      aria-label="AI market analysis"
    >
      <p className="text-[13px] leading-relaxed" style={{ color: "#7D5A44" }}>
        {analysis.summary}
      </p>
      {isStale && (
        <div className="flex items-center gap-1.5 mt-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[11px]" style={{ color: "#d97706" }}>
            Analysis from {relativeTime(analysis.analysis_at)}
          </span>
        </div>
      )}
    </div>
  );
}
