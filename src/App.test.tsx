import "fake-indexeddb/auto";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { listDiagrams, deleteDiagram } from "./db/library";

beforeEach(async () => {
  for (const d of await listDiagrams()) await deleteDiagram(d.id);
});

test("app starts on the gallery and seeds HDL", async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText("FlowBuilder")).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText("HDL Customer Lifecycle")).toBeInTheDocument());
});
