import { render, screen, fireEvent } from "@testing-library/react";
import { Palette } from "./Palette";

test("renders a draggable item per node kind and sets drag data", () => {
  render(<Palette />);
  const card = screen.getByText(/card/i);
  const setData = vi.fn();
  fireEvent.dragStart(card, { dataTransfer: { setData, effectAllowed: "" } });
  expect(setData).toHaveBeenCalledWith("application/flow-kind", "card");
});
