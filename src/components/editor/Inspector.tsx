import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useEditorStore } from "../../store/editorStore";
import { ACCENTS, PATH_KINDS, HEALTH_STATUS_CONFIG, type NodeHealthStatus } from "../../types";
import { POPULAR_ICONS } from "../../lib/iconLibrary";
import { IconPickerModal } from "./IconPickerModal";
import { useWebhookStore, getWebhookEndpointUrl, generateCurlSnippet } from "../../store/webhookStore";

export type Sel =
  | { kind: "node" | "edge"; id: string }
  | { kind: "multi"; nodeIds: string[] }
  | null;

const LABEL_PRESETS = ["Yes", "No", "Approved", "Rejected", "Success", "Retry"];

export function Inspector({ selection, onClearSelection }: { selection: Sel; onClearSelection?: () => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const updateEdgeData = useEditorStore((s) => s.updateEdgeData);
  const removeEdge = useEditorStore((s) => s.removeEdge);
  const addBranch = useEditorStore((s) => s.addBranch);
  const setAllEdgesPathKind = useEditorStore((s) => s.setAllEdgesPathKind);
  const alignNodes = useEditorStore((s) => s.alignNodes);
  const distributeNodes = useEditorStore((s) => s.distributeNodes);
  const bulkUpdateNodeData = useEditorStore((s) => s.bulkUpdateNodeData);
  const removeMultipleNodes = useEditorStore((s) => s.removeMultipleNodes);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [probeUrl, setProbeUrl] = useState<string>("");
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  const triggerWebhook = useWebhookStore((s) => s.triggerWebhook);
  const runSyntheticProbe = useWebhookStore((s) => s.runSyntheticProbe);

  const quickIcons = useMemo(() => {
    if (!iconSearch.trim()) {
      return POPULAR_ICONS.slice(0, 16);
    }
    const q = iconSearch.toLowerCase();
    return POPULAR_ICONS.filter(
      (item) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    ).slice(0, 16);
  }, [iconSearch]);

  if (!selection || !diagram)
    return (
      <aside className="w-72 shrink-0 border-l border-gray-800 p-4 text-xs text-gray-500">
        <p className="font-semibold text-gray-400 mb-1">Inspector</p>
        <p>Select a block or connector line to customize its properties, colors, animations, and branch labels.</p>
      </aside>
    );

  if (selection.kind === "multi") {
    const selectedNodes = diagram.nodes.filter((n) => selection.nodeIds.includes(n.id));
    return (
      <aside className="w-72 shrink-0 border-l border-gray-800 p-4 space-y-4 text-sm overflow-y-auto max-h-full">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <div className="text-xs uppercase tracking-wide text-sky-400 font-bold">Multi-Selection</div>
              <div className="text-[11px] text-gray-400 font-medium">{selectedNodes.length} Blocks Selected</div>
            </div>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-gray-400 hover:text-white"
                title="Deselect all (Esc)"
              >
                ✕ Deselect
              </button>
            )}
          </div>

          {/* Alignment Tools Grid */}
          <div className="space-y-2 pt-3">
            <span className="text-xs font-semibold text-gray-300">Align Blocks</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => alignNodes(selection.nodeIds, "left")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
                title="Align Left Edges"
              >
                <span className="text-sm">⇤</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Left</span>
              </button>
              <button
                type="button"
                onClick={() => alignNodes(selection.nodeIds, "center")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
                title="Align Horizontal Centers"
              >
                <span className="text-sm">↔</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Center</span>
              </button>
              <button
                type="button"
                onClick={() => alignNodes(selection.nodeIds, "right")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
                title="Align Right Edges"
              >
                <span className="text-sm">⇥</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Right</span>
              </button>
              <button
                type="button"
                onClick={() => alignNodes(selection.nodeIds, "top")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
                title="Align Top Edges"
              >
                <span className="text-sm">⤒</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Top</span>
              </button>
              <button
                type="button"
                onClick={() => alignNodes(selection.nodeIds, "middle")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
                title="Align Vertical Middles"
              >
                <span className="text-sm">↕</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Middle</span>
              </button>
              <button
                type="button"
                onClick={() => alignNodes(selection.nodeIds, "bottom")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 hover:border-sky-400 text-xs text-gray-200 transition"
                title="Align Bottom Edges"
              >
                <span className="text-sm">⤓</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Bottom</span>
              </button>
            </div>
          </div>

          {/* Distribute Spacing */}
          {selection.nodeIds.length >= 3 && (
            <div className="space-y-2 pt-3 border-t border-gray-800">
              <span className="text-xs font-semibold text-gray-300">Distribute Spacing</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => distributeNodes(selection.nodeIds, "horizontal")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-amber-600/40 bg-amber-950/40 hover:bg-amber-900/60 text-xs font-semibold text-amber-300 transition"
                  title="Evenly space blocks horizontally"
                >
                  <span>⇹</span> Horizontally
                </button>
                <button
                  type="button"
                  onClick={() => distributeNodes(selection.nodeIds, "vertical")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-amber-600/40 bg-amber-950/40 hover:bg-amber-900/60 text-xs font-semibold text-amber-300 transition"
                  title="Evenly space blocks vertically"
                >
                  <span>⇕</span> Vertically
                </button>
              </div>
            </div>
          )}

          {/* Bulk Accent Color */}
          <div className="space-y-2 pt-3 border-t border-gray-800">
            <span className="text-xs font-semibold text-gray-300">Bulk Accent Color</span>
            <div className="grid grid-cols-5 gap-1.5">
              {ACCENTS.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  aria-label={`Bulk set accent ${acc}`}
                  onClick={() => bulkUpdateNodeData(selection.nodeIds, { accent: acc })}
                  className="py-1 px-1 rounded-md text-[10px] font-medium uppercase border border-gray-700 bg-gray-900 hover:border-gray-500 text-gray-300 transition text-center"
                >
                  {acc.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk DevOps Health Status */}
          <div className="space-y-2 pt-3 border-t border-gray-800">
            <span className="text-xs font-semibold text-emerald-400">Bulk Health Status</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => bulkUpdateNodeData(selection.nodeIds, { healthStatus: undefined, metric: undefined })}
                className="p-1.5 rounded-lg border border-gray-800 bg-gray-900 text-xs text-gray-400 hover:text-white"
              >
                ⚪ None
              </button>
              {(Object.entries(HEALTH_STATUS_CONFIG) as [NodeHealthStatus, typeof HEALTH_STATUS_CONFIG[NodeHealthStatus]][]).map(([st, cfg]) => (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    bulkUpdateNodeData(selection.nodeIds, {
                      healthStatus: st,
                      metric: st === "healthy" ? "18ms" : st === "warning" ? "250ms" : "Timeout",
                    })
                  }
                  className="p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  <span className="truncate">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Delete */}
          <div className="pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                removeMultipleNodes(selection.nodeIds);
                onClearSelection?.();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-red-950/40 p-2 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition"
            >
              <span>🗑</span> Delete {selectedNodes.length} Blocks
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (selection.kind === "node") {
    const n = diagram.nodes.find((x) => x.id === selection.id);
    if (!n) return <aside className="w-72 shrink-0 border-l border-gray-800 p-4" />;

    // Find outgoing edges from this node (e.g. branches coming out of a decision diamond)
    const outgoingEdges = diagram.edges.filter((e) => e.source === n.id);

    return (
      <aside className="w-72 shrink-0 border-l border-gray-800 p-4 space-y-4 text-sm overflow-y-auto max-h-full">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Block Properties</div>
          <div className="space-y-3">
            <label className="block text-xs">
              <span className="text-gray-400">Title</span>
              <input
                aria-label="title"
                className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2.5 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
                value={n.data.title}
                onChange={(e) => updateNodeData(n.id, { title: e.target.value })}
              />
            </label>
            {n.type === "note" ? (
              <label className="block text-xs">
                <span className="text-gray-400">Note Content</span>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2.5 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
                  value={n.data.subtitle}
                  onChange={(e) => updateNodeData(n.id, { subtitle: e.target.value })}
                />
              </label>
            ) : (
              <label className="block text-xs">
                <span className="text-gray-400">Subtitle</span>
                <input
                  aria-label="subtitle"
                  className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2.5 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
                  value={n.data.subtitle}
                  onChange={(e) => updateNodeData(n.id, { subtitle: e.target.value })}
                />
              </label>
            )}
            <label className="block text-xs">
              <span className="text-gray-400">Accent Color</span>
              <select
                aria-label="accent"
                className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
                value={n.data.accent}
                onChange={(e) => updateNodeData(n.id, { accent: e.target.value as any })}
              >
                {ACCENTS.map((a) => (
                  <option key={a} value={a}>
                    {a.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            {n.type === "group" && (
              <label className="block text-xs">
                <span className="text-gray-400">Boundary Style</span>
                <select
                  aria-label="borderStyle"
                  className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
                  value={n.data.borderStyle ?? "dashed"}
                  onChange={(e) => updateNodeData(n.id, { borderStyle: e.target.value as any })}
                >
                  <option value="dashed">Dashed Boundary</option>
                  <option value="solid">Solid Boundary</option>
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={n.data.glow}
                onChange={(e) => updateNodeData(n.id, { glow: e.target.checked })}
                className="rounded border-gray-700 bg-gray-900 text-sky-500 focus:ring-0"
              />
              Glow Effect
            </label>
            <div className="block text-xs">
              <span className="text-gray-400">Size (W × H)</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  aria-label="width"
                  type="number"
                  min={40}
                  className="w-full rounded bg-gray-900 border border-gray-700 px-2 py-1 text-xs text-gray-100"
                  value={n.data.width}
                  onChange={(e) => updateNodeData(n.id, { width: Math.max(40, Number(e.target.value) || 0) })}
                />
                <span className="text-gray-500">×</span>
                <input
                  aria-label="height"
                  type="number"
                  min={30}
                  className="w-full rounded bg-gray-900 border border-gray-700 px-2 py-1 text-xs text-gray-100"
                  value={n.data.height}
                  onChange={(e) => updateNodeData(n.id, { height: Math.max(30, Number(e.target.value) || 0) })}
                />
              </div>
            </div>

            {/* DevOps & Health Monitoring Card */}
            <div className="space-y-2.5 pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-emerald-400 font-bold flex items-center gap-1.5">
                  <span>🩺</span> Health & Metrics (DevOps)
                </span>
                {(n.data.healthStatus || n.data.metric) && (
                  <button
                    type="button"
                    aria-label="Clear Health Status"
                    onClick={() => updateNodeData(n.id, { healthStatus: undefined, metric: undefined })}
                    className="text-[11px] text-gray-400 hover:text-red-300 font-medium transition"
                  >
                    ✕ Reset
                  </button>
                )}
              </div>

              {/* Status Selector Pills */}
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 font-medium">Status State:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    aria-label="Status None"
                    onClick={() => updateNodeData(n.id, { healthStatus: undefined })}
                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition text-left flex items-center gap-1.5 ${
                      !n.data.healthStatus
                        ? "border-sky-500 bg-sky-950/60 text-white ring-1 ring-sky-500"
                        : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                    }`}
                  >
                    <span className="text-gray-500">⚪</span> None
                  </button>
                  {(Object.entries(HEALTH_STATUS_CONFIG) as [NodeHealthStatus, typeof HEALTH_STATUS_CONFIG[NodeHealthStatus]][]).map(([st, cfg]) => {
                    const isSelected = n.data.healthStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        aria-label={`Status ${cfg.label}`}
                        onClick={() => updateNodeData(n.id, { healthStatus: st })}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                          isSelected
                            ? "ring-1 font-semibold"
                            : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700"
                        }`}
                        style={isSelected ? {
                          backgroundColor: cfg.bg,
                          borderColor: cfg.border,
                          color: cfg.color,
                          boxShadow: `0 0 10px ${cfg.glow}`,
                        } : undefined}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: cfg.dot }} />
                        <span className="truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Metric Tag (Latency / Throughput / SLA) - Always visible */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">⚡ Live Metric Tag (Latency / RPS / SLA)</span>
                    {n.data.metric && (
                      <button
                        type="button"
                        onClick={() => updateNodeData(n.id, { metric: undefined })}
                        className="text-[10px] text-gray-500 hover:text-red-400"
                      >
                        clear
                      </button>
                    )}
                  </div>
                  <input
                    aria-label="metric"
                    placeholder="Type metric (e.g. 24ms, 99.9%, 1.4k rps)..."
                    className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-sky-500 focus:outline-none"
                    value={n.data.metric ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateNodeData(n.id, {
                        metric: val,
                        healthStatus: n.data.healthStatus ?? (val.trim() ? "healthy" : undefined),
                      });
                    }}
                  />
                </label>

                {/* 1-Click Metric Presets */}
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-400 font-medium flex items-center justify-between">
                    <span>1-Click Presets:</span>
                    <span className="text-[10px] text-gray-500">Auto-applies status</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "18ms", status: "healthy" as const },
                      { label: "42ms", status: "healthy" as const },
                      { label: "250ms", status: "warning" as const },
                      { label: "99.9%", status: "healthy" as const },
                      { label: "1.2k rps", status: "healthy" as const },
                      { label: "0.02% err", status: "warning" as const },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        aria-label={`Metric preset ${item.label}`}
                        onClick={() =>
                          updateNodeData(n.id, {
                            metric: item.label,
                            healthStatus: n.data.healthStatus ?? item.status,
                          })
                        }
                        className={`px-2 py-1 rounded-md text-[11px] font-mono border transition flex items-center gap-1 ${
                          n.data.metric === item.label
                            ? "border-emerald-500 bg-emerald-950/80 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500"
                            : "border-gray-800 bg-gray-900/90 text-gray-300 hover:border-gray-600 hover:text-white"
                        }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Webhook & Synthetic Ping Binding Card */}
            <div className="space-y-2.5 pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-cyan-400 font-bold flex items-center gap-1.5">
                  <span>⚡</span> Live Webhook & NOC Binding
                </span>
                <span className="text-[10px] text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                  HTTP POST
                </span>
              </div>

              {/* Webhook URL with 1-click Copy */}
              <div className="space-y-1">
                <div className="text-[11px] text-gray-400 font-medium">Node Webhook Endpoint:</div>
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={getWebhookEndpointUrl(diagram.id, n.id)}
                    className="flex-1 rounded bg-black/60 border border-gray-800 px-2 py-1 text-[11px] text-cyan-300 font-mono select-all focus:outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(getWebhookEndpointUrl(diagram.id, n.id));
                      setCopiedWebhook("url");
                      setTimeout(() => setCopiedWebhook(null), 2000);
                    }}
                    className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 transition shrink-0 font-medium"
                    title="Copy Webhook URL"
                  >
                    {copiedWebhook === "url" ? "✓" : "📋 URL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(generateCurlSnippet(diagram.id, n.id, "healthy"));
                      setCopiedWebhook("curl");
                      setTimeout(() => setCopiedWebhook(null), 2000);
                    }}
                    className="px-2 py-1 rounded bg-[#c00000]/20 hover:bg-[#c00000]/30 border border-[#c00000]/50 text-xs text-[#ff4040] transition shrink-0 font-semibold"
                    title="Copy cURL Command"
                  >
                    {copiedWebhook === "curl" ? "✓" : "⚡ cURL"}
                  </button>
                </div>
              </div>

              {/* Quick Mock Webhook Trigger Buttons */}
              <div className="space-y-1 pt-1">
                <div className="text-[11px] text-gray-400 font-medium flex items-center justify-between">
                  <span>Simulate Incoming Webhook:</span>
                  <span className="text-[10px] text-gray-500">Live SSE push</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerWebhook(diagram.id, n.id, "healthy", "24ms", "Webhook: 200 OK via synthetic alert")}
                    className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-semibold transition text-center"
                    title="Simulate 200 OK Webhook"
                  >
                    🟢 200 OK
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerWebhook(diagram.id, n.id, "warning", "780ms (429)", "Webhook: High latency threshold exceeded")}
                    className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/80 hover:bg-amber-900/60 text-amber-300 text-[11px] font-semibold transition text-center"
                    title="Simulate 429 Degradation Webhook"
                  >
                    🟡 429 Warn
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerWebhook(diagram.id, n.id, "down", "502 Bad Gateway", "Webhook: Service down alert")}
                    className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900/60 text-rose-300 text-[11px] font-semibold transition text-center"
                    title="Simulate 500 Outage Webhook"
                  >
                    🔴 500 Down
                  </button>
                </div>
              </div>

              {/* Synthetic HTTP Ping Probe Section */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] text-gray-400 font-medium flex items-center justify-between">
                  <span>Synthetic Health Probe (Ping URL):</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="https://api.github.com or health URL..."
                    value={probeUrl}
                    onChange={(e) => setProbeUrl(e.target.value)}
                    className="flex-1 rounded bg-gray-950 border border-gray-800 px-2 py-1 text-xs text-gray-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isProbing || !probeUrl.trim()}
                    onClick={async () => {
                      if (!probeUrl.trim()) return;
                      setIsProbing(true);
                      setProbeResult(null);
                      try {
                        const res = await runSyntheticProbe(probeUrl.trim());
                        setProbeResult(res);
                        updateNodeData(n.id, {
                          healthStatus: res.status,
                          metric: res.metric,
                        });
                      } finally {
                        setIsProbing(false);
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800/70 border border-cyan-700/60 text-xs font-semibold text-cyan-200 transition disabled:opacity-40"
                  >
                    {isProbing ? "⏳" : "📡 Ping"}
                  </button>
                </div>
                {probeResult && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-mono border ${
                      probeResult.ok
                        ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-300"
                        : "bg-rose-950/50 border-rose-800/60 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Status: {probeResult.status.toUpperCase()}</span>
                      <span>{probeResult.latencyMs}ms</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{probeResult.message}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Block Icon Section (Direct Interactive Grid + Live Search + Clear) */}
            {(n.type === "card" || n.type === "group") && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-sky-400 font-semibold flex items-center gap-1.5">
                    <span>✨</span> Block Icon
                  </span>
                  {(n.data.iconify || n.data.icon) && (
                    <button
                      type="button"
                      aria-label="Clear Icon"
                      onClick={() => updateNodeData(n.id, { iconify: undefined, icon: undefined })}
                      className="text-[11px] text-red-400 hover:text-red-300 font-medium transition"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                {/* Current Selected Icon Status Card */}
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-700/80 bg-gray-900/90 p-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-base shadow-inner">
                    {n.data.iconify ? (
                      <Icon icon={n.data.iconify} width={22} height={22} />
                    ) : n.data.icon ? (
                      <span className="text-lg leading-none">{n.data.icon}</span>
                    ) : (
                      <span className="text-gray-500 text-[10px]">None</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-200 truncate">
                      {n.data.iconify || n.data.icon || "No icon selected"}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {n.data.iconify ? "Tech Logo" : n.data.icon ? "Emoji Icon" : "Pick from grid below"}
                    </div>
                  </div>
                  {(n.data.iconify || n.data.icon) ? (
                    <button
                      type="button"
                      onClick={() => updateNodeData(n.id, { iconify: undefined, icon: undefined })}
                      className="rounded-md border border-red-900/50 bg-red-950/40 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-900/60 transition"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                {/* Inline Live Search for Icons right in Inspector */}
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-gray-500">🔍</span>
                  <input
                    type="text"
                    placeholder="Search icons (AWS, Docker, DB, React)..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 pl-8 pr-7 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none"
                  />
                  {iconSearch && (
                    <button
                      onClick={() => setIconSearch("")}
                      className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 1-Click Interactive Icon Grid */}
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-gray-950/70 rounded-xl border border-gray-800">
                  {quickIcons.map((item) => {
                    const isSelected = item.isEmoji
                      ? n.data.icon === item.id
                      : n.data.iconify === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={`Select icon ${item.name}`}
                        title={item.name}
                        onClick={() => {
                          if (item.isEmoji) {
                            updateNodeData(n.id, { icon: item.id, iconify: undefined });
                          } else {
                            updateNodeData(n.id, { iconify: item.id, icon: undefined });
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition ${
                          isSelected
                            ? "border-sky-400 bg-sky-950/80 text-white ring-1 ring-sky-400 shadow-sm"
                            : "border-gray-800/80 bg-gray-900/80 text-gray-300 hover:border-gray-600 hover:bg-gray-800"
                        }`}
                      >
                        <div className="h-6 w-6 flex items-center justify-center">
                          {item.isEmoji ? (
                            <span className="text-base leading-none">{item.id}</span>
                          ) : (
                            <Icon icon={item.id} width={20} height={20} />
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400 truncate max-w-full leading-tight mt-0.5">
                          {item.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Browse Full Modal */}
                <button
                  type="button"
                  aria-label="Choose Block Icon"
                  onClick={() => setShowIconPicker(true)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/90 py-1.5 text-xs font-medium text-sky-400 hover:bg-gray-800 hover:border-sky-500 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>✨ Browse Full Library (All Tech & Emojis) ▾</span>
                </button>

                {showIconPicker && (
                  <IconPickerModal
                    currentIconify={n.data.iconify}
                    currentEmoji={n.data.icon}
                    onSelect={(selected) => updateNodeData(n.id, selected)}
                    onClose={() => setShowIconPicker(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Decision & Branch Control */}
        {n.type !== "group" && n.type !== "note" && (
          <div className="pt-3 border-t border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-sky-400 font-semibold flex items-center gap-1.5">
                <span>🔀</span> Decision Branches ({outgoingEdges.length})
              </div>
              {n.type === "decision" && (
                <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                  Decision Node
                </span>
              )}
            </div>

            {/* Quick 1-Click Branch Creators */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-gray-400 font-medium">Add 1-Click Branch Step:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => addBranch(n.id, "Yes", "#10b981", { x: 230, y: -50 })}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 transition shadow-sm"
                >
                  <span className="text-sm font-bold">✓</span> + Add "Yes"
                </button>
                <button
                  type="button"
                  onClick={() => addBranch(n.id, "No", "#f43f5e", { x: 230, y: 90 })}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 px-2.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:border-rose-400 transition shadow-sm"
                >
                  <span className="text-sm font-bold">✕</span> + Add "No"
                </button>
              </div>
            </div>

            {/* Existing Connected Outgoing Branches */}
            {outgoingEdges.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                <div className="text-[11px] text-gray-400 font-medium">Connected Branches:</div>
                {outgoingEdges.map((ed, idx) => {
                  const targetNode = diagram.nodes.find((x) => x.id === ed.target);
                  return (
                    <div key={ed.id} className="rounded-lg border border-gray-800 bg-gray-900/80 p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 truncate max-w-[160px] font-medium">
                          Branch {idx + 1} → <strong className="text-sky-300">{targetNode?.data.title || "Next Step"}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: ed.data.color }} />
                          <button
                            type="button"
                            onClick={() => removeEdge(ed.id)}
                            className="text-gray-500 hover:text-red-400 text-xs px-1"
                            title="Delete branch connection"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div>
                        <input
                          placeholder="e.g. Yes / No / Approved"
                          className="w-full rounded bg-gray-950 border border-gray-700 px-2 py-1 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
                          value={ed.data.label ?? ""}
                          onChange={(e) => updateEdgeData(ed.id, { label: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {LABEL_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateEdgeData(ed.id, { label: preset })}
                            className={`rounded border px-2 py-0.5 text-[10px] transition ${
                              ed.data.label === preset
                                ? "border-sky-500 bg-sky-950/80 text-sky-300 font-semibold"
                                : "border-gray-800 bg-gray-900/80 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                        {ed.data.label && (
                          <button
                            type="button"
                            onClick={() => updateEdgeData(ed.id, { label: "" })}
                            className="rounded border border-red-900/40 bg-red-950/30 px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-900/40 transition"
                          >
                            ✕ Clear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/40 p-2.5 text-[11px] text-gray-400 text-center space-y-1">
                <div>No lines connected yet.</div>
                <div className="text-gray-500 text-[10px]">
                  Click <strong className="text-emerald-400">+ Add "Yes"</strong> or <strong className="text-rose-400">+ Add "No"</strong> above to auto-create a connected step, or drag connector lines manually from the edge handles!
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    );
  }

  // Selected Connector (Edge)
  const ed = diagram.edges.find((x) => x.id === selection.id);
  if (!ed) return <aside className="w-72 shrink-0 border-l border-gray-800 p-4" />;

  const sourceNode = diagram.nodes.find((x) => x.id === ed.source);
  const targetNode = diagram.nodes.find((x) => x.id === ed.target);

  return (
    <aside className="w-72 shrink-0 border-l border-gray-800 p-4 space-y-3.5 text-sm overflow-y-auto max-h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Connector Properties</span>
        <span className="h-2 w-2 rounded-full" style={{ background: ed.data.color }} />
      </div>

      {sourceNode && targetNode && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-2 text-[11px] text-gray-400 space-y-0.5">
          <div className="truncate">From: <strong className="text-gray-200">{sourceNode.data.title}</strong></div>
          <div className="truncate">To: <strong className="text-gray-200">{targetNode.data.title}</strong></div>
        </div>
      )}

      {/* Edge Label Input & Quick Presets */}
      <div>
        <label className="block font-medium text-xs text-gray-300">
          Connector Label <span className="text-gray-500">(Path text)</span>
          <input
            aria-label="connector label"
            placeholder="e.g. Yes / No / Approved"
            className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2.5 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
            value={ed.data.label ?? ""}
            onChange={(e) => updateEdgeData(ed.id, { label: e.target.value })}
          />
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {LABEL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateEdgeData(ed.id, { label: preset })}
              className={`rounded border px-2 py-0.5 text-[10px] transition ${
                ed.data.label === preset
                  ? "border-sky-500 bg-sky-950/60 text-sky-300 font-semibold"
                  : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200"
              }`}
            >
              {preset}
            </button>
          ))}
          {ed.data.label && (
            <button
              type="button"
              onClick={() => updateEdgeData(ed.id, { label: "" })}
              className="rounded border border-red-900/40 bg-red-950/30 px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-900/40 transition"
              title="Clear label"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Live Edge Animation Preview Box */}
      <div className="rounded-xl border border-gray-800 bg-[#090e17] p-3 space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span className="font-semibold text-gray-300 flex items-center gap-1">
            <span>✨</span> Live Flow Preview
          </span>
          <span className="font-mono text-[10px] text-sky-400">
            {ed.data.speed}x • {ed.data.animation.toUpperCase()}
          </span>
        </div>
        <div className="h-10 w-full overflow-hidden flex items-center justify-center bg-gray-950/70 rounded-lg border border-gray-800/80">
          <svg width="100%" height="40" className="overflow-visible px-2">
            <defs>
              <linearGradient id={`preview-grad-${ed.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={ed.data.color} stopOpacity="0.1" />
                <stop offset="50%" stopColor={ed.data.color} stopOpacity="1" />
                <stop offset="100%" stopColor={ed.data.color} stopOpacity="0.1" />
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  from="-1 0"
                  to="1 0"
                  dur={`${4.8 - ed.data.speed * 0.8}s`}
                  repeatCount="indefinite"
                />
              </linearGradient>
            </defs>
            <path
              d="M 15 20 Q 80 5, 140 20 T 260 20"
              fill="none"
              stroke={ed.data.animation === "gradient" ? `url(#preview-grad-${ed.id})` : ed.data.color}
              strokeWidth={ed.data.strokeWidth ?? 2.5}
              strokeDasharray={ed.data.lineStyle === "dashed" ? "6 6" : undefined}
              style={{
                opacity: 0.85,
                filter: `drop-shadow(0 0 6px ${ed.data.color})`,
              }}
            />
            {ed.data.animation === "pulse" && (
              <path
                d="M 15 20 Q 80 5, 140 20 T 260 20"
                fill="none"
                stroke={ed.data.color}
                strokeWidth={(ed.data.strokeWidth ?? 2.5) + 1.5}
                strokeDasharray="20 40"
                style={{
                  filter: `drop-shadow(0 0 10px ${ed.data.color})`,
                  opacity: 0.95,
                }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="60"
                  to="0"
                  dur={`${4.8 - ed.data.speed * 0.8}s`}
                  repeatCount="indefinite"
                />
              </path>
            )}
            {ed.data.animation === "dots" && (
              <circle r={5} fill={ed.data.color} style={{ filter: `drop-shadow(0 0 8px ${ed.data.color})` }}>
                <animateMotion
                  dur={`${4.8 - ed.data.speed * 0.8}s`}
                  repeatCount="indefinite"
                  path="M 15 20 Q 80 5, 140 20 T 260 20"
                />
              </circle>
            )}
          </svg>
        </div>
      </div>

      {/* Animation Style Selector */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-300">Animation Style</span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: "dots", label: "Packets", icon: "🟢", desc: "Moving pulse dot" },
            { id: "pulse", label: "Energy Wave", icon: "⚡", desc: "Laser pulse wave" },
            { id: "gradient", label: "Beam", icon: "🌈", desc: "Sliding gradient" },
            { id: "none", label: "Static", icon: "─", desc: "No animation" },
          ].map((style) => {
            const isSelected = ed.data.animation === style.id;
            return (
              <button
                key={style.id}
                type="button"
                aria-label={`Animation ${style.label}`}
                onClick={() => updateEdgeData(ed.id, { animation: style.id as any })}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                  isSelected
                    ? "border-sky-500 bg-sky-950/70 text-sky-200 ring-1 ring-sky-500/40"
                    : "border-gray-800 bg-gray-900/80 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                }`}
              >
                <span className="text-xs">{style.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight">{style.label}</div>
                  <div className="text-[9px] text-gray-500 truncate">{style.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed Controls (1x..5x) */}
      <div className="space-y-1.5 pt-1 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-medium">Flow Speed</span>
          <span className="font-mono text-sky-400 font-bold">
            {ed.data.speed}x {ed.data.speed >= 4 ? "⚡ Turbo" : ed.data.speed >= 3 ? "🐇 Fast" : "🐢 Normal"}
          </span>
        </div>
        <input
          aria-label="speed"
          type="range"
          min={1}
          max={5}
          step={1}
          className="w-full accent-sky-500 cursor-pointer"
          value={ed.data.speed}
          onChange={(e) => updateEdgeData(ed.id, { speed: Number(e.target.value) })}
        />
        <div className="grid grid-cols-5 gap-1 pt-0.5">
          {[1, 2, 3, 4, 5].map((sp) => (
            <button
              key={sp}
              type="button"
              aria-label={`Speed ${sp}x`}
              onClick={() => updateEdgeData(ed.id, { speed: sp })}
              className={`py-1 rounded text-xs font-mono font-medium border transition text-center ${
                ed.data.speed === sp
                  ? "border-sky-500 bg-sky-950/80 text-sky-300 font-bold shadow-sm"
                  : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200"
              }`}
            >
              {sp}x
            </button>
          ))}
        </div>
      </div>

      {/* Line Thickness / Beam Width */}
      <div className="space-y-1.5 pt-1 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-medium">Beam Width</span>
          <span className="text-[11px] text-gray-500">{ed.data.strokeWidth ?? 2.5}px</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { width: 1.5, label: "Thin" },
            { width: 2.5, label: "Normal" },
            { width: 4, label: "Thick" },
            { width: 6, label: "Trunk" },
          ].map((item) => {
            const isSelected = (ed.data.strokeWidth ?? 2.5) === item.width;
            return (
              <button
                key={item.width}
                type="button"
                aria-label={`Width ${item.label}`}
                onClick={() => updateEdgeData(ed.id, { strokeWidth: item.width })}
                className={`py-1 px-1 rounded-md text-xs font-medium border transition text-center ${
                  isSelected
                    ? "border-sky-500 bg-sky-950/80 text-sky-300 font-bold ring-1 ring-sky-500/40"
                    : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Tuning & Quick Palette */}
      <div className="space-y-1.5 pt-1 border-t border-gray-800">
        <span className="text-xs font-medium text-gray-300">Connector Color</span>
        <div className="flex items-center gap-2">
          <input
            aria-label="color"
            type="color"
            className="h-8 w-12 rounded bg-gray-900 border border-gray-700 cursor-pointer shrink-0"
            value={ed.data.color}
            onChange={(e) => updateEdgeData(ed.id, { color: e.target.value })}
          />
          <div className="flex flex-wrap gap-1.5 flex-1">
            {[
              { color: "#38bdf8", name: "Sky" },
              { color: "#10b981", name: "Emerald" },
              { color: "#f59e0b", name: "Amber" },
              { color: "#f43f5e", name: "Rose" },
              { color: "#a855f7", name: "Purple" },
              { color: "#06b6d4", name: "Cyan" },
            ].map((c) => (
              <button
                key={c.color}
                type="button"
                aria-label={`Color preset ${c.name}`}
                title={c.name}
                onClick={() => updateEdgeData(ed.id, { color: c.color })}
                style={{ backgroundColor: c.color }}
                className={`h-5 w-5 rounded-full border transition ${
                  ed.data.color.toLowerCase() === c.color.toLowerCase()
                    ? "border-white ring-2 ring-sky-400 scale-110"
                    : "border-gray-900 hover:scale-110"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Line Style */}
      <label className="block text-xs pt-1 border-t border-gray-800">
        <span className="text-gray-400">Line Style</span>
        <select
          aria-label="lineStyle"
          className="mt-1 w-full rounded bg-gray-900 border border-gray-700 px-2 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
          value={ed.data.lineStyle}
          onChange={(e) => updateEdgeData(ed.id, { lineStyle: e.target.value as any })}
        >
          <option value="solid">Solid Line (Continuous)</option>
          <option value="dashed">Dashed Line (Packets / Async)</option>
        </select>
      </label>

      <div className="space-y-1.5 pt-1">
        <label className="block text-xs font-medium text-gray-300">
          Connector Routing
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PATH_KINDS.map((pk) => {
            const isSelected = ed.data.path === pk.id;
            return (
              <button
                key={pk.id}
                type="button"
                aria-label={`Route ${pk.label}`}
                onClick={() => updateEdgeData(ed.id, { path: pk.id })}
                className={`flex items-start gap-1.5 rounded-lg border p-2 text-left transition ${
                  isSelected
                    ? "border-sky-500 bg-sky-950/70 text-sky-200 ring-1 ring-sky-500/40"
                    : "border-gray-800 bg-gray-900/80 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                }`}
              >
                <span className="text-sm font-mono text-sky-400 shrink-0 mt-0.5">{pk.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight">{pk.label}</div>
                  <div className="text-[9px] text-gray-500 leading-tight truncate">{pk.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAllEdgesPathKind(ed.data.path)}
          className="w-full mt-1.5 rounded border border-gray-800 bg-gray-900/60 py-1 text-[11px] text-gray-400 hover:border-gray-700 hover:text-gray-200 transition"
          title="Apply this routing style to all existing connectors in this diagram"
        >
          ⚡ Apply "{PATH_KINDS.find((p) => p.id === ed.data.path)?.label}" to all lines
        </button>
      </div>

      <button
        aria-label="Delete connector"
        className="mt-3 w-full rounded-lg border border-red-900/60 bg-red-950/40 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/50 transition"
        onClick={() => {
          removeEdge(ed.id);
          onClearSelection?.();
        }}
      >
        🗑️ Delete Connector
      </button>
    </aside>
  );
}
