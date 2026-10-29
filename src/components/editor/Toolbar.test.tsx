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
