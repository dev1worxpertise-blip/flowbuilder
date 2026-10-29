import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { GroupNode } from "./GroupNode";
import { useEditorStore } from "../../store/editorStore";
import { createEmptyDiagram, type NodeData } from "../../types";

const GROUP_DATA: NodeData = {
  title: "Cloud VPC (us-east-1)",
  subtitle: "Production Subnet",
  accent: "blue",
  width: 480,
  height: 280,
  glow: false,
  borderStyle: "dashed",
};

function renderGroup(data: any = GROUP_DATA, id = "g1", selected = false) {
  return render(
    <ReactFlowProvider>
      <GroupNode
        id={id}
        data={data}
        selected={selected}
        type="group"
        dragging={false}
        zIndex={-1}
        isConnectable
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        draggable={false}
        selectable={false}
        deletable={false}
      />
    </ReactFlowProvider> as any
  );
}

test("renders group title and subtitle pill", () => {
  renderGroup();
  expect(screen.getByText("Cloud VPC (us-east-1)")).toBeInTheDocument();
  expect(screen.getByText("Production Subnet")).toBeInTheDocument();
});

test("supports solid and dashed border styles", () => {
  const { container: c1 } = renderGroup({ ...GROUP_DATA, borderStyle: "dashed" });
  expect(c1.querySelector(".border-dashed")).toBeTruthy();

  const { container: c2 } = renderGroup({ ...GROUP_DATA, borderStyle: "solid" });
  expect(c2.querySelector(".border-solid")).toBeTruthy();
});

test("delete button removes the group container from the store", () => {
  const d = createEmptyDiagram("T");
  d.nodes = [{ id: "g1", type: "group", position: { x: 0, y: 0 }, data: { ...GROUP_DATA } }];
  useEditorStore.getState().loadDiagram(d);
  renderGroup(GROUP_DATA);
  fireEvent.click(screen.getByLabelText(/delete block/i));
  expect(useEditorStore.getState().diagram!.nodes).toHaveLength(0);
});
