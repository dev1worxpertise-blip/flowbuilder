import { render, screen } from "@testing-library/react";
import { HealthBadge } from "./HealthBadge";

describe("HealthBadge", () => {
  test("renders nothing when status is not provided", () => {
    const { container } = render(<HealthBadge />);
    expect(container.firstChild).toBeNull();
  });

  test("renders healthy status badge and dot", () => {
    render(<HealthBadge status="healthy" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByTestId("health-dot")).toBeInTheDocument();
  });

  test("renders warning status with metric", () => {
    render(<HealthBadge status="warning" metric="42ms" />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByTestId("health-metric")).toHaveTextContent("42ms");
  });

  test("renders outage and deploying statuses", () => {
    const { rerender } = render(<HealthBadge status="down" />);
    expect(screen.getByText("Outage")).toBeInTheDocument();

    rerender(<HealthBadge status="pending" metric="deploying..." />);
    expect(screen.getByText("Deploying")).toBeInTheDocument();
    expect(screen.getByText("deploying...")).toBeInTheDocument();
  });
});
