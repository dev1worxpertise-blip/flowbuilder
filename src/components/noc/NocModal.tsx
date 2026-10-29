import { useState } from "react";
import { createPortal } from "react-dom";
import { useEditorStore } from "../../store/editorStore";
import { useWebhookStore, generateCurlSnippet, getWebhookEndpointUrl } from "../../store/webhookStore";
import { HEALTH_STATUS_CONFIG, type NodeHealthStatus } from "../../types";

export function NocModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const diagram = useEditorStore((s) => s.diagram);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const { isConnected, events, triggerWebhook, clearEvents, getNocSummary } = useWebhookStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "incident" | "healthy">("all");
  const [tab, setTab] = useState<"nodes" | "feed" | "setup">("nodes");

  if (!isOpen || !diagram) return null;

  const summary = getNocSummary();
  const nodes = diagram.nodes;

  const filteredNodes = nodes.filter((n) => {
    if (filter === "incident") return n.data.healthStatus === "down" || n.data.healthStatus === "warning";
    if (filter === "healthy") return n.data.healthStatus === "healthy";
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickStatus = async (nodeId: string, status: NodeHealthStatus) => {
    const metric = status === "healthy" ? "22ms" : status === "warning" ? "820ms" : "500 Outage";
    const msg = status === "healthy" ? "Operational OK" : status === "warning" ? "Degraded performance" : "Critical failure";
    await triggerWebhook(diagram.id, nodeId, status, metric, msg);
  };

  const handleChaosDrill = async () => {
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    if (target) {
      await triggerWebhook(diagram.id, target.id, "down", "503 Service Unavailable", "Simulated Chaos Incident");
    }
  };

  const handleResolveAll = async () => {
    for (const n of nodes) {
      if (n.data.healthStatus === "down" || n.data.healthStatus === "warning") {
        await triggerWebhook(diagram.id, n.id, "healthy", "18ms", "Service recovered");
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-[85vh] max-h-[820px] rounded-2xl border border-[#232c3d] bg-[#0d111a] text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#232c3d] px-6 py-4 bg-[#151b27]/80">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c00000]/20 border border-[#c00000]/40 text-lg shadow-sm">
              🚨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  NOC Operations & Live Webhook Monitor
                </h2>
                <span
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isConnected
                      ? "bg-emerald-950/70 border-emerald-600/60 text-emerald-300"
                      : "bg-amber-950/70 border-amber-600/60 text-amber-300"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  {isConnected ? "Live SSE Stream" : "Connecting..."}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time API webhook binding, incident failover drills, and telemetry feed for{" "}
                <span className="text-[#ff4040] font-semibold">{diagram.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#232c3d] bg-[#151b27] text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            ✕
          </button>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-[#0a0d15] border-b border-[#232c3d]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-900/40 text-emerald-400 font-bold text-xs">
              ✓
            </span>
            <div>
              <div className="text-lg font-extrabold text-emerald-400">{summary.healthy}</div>
              <div className="text-[11px] text-slate-400 font-medium">Healthy Systems</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-900/40 bg-amber-950/20">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-900/40 text-amber-400 font-bold text-xs">
              ⚠️
            </span>
            <div>
              <div className="text-lg font-extrabold text-amber-400">{summary.warning}</div>
              <div className="text-[11px] text-slate-400 font-medium">Degraded / Warning</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/20">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-900/40 text-rose-400 font-bold text-xs">
              ✕
            </span>
            <div>
              <div className="text-lg font-extrabold text-rose-400">{summary.down}</div>
              <div className="text-[11px] text-slate-400 font-medium">Critical Outages</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleChaosDrill}
              className="px-3 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
              title="Simulate random component failure"
            >
              <span>🔥</span> Chaos Drill
            </button>
            <button
              onClick={handleResolveAll}
              className="px-3 py-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
              title="Resolve all degraded & outage services"
            >
              <span>🛡️</span> Resolve All
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-[#232c3d] px-6 py-2 bg-[#151b27]/40">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTab("nodes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === "nodes"
                  ? "bg-[#c00000] text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Monitored Nodes ({nodes.length})
            </button>
            <button
              onClick={() => setTab("feed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                tab === "feed"
                  ? "bg-[#c00000] text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Live Telemetry Feed
              {events.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold">
                  {events.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("setup")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === "setup"
                  ? "bg-[#c00000] text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Webhook Documentation & cURL
            </button>
          </div>

          {tab === "nodes" && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 text-[11px] mr-1">Filter:</span>
              <button
                onClick={() => setFilter("all")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filter === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({nodes.length})
              </button>
              <button
                onClick={() => setFilter("incident")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filter === "incident" ? "bg-rose-950 text-rose-300 border border-rose-800" : "text-slate-400 hover:text-white"
                }`}
              >
                Incidents ({summary.down + summary.warning})
              </button>
              <button
                onClick={() => setFilter("healthy")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filter === "healthy" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "text-slate-400 hover:text-white"
                }`}
              >
                Healthy ({summary.healthy})
              </button>
            </div>
          )}

          {tab === "feed" && events.length > 0 && (
            <button
              onClick={clearEvents}
              className="text-xs text-slate-400 hover:text-rose-400 transition"
            >
              Clear Log
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === "nodes" && (
            <div className="space-y-3">
              {filteredNodes.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No nodes match the selected filter.
                </div>
              ) : (
                filteredNodes.map((n) => {
                  const status = n.data.healthStatus;
                  const cfg = status ? HEALTH_STATUS_CONFIG[status] : null;
                  const webhookUrl = getWebhookEndpointUrl(diagram.id, n.id);
                  const curlCmd = generateCurlSnippet(diagram.id, n.id, "healthy");

                  return (
                    <div
                      key={n.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                        status === "down"
                          ? "bg-rose-950/20 border-rose-800/60 shadow-lg shadow-rose-950/30"
                          : status === "warning"
                          ? "bg-amber-950/20 border-amber-800/60"
                          : "bg-[#151b27]/60 border-[#232c3d] hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: cfg ? cfg.dot : "#64748b",
                            boxShadow: cfg ? `0 0 10px ${cfg.dot}` : "none",
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-xs">
                              {n.data.title}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800">
                              {n.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                            {n.data.subtitle || "Operational pipeline service"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {status && cfg ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5"
                            style={{
                              color: cfg.color,
                              backgroundColor: cfg.bg,
                              borderColor: cfg.border,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                            {cfg.label}
                            {n.data.metric && (
                              <span className="font-mono text-[10px] opacity-80">({n.data.metric})</span>
                            )}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] text-slate-500 bg-slate-800/60 border border-slate-700/40">
                            Unconfigured
                          </span>
                        )}

                        <div className="flex items-center rounded-lg bg-[#0d111a] border border-[#232c3d] p-0.5">
                          <button
                            onClick={() => handleQuickStatus(n.id, "healthy")}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-emerald-400 hover:bg-emerald-950/50 transition"
                            title="Trigger 200 OK"
                          >
                            200 OK
                          </button>
                          <button
                            onClick={() => handleQuickStatus(n.id, "warning")}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-amber-400 hover:bg-amber-950/50 transition"
                            title="Trigger 429 Degradation"
                          >
                            429 Warn
                          </button>
                          <button
                            onClick={() => handleQuickStatus(n.id, "down")}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-rose-400 hover:bg-rose-950/50 transition"
                            title="Trigger 500 Outage"
                          >
                            500 Down
                          </button>
                        </div>

                        <button
                          onClick={() => handleCopy(webhookUrl, `url_${n.id}`)}
                          className="px-2.5 py-1 rounded-lg border border-[#232c3d] bg-[#151b27] hover:border-slate-500 text-xs text-slate-300 font-medium transition flex items-center gap-1"
                          title="Copy direct POST Webhook URL"
                        >
                          <span>{copiedId === `url_${n.id}` ? "✓" : "📋"}</span>
                          <span className="hidden sm:inline">URL</span>
                        </button>

                        <button
                          onClick={() => handleCopy(curlCmd, `curl_${n.id}`)}
                          className="px-2.5 py-1 rounded-lg border border-[#232c3d] bg-[#151b27] hover:border-[#c00000] text-xs text-slate-300 font-medium transition flex items-center gap-1"
                          title="Copy ready-to-run curl command"
                        >
                          <span>{copiedId === `curl_${n.id}` ? "✓" : "⚡"}</span>
                          <span className="hidden sm:inline">cURL</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "feed" && (
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No webhook events recorded yet. Send a test webhook or trigger a status change above.
                </div>
              ) : (
                events.map((ev) => {
                  const cfg = HEALTH_STATUS_CONFIG[ev.status];
                  const targetNode = nodes.find((n) => n.id === ev.nodeId);
                  const nodeTitle = targetNode ? targetNode.data.title : ev.nodeId;

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#232c3d] bg-[#151b27]/60 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}` }}
                        />
                        <span className="text-slate-400 text-[11px]">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="font-bold text-white text-xs font-sans">
                          {nodeTitle}
                        </span>
                        <span
                          className="px-2 py-0.2 rounded-full font-bold text-[10px]"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                        {ev.metric && (
                          <span className="text-slate-300 text-[11px]">
                            {ev.metric}
                          </span>
                        )}
                        {ev.message && (
                          <span className="text-slate-400 font-sans text-[11px] truncate max-w-xs">
                            — {ev.message}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                        {ev.source}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "setup" && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl border border-[#232c3d] bg-[#151b27]/50 space-y-2">
                <h3 className="font-bold text-white text-sm">How to Bind Any External Service</h3>
                <p className="text-slate-400 leading-relaxed">
                  Every node in your flowchart possesses a persistent HTTP POST webhook endpoint. External pipelines (Stripe webhooks, GitHub Actions, Datadog alerts, LeadSquared, AWS Lambda, or custom Cron jobs) can push status payloads directly into your diagram.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">Endpoint Format:</div>
                <div className="p-3 rounded-lg bg-black/60 border border-[#232c3d] font-mono text-emerald-400 text-xs">
                  POST http://localhost:5055/api/webhooks/nodes/:diagramId/:nodeId
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">Sample JSON Payload:</div>
                <pre className="p-3 rounded-lg bg-black/60 border border-[#232c3d] font-mono text-slate-200 text-xs overflow-x-auto">
{`{
  "status": "down",              // "healthy" | "warning" | "down" | "pending"
  "metric": "502 Bad Gateway",   // Optional metric / latency display
  "message": "Payment gateway timeout after 30s" // Optional incident description
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">Sample cURL Command:</div>
                <pre className="p-3 rounded-lg bg-black/60 border border-[#232c3d] font-mono text-amber-300 text-xs overflow-x-auto whitespace-pre-wrap">
{generateCurlSnippet(diagram.id, nodes[0]?.id || "node_1", "down")}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#232c3d] px-6 py-3 bg-[#151b27]/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>FlowBuilder NOC Engine v2.0</span>
            <span>•</span>
            <span>Server-Sent Events Active on Port 5055</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#c00000] hover:bg-[#ff4040] text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
