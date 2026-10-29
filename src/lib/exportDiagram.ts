import { toPng, toSvg } from "html-to-image";
import jsPDF from "jspdf";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { Diagram, FlowNode, FlowEdge } from "../types";

export function diagramToJson(d: Diagram): string {
  return JSON.stringify(d, null, 2);
}

export function diagramFromJson(text: string): Diagram {
  const obj = JSON.parse(text);
  if (
    !obj || typeof obj.id !== "string" || typeof obj.name !== "string" ||
    !Array.isArray(obj.nodes) || !Array.isArray(obj.edges)
  ) {
    throw new Error("Invalid diagram file");
  }
  return obj as Diagram;
}

// React Flow UI chrome that should not appear in an exported image.
const EXPORT_EXCLUDE = [
  "react-flow__controls",
  "react-flow__panel",
  "react-flow__attribution",
  "react-flow__minimap",
  "node-delete-btn",
];

/** html-to-image filter: drop the editor chrome so exports show only the diagram. */
export function exportFilter(node: HTMLElement): boolean {
  const cl = node.classList;
  if (!cl) return true;
  return !EXPORT_EXCLUDE.some((c) => cl.contains(c));
}

export interface Bounds { x: number; y: number; width: number; height: number; }

/** Bounding box (in flow coordinates) that encloses every node, plus padding.
 *  Used so exports capture the whole diagram, not just the on-screen viewport. */
export function diagramBounds(
  nodes: { position: { x: number; y: number }; data: { width?: number; height?: number } }[],
  pad = 100,
): Bounds {
  if (!nodes.length) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const w = n.data.width ?? 0, h = n.data.height ?? 0;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }
  return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}

export interface ExportImageOptions {
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Render the entire diagram to an image. Pass the `.react-flow__viewport`
 * element and the flow-coordinate bounds of all nodes; the viewport is
 * re-transformed to frame the full diagram at 1:1 so nothing is clipped by
 * the on-screen pan/zoom.
 */
export async function exportImage(
  viewport: HTMLElement,
  format: "png" | "svg",
  bounds: Bounds,
  filterFn: (node: HTMLElement) => boolean = exportFilter,
  options?: ExportImageOptions,
): Promise<string> {
  const width = Math.ceil(bounds.width) || viewport.clientWidth;
  const height = Math.ceil(bounds.height) || viewport.clientHeight;
  const bg = options?.backgroundColor === "transparent" ? undefined : (options?.backgroundColor ?? "#0a0e1a");
  const opts = {
    backgroundColor: bg,
    pixelRatio: options?.pixelRatio ?? 2,
    filter: filterFn,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${-bounds.x}px, ${-bounds.y}px) scale(1)`,
      transformOrigin: "top left",
    },
  };
  return format === "png" ? toPng(viewport, opts) : toSvg(viewport, opts);
}

export interface PosterOptions {
  scale?: number; // 1 = Standard (1x), 2 = High-Res (2x), 3 = Ultra HD (3x), 4 = 4K Poster (4x)
  backgroundColor?: string;
  format?: "png" | "svg";
  includeHeader?: boolean;
}

/**
 * Render a high-res poster with optional branded header banner containing diagram title,
 * timestamp, and component statistics.
 */
export async function exportPoster(
  viewport: HTMLElement,
  bounds: Bounds,
  diagram: Diagram,
  options?: PosterOptions,
): Promise<string> {
  const scale = options?.scale ?? 2;
  const format = options?.format ?? "png";
  const bg = options?.backgroundColor ?? "#0a0e1a";
  const includeHeader = options?.includeHeader ?? false;

  const baseDataUrl = await exportImage(viewport, format, bounds, exportFilter, {
    pixelRatio: scale,
    backgroundColor: bg,
  });

  if (!includeHeader || format !== "png") {
    return baseDataUrl;
  }

  // Composite header onto canvas
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const headerH = Math.max(90, Math.round(100 * (scale / 2)));

      const canvas = document.createElement("canvas");
      canvas.width = origW;
      canvas.height = origH + headerH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(baseDataUrl);
        return;
      }

      // Fill background
      if (bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw header banner
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(0, 0, canvas.width, headerH);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.lineWidth = Math.max(1, Math.round(scale));
      ctx.beginPath();
      ctx.moveTo(0, headerH);
      ctx.lineTo(canvas.width, headerH);
      ctx.stroke();

      // Title
      const titleSize = Math.max(16, Math.round(24 * (scale / 2)));
      ctx.font = `bold ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(diagram.name || "Flowchart Diagram", 24 * (scale / 2), headerH * 0.45);

      // Subtitle & Metrics
      const subSize = Math.max(11, Math.round(13 * (scale / 2)));
      ctx.font = `${subSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "#94a3b8";
      const dateStr = new Date(diagram.updatedAt || Date.now()).toLocaleDateString();
      const meta = `${diagram.nodes.length} Components  •  ${diagram.edges.length} Pipelines  •  Generated by FlowBuilder DevOps  •  ${dateStr}`;
      ctx.fillText(meta, 24 * (scale / 2), headerH * 0.78);

      // Draw diagram snapshot below header
      ctx.drawImage(img, 0, headerH);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = baseDataUrl;
  });
}

/** Convert a data: URL (base64 or URL-encoded) into a Blob, preserving its MIME type. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  const mime = header.match(/data:([^;,]+)/)?.[1] ?? "application/octet-stream";
  if (header.includes(";base64")) {
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(body)], { type: mime });
}

/**
 * Download a data: URL with the given filename. Routes through a Blob object URL
 * and a DOM-attached anchor so the filename (including its extension) is honored
 * reliably across browsers — a detached anchor on a data: URL is not.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export interface ExportPdfOptions {
  multiPage?: boolean;
  orientation?: "landscape" | "portrait";
}

/**
 * Export the diagram as a formatted landscape PDF document.
 * Supports Single-Page Architecture Poster OR Multi-Page Executive Architecture Report.
 */
export async function exportPdf(
  viewport: HTMLElement,
  bounds: Bounds,
  diagram: Diagram,
  options?: ExportPdfOptions,
): Promise<void> {
  const isMultiPage = options?.multiPage ?? false;
  const imgData = await exportImage(viewport, "png", bounds, exportFilter, { pixelRatio: 2 });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;
  const totalPages = isMultiPage ? 3 : 1;

  // -------------------------------------------------------------
  // PAGE 1: Architecture Overview & High-Res Diagram Poster
  // -------------------------------------------------------------
  pdf.setFillColor(10, 14, 26);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(56, 189, 248);
  pdf.text(diagram.name || "Flowchart Diagram", margin, 18);

  // Subtitle & metadata
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(156, 163, 175);
  const dateStr = new Date(diagram.updatedAt || Date.now()).toLocaleString();
  pdf.text(
    `Executive Architecture Blueprint  •  ${diagram.nodes.length} Components  •  ${diagram.edges.length} Connectors  •  ${dateStr}`,
    margin,
    24,
  );

  // Scale diagram image to fit cleanly
  const maxImgW = pageWidth - margin * 2;
  const maxImgH = pageHeight - 34 - margin - 8;
  const bW = bounds.width || 1;
  const bH = bounds.height || 1;
  const imgAspect = bW / bH;
  const targetAspect = maxImgW / maxImgH;

  let renderW = maxImgW;
  let renderH = maxImgH;

  if (imgAspect > targetAspect) {
    renderH = maxImgW / imgAspect;
  } else {
    renderW = maxImgH * imgAspect;
  }

  const posX = margin + (maxImgW - renderW) / 2;
  const posY = 30 + (maxImgH - renderH) / 2;

  // Diagram Frame Border
  pdf.setDrawColor(30, 41, 59);
  pdf.setLineWidth(0.5);
  pdf.rect(posX - 1, posY - 1, renderW + 2, renderH + 2);

  pdf.addImage(imgData, "PNG", posX, posY, renderW, renderH, undefined, "FAST");

  // Page 1 Footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Page 1 of ${totalPages}  •  System Architecture Overview  •  FlowBuilder DevOps Suite`,
    margin,
    pageHeight - 6,
  );

  if (isMultiPage) {
    // -------------------------------------------------------------
    // PAGE 2: Component Inventory & Microservices Catalog
    // -------------------------------------------------------------
    pdf.addPage("a4", "landscape");
    pdf.setFillColor(10, 14, 26);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(56, 189, 248);
    pdf.text("Component Inventory & Microservices Catalog", margin, 18);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      "Runtime parameters, health badges, throughput metrics, and role specifications for all system nodes",
      margin,
      24,
    );

    // Table Header
    const colX = [margin, margin + 12, margin + 74, margin + 110, margin + 148, margin + 192];
    let curY = 32;

    pdf.setFillColor(20, 27, 45);
    pdf.rect(margin, curY, pageWidth - margin * 2, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(248, 250, 252);
    pdf.text("#", colX[0] + 2, curY + 5.5);
    pdf.text("Component Name", colX[1], curY + 5.5);
    pdf.text("Type / Kind", colX[2], curY + 5.5);
    pdf.text("Health Status", colX[3], curY + 5.5);
    pdf.text("Live Metrics", colX[4], curY + 5.5);
    pdf.text("Description / Role", colX[5], curY + 5.5);

    curY += 8;

    // Table Rows
    const nodes = diagram.nodes as FlowNode[];
    nodes.forEach((node, idx) => {
      if (curY > pageHeight - 20) return; // limit to fit single catalog page cleanly

      pdf.setFillColor(idx % 2 === 0 ? 13 : 18, idx % 2 === 0 ? 18 : 24, idx % 2 === 0 ? 32 : 40);
      pdf.rect(margin, curY, pageWidth - margin * 2, 8, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(String(idx + 1), colX[0] + 2, curY + 5);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(241, 245, 249);
      const name = String((node.data as any)?.title || (node.data as any)?.label || node.id).slice(0, 30);
      pdf.text(name, colX[1], curY + 5);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(56, 189, 248);
      pdf.text(String(node.type || "node").toUpperCase(), colX[2], curY + 5);

      // Status with color
      const health = String((node.data as any)?.healthStatus || (node.data as any)?.health || "healthy");
      if (health === "healthy") {
        pdf.setTextColor(16, 185, 129); // green
      } else if (health === "warning" || health === "degraded") {
        pdf.setTextColor(245, 158, 11); // amber
      } else {
        pdf.setTextColor(244, 63, 94); // red
      }
      pdf.text(health.toUpperCase(), colX[3], curY + 5);

      pdf.setTextColor(203, 213, 225);
      const metric = String((node.data as any)?.metric || "Live Normal");
      pdf.text(metric.slice(0, 20), colX[4], curY + 5);

      pdf.setTextColor(148, 163, 184);
      const desc = String((node.data as any)?.subtitle || (node.data as any)?.description || "-").slice(0, 42);
      pdf.text(desc, colX[5], curY + 5);

      curY += 8;
    });

    // Page 2 Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Page 2 of ${totalPages}  •  Component Catalog & Node Inventory  •  FlowBuilder DevOps Suite`,
      margin,
      pageHeight - 6,
    );

    // -------------------------------------------------------------
    // PAGE 3: Pipeline Flow & Dependency Matrix
    // -------------------------------------------------------------
    pdf.addPage("a4", "landscape");
    pdf.setFillColor(10, 14, 26);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(56, 189, 248);
    pdf.text("Pipeline Flow & Dependency Matrix", margin, 18);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      "Inter-service connector topology, packet animation styles, flow velocities, and routing channels",
      margin,
      24,
    );

    // Flow Table Header
    const flowColX = [margin, margin + 12, margin + 74, margin + 136, margin + 188, margin + 232];
    let flowY = 32;

    pdf.setFillColor(20, 27, 45);
    pdf.rect(margin, flowY, pageWidth - margin * 2, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(248, 250, 252);
    pdf.text("#", flowColX[0] + 2, flowY + 5.5);
    pdf.text("Source Service", flowColX[1], flowY + 5.5);
    pdf.text("Target Service", flowColX[2], flowY + 5.5);
    pdf.text("Protocol / Route", flowColX[3], flowY + 5.5);
    pdf.text("Flow Animation", flowColX[4], flowY + 5.5);
    pdf.text("Beam Color", flowColX[5], flowY + 5.5);

    flowY += 8;

    const edges = diagram.edges as FlowEdge[];
    const nodeMap = new Map<string, string>();
    diagram.nodes.forEach((n) => {
      const lbl = String((n.data as any)?.title || (n.data as any)?.label || n.id);
      nodeMap.set(n.id, lbl);
    });

    edges.forEach((edge, idx) => {
      if (flowY > pageHeight - 32) return;

      pdf.setFillColor(idx % 2 === 0 ? 13 : 18, idx % 2 === 0 ? 18 : 24, idx % 2 === 0 ? 32 : 40);
      pdf.rect(margin, flowY, pageWidth - margin * 2, 8, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(String(idx + 1), flowColX[0] + 2, flowY + 5);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(241, 245, 249);
      const srcName = String(nodeMap.get(edge.source) || edge.source).slice(0, 28);
      pdf.text(srcName, flowColX[1], flowY + 5);

      const tgtName = String(nodeMap.get(edge.target) || edge.target).slice(0, 28);
      pdf.text(tgtName, flowColX[2], flowY + 5);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(203, 213, 225);
      const route = String((edge as any).label || (edge.data as any)?.label || "Direct Link").slice(0, 24);
      pdf.text(route, flowColX[3], flowY + 5);

      pdf.setTextColor(56, 189, 248);
      const anim = String(edge.data?.animation || "dots");
      const spd = (edge.data as any)?.speed ?? 1;
      pdf.text(`${anim.toUpperCase()} (${spd}x)`, flowColX[4], flowY + 5);

      pdf.setTextColor(148, 163, 184);
      pdf.text(edge.data?.color || "#38bdf8", flowColX[5], flowY + 5);

      flowY += 8;
    });

    // KPI Summary Panel
    const kpiY = pageHeight - 24;
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, kpiY, pageWidth - margin * 2, 12, "F");
    pdf.setDrawColor(30, 41, 59);
    pdf.rect(margin, kpiY, pageWidth - margin * 2, 12);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(56, 189, 248);
    const activeAnimCount = edges.filter((e) => e.data?.animation && e.data.animation !== "none").length;
    pdf.text(
      `TOTAL PIPELINES: ${edges.length}    •    ACTIVE ANIMATED FLOWS: ${activeAnimCount}    •    FAILOVER CHANNELS: 100% OPERATIONAL`,
      margin + 6,
      kpiY + 7.5,
    );

    // Page 3 Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Page 3 of ${totalPages}  •  Pipeline Flow & Dependency Matrix  •  FlowBuilder DevOps Suite`,
      margin,
      pageHeight - 6,
    );
  }

  pdf.save(`${diagram.name || "flowchart"}.pdf`);
}

/**
 * Safely get the total length of an SVGPathElement (graceful fallback in test/jsdom environments).
 */
function getPathLengthSafe(pathEl: SVGPathElement): number {
  if (typeof pathEl.getTotalLength === "function") {
    try {
      const len = pathEl.getTotalLength();
      if (typeof len === "number" && !isNaN(len)) return len;
    } catch {}
  }
  return 0;
}

/**
 * Safely get a point along an SVGPathElement at a given length.
 */
function getPointAtLengthSafe(
  pathEl: SVGPathElement,
  len: number,
): { x: number; y: number } | null {
  if (typeof pathEl.getPointAtLength === "function") {
    try {
      return pathEl.getPointAtLength(len);
    } catch {}
  }
  return null;
}

/**
 * Capture an animated sequence of frames with rendered flowing glowing particles along connector lines.
 */
export async function exportGif(
  viewport: HTMLElement,
  bounds: Bounds,
  diagram: Diagram,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const frameCount = 16;
  const frameDelay = 75; // 75ms per frame (~13.3 fps)
  const gif = GIFEncoder();

  const origW = Math.ceil(bounds.width) || viewport.clientWidth || 800;
  const origH = Math.ceil(bounds.height) || viewport.clientHeight || 600;

  // Max dimension 850 for high resolution yet fast GIF encoding
  const scale = Math.min(1, 850 / Math.max(origW, origH));
  const width = Math.max(100, Math.round(origW * scale));
  const height = Math.max(100, Math.round(origH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context unavailable");

  // Step 1: Capture base diagram image (excluding static/frozen SVG motion dots)
  onProgress?.(15);
  const gifBaseFilter = (node: HTMLElement) => {
    if (!exportFilter(node)) return false;
    const cl = node.classList;
    if (cl && cl.contains("gif-exclude")) return false;
    return true;
  };

  const baseDataUrl = await exportImage(viewport, "png", bounds, gifBaseFilter);
  const baseImg = new Image();
  await new Promise<void>((resolve, reject) => {
    baseImg.onload = () => resolve();
    baseImg.onerror = reject;
    baseImg.src = baseDataUrl;
  });

  // Step 2: Extract active edge paths from the DOM
  interface EdgePathInfo {
    element: SVGPathElement;
    length: number;
    color: string;
    particleCount: number;
  }

  const edgePaths: EdgePathInfo[] = [];
  const pathElements = viewport.querySelectorAll<SVGPathElement>("path.react-flow__edge-path");

  pathElements.forEach((pathEl) => {
    const len = getPathLengthSafe(pathEl);
    if (len > 5) {
      // Find matching edge color from diagram data or stroke attribute
      const matchingEdge = diagram.edges.find((e) => e.id === pathEl.id);
      const color =
        matchingEdge?.data?.color ||
        pathEl.getAttribute("stroke") ||
        "#38bdf8";

      // Longer lines get 2 particles, shorter lines get 1
      const particleCount = len > 100 ? 2 : 1;
      edgePaths.push({
        element: pathEl,
        length: len,
        color,
        particleCount,
      });
    }
  });

  // Step 3: Render each animation frame with glowing flowing particles
  for (let f = 0; f < frameCount; f++) {
    onProgress?.(25 + Math.round(((f + 1) / frameCount) * 65));

    // Draw base diagram snapshot
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(baseImg, 0, 0, width, height);

    // Global normalized time for this frame (0.0 to 1.0)
    const t = f / frameCount;

    // Render moving neon particles along each edge path
    for (const ep of edgePaths) {
      for (let pIdx = 0; pIdx < ep.particleCount; pIdx++) {
        const offset = pIdx / ep.particleCount;
        const progress = (t + offset) % 1.0;
        const targetLen = progress * ep.length;

        const pt = getPointAtLengthSafe(ep.element, targetLen);
        if (pt) {
          // Map from flow coordinates to scaled canvas coordinates
          const cx = (pt.x - bounds.x) * scale;
          const cy = (pt.y - bounds.y) * scale;

          ctx.save();
          // Outer vibrant neon glow
          ctx.shadowColor = ep.color;
          ctx.shadowBlur = 10 * scale;
          ctx.fillStyle = ep.color;
          ctx.beginPath();
          ctx.arc(cx, cy, 4.5 * scale, 0, Math.PI * 2);
          ctx.fill();

          // Inner bright core
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(cx, cy, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Quantize colors and write frame to GIF encoder
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: frameDelay });
  }

  // Step 4: Finish encoding and trigger instant download
  onProgress?.(95);
  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes], { type: "image/gif" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${diagram.name || "flowchart"}.gif`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  onProgress?.(100);
}
