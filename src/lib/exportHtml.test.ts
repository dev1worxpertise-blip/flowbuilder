import { describe, it, expect, vi } from "vitest";
import { exportInteractiveHtml, downloadInteractiveHtml } from "./exportHtml";
import { createEmptyDiagram, type FlowNode } from "../types";
import { buildHdlTemplate } from "../templates/hdl";

describe("exportInteractiveHtml", () => {
  it("generates a valid standalone HTML document with DOCTYPE", () => {
    const diagram = createEmptyDiagram("Test Workflow");
    const html = exportInteractiveHtml(diagram);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html lang=\"en\">");
    expect(html).toContain("<title>Test Workflow — Interactive Architecture & Flow Simulation</title>");
    expect(html).toContain("WORXPERTISE");
    expect(html).toContain("id=\"canvas-container\"");
    expect(html).toContain("id=\"sim-hud\"");
    expect(html).toContain("id=\"side-drawer\"");
    expect(html).toContain("id=\"radar-box\"");
  });

  it("safely escapes special characters in diagram name and node content", () => {
    const diagram = createEmptyDiagram("Architecture <Special> & 'Quotes' | Test");
    const node: FlowNode = {
      id: "node_1",
      type: "card",
      position: { x: 10, y: 10 },
      data: {
        title: "Malicious <script>alert(1)</script>",
        subtitle: "Check & verify \"safe\" output",
        accent: "crimson",
        width: 200,
        height: 90,
        glow: true,
      },
    };
    diagram.nodes.push(node);

    const html = exportInteractiveHtml(diagram);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Architecture &lt;Special&gt; &amp; &#039;Quotes&#039; | Test");
  });

  it("correctly embeds nodes and edges from architecture templates", () => {
    const hdlDiagram = buildHdlTemplate();
    const html = exportInteractiveHtml(hdlDiagram);

    // Verifies all blocks are rendered in SVG layers and embedded JSON
    expect(html).toContain(`${hdlDiagram.nodes.length} Blocks • ${hdlDiagram.edges.length} Connectors`);
    expect(html).toContain("layer-nodes");
    expect(html).toContain("layer-edges");
    expect(html).toContain("layer-particles");

    // Key blocks exist
    expect(html).toContain("3A. High-Priority Route");
    expect(html).toContain("4B. Standard CRM Route");

    // Interactive script embedded
    expect(html).toContain("function focusNode(nodeId");
    expect(html).toContain("function startSimulation()");
    expect(html).toContain("function animateTraffic(");
  });

  it("handles empty diagrams gracefully without crashing", () => {
    const emptyDiagram = createEmptyDiagram("Empty");
    const html = exportInteractiveHtml(emptyDiagram);

    expect(html).toBeDefined();
    expect(html).toContain("0 Blocks • 0 Connectors");
  });

  it("downloadInteractiveHtml triggers anchor click with sanitized filename", () => {
    const diagram = createEmptyDiagram("Worxpertise | Voice Platform");
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });

    const captured: { download: string; inDom: boolean }[] = [];
    const realCreate = document.createElement.bind(document);
    const spy = vi.spyOn(document, "createElement").mockImplementation((tag: any) => {
      const el = realCreate(tag) as HTMLElement;
      if (tag === "a") {
        (el as HTMLAnchorElement).click = () =>
          captured.push({ download: (el as HTMLAnchorElement).download, inDom: document.body.contains(el) });
      }
      return el;
    });

    downloadInteractiveHtml(diagram);

    expect(captured).toHaveLength(1);
    expect(captured[0].download).toBe("Worxpertise - Voice Platform_interactive.html");
    expect(captured[0].inDom).toBe(true);

    spy.mockRestore();
    vi.unstubAllGlobals();
  });
});
