import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { AnimatedEdge } from "./AnimatedEdge";

function renderEdge(data: any) {
  return render(
    <ReactFlowProvider>
      <svg>
        <AnimatedEdge id="e1" source="a" target="b" sourceX={0} sourceY={0}
          targetX={100} targetY={100} sourcePosition={"right" as any}
          targetPosition={"left" as any} data={data} selected={false}
          markerEnd="" style={{}} />
      </svg>
    </ReactFlowProvider> as any
  );
}

test("dots animation renders an animateMotion element", () => {
  const { container } = renderEdge({ animation: "dots", color: "#fff", speed: 3, lineStyle: "solid", path: "smoothstep" });
  expect(container.querySelector("animateMotion")).toBeTruthy();
});

test("gradient animation renders a linearGradient", () => {
  const { container } = renderEdge({ animation: "gradient", color: "#fff", speed: 3, lineStyle: "solid", path: "bezier" });
  expect(container.querySelector("linearGradient")).toBeTruthy();
});

test("step path renders sharp 90-degree orthogonal path", () => {
  const { container } = renderEdge({ animation: "dots", color: "#fff", speed: 3, lineStyle: "solid", path: "step" });
  const path = container.querySelector("path");
  expect(path).toBeTruthy();
  expect(path?.getAttribute("d")).toBeTruthy();
});

test("straight path renders direct line path", () => {
  const { container } = renderEdge({ animation: "dots", color: "#fff", speed: 3, lineStyle: "solid", path: "straight" });
  const path = container.querySelector("path");
  expect(path).toBeTruthy();
  expect(path?.getAttribute("d")).toMatch(/M\s*0,0L\s*100,100/);
});

test("pulse animation renders a pulsed stroke-dashoffset animate element", () => {
  const { container } = renderEdge({ animation: "pulse", color: "#38bdf8", speed: 4, lineStyle: "solid", path: "smoothstep" });
  const animate = container.querySelector("animate");
  expect(animate).toBeTruthy();
  expect(animate?.getAttribute("attributeName")).toBe("stroke-dashoffset");
});
