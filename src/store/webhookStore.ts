import { create } from "zustand";
import { useEditorStore } from "./editorStore";
import type { NodeHealthStatus, WebhookEvent } from "../types";

export interface NocSummary {
  healthy: number;
  warning: number;
  down: number;
  pending: number;
  total: number;
}

interface WebhookState {
  isConnected: boolean;
  activeDiagramId: string | null;
  events: WebhookEvent[];
  isNocDrawerOpen: boolean;
  selectedNodeIdForHistory: string | null;

  // Actions
  connect: (diagramId: string) => void;
  disconnect: () => void;
  setNocDrawerOpen: (open: boolean) => void;
  setSelectedNodeIdForHistory: (nodeId: string | null) => void;
  triggerWebhook: (
    diagramId: string,
    nodeId: string,
    status: NodeHealthStatus,
    metric?: string,
    message?: string
  ) => Promise<boolean>;
  runSyntheticProbe: (
    url: string
  ) => Promise<{ ok: boolean; status: NodeHealthStatus; metric: string; message: string; latencyMs: number }>;
  clearEvents: () => void;
  getNocSummary: () => NocSummary;
}

// Active EventSource connection
let activeEventSource: EventSource | null = null;
let reconnectTimer: any = null;

const API_BASE = "http://localhost:5055";

export const useWebhookStore = create<WebhookState>((set, get) => ({
  isConnected: false,
  activeDiagramId: null,
  events: [],
  isNocDrawerOpen: false,
  selectedNodeIdForHistory: null,

  setNocDrawerOpen: (open) => set({ isNocDrawerOpen: open }),
  setSelectedNodeIdForHistory: (nodeId) => set({ selectedNodeIdForHistory: nodeId }),
  clearEvents: () => set({ events: [] }),

  connect: (diagramId: string) => {
    if (get().activeDiagramId === diagramId && get().isConnected && activeEventSource) {
      return;
    }

    get().disconnect();
    set({ activeDiagramId: diagramId });

    fetch(`${API_BASE}/api/webhooks/events/${diagramId}`)
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (Array.isArray(data.events)) {
          set({ events: data.events });
        }
      })
      .catch((err) => console.warn("Failed to fetch initial webhook events:", err));

    try {
      activeEventSource = new EventSource(`${API_BASE}/api/webhooks/stream/${diagramId}`);

      activeEventSource.addEventListener("connected", () => {
        set({ isConnected: true });
      });

      activeEventSource.addEventListener("webhook_event", (e) => {
        try {
          const event: WebhookEvent = JSON.parse(e.data);
          set((state) => ({
            events: [event, ...state.events.slice(0, 99)],
          }));

          const editor = useEditorStore.getState();
          const targetNode = editor.diagram?.nodes.find((n) => n.id === event.nodeId);
          if (targetNode) {
            const currentHistory = targetNode.data.webhookConfig?.history || [];
            editor.updateNodeData(event.nodeId, {
              healthStatus: event.status,
              metric: event.metric,
              webhookConfig: {
                enabled: true,
                lastPingAt: event.timestamp,
                lastMessage: event.message,
                pollUrl: targetNode.data.webhookConfig?.pollUrl,
                history: [event, ...currentHistory.slice(0, 19)],
              },
            });
          }
        } catch (parseErr) {
          console.error("Failed to parse SSE webhook_event payload:", parseErr);
        }
      });

      activeEventSource.onerror = () => {
        set({ isConnected: false });
        if (activeEventSource) {
          activeEventSource.close();
          activeEventSource = null;
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (get().activeDiagramId === diagramId) {
            get().connect(diagramId);
          }
        }, 5000);
      };
    } catch (err) {
      console.warn("Could not establish EventSource connection:", err);
      set({ isConnected: false });
    }
  },

  disconnect: () => {
    clearTimeout(reconnectTimer);
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }
    set({ isConnected: false, activeDiagramId: null });
  },

  triggerWebhook: async (diagramId, nodeId, status, metric, message) => {
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/nodes/${diagramId}/${nodeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, metric, message, source: "manual" }),
      });
      if (!res.ok) throw new Error("HTTP error " + res.status);
      const data = await res.json();

      if (!get().isConnected && data.event) {
        useEditorStore.getState().updateNodeData(nodeId, {
          healthStatus: status,
          metric,
        });
        set((state) => ({ events: [data.event, ...state.events.slice(0, 99)] }));
      }
      return true;
    } catch (err) {
      console.error("Failed to trigger webhook:", err);
      useEditorStore.getState().updateNodeData(nodeId, {
        healthStatus: status,
        metric,
      });
      return false;
    }
  },

  runSyntheticProbe: async (url: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/probe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Probe request failed: " + res.status);
      return await res.json();
    } catch (err: any) {
      return {
        ok: false,
        status: "down",
        metric: "Connection Error",
        message: err.message || "Failed to probe endpoint",
        latencyMs: 0,
      };
    }
  },

  getNocSummary: () => {
    const nodes = useEditorStore.getState().diagram?.nodes || [];
    let healthy = 0;
    let warning = 0;
    let down = 0;
    let pending = 0;

    for (const n of nodes) {
      const s = n.data.healthStatus;
      if (s === "healthy") healthy++;
      else if (s === "warning") warning++;
      else if (s === "down") down++;
      else if (s === "pending") pending++;
    }

    return {
      healthy,
      warning,
      down,
      pending,
      total: nodes.length,
    };
  },
}));

export function generateCurlSnippet(diagramId: string, nodeId: string, sampleStatus: NodeHealthStatus = "healthy"): string {
  const metric = sampleStatus === "healthy" ? "18ms" : sampleStatus === "warning" ? "850ms latency" : "502 Bad Gateway";
  const msg = sampleStatus === "healthy" ? "System OK" : sampleStatus === "warning" ? "High memory load" : "Service outage";
  return `curl -X POST "${API_BASE}/api/webhooks/nodes/${diagramId}/${nodeId}" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"${sampleStatus}","metric":"${metric}","message":"${msg}"}'`;
}

export function getWebhookEndpointUrl(diagramId: string, nodeId: string): string {
  return `${API_BASE}/api/webhooks/nodes/${diagramId}/${nodeId}`;
}
