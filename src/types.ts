export const ACCENTS = ["neutral", "green", "pink", "blue", "amber", "crimson", "purple"] as const;
export type Accent = (typeof ACCENTS)[number];

export const NODE_KINDS = [
  "card", "decision", "pill", "label", "note", "group",
  "process", "io", "database", "document", "multidoc", "predefined",
  "preparation", "connector", "manualinput", "delay", "manualop", "offpage",
] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

/** Human-readable palette label per node kind. */
export const NODE_LABELS: Record<NodeKind, string> = {
  card: "Card",
  decision: "Decision",
  pill: "Start / End",
  label: "Label",
  note: "Sticky Note",
  group: "Group Container",
  process: "Process",
  io: "Input / Output",
  database: "Database",
  document: "Document",
  multidoc: "Multi-document",
  predefined: "Predefined Process",
  preparation: "Preparation",
  connector: "Connector",
  manualinput: "Manual Input",
  delay: "Delay",
  manualop: "Manual Operation",
  offpage: "Off-page Connector",
};

export const EDGE_ANIMATIONS = ["dots", "pulse", "gradient", "none"] as const;
export type EdgeAnimation = (typeof EDGE_ANIMATIONS)[number];

export type PathKind = "smoothstep" | "step" | "bezier" | "straight";

export interface PathKindOption {
  id: PathKind;
  label: string;
  icon: string;
  desc: string;
}

export const PATH_KINDS: PathKindOption[] = [
  { id: "smoothstep", label: "Smooth Step", icon: "↳", desc: "Rounded 90° Orthogonal" },
  { id: "step", label: "Sharp Step", icon: "⌐", desc: "Classic 90° Orthogonal" },
  { id: "bezier", label: "Curved", icon: "∿", desc: "Smooth Bezier Curve" },
  { id: "straight", label: "Straight", icon: "─", desc: "Direct Point-to-Point" },
];

export type LineStyle = "solid" | "dashed";

export type NodeHealthStatus = "healthy" | "warning" | "down" | "pending";

export const HEALTH_STATUS_CONFIG: Record<
  NodeHealthStatus,
  { label: string; dot: string; color: string; bg: string; border: string; glow: string }
> = {
  healthy: {
    label: "Healthy",
    dot: "#10b981",
    color: "#34d399",
    bg: "rgba(6, 78, 59, 0.6)",
    border: "rgba(52, 211, 153, 0.4)",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  warning: {
    label: "Warning",
    dot: "#f59e0b",
    color: "#fbbf24",
    bg: "rgba(120, 53, 15, 0.6)",
    border: "rgba(251, 191, 36, 0.4)",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  down: {
    label: "Outage",
    dot: "#ef4444",
    color: "#f87171",
    bg: "rgba(127, 29, 29, 0.6)",
    border: "rgba(248, 113, 113, 0.4)",
    glow: "rgba(239, 68, 68, 0.4)",
  },
  pending: {
    label: "Deploying",
    dot: "#0ea5e9",
    color: "#38bdf8",
    bg: "rgba(12, 74, 110, 0.6)",
    border: "rgba(56, 189, 248, 0.4)",
    glow: "rgba(14, 165, 233, 0.4)",
  },
};

export interface WebhookEvent {
  id: string;
  diagramId: string;
  nodeId: string;
  status: NodeHealthStatus;
  metric?: string;
  message?: string;
  source: "webhook" | "probe" | "manual";
  timestamp: string;
}

export interface NodeWebhookConfig {
  enabled: boolean;
  pollUrl?: string; // Optional synthetic ping target URL
  pollIntervalSec?: number; // e.g. 15, 30, 60s
  lastPingAt?: string;
  lastMessage?: string;
  history?: WebhookEvent[];
}

export interface NodeData {
  title: string;
  subtitle: string;
  accent: Accent;
  width: number;
  height: number;
  glow: boolean;
  borderStyle?: LineStyle; // optional: solid or dashed for group containers
  healthStatus?: NodeHealthStatus; // optional: healthy | warning | down | pending
  metric?: string; // optional: e.g. "18ms", "99.9%", "1.2k rps"
  webhookConfig?: NodeWebhookConfig; // optional: live API webhook & synthetic probe config
  icon?: string; // optional: an emoji, or an image/data URL shown on the card
  iconify?: string; // optional: an Iconify icon name (e.g. "mdi:rocket-launch"); takes priority over `icon`
  [key: string]: unknown; // React Flow requires index signature on node data
}

export interface EdgeData {
  animation: EdgeAnimation;
  color: string;
  speed: number; // 1..5
  lineStyle: LineStyle;
  path: PathKind;
  strokeWidth?: number;
  label?: string;
  [key: string]: unknown;
}

export interface FlowNode {
  id: string;
  type: NodeKind;
  position: { x: number; y: number };
  data: NodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: "animated";
  data: EdgeData;
}

export interface Diagram {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  theme: "dark";
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Default data (title + sensible shape size) for a freshly-dropped node of a kind. */
export function defaultNodeData(kind: NodeKind): NodeData {
  const presets: Record<NodeKind, { title: string; subtitle?: string; width: number; height: number }> = {
    card: { title: "New Block", subtitle: "Subtitle", width: 220, height: 88 },
    decision: { title: "Decision?", width: 150, height: 150 },
    pill: { title: "Start", width: 150, height: 56 },
    label: { title: "Label", width: 120, height: 40 },
    note: { title: "Note", subtitle: "Write note or comments here...", width: 190, height: 160 },
    group: { title: "Cloud VPC / Subnet", subtitle: "Architecture Tier", width: 480, height: 280 },
    process: { title: "Process", width: 180, height: 80 },
    io: { title: "Input / Output", width: 190, height: 80 },
    database: { title: "Database", width: 150, height: 120 },
    document: { title: "Document", width: 180, height: 100 },
    multidoc: { title: "Documents", width: 184, height: 110 },
    predefined: { title: "Subroutine", width: 190, height: 80 },
    preparation: { title: "Preparation", width: 190, height: 90 },
    connector: { title: "A", width: 64, height: 64 },
    manualinput: { title: "Manual Input", width: 180, height: 84 },
    delay: { title: "Delay", width: 170, height: 80 },
    manualop: { title: "Manual Op", width: 180, height: 80 },
    offpage: { title: "Off-page", width: 150, height: 96 },
  };
  const p = presets[kind];
  return {
    title: p.title,
    subtitle: p.subtitle ?? "",
    accent: kind === "note" ? "amber" : kind === "group" ? "blue" : "neutral",
    width: p.width,
    height: p.height,
    glow: kind !== "note" && kind !== "group",
    borderStyle: kind === "group" ? "dashed" : "solid",
  };
}

export function createEmptyDiagram(name: string): Diagram {
  const now = Date.now();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    nodes: [],
    edges: [],
    theme: "dark",
  };
}
