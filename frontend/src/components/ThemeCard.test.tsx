import { render, screen } from "@testing-library/react";
import ThemeCard, { ThemeCardSkeleton } from "./ThemeCard";
import { MarketThemeSummary } from "@/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const VALID_THEME: MarketThemeSummary = {
  theme_id: "theme-001",
  name: "Fed Rate Cut Sentiment",
  description:
    "Markets anticipate rate cuts following softer CPI data published this week. Banking stocks are pricing in 2 cuts by year-end. SET banking sector outperforms.",
  overall_sentiment: "bullish",
  article_count: 3,
  last_article_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
};

describe("ThemeCard", () => {
  it("renders theme name", () => {
    render(<ThemeCard theme={VALID_THEME} />);
    expect(screen.getByText("Fed Rate Cut Sentiment")).toBeInTheDocument();
  });

  it("renders SentimentBadge with BULLISH label", () => {
    render(<ThemeCard theme={VALID_THEME} />);
    expect(screen.getByText("BULLISH")).toBeInTheDocument();
  });

  it("renders article count", () => {
    render(<ThemeCard theme={VALID_THEME} />);
    expect(screen.getByText("3 articles")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<ThemeCard theme={VALID_THEME} />);
    expect(
      screen.getByText(/Markets anticipate rate cuts/)
    ).toBeInTheDocument();
  });

  it("renders footer with relative time", () => {
    render(<ThemeCard theme={VALID_THEME} />);
    expect(screen.getByText(/Updated \d+h ago/)).toBeInTheDocument();
  });

  it("card is wrapped in article element", () => {
    const { container } = render(<ThemeCard theme={VALID_THEME} />);
    expect(container.querySelector("article")).not.toBeNull();
  });

  it("link navigates to /trends/[theme_id]", () => {
    render(<ThemeCard theme={VALID_THEME} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/trends/theme-001");
  });

  it("renders BEARISH sentiment", () => {
    render(
      <ThemeCard theme={{ ...VALID_THEME, overall_sentiment: "bearish" }} />
    );
    expect(screen.getByText("BEARISH")).toBeInTheDocument();
  });

  it("renders NEUTRAL sentiment", () => {
    render(
      <ThemeCard theme={{ ...VALID_THEME, overall_sentiment: "neutral" }} />
    );
    expect(screen.getByText("NEUTRAL")).toBeInTheDocument();
  });

  it("article count uses singular 'article' for count of 1", () => {
    render(<ThemeCard theme={{ ...VALID_THEME, article_count: 1 }} />);
    expect(screen.getByText("1 article")).toBeInTheDocument();
  });

  it("renders 'unknown' footer when last_article_at is an empty string", () => {
    render(<ThemeCard theme={{ ...VALID_THEME, last_article_at: "" }} />);
    expect(screen.getByText(/Updated unknown/)).toBeInTheDocument();
  });
});

describe("ThemeCardSkeleton", () => {
  it("renders without throwing", () => {
    expect(() => render(<ThemeCardSkeleton />)).not.toThrow();
  });

  it("has role='status'", () => {
    render(<ThemeCardSkeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has aria-label 'Loading themes'", () => {
    render(<ThemeCardSkeleton />);
    expect(
      screen.getByRole("status", { name: "Loading themes" })
    ).toBeInTheDocument();
  });
});
