import "fake-indexeddb/auto";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Gallery } from "./Gallery";
import { listDiagrams, deleteDiagram } from "../../db/library";

beforeEach(async () => {
  for (const d of await listDiagrams()) await deleteDiagram(d.id);
});

test("seeds HDL template when library is empty", async () => {
  render(<Gallery onOpen={() => {}} />);
  await waitFor(() => expect(screen.getByText("HDL Customer Lifecycle")).toBeInTheDocument());
});

test("New diagram button opens a fresh diagram", async () => {
  const onOpen = vi.fn();
  render(<Gallery onOpen={onOpen} />);
  await waitFor(() => screen.getByText(/new diagram/i));
  fireEvent.click(screen.getByText(/new diagram/i));
  await waitFor(() => expect(onOpen).toHaveBeenCalled());
});
