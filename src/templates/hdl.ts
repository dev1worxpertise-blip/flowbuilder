import type { Diagram, FlowNode, FlowEdge, Accent } from "../types";

export const HDL_TEMPLATE_ID = "hdl-starter";

function node(
  id: string,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  accent: Accent = "neutral"
): FlowNode {
  return {
    id,
    type: "card",
    position: { x, y },
    data: { title, subtitle, accent, width: 220, height: 88, glow: true },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  color: string,
  animation: "dots" | "gradient" = "dots",
  label?: string
): FlowEdge {
  return {
    id,
    source,
    target,
    type: "animated",
    data: { animation, color, speed: 3, lineStyle: "solid", path: "smoothstep", label },
  };
}

export function buildHdlTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    node("n1", "1. Customer Engagement", "Web, Social, Client Touchpoints", 40, 220),
    node("n2", "2. Lead Prioritization", "Sorting Decision Engine Split", 320, 220),
    node("n3a", "3A. High-Priority Route", "Bypasses scrub to Quick Dispatch", 600, 80, "green"),
    node("n4b", "4B. Standard CRM Route", "Data Scrub, Cleaning & Validation", 600, 360, "pink"),
    node("n3", "3. Data Scrub & Assign", "Worxpertise CRM Core", 880, 220),
    node("n4", "4. Intelligent Contact", "Agent Intelligent UI View", 1160, 220, "blue"),
    node("n5", "5. Channel Execution", "Omnichannel SMS / Inbound IVR", 880, 440),
    node("n6", "6. Experience Tracking", "Feedback Loops & CSAT Metrics", 600, 560, "amber"),
  ];
  const edges: FlowEdge[] = [
    edge("e1", "n1", "n2", "#34d399"),
    edge("e2", "n2", "n3a", "#34d399", "dots", "High Priority"),
    edge("e3", "n2", "n4b", "#ec4899", "gradient", "Standard Route"),
    edge("e4", "n3a", "n3", "#34d399"),
    edge("e5", "n4b", "n3", "#ec4899", "gradient"),
    edge("e6", "n3", "n4", "#60a5fa"),
    edge("e7", "n4", "n5", "#60a5fa"),
    edge("e8", "n5", "n6", "#fbbf24"),
  ];
  return { id: HDL_TEMPLATE_ID, name: "HDL Customer Lifecycle", createdAt: now, updatedAt: now, nodes, edges, theme: "dark" };
}
