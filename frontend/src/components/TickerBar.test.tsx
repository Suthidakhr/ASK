import { render, screen } from "@testing-library/react";
import TickerBar from "./TickerBar";
import { MarketSnapshot } from "@/types";

const VALID_SNAPSHOT: MarketSnapshot = {
  indices: [],
  tickers: [
    { symbol: "SET", price: 1384.52, change_pct: 0.60, direction: "positive" },
    { symbol: "GOLD", price: 2389.80, change_pct: -0.51, direction: "negative" },
  ],
  market_open: true,
  snapshot_at: "2026-06-27T03:00:00Z",
};

describe("TickerBar", () => {
  it("renders each ticker symbol", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />);
    expect(screen.getAllByText("SET").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GOLD").length).toBeGreaterThan(0);
  });

  it("positive direction renders ▲ arrow", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />);
    expect(screen.getAllByText(/▲/).length).toBeGreaterThan(0);
  });

  it("negative direction renders ▼ arrow", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />);
    expect(screen.getAllByText(/▼/).length).toBeGreaterThan(0);
  });

  it("neutral direction renders – dash", () => {
    const snap: MarketSnapshot = {
      ...VALID_SNAPSHOT,
      tickers: [{ symbol: "KBK", price: 143.0, change_pct: 0.0, direction: "neutral" }],
    };
    render(<TickerBar snapshot={snap} />);
    expect(screen.getAllByText(/–/).length).toBeGreaterThan(0);
  });

  it("positive change_pct displays with + prefix", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />);
    expect(screen.getAllByText(/\+0\.60%/).length).toBeGreaterThan(0);
  });

  it("negative change_pct displays natural – sign without + prefix", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />);
    expect(screen.getAllByText(/-0\.51%/).length).toBeGreaterThan(0);
  });

  it("outer container has aria-hidden=true", () => {
    const { container } = render(<TickerBar snapshot={VALID_SNAPSHOT} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("shows Market closed badge when market_open is false", () => {
    render(<TickerBar snapshot={{ ...VALID_SNAPSHOT, market_open: false }} />);
    expect(screen.getByText(/Market closed/)).toBeInTheDocument();
  });

  it("does NOT show Market closed badge when market_open is true", () => {
    render(<TickerBar snapshot={VALID_SNAPSHOT} />);
    expect(screen.queryByText(/Market closed/)).not.toBeInTheDocument();
  });

  it("renders Market data unavailable message when snapshot is null", () => {
    render(<TickerBar snapshot={null} />);
    expect(screen.getByText(/Market data unavailable/)).toBeInTheDocument();
  });

  it("unavailable state preserves aria-hidden on container", () => {
    const { container } = render(<TickerBar snapshot={null} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("NaN change_pct renders — not undefined or throw", () => {
    const snap: MarketSnapshot = {
      ...VALID_SNAPSHOT,
      tickers: [{ symbol: "X", price: 0, change_pct: NaN, direction: "neutral" }],
    };
    render(<TickerBar snapshot={snap} />);
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it("renders without throwing when tickers array is empty", () => {
    expect(() =>
      render(<TickerBar snapshot={{ ...VALID_SNAPSHOT, tickers: [] }} />)
    ).not.toThrow();
  });
});
