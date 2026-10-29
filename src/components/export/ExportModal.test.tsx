import { render, screen, fireEvent } from "@testing-library/react";
import { ExportModal } from "./ExportModal";
import { createEmptyDiagram } from "../../types";

describe("ExportModal", () => {
  const dummyDiagram = createEmptyDiagram("Architecture Pipeline");

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ExportModal
        diagram={dummyDiagram}
        isOpen={false}
        onClose={vi.fn()}
        viewportElement={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with Export Studio title and tabs when open", () => {
    const onClose = vi.fn();
    render(
      <ExportModal
        diagram={dummyDiagram}
        isOpen={true}
        onClose={onClose}
        viewportElement={null}
      />
    );

    expect(screen.getByText("Export Studio")).toBeInTheDocument();
    expect(screen.getByText(/High-Res Poster/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF Document/i)).toBeInTheDocument();
    expect(screen.getByText(/Looping GIF/i)).toBeInTheDocument();
    expect(screen.getByText(/JSON Model/i)).toBeInTheDocument();

    // Close button
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalled();
  });

  it("allows switching to PDF Document tab and selecting Multi-Page Report", () => {
    render(
      <ExportModal
        diagram={dummyDiagram}
        isOpen={true}
        onClose={vi.fn()}
        viewportElement={null}
      />
    );

    // Switch to PDF tab
    fireEvent.click(screen.getByText(/PDF Document/i));
    expect(screen.getAllByText(/Multi-Page Architecture Report/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Single-Page Poster/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Download Multi-Page Architecture Report/i)
    ).toBeInTheDocument();
  });

  it("allows switching resolution scale factors on Poster tab", () => {
    render(
      <ExportModal
        diagram={dummyDiagram}
        isOpen={true}
        onClose={vi.fn()}
        viewportElement={null}
      />
    );

    // Click 4x scale
    fireEvent.click(screen.getByText(/4x 4K Print/i));
    expect(screen.getByText(/Download 4x High-Res PNG Poster/i)).toBeInTheDocument();
  });
});
