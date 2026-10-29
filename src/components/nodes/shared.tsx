import { Fragment } from "react";
import { Handle, Position } from "@xyflow/react";
import { useEditorStore } from "../../store/editorStore";
import { useSimulationStore } from "../../store/simulationStore";

/** Hover-reveal delete button. Parent must have the `group relative` classes. */
export function DeleteButton({ id, className = "-top-2 -right-2" }: { id: string; className?: string }) {
  const removeNode = useEditorStore((s) => s.removeNode);
  return (
    <button
      type="button"
      aria-label="Delete block"
      title="Delete block"
      className={`node-delete-btn nodrag nopan absolute ${className} z-10 flex h-5 w-5 items-center justify-center
        rounded-full border border-gray-600 bg-gray-900 text-xs leading-none text-gray-300
        opacity-0 transition group-hover:opacity-100 hover:border-red-500 hover:text-red-400`}
      onClick={(e) => { e.stopPropagation(); removeNode(id); }}
    >
      ×
    </button>
  );
}

const SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];

/** Target + source handle on each side so any side can both send and receive
 *  connections (connectionMode="loose"); shared id lets stored edges resolve. */
export function SideHandles({ color }: { color: string }) {
  return (
    <>
      {SIDES.map((p) => (
        <Fragment key={p}>
          <Handle type="target" position={p} id={p} style={{ background: color, width: 8, height: 8 }} />
          <Handle type="source" position={p} id={p} style={{ background: color, width: 8, height: 8 }} />
        </Fragment>
      ))}
    </>
  );
}

/** Simulation step highlight and visited checkmark badge */
export function SimulationBadges({ id }: { id: string }) {
  const isActive = useSimulationStore((s) => s.isActive);
  const currentNodeId = useSimulationStore((s) => s.currentNodeId);
  const visitedNodeIds = useSimulationStore((s) => s.visitedNodeIds);

  if (!isActive) return null;

  const isCurrent = currentNodeId === id;
  const isVisited = visitedNodeIds.includes(id) && !isCurrent;

  return (
    <>
      {isCurrent && (
        <>
          <div className="pointer-events-none absolute -inset-1 rounded-2xl ring-4 ring-sky-400 ring-offset-2 ring-offset-gray-950 animate-pulse shadow-[0_0_25px_rgba(56,189,248,0.7)] z-20" />
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg z-30 whitespace-nowrap flex items-center gap-1 animate-bounce">
            <span>▶</span> ACTIVE STEP
          </div>
        </>
      )}
      {isVisited && (
        <span className="pointer-events-none absolute -top-2 -left-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-md ring-2 ring-gray-950">
          ✓
        </span>
      )}
    </>
  );
}

/** Spotlight search glowing highlight when node is found & focused */
export function SpotlightHighlight({ id }: { id: string }) {
  const isHighlighted = useEditorStore((s) => s.highlightedNodeId === id);
  if (!isHighlighted) return null;

  return (
    <>
      <div className="pointer-events-none absolute -inset-2 rounded-2xl ring-4 ring-amber-400 ring-offset-2 ring-offset-gray-950 animate-pulse shadow-[0_0_35px_rgba(251,191,36,0.9)] z-30" />
      <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-gray-950 shadow-2xl z-30 whitespace-nowrap flex items-center gap-1.5 animate-bounce">
        <span>🔍</span> FOUND NODE
      </div>
    </>
  );
}
