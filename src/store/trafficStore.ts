import { create } from "zustand";
import { useEditorStore } from "./editorStore";
import type { NodeHealthStatus } from "../types";

export interface MetricBackup {
  id: string;
  healthStatus?: NodeHealthStatus;
  metric?: string;
}

interface TrafficState {
  isSimulating: boolean;
  totalPackets: number;
  avgLatency: number;
  incidentCount: number;
  backups: MetricBackup[];

  startTraffic: () => void;
  stopTraffic: (restoreBackups?: boolean) => void;
  toggleTraffic: () => void;
  tickTraffic: () => void;
  injectChaos: () => void;
  healAll: () => void;
  triggerSpike: () => void;
}

export const useTrafficStore = create<TrafficState>((set, get) => ({
  isSimulating: false,
  totalPackets: 0,
  avgLatency: 22,
  incidentCount: 0,
  backups: [],

  startTraffic: () => {
    const editor = useEditorStore.getState();
    const diagram = editor.diagram;
    if (!diagram || diagram.nodes.length === 0) return;

    // Snapshot current node states so user can restore them anytime
    const backups: MetricBackup[] = diagram.nodes.map((n) => ({
      id: n.id,
      healthStatus: n.data.healthStatus,
      metric: n.data.metric,
    }));

    // If no nodes have health status yet, initialize at least the first 3 nodes with healthy status
    const hasAnyStatus = diagram.nodes.some((n) => n.data.healthStatus);
    if (!hasAnyStatus) {
      diagram.nodes.slice(0, 4).forEach((n, idx) => {
        const presets = ["18ms", "42ms", "1.2k rps", "99.9%"];
        editor.updateNodeData(n.id, {
          healthStatus: "healthy",
          metric: presets[idx % presets.length],
        });
      });
    }

    set({
      isSimulating: true,
      totalPackets: 1250,
      avgLatency: 21,
      incidentCount: diagram.nodes.filter((n) => n.data.healthStatus === "down" || n.data.healthStatus === "warning").length,
      backups,
    });
  },

  stopTraffic: (restoreBackups = false) => {
    const { backups, isSimulating } = get();
    if (!isSimulating) return;

    if (restoreBackups && backups.length > 0) {
      const editor = useEditorStore.getState();
      backups.forEach((b) => {
        editor.updateNodeData(b.id, {
          healthStatus: b.healthStatus,
          metric: b.metric,
        });
      });
    }

    set({
      isSimulating: false,
      totalPackets: 0,
      avgLatency: 0,
      incidentCount: 0,
      backups: [],
    });
  },

  toggleTraffic: () => {
    if (get().isSimulating) {
      get().stopTraffic(false);
    } else {
      get().startTraffic();
    }
  },

  tickTraffic: () => {
    if (!get().isSimulating) return;
    const editor = useEditorStore.getState();
    const diagram = editor.diagram;
    if (!diagram) return;

    let latencySum = 0;
    let latencyCount = 0;
    let incidents = 0;

    diagram.nodes.forEach((node) => {
      const status = node.data.healthStatus;
      if (!status) return;

      if (status === "down" || status === "warning") {
        incidents++;
      }

      if (status === "healthy") {
        const currentMetric = node.data.metric ?? "20ms";
        if (currentMetric.endsWith("ms")) {
          const base = parseInt(currentMetric, 10) || 20;
          const jitter = Math.floor(Math.random() * 7) - 3; // -3 to +3
          const next = Math.max(8, Math.min(65, base + jitter));
          editor.updateNodeData(node.id, { metric: `${next}ms` });
          latencySum += next;
          latencyCount++;
        } else if (currentMetric.endsWith("rps")) {
          const nextRps = (1.1 + Math.random() * 0.35).toFixed(1);
          editor.updateNodeData(node.id, { metric: `${nextRps}k rps` });
        } else if (currentMetric.endsWith("%")) {
          const nextSla = (99.85 + Math.random() * 0.14).toFixed(1);
          editor.updateNodeData(node.id, { metric: `${nextSla}%` });
        }
      } else if (status === "warning") {
        const warningLatency = 160 + Math.floor(Math.random() * 90);
        editor.updateNodeData(node.id, { metric: `${warningLatency}ms` });
        latencySum += warningLatency;
        latencyCount++;
      } else if (status === "down") {
        editor.updateNodeData(node.id, { metric: "Timeout" });
      }
    });

    const newAvg = latencyCount > 0 ? Math.round(latencySum / latencyCount) : 22;
    const packetSurge = Math.floor(Math.random() * 200) - 80;

    set((s) => ({
      totalPackets: Math.max(500, s.totalPackets + packetSurge),
      avgLatency: newAvg,
      incidentCount: incidents,
    }));
  },

  injectChaos: () => {
    const editor = useEditorStore.getState();
    const diagram = editor.diagram;
    if (!diagram || diagram.nodes.length === 0) return;

    // Pick a candidate node that is currently healthy
    const candidates = diagram.nodes.filter((n) => n.data.healthStatus === "healthy" || !n.data.healthStatus);
    const target = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : diagram.nodes[Math.floor(Math.random() * diagram.nodes.length)];

    const chaosStatus: NodeHealthStatus = Math.random() > 0.4 ? "down" : "warning";
    const chaosMetric = chaosStatus === "down" ? "504 Timeout" : "380ms (High Load)";

    editor.updateNodeData(target.id, {
      healthStatus: chaosStatus,
      metric: chaosMetric,
    });

    // Flash spotlight on the failing node so user can see it immediately
    editor.flashNode(target.id, 3000);

    set((s) => ({
      incidentCount: s.incidentCount + 1,
      avgLatency: s.avgLatency + 25,
    }));
  },

  healAll: () => {
    const editor = useEditorStore.getState();
    const diagram = editor.diagram;
    if (!diagram) return;

    diagram.nodes.forEach((node) => {
      if (node.data.healthStatus === "down" || node.data.healthStatus === "warning") {
        editor.updateNodeData(node.id, {
          healthStatus: "healthy",
          metric: "18ms",
        });
      }
    });

    set({ incidentCount: 0, avgLatency: 19 });
  },

  triggerSpike: () => {
    const editor = useEditorStore.getState();
    const diagram = editor.diagram;
    if (!diagram) return;

    diagram.nodes.forEach((node) => {
      if (node.data.healthStatus === "healthy") {
        editor.updateNodeData(node.id, {
          metric: `${45 + Math.floor(Math.random() * 30)}ms`,
        });
      }
    });

    set((s) => ({
      totalPackets: s.totalPackets + 2400,
      avgLatency: 52,
    }));
  },
}));
