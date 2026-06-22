import { NewsItem } from "@/types";
import AIInsightBox from "@/components/AIInsightBox";
import SentimentBadge from "@/components/SentimentBadge";

const DIRECTION_LABEL: Record<string, string> = {
  positive: "rising",
  negative: "falling",
  neutral: "unchanged",
};

const DIRECTION_ARROW: Record<string, string> = {
  positive: "▲",
  negative: "▼",
  neutral: "–",
};

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  positive: { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  negative: { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  neutral: { bg: "#f5f5f4", text: "#6b6560", border: "#e7e5e4" },
};

function formatBangkokTime(isoString: string): string {
  return new Date(isoString).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  news: NewsItem;
}

export default function NewsDetailContent({ news }: Props) {
  const isOldArticle =
    Date.now() - new Date(news.published_at).getTime() > 24 * 60 * 60 * 1000;

  const aiSection = (() => {
    if (news.ai_analysis !== null) {
      return <AIInsightBox analysis={news.ai_analysis} />;
    }
    if (!isOldArticle) {
      return <AIInsightBox analysis={null} />;
    }
    return (
      <p className="text-sm" style={{ color: "#6b6560" }}>
        Analysis unavailable for this article.
      </p>
    );
  })();

  return (
    <article className="space-y-4">
      {/* Zone 1: Headline */}
      <h1 className="text-xl font-bold leading-snug" style={{ color: "#4A342A" }}>
        {news.headline}
      </h1>

      {/* Zone 2: Source row */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "#6b6560" }}>
        {news.source_url ? (
          <a
            href={news.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline flex items-center gap-1"
            style={{ color: "#4A342A" }}
          >
            {news.source}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ) : (
          <span className="font-medium" style={{ color: "#4A342A" }}>
            {news.source}
          </span>
        )}
        <span aria-hidden="true">·</span>
        <span>{formatBangkokTime(news.published_at)}</span>
      </div>

      {/* Zone 3: AI analysis section */}
      {aiSection}

      {/* Zones 4–6: Sectors, stocks, sentiment — only when analysis is loaded */}
      {news.ai_analysis !== null && (
        <>
          {/* Zone 4: Affected sectors */}
          {news.ai_analysis.affected_sectors.length > 0 && (
            <section aria-label="Affected sectors">
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "#6b6560" }}
              >
                Affected Sectors
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {news.ai_analysis.affected_sectors.map((sector) => (
                  <li
                    key={sector}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: "#F5F1EA", color: "#4A342A" }}
                  >
                    {sector}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Zone 5: Stock direction badges */}
          {news.stock_impacts.length > 0 && (
            <section aria-label="Stock impacts">
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "#6b6560" }}
              >
                Stock Impacts
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {news.stock_impacts.map((impact) => {
                  const colors =
                    BADGE_COLORS[impact.direction] ?? BADGE_COLORS.neutral;
                  return (
                    <span
                      key={impact.symbol}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.border,
                      }}
                      aria-label={`${impact.symbol}: ${DIRECTION_LABEL[impact.direction] ?? "unchanged"}`}
                    >
                      <span aria-hidden="true">
                        {DIRECTION_ARROW[impact.direction] ?? "–"}
                      </span>
                      {impact.symbol}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Zone 6: Sentiment */}
          <div>
            <SentimentBadge sentiment={news.ai_analysis.sentiment} />
          </div>
        </>
      )}

      {/* Zone 7: NON-REMOVABLE DISCLAIMER — FR-A04 */}
      <div
        className="pt-4 border-t text-xs leading-relaxed"
        style={{ borderColor: "rgba(74,52,42,0.1)", color: "#6b6560" }}
      >
        This analysis is generated by AI for educational purposes only. It does
        not constitute investment advice. Always consult a qualified financial
        advisor before making investment decisions.
      </div>
    </article>
  );
}
