import { render, screen } from "@testing-library/react";
import MarketOverviewWidget, { MarketOverviewWidgetSkeleton } from "./MarketOverviewWidget";
import { MarketSnapshot } from "@/types";

const VALID_SNAPSHOT: MarketSnapshot = {
  indices: [
    { name: "SET Index", value: 1384.52, change_pct: 0.60, direction: "positive" },
    { name: "Nikkei 225", value: 38947.00, change_pct: -0.32, direction: "negative" },
  ],
  tickers: [],
  market_open: true,
  snapshot_at: "2026-06-27T03:00:00Z",
};

describe("MarketOverviewWidget", () => {
  it("renders each index name", () => {
    render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(screen.getByText("SET Index")).toBeInTheDocument();
    expect(screen.getByText("Nikkei 225")).toBeInTheDocument();
  });

  it("positive direction renders ▲ arrow", () => {
    render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(screen.getAllByText(/▲/).length).toBeGreaterThan(0);
  });

  it("negative direction renders ▼ arrow", () => {
    render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(screen.getAllByText(/▼/).length).toBeGreaterThan(0);
  });

  it("neutral direction renders – dash", () => {
    const snap: MarketSnapshot = {
      ...VALID_SNAPSHOT,
      indices: [{ name: "Bond Yield", value: 3.85, change_pct: 0.0, direction: "neutral" }],
    };
    render(<MarketOverviewWidget snapshot={snap} />);
    expect(screen.getAllByText(/–/).length).toBeGreaterThan(0);
  });

  it("renders without throwing when indices array is empty", () => {
    expect(() =>
      render(<MarketOverviewWidget snapshot={{ ...VALID_SNAPSHOT, indices: [] }} />)
    ).not.toThrow();
  });

  it("positive change_pct displays with + prefix", () => {
    render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(screen.getByText(/\+0\.60%/)).toBeInTheDocument();
  });

  it("negative change_pct displays natural – sign without + prefix", () => {
    render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(screen.getByText(/-0\.32%/)).toBeInTheDocument();
  });

  it("positive direction applies text-positive CSS class", () => {
    const { container } = render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(container.querySelector(".text-positive")).toBeInTheDocument();
  });

  it("negative direction applies text-negative CSS class", () => {
    const { container } = render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(container.querySelector(".text-negative")).toBeInTheDocument();
  });

  it("shows Market closed note when market_open is false", () => {
    render(<MarketOverviewWidget snapshot={{ ...VALID_SNAPSHOT, market_open: false }} />);
    expect(screen.getByText(/Market closed/)).toBeInTheDocument();
  });

  it("does NOT show Market closed note when market_open is true", () => {
    render(<MarketOverviewWidget snapshot={VALID_SNAPSHOT} />);
    expect(screen.queryByText(/Market closed/)).not.toBeInTheDocument();
  });

  it("shows Market data unavailable when snapshot is null", () => {
    render(<MarketOverviewWidget snapshot={null} />);
    expect(screen.getByText(/Market data unavailable/)).toBeInTheDocument();
  });

  it("value NaN renders — not throw", () => {
    const snap: MarketSnapshot = {
      ...VALID_SNAPSHOT,
      indices: [{ name: "X", value: NaN, change_pct: 0.0, direction: "neutral" }],
    };
    render(<MarketOverviewWidget snapshot={snap} />);
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it("change_pct NaN renders — not throw", () => {
    const snap: MarketSnapshot = {
      ...VALID_SNAPSHOT,
      indices: [{ name: "X", value: 100, change_pct: NaN, direction: "neutral" }],
    };
    render(<MarketOverviewWidget snapshot={snap} />);
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });
});

describe("MarketOverviewWidgetSkeleton", () => {
  it("renders without throwing", () => {
    expect(() => render(<MarketOverviewWidgetSkeleton />)).not.toThrow();
  });

  it("renders pulse row blocks", () => {
    const { container } = render(<MarketOverviewWidgetSkeleton />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
