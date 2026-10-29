import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { CardNode } from "./CardNode";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram, type NodeData } from "../../types";

const DATA: NodeData = { title: "1. Engagement", subtitle: "Touchpoints", accent: "green", width: 220, height: 88, glow: true };

function renderNode(data: any, id = "n1") {
  return render(
    <ReactFlowProvider>
      <CardNode id={id} data={data} selected={false} type="card"
        dragging={false} zIndex={0} isConnectable positionAbsoluteX={0} positionAbsoluteY={0}
        draggable={false} selectable={false} deletable={false} />
    </ReactFlowProvider> as any
  );
}

test("renders title and subtitle", () => {
  renderNode(DATA);
  expect(screen.getByText("1. Engagement")).toBeInTheDocument();
  expect(screen.getByText("Touchpoints")).toBeInTheDocument();
});

test("delete button removes the node from the store", () => {
  const d = createEmptyDiagram("T");
  d.nodes = [{ id: "n1", type: "card", position: { x: 0, y: 0 }, data: { ...DATA } }];
  useEditorStore.getState().loadDiagram(d);
  renderNode(DATA);
  fireEvent.click(screen.getByLabelText(/delete block/i));
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(0);
});

test("renders an emoji icon as text", () => {
  renderNode({ ...DATA, icon: "🚀" });
  expect(screen.getByText("🚀")).toBeInTheDocument();
});

test("renders an image icon as <img> with the given src", () => {
  const { container } = renderNode({ ...DATA, icon: "https://example.com/logo.png" });
  const img = container.querySelector("img");
  expect(img).toBeTruthy();
  expect(img?.getAttribute("src")).toBe("https://example.com/logo.png");
});

test("no icon element when icon is unset", () => {
  const { container } = renderNode(DATA);
  expect(container.querySelector("img")).toBeNull();
});

test("renders an Iconify icon when iconify is set", () => {
  const { container } = renderNode({ ...DATA, iconify: "mdi:rocket-launch" });
  expect(container.querySelector('[data-iconify="mdi:rocket-launch"]')).toBeTruthy();
});

test("iconify takes priority over the emoji/image icon", () => {
  const { container } = renderNode({ ...DATA, iconify: "mdi:home", icon: "🚀" });
  expect(container.querySelector('[data-iconify="mdi:home"]')).toBeTruthy();
  expect(screen.queryByText("🚀")).toBeNull(); // emoji branch not used
});
