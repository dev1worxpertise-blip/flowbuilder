import type { ReactNode } from "react";
import { SHAPES } from "./shapes";
import type { NodeKind } from "../../types";

// Virtual drawing box for the mini glyphs (scaled down by the <svg> size).
const W = 30;
const H = 22;
const P = 4;

/** Glyphs for the kinds that have bespoke node components (not in SHAPES). */
const SPECIAL: Partial<Record<NodeKind, () => ReactNode>> = {
  card: () => <rect x={P} y={5} width={W - 2 * P} height={H - 10} rx={3} />,
  decision: () => <polygon points={`${W / 2},${P} ${W - P},${H / 2} ${W / 2},${H - P} ${P},${H / 2}`} />,
  pill: () => <rect x={P} y={6} width={W - 2 * P} height={H - 12} rx={(H - 12) / 2} />,
  label: () => (
    <>
      <line x1={P + 2} y1={H / 2 - 2} x2={W - P - 2} y2={H / 2 - 2} />
      <line x1={P + 2} y1={H / 2 + 3} x2={W - P - 7} y2={H / 2 + 3} />
    </>
  ),
  note: () => (
    <>
      <rect x={P + 1} y={4} width={W - 2 * P - 2} height={H - 8} rx={2} />
      <line x1={P + 4} y1={9} x2={W - P - 5} y2={9} />
      <line x1={P + 4} y1={13} x2={W - P - 8} y2={13} />
    </>
  ),
  group: () => (
    <>
      <rect x={P} y={3} width={W - 2 * P} height={H - 6} rx={2} strokeDasharray="2 2" />
      <line x1={P} y1={8} x2={W - P} y2={8} strokeDasharray="none" />
    </>
  ),
};

/** A small outline glyph for a node kind, for the palette. */
export function NodeIcon({ kind }: { kind: NodeKind }) {
  const special = SPECIAL[kind];
  const geom = special ? special() : (SHAPES[kind] ?? SHAPES.process!)(W, H);
  return (
    <svg
      width={26} height={19} viewBox={`0 0 ${W} ${H}`}
      className="shrink-0 overflow-visible text-gray-400"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
        {geom}
      </g>
    </svg>
  );
}
