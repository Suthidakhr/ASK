import Link from "next/link";
import { MarketThemeSummary } from "@/types";
import SentimentBadge from "./SentimentBadge";

function relativeTime(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  if (!isoString || isNaN(ms)) return "unknown";
  const hours = Math.floor(Math.max(0, ms) / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

interface Props {
  theme: MarketThemeSummary;
}

export default function ThemeCard({ theme }: Props) {
  return (
    <article
      className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 focus-within:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]"
      style={{ border: "1px solid rgba(74,52,42,0.1)" }}
    >
      <Link
        href={`/trends/${theme.theme_id}`}
        className="block px-6 py-5 focus:outline-none"
      >
        <div className="flex items-start gap-2 mb-1">
          <h2
            className="text-[16px] font-bold leading-snug flex-1"
            style={{ color: "#4A342A" }}
          >
            {theme.name}
          </h2>
          <div className="flex-shrink-0 mt-0.5">
            <SentimentBadge sentiment={theme.overall_sentiment} />
          </div>
        </div>

        <p className="text-xs mb-3" style={{ color: "#7D5A44" }}>
          {theme.article_count}{" "}
          {theme.article_count === 1 ? "article" : "articles"}
        </p>

        <p className="text-sm leading-relaxed mb-3" style={{ color: "#7D5A44" }}>
          {theme.description}
        </p>

        <hr className="my-2" style={{ borderColor: "rgba(74,52,42,0.1)" }} />

        <p className="text-xs" style={{ color: "#7D5A44" }}>
          Updated {relativeTime(theme.last_article_at)}
        </p>
      </Link>
    </article>
  );
}

export function ThemeCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading themes"
      className="bg-white rounded-xl px-6 py-5 animate-pulse"
      style={{ border: "1px solid rgba(74,52,42,0.1)" }}
    >
      <div className="flex items-start gap-2 mb-1">
        <div className="h-5 bg-linen rounded w-3/4" />
        <div className="h-5 bg-linen rounded w-16" />
      </div>
      <div className="h-3 bg-linen rounded w-1/4 mb-3" />
      <div className="h-4 bg-linen rounded w-full mb-1.5" />
      <div className="h-4 bg-linen rounded w-5/6 mb-3" />
      <hr style={{ borderColor: "rgba(74,52,42,0.1)" }} className="my-2" />
      <div className="h-3 bg-linen rounded w-24" />
    </div>
  );
}
