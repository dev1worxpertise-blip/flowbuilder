import type { ReactNode } from "react";
import { type NodeProps } from "@xyflow/react";
import type { NodeData, NodeKind } from "../../types";
import { accentStyle } from "../../lib/theme";
import { DeleteButton, SideHandles, SimulationBadges, SpotlightHighlight } from "./shared";
import { HealthBadge } from "./HealthBadge";

/**
 * Geometry for each SVG-drawn flowchart shape. Each generator returns SVG
 * children (no fill/stroke — the parent <g> applies those) drawn in pixel
 * space for a w×h box, so strokes and curves never distort with node size.
 */
const P = 5; // padding so stroke + glow are not clipped

export type Geom = (w: number, h: number) => ReactNode;

export const SHAPES: Partial<Record<NodeKind, Geom>> = {
  process: (w, h) => <rect x={P} y={P} width={w - 2 * P} height={h - 2 * P} rx={3} />,

  io: (w, h) => {
    const k = Math.min(28, (w - 2 * P) * 0.22);
    return <polygon points={`${P + k},${P} ${w - P},${P} ${w - P - k},${h - P} ${P},${h - P}`} />;
  },

  database: (w, h) => {
    const rx = (w - 2 * P) / 2;
    const ry = Math.min(16, (h - 2 * P) * 0.16);
    const top = P + ry;
    const bot = h - P - ry;
    return (
      <>
        <path d={`M ${P},${top} L ${P},${bot} A ${rx},${ry} 0 0 0 ${w - P},${bot} L ${w - P},${top}`} />
        <ellipse cx={w / 2} cy={top} rx={rx} ry={ry} />
      </>
    );
  },

  document: (w, h) => {
    const wave = Math.min(16, (h - 2 * P) * 0.18);
    const y = h - P - wave;
    return (
      <path d={`M ${P},${P} L ${w - P},${P} L ${w - P},${y}
        C ${w * 0.66},${y + wave * 1.6} ${w * 0.34},${y - wave * 1.6} ${P},${y} Z`} />
    );
  },

  multidoc: (w, h) => {
    const off = 6;
    const wave = Math.min(14, (h - 2 * P) * 0.16);
    const doc = (ox: number, oy: number) => {
      const x0 = P + ox, x1 = w - P - (off * 2 - ox);
      const y0 = P + oy, y1 = h - P - (off * 2 - oy) - wave;
      return `M ${x0},${y0} L ${x1},${y0} L ${x1},${y1}
        C ${(x0 + x1) * 0.62},${y1 + wave * 1.6} ${(x0 + x1) * 0.38},${y1 - wave * 1.6} ${x0},${y1} Z`;
    };
    return (
      <>
        <path d={doc(off * 2, 0)} />
        <path d={doc(off, off)} />
        <path d={doc(0, off * 2)} />
      </>
    );
  },

  predefined: (w, h) => {
    const bar = Math.min(14, (w - 2 * P) * 0.12);
    return (
      <>
        <rect x={P} y={P} width={w - 2 * P} height={h - 2 * P} rx={2} />
        <line x1={P + bar} y1={P} x2={P + bar} y2={h - P} />
        <line x1={w - P - bar} y1={P} x2={w - P - bar} y2={h - P} />
      </>
    );
  },

  preparation: (w, h) => {
    const k = Math.min(30, (w - 2 * P) * 0.18);
    return (
      <polygon points={`${P + k},${P} ${w - P - k},${P} ${w - P},${h / 2} ${w - P - k},${h - P} ${P + k},${h - P} ${P},${h / 2}`} />
    );
  },

  connector: (w, h) => {
    const r = Math.min(w, h) / 2 - P;
    return <circle cx={w / 2} cy={h / 2} r={r} />;
  },

  manualinput: (w, h) => {
    const slant = Math.min(22, (h - 2 * P) * 0.3);
    return <polygon points={`${P},${P + slant} ${w - P},${P} ${w - P},${h - P} ${P},${h - P}`} />;
  },

  delay: (w, h) => {
    const r = (h - 2 * P) / 2;
    const flat = w - P - r;
    return <path d={`M ${P},${P} L ${flat},${P} A ${r},${r} 0 0 1 ${flat},${h - P} L ${P},${h - P} Z`} />;
  },

  manualop: (w, h) => {
    const k = Math.min(26, (w - 2 * P) * 0.14);
    return <polygon points={`${P},${P} ${w - P},${P} ${w - P - k},${h - P} ${P + k},${h - P}`} />;
  },

  offpage: (w, h) => {
    const pt = Math.min(26, (h - 2 * P) * 0.34);
    return (
      <polygon points={`${P},${P} ${w - P},${P} ${w - P},${h - P - pt} ${w / 2},${h - P} ${P},${h - P - pt}`} />
    );
  },
};

export function ShapeNode({ id, data, type, selected }: NodeProps & { data: NodeData }) {
  const s = accentStyle(data.accent);
  const w = data.width;
  const h = data.height;
  const geom = SHAPES[type as NodeKind] ?? SHAPES.process!;
  const isDown = data.healthStatus === "down";
  const isWarning = data.healthStatus === "warning";
  const strokeColor = isDown ? "#ef4444" : isWarning ? "#f59e0b" : s.border;
  const shadowFilter = isDown
    ? "drop-shadow(0 0 14px rgba(239, 68, 68, 0.9))"
    : isWarning
    ? "drop-shadow(0 0 8px rgba(245, 158, 11, 0.7))"
    : data.glow
    ? `drop-shadow(0 0 7px ${s.glow})`
    : "none";

  return (
    <div className={`group relative ${isDown ? "animate-pulse" : ""}`} style={{ width: w, height: h }}>
      <SimulationBadges id={id} />
      <SpotlightHighlight id={id} />
      {data.healthStatus && (
        <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <HealthBadge status={data.healthStatus} metric={data.metric} size="sm" />
        </div>
      )}
      <svg
        width={w} height={h} viewBox={`0 0 ${w} ${h}`}
        className="absolute inset-0 overflow-visible"
        style={{ filter: shadowFilter }}
      >
        <g
          fill={isDown ? "rgba(30,10,10,0.92)" : "rgba(17,24,39,0.9)"}
          stroke={strokeColor}
          strokeWidth={selected ? 2.5 : isDown ? 2 : 1.5}
          strokeLinejoin="round"
        >
          {geom(w, h)}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span className="text-xs font-bold leading-tight" style={{ color: s.title }}>{data.title}</span>
        {data.subtitle ? <span className="text-[10px] leading-tight text-gray-400">{data.subtitle}</span> : null}
      </div>
      <DeleteButton id={id} />
      <SideHandles color={s.border} />
    </div>
  );
}
