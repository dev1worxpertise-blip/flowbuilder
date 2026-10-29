import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AiFlowModal } from "./AiFlowModal";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

describe("AiFlowModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useEditorStore.getState().loadDiagram(createEmptyDiagram("Blank"));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("does not render when closed", () => {
    const { container } = render(<AiFlowModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders modal, selects a preset, and generates flow", () => {
    const onClose = vi.fn();
    render(<AiFlowModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText(/ai workflow generator/i)).toBeInTheDocument();

    // Click a preset button
    const presetBtn = screen.getByText(/fintech loan & kyc/i);
    fireEvent.click(presetBtn);

    // Prompt textarea should now contain the loan workflow
    const textarea = screen.getByPlaceholderText(/e\.g\. user submits kyc application/i);
    expect((textarea as HTMLTextAreaElement).value).toContain("Customer applies for personal loan");

    // Click Generate
    const generateBtn = screen.getByRole("button", { name: /generate flowchart/i });
    fireEvent.click(generateBtn);

    // Fast-forward simulated AI synthesis timer
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Verify preview summary appeared
    expect(screen.getByText(/ready to apply/i)).toBeInTheDocument();
    expect(screen.getByText(/fintech kyc & loan approval/i)).toBeInTheDocument();

    // Click Insert into Canvas
    const insertBtn = screen.getByRole("button", { name: /insert into canvas/i });
    fireEvent.click(insertBtn);

    // Store should now have the generated nodes and edges
    const diagram = useEditorStore.getState().diagram!;
    expect(diagram.nodes.length).toBeGreaterThanOrEqual(8);
    expect(diagram.edges.length).toBeGreaterThanOrEqual(8);
    expect(onClose).toHaveBeenCalled();
  });
});
