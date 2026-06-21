type Sentiment = "bullish" | "bearish" | "neutral";

const SENTIMENT_STYLES: Record<Sentiment, { text: string; bg: string; label: string }> = {
  bullish: { text: "#15803d", bg: "#dcfce7", label: "BULLISH" },
  bearish: { text: "#dc2626", bg: "#fee2e2", label: "BEARISH" },
  neutral: { text: "#6b6560", bg: "#f5f5f4", label: "NEUTRAL" },
};

interface Props {
  sentiment: Sentiment;
}

export default function SentimentBadge({ sentiment }: Props) {
  const { text, bg, label } = SENTIMENT_STYLES[sentiment];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest"
      style={{ backgroundColor: bg, color: text }}
      aria-label={`Market sentiment: ${sentiment}`}
    >
      <span aria-hidden="true">●</span>
      {label}
    </span>
  );
}
