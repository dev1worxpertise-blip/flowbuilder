import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { EdgeData } from "../../types";
import { useSimulationStore } from "../../store/simulationStore";
import { useEditorStore } from "../../store/editorStore";

function durationFor(speed: number): number {
  // speed 1 (slow) -> 4s, speed 5 (fast) -> 0.8s
  const clamped = Math.min(5, Math.max(1, speed));
  return 4.8 - clamped * 0.8;
}

export function AnimatedEdge(props: EdgeProps & { data: EdgeData }) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const common = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const { setEdges } = useReactFlow();

  const [path, labelX, labelY] =
    data.path === "bezier"
      ? getBezierPath(common)
      : data.path === "straight"
      ? getStraightPath(common)
      : data.path === "step"
      ? getSmoothStepPath({ ...common, borderRadius: 0 })
      : getSmoothStepPath({ ...common, borderRadius: 8 });

  const activeEdgeId = useSimulationStore((s) => s.activeEdgeId);
  const isTraversing = activeEdgeId === id;

  const nodes = useEditorStore((s) => s.diagram?.nodes);
  const sourceNode = nodes?.find((n) => n.id === props.source);
  const targetNode = nodes?.find((n) => n.id === props.target);
  const isIncident = sourceNode?.data.healthStatus === "down" || targetNode?.data.healthStatus === "down";
  const isWarning = !isIncident && (sourceNode?.data.healthStatus === "warning" || targetNode?.data.healthStatus === "warning");

  const effectiveColor = isIncident ? "#ef4444" : isWarning ? "#f59e0b" : data.color;
  const dur = isTraversing ? "0.6s" : `${durationFor(data.speed)}s`;
  const dash = isIncident ? "8 6" : data.lineStyle === "dashed" ? "6 6" : undefined;
  const gradId = `grad-${id}`;
  const baseWidth = data.strokeWidth ?? (isIncident ? 3.5 : isTraversing ? 5 : selected ? 3.5 : 2);

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((edges) =>
      edges.map((edge) => ({
        ...edge,
        selected: edge.id === id,
      }))
    );
  };

  return (
    <>
      {data.animation === "gradient" ? (
        <>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={effectiveColor} stopOpacity="0.1" />
              <stop offset="50%" stopColor={effectiveColor} stopOpacity="1" />
              <stop offset="100%" stopColor={effectiveColor} stopOpacity="0.1" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="-1 0"
                to="1 0"
                dur={dur}
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          <BaseEdge
            id={id}
            path={path}
            interactionWidth={30}
            style={{
              stroke: `url(#${gradId})`,
              strokeWidth: data.strokeWidth ? data.strokeWidth + 1 : isTraversing ? 5.5 : selected ? 4 : 3,
              strokeDasharray: dash,
              filter: isIncident
                ? "drop-shadow(0 0 10px rgba(239, 68, 68, 0.9))"
                : isTraversing
                ? `drop-shadow(0 0 12px ${effectiveColor}) drop-shadow(0 0 20px ${effectiveColor})`
                : `drop-shadow(0 0 ${selected ? "8px" : "4px"} ${effectiveColor})`,
            }}
          />
        </>
      ) : (
        <>
          <BaseEdge
            id={id}
            path={path}
            interactionWidth={30}
            style={{
              stroke: effectiveColor,
              strokeWidth: baseWidth,
              opacity: isIncident ? 1 : isTraversing ? 1 : selected ? 0.95 : 0.65,
              strokeDasharray: dash,
              filter: isIncident
                ? "drop-shadow(0 0 10px rgba(239, 68, 68, 0.85))"
                : isTraversing
                ? `drop-shadow(0 0 10px ${effectiveColor}) drop-shadow(0 0 18px ${effectiveColor})`
                : selected
                ? `drop-shadow(0 0 6px ${effectiveColor})`
                : "none",
            }}
          />
          {data.animation === "pulse" && (
            <path
              d={path}
              fill="none"
              stroke={effectiveColor}
              strokeWidth={baseWidth + 1.5}
              strokeDasharray="20 40"
              style={{
                filter: isTraversing
                  ? `drop-shadow(0 0 12px ${effectiveColor}) drop-shadow(0 0 20px ${effectiveColor})`
                  : `drop-shadow(0 0 8px ${effectiveColor})`,
                opacity: 0.95,
              }}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="60"
                to="0"
                dur={dur}
                repeatCount="indefinite"
              />
            </path>
          )}
          {data.animation === "dots" && (
            <circle
              className="gif-exclude"
              r={isTraversing ? 7 : selected ? 5 : 4}
              fill={effectiveColor}
              style={{
                filter: isTraversing
                  ? `drop-shadow(0 0 10px ${effectiveColor})`
                  : `drop-shadow(0 0 6px ${effectiveColor})`,
              }}
            >
              <animateMotion dur={dur} repeatCount="indefinite" path={path} />
            </circle>
          )}
        </>
      )}

      {/* Render Edge Label on path */}
      {data.label && data.label.trim() !== "" && (
        <EdgeLabelRenderer>
          <div
            onClick={handleLabelClick}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`nodrag nopan flex cursor-pointer items-center justify-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold shadow-lg backdrop-blur transition hover:scale-105 ${
              selected
                ? "border-sky-400 bg-[#0f172a] text-white ring-2 ring-sky-500/40"
                : "border-gray-700/80 bg-[#0f172a]/95 text-gray-200 hover:border-gray-500"
            }`}
          >
            <span style={{ color: selected ? "#38bdf8" : data.color }}>{data.label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
