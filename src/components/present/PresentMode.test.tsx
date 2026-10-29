import { render, screen, fireEvent } from "@testing-library/react";
import { PresentMode } from "./PresentMode";
import { useEditorStore } from "../../store/editorStore";
import { buildHdlTemplate } from "../../templates/hdl";

describe("PresentMode", () => {
  beforeEach(() => {
    useEditorStore.getState().loadDiagram(buildHdlTemplate());
  });

  test("shows the diagram title and exits on Escape", () => {
    const onExit = vi.fn();
    render(<PresentMode onExit={onExit} />);
    expect(screen.getByText("HDL Customer Lifecycle")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onExit).toHaveBeenCalled();
  });

  test("Exit button calls onExit", () => {
    const onExit = vi.fn();
    render(<PresentMode onExit={onExit} />);
    fireEvent.click(screen.getByText(/exit/i));
    expect(onExit).toHaveBeenCalled();
  });

  test("displays Guided Tour HUD and steps forward/backward", () => {
    render(<PresentMode onExit={vi.fn()} />);

    // Step 1 should be visible
    expect(screen.getByText(/STEP 1 OF/i)).toBeInTheDocument();
    expect(screen.getByText(/Next/i)).toBeInTheDocument();
    expect(screen.getByText(/Prev/i)).toBeInTheDocument();

    // Advance step
    fireEvent.click(screen.getByText(/Next/i));
    expect(screen.getByText(/STEP 2 OF/i)).toBeInTheDocument();

    // Step backward
    fireEvent.click(screen.getByText(/Prev/i));
    expect(screen.getByText(/STEP 1 OF/i)).toBeInTheDocument();
  });

  test("switches between Guided Tour and Free Explore modes", () => {
    render(<PresentMode onExit={vi.fn()} />);

    expect(screen.getByText(/STEP 1 OF/i)).toBeInTheDocument();

    // Click Free Explore
    fireEvent.click(screen.getByText(/Free Explore/i));
    // HUD should be hidden in Free Explore
    expect(screen.queryByText(/STEP 1 OF/i)).not.toBeInTheDocument();

    // Click back to Guided Tour
    fireEvent.click(screen.getByText(/Guided Tour/i));
    expect(screen.getByText(/STEP 1 OF/i)).toBeInTheDocument();
  });

  test("toggles auto-play walkthrough", () => {
    render(<PresentMode onExit={vi.fn()} />);

    const autoBtn = screen.getByTitle(/Play Auto Walkthrough/i);
    expect(autoBtn).toBeInTheDocument();

    fireEvent.click(autoBtn);
    expect(screen.getByTitle(/Pause Auto Walkthrough/i)).toBeInTheDocument();
  });
});
