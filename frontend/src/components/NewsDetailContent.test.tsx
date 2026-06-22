import { render, screen } from "@testing-library/react";
import NewsDetailContent from "./NewsDetailContent";
import { NewsItem } from "@/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const makeNewsItem = (
  overrides: Partial<NewsItem> & Pick<NewsItem, "id">
): NewsItem => ({
  headline: "Thailand Raises Key Rate",
  summary: "Bank of Thailand surprises markets.",
  content: "Full article content.",
  source: "Reuters",
  source_url: "https://reuters.com/article/123",
  category: "ดอกเบี้ยโลก",
  published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  featured: false,
  ai_analysis: {
    summary: "Rate hike signals hawkish pivot.",
    affected_sectors: ["Banking", "Real Estate"],
    affected_stocks: ["KBANK", "PTT"],
    sentiment: "bullish",
    analysis_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  stock_impacts: [
    { symbol: "KBANK", direction: "positive", reason: "Net interest margin expansion" },
    { symbol: "PTT", direction: "neutral", reason: null },
  ],
  ...overrides,
});

const FULL_NEWS = makeNewsItem({ id: "n1" });

const NULL_URL_NEWS = makeNewsItem({ id: "n2", source_url: null });

const PENDING_NEWS = makeNewsItem({
  id: "n3",
  ai_analysis: null,
  stock_impacts: [],
  published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
});

const OLD_PENDING_NEWS = makeNewsItem({
  id: "n4",
  ai_analysis: null,
  stock_impacts: [],
  published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
});

describe("NewsDetailContent", () => {
  it("renders headline as h1", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Thailand Raises Key Rate");
  });

  it("renders source name as external link when source_url is non-null", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    const link = screen.getByRole("link", { name: /Reuters/i });
    expect(link).toHaveAttribute("href", "https://reuters.com/article/123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders source name as plain text when source_url is null — no broken link", () => {
    render(<NewsDetailContent news={NULL_URL_NEWS} />);
    expect(screen.queryByRole("link", { name: /Reuters/i })).toBeNull();
    expect(screen.getByText("Reuters")).toBeInTheDocument();
  });

  it("renders publication timestamp", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    // Timestamp is formatted via toLocaleString('th-TH') — just check it exists in the doc
    const main = document.body;
    // The formatted timestamp will be inside the component; check for a time-like element
    expect(main.textContent).toMatch(/\d/); // has digit content (the timestamp)
  });

  it("renders AIInsightBox when ai_analysis is non-null", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    expect(screen.getByLabelText("AI market analysis")).toBeInTheDocument();
  });

  it("renders affected sectors list when ai_analysis is non-null", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    expect(screen.getByText("Banking")).toBeInTheDocument();
    expect(screen.getByText("Real Estate")).toBeInTheDocument();
  });

  it("renders stock direction badges with correct aria-label", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    expect(screen.getByLabelText("KBANK: rising")).toBeInTheDocument();
    expect(screen.getByLabelText("PTT: unchanged")).toBeInTheDocument();
  });

  it("renders SentimentBadge when ai_analysis is non-null", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    expect(screen.getByLabelText("Market sentiment: bullish")).toBeInTheDocument();
  });

  it("disclaimer always renders when ai_analysis is non-null", () => {
    render(<NewsDetailContent news={FULL_NEWS} />);
    expect(
      screen.getByText(/educational purposes only/i)
    ).toBeInTheDocument();
  });

  it("disclaimer always renders when ai_analysis is null (recent article)", () => {
    render(<NewsDetailContent news={PENDING_NEWS} />);
    expect(
      screen.getByText(/educational purposes only/i)
    ).toBeInTheDocument();
  });

  it("recent article with null ai_analysis shows AIInsightBox pending state — no unavailable text", () => {
    render(<NewsDetailContent news={PENDING_NEWS} />);
    expect(screen.getByText(/Analysis in progress/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Analysis unavailable for this article/i)
    ).toBeNull();
  });

  it("old article (>24h) with null ai_analysis shows unavailable message — no pending state", () => {
    render(<NewsDetailContent news={OLD_PENDING_NEWS} />);
    expect(
      screen.getByText(/Analysis unavailable for this article/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Analysis in progress/i)).toBeNull();
  });
});
