import { render, screen } from "@testing-library/react";
import DailyBriefPlaceholder from "./DailyBriefPlaceholder";

describe("DailyBriefPlaceholder", () => {
  it("renders without throwing", () => {
    expect(() => render(<DailyBriefPlaceholder />)).not.toThrow();
  });

  it("renders AI Daily Brief heading", () => {
    render(<DailyBriefPlaceholder />);
    expect(screen.getByText("AI Daily Brief")).toBeInTheDocument();
  });

  it("renders preparing subtitle", () => {
    render(<DailyBriefPlaceholder />);
    expect(
      screen.getByText(/Today's brief is being prepared/i)
    ).toBeInTheDocument();
  });
});
