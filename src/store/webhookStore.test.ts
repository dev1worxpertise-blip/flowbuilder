import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWebhookStore, generateCurlSnippet, getWebhookEndpointUrl } from "./webhookStore";
import { useEditorStore } from "./editorStore";
import { createEmptyDiagram } from "../types";

describe("useWebhookStore", () => {
  beforeEach(() => {
    useWebhookStore.setState({
      isConnected: false,
      activeDiagramId: null,
      events: [],
      isNocDrawerOpen: false,
      selectedNodeIdForHistory: null,
    });
    useEditorStore.getState().loadDiagram(createEmptyDiagram("Test Diagram"));
  });

  it("should have correct initial state", () => {
    const state = useWebhookStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.activeDiagramId).toBeNull();
    expect(state.events).toEqual([]);
    expect(state.isNocDrawerOpen).toBe(false);
  });

  it("should generate correct cURL snippets", () => {
    const curl = generateCurlSnippet("diag_123", "node_abc", "down");
    expect(curl).toContain("curl -X POST");
    expect(curl).toContain("/api/webhooks/nodes/diag_123/node_abc");
    expect(curl).toContain('"status":"down"');
    expect(curl).toContain("502 Bad Gateway");
  });

  it("should generate correct webhook endpoint URL", () => {
    const url = getWebhookEndpointUrl("diag_test", "node_99");
    expect(url).toBe("http://localhost:5055/api/webhooks/nodes/diag_test/node_99");
  });

  it("should calculate getNocSummary accurately across all node statuses", () => {
    const editor = useEditorStore.getState();
    // Add 3 nodes with different health statuses
    const n1 = editor.addNode("card", { x: 0, y: 0 });
    const n2 = editor.addNode("card", { x: 100, y: 0 });
    const n3 = editor.addNode("card", { x: 200, y: 0 });

    editor.updateNodeData(n1.id, { healthStatus: "healthy", metric: "14ms" });
    editor.updateNodeData(n2.id, { healthStatus: "warning", metric: "650ms" });
    editor.updateNodeData(n3.id, { healthStatus: "down", metric: "500 Error" });

    const summary = useWebhookStore.getState().getNocSummary();
    expect(summary.healthy).toBe(1);
    expect(summary.warning).toBe(1);
    expect(summary.down).toBe(1);
    expect(summary.total).toBe(3);
  });

  it("should toggle NOC drawer state", () => {
    const { setNocDrawerOpen } = useWebhookStore.getState();
    setNocDrawerOpen(true);
    expect(useWebhookStore.getState().isNocDrawerOpen).toBe(true);
    setNocDrawerOpen(false);
    expect(useWebhookStore.getState().isNocDrawerOpen).toBe(false);
  });

  it("should handle triggerWebhook fallback when offline", async () => {
    const editor = useEditorStore.getState();
    const node = editor.addNode("card", { x: 0, y: 0 });

    // Mock fetch to simulate failure and verify graceful fallback
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    const result = await useWebhookStore.getState().triggerWebhook(
      "diag_local",
      node.id,
      "down",
      "504 Timeout",
      "Offline fallback test"
    );

    expect(result).toBe(false);
    // Node in editor store should still be updated locally
    const updated = useEditorStore.getState().diagram?.nodes.find((n) => n.id === node.id);
    expect(updated?.data.healthStatus).toBe("down");
    expect(updated?.data.metric).toBe("504 Timeout");

    global.fetch = originalFetch;
  });

  it("should clear events", () => {
    useWebhookStore.setState({
      events: [
        {
          id: "evt_1",
          diagramId: "d1",
          nodeId: "n1",
          status: "healthy",
          metric: "12ms",
          message: "OK",
          timestamp: new Date().toISOString(),
          source: "manual",
        },
      ],
    });
    expect(useWebhookStore.getState().events.length).toBe(1);

    useWebhookStore.getState().clearEvents();
    expect(useWebhookStore.getState().events.length).toBe(0);
  });
});
