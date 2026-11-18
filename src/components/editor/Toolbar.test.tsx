import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram } from "../../types";

test("editing name updates the store and Present fires callback", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("Old"));
  const onPresent = vi.fn();
  render(<Toolbar onPresent={onPresent} onExportImage={() => {}} onBack={() => {}} />);
  fireEvent.change(screen.getByLabelText(/diagram name/i), { target: { value: "New" } });
  expect(useEditorStore.getState().diagram!.name).toBe("New");
  fireEvent.click(screen.getByText(/present/i));
  expect(onPresent).toHaveBeenCalled();
});

test("clicking Export button directly triggers onOpenExport", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("ExportTest"));
  const onOpenExport = vi.fn();
  render(
    <Toolbar
      onPresent={() => {}}
      onExportImage={() => {}}
      onOpenExport={onOpenExport}
      onBack={() => {}}
    />
  );
  const exportBtn = screen.getByTitle("Open Export Studio (Poster, PDF, GIF, JSON)");
  fireEvent.click(exportBtn);
  expect(onOpenExport).toHaveBeenCalledOnce();
});

test("clicking Export arrow opens quick download dropdown menu", () => {
  useEditorStore.getState().loadDiagram(createEmptyDiagram("ExportTest"));
  const onExportImage = vi.fn();
  render(
    <Toolbar
      onPresent={() => {}}
      onExportImage={onExportImage}
      onBack={() => {}}
    />
  );
  const dropdownArrow = screen.getByTitle("Quick Download Options (PNG, SVG, PDF, GIF, JSON)");
  fireEvent.click(dropdownArrow);
  expect(screen.getByText("Quick PNG Image")).toBeTruthy();
  expect(screen.getByText("Quick SVG Vector")).toBeTruthy();

  fireEvent.click(screen.getByText("Quick PNG Image"));
  expect(onExportImage).toHaveBeenCalledWith("png");
});
