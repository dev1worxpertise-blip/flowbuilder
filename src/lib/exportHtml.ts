import type { Diagram, FlowNode, Accent, NodeHealthStatus } from "../types";
import { diagramBounds, sanitizeFilename } from "./exportDiagram";
import { buildGuidedTour } from "./guidedTour";

export interface ExportHtmlOptions {
  isDark?: boolean;
  canvasColor?: string;
  embedData?: boolean;
}

/** Escape HTML entities for safe embedding in text nodes */
function escapeHtml(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Accent color mappings matching Worxpertise design system */
const ACCENT_COLORS: Record<Accent, { border: string; bg: string; glow: string; text: string }> = {
  neutral: { border: "#475569", bg: "#1e293b", glow: "rgba(100,116,139,0.3)", text: "#cbd5e1" },
  green: { border: "#10b981", bg: "#064e3b", glow: "rgba(16,185,129,0.3)", text: "#6ee7b7" },
  pink: { border: "#ec4899", bg: "#831843", glow: "rgba(236,72,153,0.3)", text: "#fbcfe8" },
  blue: { border: "#0ea5e9", bg: "#0c4a6e", glow: "rgba(14,165,233,0.3)", text: "#7dd3fc" },
  amber: { border: "#f59e0b", bg: "#78350f", glow: "rgba(245,158,11,0.3)", text: "#fde68a" },
  crimson: { border: "#c00000", bg: "#450a0a", glow: "rgba(192,0,0,0.4)", text: "#fca5a5" },
  purple: { border: "#a855f7", bg: "#581c87", glow: "rgba(168,85,247,0.3)", text: "#e9d5ff" },
};

/** Sticky Note styles matching NoteNode.tsx */
const NOTE_STYLES: Record<
  Accent,
  {
    bg: string;
    border: string;
    tape: string;
    title: string;
    body: string;
  }
> = {
  amber: {
    bg: "rgba(43, 33, 14, 0.96)",
    border: "#d97706",
    tape: "rgba(245, 158, 11, 0.35)",
    title: "#fbbf24",
    body: "#fef3c7",
  },
  pink: {
    bg: "rgba(46, 16, 30, 0.96)",
    border: "#db2777",
    tape: "rgba(236, 72, 153, 0.35)",
    title: "#f472b6",
    body: "#fce7f3",
  },
  blue: {
    bg: "rgba(14, 32, 54, 0.96)",
    border: "#0284c7",
    tape: "rgba(56, 189, 248, 0.35)",
    title: "#38bdf8",
    body: "#e0f2fe",
  },
  green: {
    bg: "rgba(12, 40, 28, 0.96)",
    border: "#059669",
    tape: "rgba(52, 211, 153, 0.35)",
    title: "#34d399",
    body: "#d1fae5",
  },
  neutral: {
    bg: "rgba(24, 25, 32, 0.96)",
    border: "#858591",
    tape: "rgba(133, 133, 145, 0.35)",
    title: "#c0c0c8",
    body: "#f1f1f5",
  },
  crimson: {
    bg: "rgba(40, 10, 12, 0.96)",
    border: "#c00000",
    tape: "rgba(192, 0, 0, 0.35)",
    title: "#ff4040",
    body: "#ffbfbf",
  },
  purple: {
    bg: "rgba(38, 14, 52, 0.96)",
    border: "#9744cc",
    tape: "rgba(151, 68, 204, 0.35)",
    title: "#c084fc",
    body: "#f3e8ff",
  },
};

/** Health status color configurations */
const HEALTH_CONFIG: Record<NodeHealthStatus, { label: string; color: string; dot: string; bg: string }> = {
  healthy: { label: "Healthy", color: "#34d399", dot: "#10b981", bg: "rgba(6,78,59,0.7)" },
  warning: { label: "Degraded", color: "#fbbf24", dot: "#f59e0b", bg: "rgba(120,53,15,0.7)" },
  down: { label: "Outage", color: "#f87171", dot: "#ef4444", bg: "rgba(127,29,29,0.7)" },
  pending: { label: "Deploying", color: "#38bdf8", dot: "#0ea5e9", bg: "rgba(12,74,110,0.7)" },
};

/** Computes absolute canvas coordinates for all nodes taking parentId nesting into account */
function resolveNodePositions(nodes: FlowNode[]) {
  const posMap = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    posMap.set(n.id, { x: n.position?.x ?? 0, y: n.position?.y ?? 0 });
  }

  const resolved = new Map<
    string,
    { absX: number; absY: number; width: number; height: number; node: FlowNode }
  >();

  for (const n of nodes) {
    let x = n.position?.x ?? 0;
    let y = n.position?.y ?? 0;
    if (n.parentId && posMap.has(n.parentId)) {
      const p = posMap.get(n.parentId)!;
      x += p.x;
      y += p.y;
    }
    const width = Number(n.data?.width) || 220;
    const height = Number(n.data?.height) || 90;
    resolved.set(n.id, { absX: x, absY: y, width, height, node: n });
  }

  return resolved;
}

/**
 * Calculates a smooth orthogonal 90-degree step path with rounded corners
 */
function getSmoothStepPathString(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r = 8
): { path: string; midX: number; midY: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Direct straight line if horizontally or vertically aligned
  if (Math.abs(y1 - y2) < 2) {
    return { path: `M ${x1},${y1} L ${x2},${y2}`, midX: mx, midY: my };
  }
  if (Math.abs(x1 - x2) < 2) {
    return { path: `M ${x1},${y1} L ${x2},${y2}`, midX: mx, midY: my };
  }

  const dirY = y2 > y1 ? 1 : -1;
  const dirX = x2 > x1 ? 1 : -1;
  const radius = Math.min(r, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);

  const path = [
    `M ${x1},${y1}`,
    `L ${mx - dirX * radius},${y1}`,
    `Q ${mx},${y1} ${mx},${y1 + dirY * radius}`,
    `L ${mx},${y2 - dirY * radius}`,
    `Q ${mx},${y2} ${mx + dirX * radius},${y2}`,
    `L ${x2},${y2}`,
  ].join(" ");

  return { path, midX: mx, midY: my };
}

/**
 * Calculates a smooth cubic bezier path
 */
function getBezierPathString(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { path: string; midX: number; midY: number } {
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
  const path = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  return { path, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2 };
}

/**
 * Generates SVG markup for a given node kind
 */
function renderNodeSvg(
  n: FlowNode,
  absX: number,
  absY: number,
  w: number,
  h: number,
  isDark: boolean
): string {
  const kind = n.type || "card";
  const accent = n.data?.accent || "neutral";
  const acc = ACCENT_COLORS[accent] || ACCENT_COLORS.neutral;
  const title = escapeHtml(String(n.data?.title || n.id));
  const subtitle = escapeHtml(String(n.data?.subtitle || ""));
  const icon = escapeHtml(String(n.data?.icon || ""));
  const metric = escapeHtml(String(n.data?.metric || ""));
  const health = n.data?.healthStatus as NodeHealthStatus | undefined;
  const healthCfg = health ? HEALTH_CONFIG[health] : null;

  let body = "";

  if (kind === "group") {
    const isDashed = n.data?.borderStyle === "dashed";
    const dashAttr = isDashed ? 'stroke-dasharray="8 6"' : "";
    const strokeColor = "#c00000";
    body = `
      <g class="node-element group-container" data-id="${n.id}">
        <rect x="0" y="0" width="${w}" height="${h}" rx="12"
          fill="${isDark ? "rgba(15,23,42,0.4)" : "rgba(241,245,249,0.7)"}"
          stroke="${strokeColor}" stroke-opacity="0.45" stroke-width="1.8" ${dashAttr} />
        <rect x="0" y="0" width="${w}" height="32" rx="12"
          fill="${isDark ? "#1b0b0e" : "#fee2e2"}" stroke="${strokeColor}" stroke-opacity="0.5" stroke-width="1" />
        <text x="14" y="21" font-size="11" font-weight="700" fill="${isDark ? "#fca5a5" : "#991b1b"}" letter-spacing="0.5">
          ${title}
        </text>
        ${subtitle ? `<text x="${w - 14}" y="21" text-anchor="end" font-size="10" fill="${isDark ? "#94a3b8" : "#64748b"}">${subtitle}</text>` : ""}
      </g>
    `;
  } else if (kind === "note") {
    const noteStyle = NOTE_STYLES[accent] || NOTE_STYLES.amber;
    body = `
      <g class="node-element note-node cursor-pointer" data-id="${n.id}">
        <foreignObject x="0" y="0" width="${w}" height="${h}" style="overflow: visible;">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            width: ${w}px;
            height: ${h}px;
            box-sizing: border-box;
            padding: 12px 14px;
            border-radius: 12px;
            background: ${noteStyle.bg};
            border: 1.5px solid ${noteStyle.border};
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          ">
            <div style="position: absolute; -top: 2px; left: 50%; transform: translateX(-50%); width: 56px; height: 12px; background: ${noteStyle.tape}; border-radius: 2px; border: 1px solid rgba(255,255,255,0.15);"></div>
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 6px; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: 12px; color: ${noteStyle.title}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>
              <span style="font-size: 11px; opacity: 0.8;">📌</span>
            </div>
            <div style="font-size: 11px; line-height: 1.45; color: ${noteStyle.body}; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; overflow-y: auto; flex: 1;">
              ${subtitle}
            </div>
          </div>
        </foreignObject>
      </g>
    `;
  } else if (kind === "decision") {
    body = `
      <g class="node-element decision-node cursor-pointer" data-id="${n.id}">
        <polygon points="${w / 2},5 ${w - 5},${h / 2} ${w / 2},${h - 5} 5,${h / 2}"
          fill="${isDark ? "#1a160d" : "#fffbeb"}"
          stroke="#f59e0b" stroke-width="2.5" />
        <foreignObject x="${w * 0.15}" y="${h * 0.15}" width="${w * 0.7}" height="${h * 0.7}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; word-break: break-word; overflow-wrap: break-word; font-weight: 700; font-size: 11.5px; color: ${isDark ? "#fef3c7" : "#78350f"}; line-height: 1.25; padding: 2px;">
            <div>${title}</div>
            ${subtitle ? `<div style="font-size: 9.5px; font-weight: 400; opacity: 0.85; margin-top: 2px;">${subtitle}</div>` : ""}
          </div>
        </foreignObject>
      </g>
    `;
  } else if (kind === "pill") {
    const rx = (h - 10) / 2;
    body = `
      <g class="node-element pill-node cursor-pointer" data-id="${n.id}">
        <rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="${rx}"
          fill="${isDark ? "#062e24" : "#ecfdf5"}"
          stroke="#10b981" stroke-width="2.2" />
        <foreignObject x="10" y="5" width="${w - 20}" height="${h - 10}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 700; font-size: 12px; color: ${isDark ? "#6ee7b7" : "#065f46"}; word-break: break-word;">
            ${title}
          </div>
        </foreignObject>
      </g>
    `;
  } else if (kind === "database") {
    const rx = (w - 14) / 2;
    const ry = Math.min(14, (h - 14) * 0.18);
    const top = 7 + ry;
    const bot = h - 7 - ry;
    body = `
      <g class="node-element database-node cursor-pointer" data-id="${n.id}">
        <path d="M 7,${top} L 7,${bot} A ${rx},${ry} 0 0 0 ${w - 7},${bot} L ${w - 7},${top}"
          fill="${isDark ? "#17182e" : "#eff6ff"}" stroke="#6366f1" stroke-width="2" />
        <ellipse cx="${w / 2}" cy="${top}" rx="${rx}" ry="${ry}"
          fill="${isDark ? "#23264c" : "#dbeafe"}" stroke="#6366f1" stroke-width="2" />
        <foreignObject x="12" y="${top + 4}" width="${w - 24}" height="${bot - top}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; word-break: break-word; overflow-wrap: break-word; font-weight: 700; font-size: 12px; color: ${isDark ? "#c7d2fe" : "#1e1b4b"}; line-height: 1.25;">
            <div>${title}</div>
            ${subtitle ? `<div style="font-size: 9.5px; font-weight: 400; opacity: 0.85; margin-top: 2px;">${subtitle}</div>` : ""}
          </div>
        </foreignObject>
      </g>
    `;
  } else {
    // Default: Card / Process Node with guaranteed word-wrapping so text NEVER extends outside block
    body = `
      <g class="node-element card-node cursor-pointer" data-id="${n.id}">
        <foreignObject x="0" y="0" width="${w}" height="${h}" style="overflow: visible;">
          <div xmlns="http://www.w3.org/1999/xhtml" class="card-box" style="
            width: ${w}px;
            height: ${h}px;
            box-sizing: border-box;
            padding: 10px 14px;
            border-radius: 12px;
            background: var(--card-bg);
            border: 1.6px solid var(--border-color);
            box-shadow: 0 4px 16px rgba(0,0,0,0.18);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          ">
            <!-- Accent stripe on top -->
            <div style="position: absolute; top: 0; left: 10px; right: 10px; height: 3.5px; background: ${acc.border}; border-radius: 2px;"></div>

            <!-- Header Row: Title, Icon & Health Badge -->
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-top: 2px;">
              <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
                ${icon ? `<span style="font-size: 18px; line-height: 1; flex-shrink: 0;">${icon}</span>` : ""}
                <div style="font-weight: 700; font-size: 12.5px; color: var(--text); line-height: 1.3; word-break: break-word;">
                  ${title}
                </div>
              </div>
              ${healthCfg ? `
                <div style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 9999px; background: ${healthCfg.bg}; flex-shrink: 0;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${healthCfg.dot}; display: inline-block;"></span>
                  <span style="font-size: 9.5px; font-weight: 700; color: ${healthCfg.color};">${healthCfg.label}</span>
                </div>
              ` : ""}
            </div>

            <!-- Subtitle with word-wrap: break-word so it NEVER overflows horizontally -->
            ${subtitle ? `
              <div style="font-size: 10.5px; line-height: 1.45; color: var(--text-muted); word-break: break-word; overflow-wrap: break-word; white-space: normal; margin-top: 6px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical;">
                ${subtitle}
              </div>
            ` : ""}

            <!-- Metric pill at bottom if present -->
            ${metric ? `
              <div style="margin-top: auto; padding-top: 4px;">
                <span style="font-family: monospace; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.3); color: #38bdf8;">
                  ${metric}
                </span>
              </div>
            ` : ""}
          </div>
        </foreignObject>
      </g>
    `;
  }

  return `
    <g class="canvas-node" id="node-${n.id}" transform="translate(${absX}, ${absY})" data-id="${n.id}">
      ${body}
    </g>
  `;
}

/**
 * Builds the complete standalone, 100% offline self-contained HTML file string
 */
export function exportInteractiveHtml(
  diagram: Diagram,
  options?: ExportHtmlOptions
): string {
  const isDark = options?.isDark ?? true;
  const canvasBg = options?.canvasColor ?? (isDark ? "#0a0d15" : "#f8fafc");
  const bounds = diagramBounds(diagram.nodes, 120);
  const resolved = resolveNodePositions(diagram.nodes);
  const tour = buildGuidedTour(diagram.nodes, diagram.edges);

  // Group nodes by type (groups at bottom, actionable nodes at top)
  const groupNodes: string[] = [];
  const standardNodes: string[] = [];

  for (const n of diagram.nodes) {
    const r = resolved.get(n.id);
    if (!r) continue;
    const svg = renderNodeSvg(n, r.absX, r.absY, r.width, r.height, isDark);
    if (n.type === "group") {
      groupNodes.push(svg);
    } else {
      standardNodes.push(svg);
    }
  }

  // Render edge paths and connectors
  const edgeSvgList: string[] = [];
  const edgeMetadataList: Array<{
    id: string;
    source: string;
    target: string;
    color: string;
    path: string;
  }> = [];

  for (const edge of diagram.edges) {
    const src = resolved.get(edge.source);
    const tgt = resolved.get(edge.target);
    if (!src || !tgt) continue;

    // Determine connection ports based on relative positions
    let sx = src.absX + src.width;
    let sy = src.absY + src.height / 2;
    let tx = tgt.absX;
    let ty = tgt.absY + tgt.height / 2;

    // Handle vertical connections
    if (Math.abs(src.absX - tgt.absX) < 40 && tgt.absY > src.absY + src.height) {
      sx = src.absX + src.width / 2;
      sy = src.absY + src.height;
      tx = tgt.absX + tgt.width / 2;
      ty = tgt.absY;
    } else if (tgt.absX < src.absX) {
      sx = src.absX;
      sy = src.absY + src.height / 2;
      tx = tgt.absX + tgt.width;
      ty = tgt.absY + tgt.height / 2;
    }

    const pathKind = edge.data?.path || "smoothstep";
    const { path, midX, midY } =
      pathKind === "bezier"
        ? getBezierPathString(sx, sy, tx, ty)
        : getSmoothStepPathString(sx, sy, tx, ty, 10);

    const color = edge.data?.color || "#38bdf8";
    const isDashed = edge.data?.lineStyle === "dashed";
    const dashAttr = isDashed ? 'stroke-dasharray="6 6"' : "";
    const strokeWidth = edge.data?.strokeWidth || 2;
    const label = edge.data?.label || (edge as any).label;

    edgeMetadataList.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      color,
      path,
    });

    edgeSvgList.push(`
      <g class="canvas-edge" id="edge-${edge.id}" data-id="${edge.id}" data-source="${edge.source}" data-target="${edge.target}">
        <!-- Transparent hit area for easy hover/selection -->
        <path d="${path}" fill="none" stroke="transparent" stroke-width="16" class="cursor-pointer edge-hit" />
        
        <!-- Visible connector path -->
        <path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" ${dashAttr}
          marker-end="url(#arrow-${edge.id})" class="edge-path" opacity="0.85" />
          
        <!-- Edge label pill if present -->
        ${
          label
            ? `
          <g transform="translate(${midX}, ${midY})" class="edge-label-group pointer-events-none">
            <rect x="-40" y="-10" width="80" height="20" rx="10"
              fill="${isDark ? "#0d111a" : "#ffffff"}"
              stroke="${color}" stroke-width="1.2" opacity="0.95" />
            <text x="0" y="3.5" text-anchor="middle" font-size="9.5" font-weight="700" fill="${isDark ? "#e2e8f0" : "#1e293b"}">
              ${escapeHtml(String(label))}
            </text>
          </g>
        `
            : ""
        }
      </g>
    `);
  }

  // Pre-generate dynamic arrow markers per edge color
  const markerDefs = edgeMetadataList
    .map(
      (e) => `
      <marker id="arrow-${e.id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="${e.color}" />
      </marker>
    `
    )
    .join("");

  // Clean JSON data for embedding with safe script tag escaping
  const embeddedData = JSON.stringify({
    name: diagram.name,
    canvasColor: canvasBg,
    bounds,
    tour: tour.map((t) => ({
      index: t.index,
      nodeId: t.node.id,
      title: t.node.data?.title || t.node.id,
      subtitle: t.node.data?.subtitle || "",
      kind: t.node.type,
      health: t.node.data?.healthStatus || "healthy",
      metric: t.node.data?.metric || "",
      branches: (diagram.edges || [])
        .filter((e) => e.source === t.node.id)
        .map((e) => ({
          targetId: e.target,
          label: e.data?.label || (e as any).label || "Next",
        })),
    })),
    nodes: diagram.nodes.map((n) => {
      const r = resolved.get(n.id);
      return {
        id: n.id,
        title: n.data?.title || n.id,
        subtitle: n.data?.subtitle || "",
        kind: n.type,
        health: n.data?.healthStatus || "healthy",
        metric: n.data?.metric || "",
        icon: n.data?.icon || "",
        x: r?.absX ?? n.position.x,
        y: r?.absY ?? n.position.y,
        width: r?.width ?? 200,
        height: r?.height ?? 90,
      };
    }),
    edges: edgeMetadataList,
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(diagram.name)} — Interactive Architecture & Flow Simulation</title>
  <style>
    :root {
      --bg: ${canvasBg};
      --header-bg: #0d111a;
      --card-bg: #101623;
      --border-color: #232c3d;
      --accent: #c00000;
      --accent-glow: rgba(192, 0, 0, 0.45);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    body.theme-light {
      --bg: #f8fafc;
      --header-bg: #ffffff;
      --card-bg: #ffffff;
      --border-color: #e2e8f0;
      --accent: #c00000;
      --accent-glow: rgba(192, 0, 0, 0.25);
      --text: #0f172a;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background-color: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      transition: background-color 0.25s ease;
    }

    /* TOP HEADER BAR */
    header {
      position: fixed; top: 0; left: 0; right: 0; height: 54px; z-index: 1000;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; background: var(--header-bg); border-bottom: 1px solid var(--border-color);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .brand-group { display: flex; align-items: center; gap: 12px; }
    .brand-logo {
      display: inline-flex; align-items: center; justify-content: center;
      background: #c00000; color: #ffffff; font-weight: 900; font-size: 13px;
      padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px;
    }
    .diagram-title { font-size: 13px; font-weight: 700; color: var(--text); max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stats-pill {
      font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 9999px;
      background: rgba(100,116,139,0.15); border: 1px solid var(--border-color); color: var(--text-muted);
    }

    .header-actions { display: flex; align-items: center; gap: 8px; }
    .search-box {
      position: relative; display: flex; align-items: center;
    }
    .search-input {
      background: rgba(100,116,139,0.12); border: 1px solid var(--border-color); border-radius: 8px;
      padding: 5px 10px 5px 28px; font-size: 11.5px; color: var(--text); width: 170px; outline: none;
      transition: all 0.2s;
    }
    .search-input:focus { width: 220px; border-color: #c00000; background: rgba(100,116,139,0.2); }
    .search-icon { position: absolute; left: 8px; font-size: 11px; opacity: 0.6; pointer-events: none; }

    .btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 11.5px;
      font-weight: 700; border-radius: 8px; border: 1px solid var(--border-color);
      background: var(--card-bg); color: var(--text); cursor: pointer; transition: all 0.15s ease;
    }
    .btn:hover { border-color: var(--accent); color: var(--accent); }
    .btn-primary { background: #c00000; color: #fff; border-color: #ff4040; box-shadow: 0 0 14px rgba(192,0,0,0.4); }
    .btn-primary:hover { background: #a00000; color: #fff; }
    .btn-active { background: #10b981 !important; color: #fff !important; border-color: #34d399 !important; }

    /* AUDIO WAVEFORM BARS */
    .audio-bars {
      display: inline-flex; align-items: flex-end; gap: 2px; height: 12px; margin-left: 2px;
    }
    .audio-bar {
      width: 2.5px; height: 100%; background: #ffffff; border-radius: 1px;
      animation: soundWave 0.7s ease-in-out infinite alternate;
    }
    .audio-bar:nth-child(1) { animation-delay: 0.1s; height: 35%; }
    .audio-bar:nth-child(2) { animation-delay: 0.3s; height: 80%; }
    .audio-bar:nth-child(3) { animation-delay: 0.05s; height: 100%; }
    .audio-bar:nth-child(4) { animation-delay: 0.25s; height: 50%; }
    @keyframes soundWave {
      0% { transform: scaleY(0.3); }
      100% { transform: scaleY(1); }
    }

    /* VIEWPORT CANVAS */
    #canvas-container {
      position: absolute; top: 54px; left: 0; right: 0; bottom: 0;
      overflow: hidden; cursor: grab; background-color: var(--bg);
    }
    #canvas-container.panning { cursor: grabbing; }
    svg#flow-svg { width: 100%; height: 100%; display: block; }

    /* NODE INTERACTIONS */
    .canvas-node { cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    .canvas-node:hover { filter: brightness(1.12); }
    .canvas-node.node-dimmed { opacity: 0.25; filter: grayscale(0.8); }
    .canvas-node.node-highlighted { opacity: 1 !important; filter: drop-shadow(0 0 16px var(--accent-glow)) !important; }

    /* SIMULATION ACTIVE RING */
    #active-glow-ring {
      pointer-events: none; fill: none; stroke: #c00000; stroke-width: 4px;
      filter: drop-shadow(0 0 12px #c00000); animation: pulseGlow 1.4s infinite ease-in-out;
      display: none;
    }
    @keyframes pulseGlow {
      0%, 100% { stroke-opacity: 0.9; stroke-width: 3.5px; }
      50% { stroke-opacity: 0.35; stroke-width: 6px; }
    }

    /* FLOATING CONTROLS */
    .zoom-toolbar {
      position: fixed; left: 20px; bottom: 24px; z-index: 500;
      display: flex; flex-direction: column; gap: 6px;
    }
    .zoom-btn {
      width: 34px; height: 34px; border-radius: 8px; background: var(--header-bg);
      border: 1px solid var(--border-color); color: var(--text); font-size: 15px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25); transition: all 0.15s;
    }
    .zoom-btn:hover { border-color: #c00000; color: #c00000; transform: translateY(-1px); }

    /* SIMULATION / GUIDED TOUR HUD DOCK */
    #sim-hud {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 800;
      width: min(640px, 92vw); background: var(--header-bg); border: 1.5px solid var(--accent);
      border-radius: 16px; padding: 14px 18px; box-shadow: 0 12px 36px rgba(0,0,0,0.5), 0 0 24px var(--accent-glow);
      display: none; flex-direction: column; gap: 10px; backdrop-blur: 12px;
    }
    .hud-header { display: flex; align-items: center; justify-content: space-between; }
    .step-pill {
      font-size: 10.5px; font-weight: 800; padding: 3px 9px; border-radius: 9999px;
      background: #c00000; color: #fff; letter-spacing: 0.5px;
    }
    .hud-title { font-size: 13.5px; font-weight: 700; color: var(--text); }
    .hud-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
    .hud-controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
    .hud-btns { display: flex; align-items: center; gap: 6px; }

    /* PROGRESS SCRUBBER */
    .scrubber-track {
      width: 100%; height: 5px; background: rgba(100,116,139,0.25); border-radius: 3px;
      cursor: pointer; position: relative; overflow: hidden;
    }
    .scrubber-fill { height: 100%; background: #c00000; width: 0%; transition: width 0.2s ease; }

    /* BRANCH SELECTION BUTTONS */
    .branch-container { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .branch-btn {
      font-size: 10.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px;
      background: rgba(14,165,233,0.15); border: 1px solid #0ea5e9; color: #38bdf8; cursor: pointer;
    }
    .branch-btn:hover { background: #0ea5e9; color: #fff; }

    /* SIDE INSPECTOR DRAWER */
    #side-drawer {
      position: fixed; top: 54px; right: -360px; width: 340px; bottom: 0; z-index: 900;
      background: var(--header-bg); border-left: 1px solid var(--border-color);
      box-shadow: -8px 0 28px rgba(0,0,0,0.4); padding: 20px; display: flex; flex-direction: column;
      gap: 16px; transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1); overflow-y: auto;
    }
    #side-drawer.open { right: 0; }
    .drawer-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
    .drawer-close { font-size: 18px; font-weight: bold; cursor: pointer; opacity: 0.6; }
    .drawer-close:hover { opacity: 1; color: #c00000; }
    .drawer-field { display: flex; flex-direction: column; gap: 4px; }
    .drawer-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; }
    .drawer-value { font-size: 12.5px; font-weight: 600; color: var(--text); }

    /* RADAR MINIMAP */
    #radar-box {
      position: fixed; right: 20px; bottom: 24px; z-index: 500;
      width: 180px; height: 110px; background: rgba(15,23,42,0.85); border: 1px solid var(--border-color);
      border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3); backdrop-blur: 8px;
    }
    #radar-viewport-rect { fill: rgba(192,0,0,0.25); stroke: #c00000; stroke-width: 1.5; }

    /* PRINT STYLES */
    @media print {
      header, .zoom-toolbar, #sim-hud, #side-drawer, #radar-box { display: none !important; }
      #canvas-container { top: 0 !important; }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <header>
    <div class="brand-group">
      <div class="brand-logo">WORXPERTISE</div>
      <div class="diagram-title" title="${escapeHtml(diagram.name)}">${escapeHtml(diagram.name)}</div>
      <div class="stats-pill">${diagram.nodes.length} Blocks • ${diagram.edges.length} Connectors</div>
    </div>

    <div class="header-actions">
      <!-- Search Input -->
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="search-input" placeholder="Find block (e.g. STT)..." />
      </div>

      <!-- Simulation Button -->
      <button class="btn btn-primary" id="btn-simulate" title="Interactive Step-by-Step Walkthrough">
        <span>▶</span> <span>Simulate</span>
      </button>

      <!-- Traffic Button -->
      <button class="btn" id="btn-traffic" title="Toggle Live Flowing Particles">
        <span>📡</span> <span>Traffic</span>
      </button>

      <!-- Telecom SFX Button -->
      <button class="btn btn-active" id="btn-sfx" title="Toggle Telecom & Architecture Sound Effects">
        <span id="sfx-icon">🔊</span> <span>SFX</span>
      </button>

      <!-- AI Voice Narration Button -->
      <button class="btn" id="btn-voice" title="Toggle AI Voice Bot Narration">
        <span id="voice-icon">🎙️</span> <span>Voice</span>
        <span class="audio-bars" id="voice-wave" style="display: none;">
          <span class="audio-bar"></span>
          <span class="audio-bar"></span>
          <span class="audio-bar"></span>
          <span class="audio-bar"></span>
        </span>
      </button>

      <!-- Theme Switcher -->
      <button class="btn" id="btn-theme" title="Toggle Dark / Light Mode">
        <span>🌓</span>
      </button>

      <!-- Fullscreen Button -->
      <button class="btn" id="btn-fullscreen" title="Fullscreen Mode">
        <span>⛶</span>
      </button>

      <!-- Print Button -->
      <button class="btn" id="btn-print" title="Print / Save PDF">
        <span>🖨️</span>
      </button>
    </div>
  </header>

  <!-- VIEWPORT CANVAS -->
  <div id="canvas-container">
    <svg id="flow-svg">
      <defs>
        <!-- Drop Shadow Filter for Cards -->
        <filter id="node-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35" />
        </filter>
        <!-- Arrowhead Markers -->
        ${markerDefs}
      </defs>

      <!-- Root Transformation Group for Pan & Zoom -->
      <g id="viewport-group" transform="matrix(1 0 0 1 0 0)">
        <!-- Layer 0: Group Container Nodes (Background) -->
        <g id="layer-groups">
          ${groupNodes.join("\n")}
        </g>

        <!-- Layer 1: Edge Connectors -->
        <g id="layer-edges">
          ${edgeSvgList.join("\n")}
        </g>

        <!-- Layer 2: Moving Traffic Particles -->
        <g id="layer-particles"></g>

        <!-- Layer 3: Standard Nodes (Cards, Decisions, Pills) -->
        <g id="layer-nodes">
          ${standardNodes.join("\n")}
        </g>

        <!-- Layer 4: Active Highlight / Simulation Halo -->
        <rect id="active-glow-ring" rx="14" ry="14" />
      </g>
    </svg>
  </div>

  <!-- FLOATING ZOOM TOOLBAR -->
  <div class="zoom-toolbar">
    <button class="zoom-btn" id="btn-zoom-in" title="Zoom In">+</button>
    <button class="zoom-btn" id="btn-zoom-out" title="Zoom Out">−</button>
    <button class="zoom-btn" id="btn-fit-view" title="Fit Entire Diagram to View">⊡</button>
    <button class="zoom-btn" id="btn-reset-zoom" title="Reset Zoom (1:1)" style="font-size: 11px;">1:1</button>
  </div>

  <!-- SIMULATION / GUIDED TOUR HUD DOCK -->
  <div id="sim-hud">
    <div class="hud-header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="step-pill" id="hud-step-pill">STEP 1 OF ${tour.length}</span>
        <span class="hud-title" id="hud-title">Title</span>
      </div>
      <button class="btn" id="btn-exit-sim" style="padding: 2px 8px; font-size: 10px;">✕ Close</button>
    </div>

    <div class="hud-desc" id="hud-desc">Description of the step</div>

    <!-- Scrubber Progress Bar -->
    <div class="scrubber-track" id="scrubber-track" title="Click to scrub steps">
      <div class="scrubber-fill" id="scrubber-fill"></div>
    </div>

    <!-- Branching Decisions (e.g. Yes / No) -->
    <div class="branch-container" id="branch-container" style="display: none;"></div>

    <div class="hud-controls">
      <div class="hud-btns">
        <button class="btn" id="btn-sim-prev">◀ Prev</button>
        <button class="btn" id="btn-sim-auto">▶ Auto</button>
        <button class="btn btn-primary" id="btn-sim-next">Next ▶</button>
      </div>
      <button class="btn" id="btn-sim-overview" style="font-size: 10.5px;">🔍 Overview</button>
    </div>
  </div>

  <!-- RADAR MINIMAP -->
  <div id="radar-box">
    <svg id="radar-svg" width="180" height="110" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}">
      <!-- Mini Node Blocks -->
      ${diagram.nodes
        .map((n) => {
          const r = resolved.get(n.id);
          if (!r) return "";
          const color = n.type === "decision" ? "#f59e0b" : n.type === "group" ? "rgba(100,116,139,0.3)" : "#38bdf8";
          return `<rect x="${r.absX}" y="${r.absY}" width="${r.width}" height="${r.height}" fill="${color}" opacity="0.6" rx="4" />`;
        })
        .join("")}
      <!-- Viewport Rectangle -->
      <rect id="radar-viewport-rect" x="0" y="0" width="100" height="100" />
    </svg>
  </div>

  <!-- NODE INSPECTOR SIDE DRAWER -->
  <div id="side-drawer">
    <div class="drawer-header">
      <div class="drawer-label" style="color: #c00000; font-weight: 800;">COMPONENT INSPECTOR</div>
      <div class="drawer-close" id="drawer-close">✕</div>
    </div>
    <div class="drawer-field">
      <div class="drawer-label">Title</div>
      <div class="drawer-value" id="drawer-title" style="font-size: 15px; color: #38bdf8;">-</div>
    </div>
    <div class="drawer-field">
      <div class="drawer-label">Kind / Type</div>
      <div class="drawer-value" id="drawer-kind">-</div>
    </div>
    <div class="drawer-field">
      <div class="drawer-label">Health & SLA Status</div>
      <div class="drawer-value" id="drawer-health">-</div>
    </div>
    <div class="drawer-field">
      <div class="drawer-label">Description / Subtitle</div>
      <div class="drawer-value" id="drawer-subtitle" style="font-weight: 400; color: var(--text-muted);">-</div>
    </div>
    <div class="drawer-field" style="margin-top: 12px;">
      <div class="drawer-label">Pipeline Connections</div>
      <div id="drawer-connections" style="font-size: 11.5px; color: var(--text-muted); line-height: 1.6;">-</div>
    </div>
  </div>

  <!-- EMBEDDED DIAGRAM DATA & CLIENT CONTROLLER SCRIPT -->
  <script>
    (function() {
      const DATA = ${embeddedData};
      const bounds = DATA.bounds;

      // Canvas state
      let scale = 1;
      let panX = 0;
      let panY = 0;
      let isPanning = false;
      let startX = 0;
      let startY = 0;

      // Simulation state
      let isSimulating = false;
      let currentStep = 0;
      let isAutoPlaying = false;
      let autoTimer = null;

      // Traffic state
      let isTrafficOn = false;
      let trafficAnimId = null;

      // Elements
      const container = document.getElementById("canvas-container");
      const vpGroup = document.getElementById("viewport-group");
      const activeRing = document.getElementById("active-glow-ring");
      const radarRect = document.getElementById("radar-viewport-rect");

      // HUD elements
      const simHud = document.getElementById("sim-hud");
      const hudPill = document.getElementById("hud-step-pill");
      const hudTitle = document.getElementById("hud-title");
      const hudDesc = document.getElementById("hud-desc");
      const scrubberFill = document.getElementById("scrubber-fill");
      const branchContainer = document.getElementById("branch-container");
      const btnAuto = document.getElementById("btn-sim-auto");

      // Drawer elements
      const sideDrawer = document.getElementById("side-drawer");

      // Map lookup
      const nodeMap = new Map();
      DATA.nodes.forEach(n => nodeMap.set(n.id, n));

      // 1. TRANSFORMATION & ZOOM ENGINE
      function applyTransform(durationMs = 0) {
        if (durationMs > 0) {
          vpGroup.style.transition = "transform " + durationMs + "ms cubic-bezier(0.16, 1, 0.3, 1)";
          setTimeout(() => { vpGroup.style.transition = "none"; }, durationMs + 50);
        } else {
          vpGroup.style.transition = "none";
        }
        vpGroup.setAttribute("transform", "matrix(" + scale + " 0 0 " + scale + " " + panX + " " + panY + ")");

        // Update Radar Minimap Box
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const vx = (-panX) / scale;
        const vy = (-panY) / scale;
        const vw = cw / scale;
        const vh = ch / scale;
        radarRect.setAttribute("x", vx);
        radarRect.setAttribute("y", vy);
        radarRect.setAttribute("width", vw);
        radarRect.setAttribute("height", vh);
      }

      function fitView(duration = 350) {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (!bounds || bounds.width <= 0) return;
        const sX = cw / bounds.width;
        const sY = ch / bounds.height;
        scale = Math.min(sX, sY, 1.0) * 0.92;
        panX = (cw - bounds.width * scale) / 2 - bounds.x * scale;
        panY = (ch - bounds.height * scale) / 2 - bounds.y * scale;
        applyTransform(duration);
      }

      function focusNode(nodeId, duration = 400) {
        const n = nodeMap.get(nodeId);
        if (!n) return;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        scale = Math.max(scale, 1.15);
        const nodeCenterX = n.x + n.width / 2;
        const nodeCenterY = n.y + n.height / 2;
        panX = cw / 2 - nodeCenterX * scale;
        panY = ch / 2 - nodeCenterY * scale;
        applyTransform(duration);

        // Highlight ring position
        activeRing.setAttribute("x", n.x - 6);
        activeRing.setAttribute("y", n.y - 6);
        activeRing.setAttribute("width", n.width + 12);
        activeRing.setAttribute("height", n.height + 12);
        activeRing.style.display = "block";
      }

      // Pointer / Mouse events for Panning
      container.addEventListener("mousedown", (e) => {
        if (e.target.closest(".canvas-node") || e.button !== 0) return;
        isPanning = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        container.classList.add("panning");
      });

      window.addEventListener("mousemove", (e) => {
        if (!isPanning) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        applyTransform(0);
      });

      window.addEventListener("mouseup", () => {
        isPanning = false;
        container.classList.remove("panning");
      });

      // Mouse Wheel Zoom
      container.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
        const newScale = Math.max(0.1, Math.min(3.5, scale * zoomFactor));
        const mouseX = e.clientX;
        const mouseY = e.clientY - 54;
        panX = mouseX - (mouseX - panX) * (newScale / scale);
        panY = mouseY - (mouseY - panY) * (newScale / scale);
        scale = newScale;
        applyTransform(0);
      }, { passive: false });

      // Zoom Buttons
      document.getElementById("btn-zoom-in").onclick = () => { scale = Math.min(3.5, scale * 1.25); applyTransform(200); };
      document.getElementById("btn-zoom-out").onclick = () => { scale = Math.max(0.1, scale * 0.8); applyTransform(200); };
      document.getElementById("btn-fit-view").onclick = () => fitView(350);
      document.getElementById("btn-reset-zoom").onclick = () => { scale = 1; fitView(300); };

      // 2. SIMULATION & GUIDED TOUR ENGINE
      function updateSimulationStep() {
        if (!DATA.tour || DATA.tour.length === 0) return;
        const step = DATA.tour[currentStep];
        if (!step) return;

        hudPill.textContent = "STEP " + (currentStep + 1) + " OF " + DATA.tour.length;
        hudTitle.textContent = step.title;
        hudDesc.textContent = step.subtitle || "Executing " + step.kind + " component in architecture flow.";

        const progressPercent = ((currentStep + 1) / DATA.tour.length) * 100;
        scrubberFill.style.width = progressPercent + "%";

        // Render Branch buttons if multiple outgoing paths exist
        branchContainer.innerHTML = "";
        if (step.branches && step.branches.length > 1) {
          branchContainer.style.display = "flex";
          step.branches.forEach(b => {
            const btn = document.createElement("button");
            btn.className = "branch-btn";
            btn.textContent = "Branch: " + b.label;
            btn.onclick = () => {
              const targetIdx = DATA.tour.findIndex(t => t.nodeId === b.targetId);
              if (targetIdx !== -1) {
                currentStep = targetIdx;
                updateSimulationStep();
              }
            };
            branchContainer.appendChild(btn);
          });
        } else {
          branchContainer.style.display = "none";
        }

        focusNode(step.nodeId, 450);
        playStepSound(step.title, step.kind);
        speakStep(step.title, step.subtitle);
      }

      function nextStep() {
        if (currentStep < DATA.tour.length - 1) {
          currentStep++;
        } else {
          currentStep = 0; // Loop back
        }
        updateSimulationStep();
      }

      function prevStep() {
        if (currentStep > 0) {
          currentStep--;
          updateSimulationStep();
        }
      }

      function toggleAuto() {
        isAutoPlaying = !isAutoPlaying;
        btnAuto.textContent = isAutoPlaying ? "⏸ Pause" : "▶ Auto";
        if (isAutoPlaying) {
          autoTimer = setInterval(nextStep, 2600);
        } else {
          clearInterval(autoTimer);
        }
      }

      function startSimulation() {
        isSimulating = true;
        simHud.style.display = "flex";
        document.getElementById("btn-simulate").classList.add("btn-active");
        currentStep = 0;
        updateSimulationStep();
      }

      function stopSimulation() {
        isSimulating = false;
        isAutoPlaying = false;
        clearInterval(autoTimer);
        btnAuto.textContent = "▶ Auto";
        stopAllAudio();
        simHud.style.display = "none";
        activeRing.style.display = "none";
        document.getElementById("btn-simulate").classList.remove("btn-active");
      }

      document.getElementById("btn-simulate").onclick = () => {
        if (isSimulating) stopSimulation(); else startSimulation();
      };
      document.getElementById("btn-exit-sim").onclick = stopSimulation;
      document.getElementById("btn-sim-next").onclick = nextStep;
      document.getElementById("btn-sim-prev").onclick = prevStep;
      document.getElementById("btn-sim-auto").onclick = toggleAuto;
      document.getElementById("btn-sim-overview").onclick = () => fitView(350);

      // Scrubber click navigation
      document.getElementById("scrubber-track").onclick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        currentStep = Math.min(DATA.tour.length - 1, Math.floor(ratio * DATA.tour.length));
        updateSimulationStep();
      };

      // 3. LIVE TRAFFIC PARTICLES ANIMATION
      const particlesGroup = document.getElementById("layer-particles");
      let particles = [];

      function initTraffic() {
        particlesGroup.innerHTML = "";
        particles = [];
        DATA.edges.forEach((edge, idx) => {
          const edgeEl = document.querySelector("#edge-" + edge.id + " .edge-path");
          if (!edgeEl || typeof edgeEl.getTotalLength !== "function") return;
          const len = edgeEl.getTotalLength();
          if (len <= 10) return;

          const pCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          pCircle.setAttribute("r", "4");
          pCircle.setAttribute("fill", edge.color || "#38bdf8");
          pCircle.setAttribute("filter", "drop-shadow(0 0 6px " + (edge.color || "#38bdf8") + ")");
          particlesGroup.appendChild(pCircle);

          particles.push({
            el: pCircle,
            pathEl: edgeEl,
            length: len,
            speed: (120 / (len + 100)) * (0.8 + (idx % 3) * 0.2),
            offset: (idx * 0.15) % 1.0,
          });
        });
      }

      function animateTraffic(time) {
        if (!isTrafficOn) return;
        const t = time * 0.0006;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const progress = (t * p.speed + p.offset) % 1.0;
          const pt = p.pathEl.getPointAtLength(progress * p.length);
          if (pt) {
            p.el.setAttribute("cx", pt.x);
            p.el.setAttribute("cy", pt.y);
          }
        }
        trafficAnimId = requestAnimationFrame(animateTraffic);
      }

      document.getElementById("btn-traffic").onclick = () => {
        isTrafficOn = !isTrafficOn;
        const btn = document.getElementById("btn-traffic");
        if (isTrafficOn) {
          btn.classList.add("btn-active");
          initTraffic();
          trafficAnimId = requestAnimationFrame(animateTraffic);
        } else {
          btn.classList.remove("btn-active");
          cancelAnimationFrame(trafficAnimId);
          particlesGroup.innerHTML = "";
        }
      };

      // 4. SPOTLIGHT SEARCH
      const searchInput = document.getElementById("search-input");
      searchInput.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
          document.querySelectorAll(".canvas-node").forEach(el => el.classList.remove("node-dimmed", "node-highlighted"));
          return;
        }

        let firstMatch = null;
        DATA.nodes.forEach(n => {
          const el = document.getElementById("node-" + n.id);
          if (!el) return;
          const match = n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q) || n.kind.toLowerCase().includes(q);
          if (match) {
            el.classList.remove("node-dimmed");
            el.classList.add("node-highlighted");
            if (!firstMatch) firstMatch = n;
          } else {
            el.classList.remove("node-highlighted");
            el.classList.add("node-dimmed");
          }
        });

        if (firstMatch) focusNode(firstMatch.id, 350);
      });

      // 5. NODE CLICK & SIDE INSPECTOR
      function openInspector(nodeId) {
        const n = nodeMap.get(nodeId);
        if (!n) return;
        document.getElementById("drawer-title").textContent = n.title;
        document.getElementById("drawer-kind").textContent = n.kind.toUpperCase();
        document.getElementById("drawer-health").textContent = (n.health || "HEALTHY").toUpperCase() + (n.metric ? " (" + n.metric + ")" : "");
        document.getElementById("drawer-subtitle").textContent = n.subtitle || "No additional description provided.";

        // Find incoming & outgoing edges
        const inEdges = DATA.edges.filter(e => e.target === nodeId);
        const outEdges = DATA.edges.filter(e => e.source === nodeId);

        let connHtml = "<div><b>Incoming:</b> " + (inEdges.length ? inEdges.map(e => {
          const src = nodeMap.get(e.source);
          return src ? src.title : e.source;
        }).join(", ") : "None (Entry Root)") + "</div>";

        connHtml += "<div style='margin-top: 6px;'><b>Outgoing:</b> " + (outEdges.length ? outEdges.map(e => {
          const tgt = nodeMap.get(e.target);
          return tgt ? tgt.title : e.target;
        }).join(", ") : "None (Exit Terminal)") + "</div>";

        document.getElementById("drawer-connections").innerHTML = connHtml;
        sideDrawer.classList.add("open");
      }

      document.querySelectorAll(".canvas-node").forEach(el => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = el.getAttribute("data-id");
          if (id) {
            focusNode(id, 300);
            openInspector(id);
            const n = nodeMap.get(id);
            if (n) playStepSound(n.title, n.kind);
          }
        });
      });

      document.getElementById("drawer-close").onclick = () => sideDrawer.classList.remove("open");

      // 6. THEME, FULLSCREEN & PRINT
      let isDarkTheme = ${isDark ? "true" : "false"};
      document.getElementById("btn-theme").onclick = () => {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle("theme-light", !isDarkTheme);
      };

      document.getElementById("btn-fullscreen").onclick = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      };

      document.getElementById("btn-print").onclick = () => window.print();

      // 7. WEB AUDIO API & AI VOICE BOT NARRATION
      let audioCtx = null;
      let sfxEnabled = true;
      let voiceEnabled = false;

      function getAudioContext() {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }
        return audioCtx;
      }

      function playTelecomRing() {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [440, 480].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.setValueAtTime(0.08, now + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.52);
        });
      }

      function playConnectChime() {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
          const t = now + i * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.3);
        });
      }

      function playAiProcessPulse() {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      }

      function playDecisionTap() {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(700, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }

      function playAgentHandoff() {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [880, 1174.66].forEach((freq, idx) => {
          const t = now + idx * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.38);
        });
      }

      function playStepSound(title, kind) {
        if (!sfxEnabled) return;
        const t = (title || "").toLowerCase();
        const k = (kind || "").toLowerCase();
        if (t.includes("initiat") || t.includes("call") || t.includes("dialer") || t.includes("asterisk")) {
          playTelecomRing();
        } else if (t.includes("sip") || t.includes("livekit") || t.includes("session") || t.includes("connect")) {
          playConnectChime();
        } else if (t.includes("stt") || t.includes("llm") || t.includes("tts") || t.includes("speech") || t.includes("transcription")) {
          playAiProcessPulse();
        } else if (k === "decision" || t.includes("decision") || t.includes("check") || t.includes("tool required")) {
          playDecisionTap();
        } else if (t.includes("human") || t.includes("agent") || t.includes("transfer") || t.includes("handoff")) {
          playAgentHandoff();
        } else {
          playConnectChime();
        }
      }

      function speakStep(title, subtitle) {
        if (!voiceEnabled || !window.speechSynthesis) return;
        try {
          window.speechSynthesis.cancel();
          const fullText = (title + ". " + (subtitle || "")).trim();
          if (!fullText) return;
          const utterance = new SpeechSynthesisUtterance(fullText);
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          const waveEl = document.getElementById("voice-wave");
          utterance.onstart = () => { if (waveEl) waveEl.style.display = "inline-flex"; };
          utterance.onend = () => { if (waveEl) waveEl.style.display = "none"; };
          utterance.onerror = () => { if (waveEl) waveEl.style.display = "none"; };
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }

      function stopAllAudio() {
        if (window.speechSynthesis) {
          try { window.speechSynthesis.cancel(); } catch (e) {}
        }
        const waveEl = document.getElementById("voice-wave");
        if (waveEl) waveEl.style.display = "none";
      }

      document.getElementById("btn-sfx").onclick = () => {
        sfxEnabled = !sfxEnabled;
        const btn = document.getElementById("btn-sfx");
        const icon = document.getElementById("sfx-icon");
        btn.classList.toggle("btn-active", sfxEnabled);
        icon.textContent = sfxEnabled ? "🔊" : "🔇";
        if (sfxEnabled) playConnectChime();
      };

      document.getElementById("btn-voice").onclick = () => {
        voiceEnabled = !voiceEnabled;
        const btn = document.getElementById("btn-voice");
        btn.classList.toggle("btn-active", voiceEnabled);
        if (!voiceEnabled) {
          stopAllAudio();
        } else {
          speakStep("Voice narration enabled", "Worxpertise AI Voice Bot platform");
        }
      };

      // Keyboard navigation
      window.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT") return;
        if (e.key === "ArrowRight") nextStep();
        if (e.key === "ArrowLeft") prevStep();
        if (e.key === " ") { e.preventDefault(); toggleAuto(); }
        if (e.key === "Escape") { stopSimulation(); sideDrawer.classList.remove("open"); }
        if (e.key === "f" || e.key === "F") document.getElementById("btn-fullscreen").click();
      });

      // Initial framing
      setTimeout(() => fitView(0), 50);
    })();
  </script>
</body>
</html>`;
}

/**
 * Downloads the diagram as a standalone offline interactive HTML file
 */
export function downloadInteractiveHtml(
  diagram: Diagram,
  options?: ExportHtmlOptions
): void {
  const html = exportInteractiveHtml(diagram, options);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = sanitizeFilename(diagram.name, "architecture_diagram");
  a.href = url;
  a.download = `${safeName}_interactive.html`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
