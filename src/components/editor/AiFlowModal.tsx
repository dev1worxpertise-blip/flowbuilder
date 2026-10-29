import { useState } from "react";
import { createPortal } from "react-dom";
import { generateFlowFromText, type GeneratedFlowResult } from "../../lib/aiFlowGenerator";
import { useEditorStore } from "../../store/editorStore";
import type { LayoutDirection } from "../../lib/autoLayout";

const PRESET_PROMPTS = [
  {
    icon: "💳",
    title: "FinTech Loan & KYC",
    prompt: "Customer applies for personal loan -> OCR ID verification -> Credit Score > 750? -> Auto disburse or manual underwriting -> Loan account activated",
  },
  {
    icon: "🚨",
    title: "IT Outage & Incident",
    prompt: "Datadog Alert triggered -> Automated ping check -> P1 Critical Outage? -> Page on-call team & open war room -> Rollback or patch -> RCA post-mortem",
  },
  {
    icon: "🛒",
    title: "E-Commerce Return & Refund",
    prompt: "Customer requests item return -> Within 30 days? -> Generate return waybill -> Warehouse QA inspection -> Passed inspection? -> Bank refund reversed",
  },
  {
    icon: "🏖️",
    title: "Employee Leave Approval",
    prompt: "Employee submits leave dates -> Check PTO balance -> Sufficient balance? -> Manager approval? -> Sync calendar & payroll update",
  },
  {
    icon: "🔐",
    title: "Zero-Trust User Auth",
    prompt: "User inputs credentials -> Password valid? -> Check MFA token -> Geo-IP risk high? -> Prompt biometric verify -> Issue JWT session token",
  },
];

export function AiFlowModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [direction, setDirection] = useState<LayoutDirection>("LR");
  const [insertMode, setInsertMode] = useState<"replace" | "append">("replace");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewResult, setPreviewResult] = useState<GeneratedFlowResult | null>(null);

  const diagram = useEditorStore((s) => s.diagram);
  const setNodes = useEditorStore((s) => s.setNodes);
  const setEdges = useEditorStore((s) => s.setEdges);
  const setName = useEditorStore((s) => s.setName);
  const commitSnapshot = useEditorStore((s) => s.commitSnapshot);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    // Simulate snappy AI synthesis with realistic 350ms delay
    setTimeout(() => {
      const result = generateFlowFromText(prompt, { direction });
      setPreviewResult(result);
      setIsGenerating(false);
    }, 350);
  };

  const handleApply = () => {
    if (!previewResult) return;

    if (insertMode === "replace" || !diagram) {
      setName(previewResult.name);
      setNodes(previewResult.nodes);
      setEdges(previewResult.edges);
    } else {
      // Append mode: offset coordinates of generated nodes so they don't collide
      const maxX = diagram.nodes.reduce((max, n) => Math.max(max, n.position.x + (n.data.width || 200)), 0);
      const offsetY = 50;
      const offsetX = maxX + 100;

      const shiftedNodes = previewResult.nodes.map((n) => ({
        ...n,
        id: `appended_${n.id}_${Date.now().toString().slice(-4)}`,
        position: {
          x: n.position.x + offsetX,
          y: n.position.y + offsetY,
        },
      }));

      // Map edges to new node IDs
      const idMap = new Map(previewResult.nodes.map((n, i) => [n.id, shiftedNodes[i].id]));
      const shiftedEdges = previewResult.edges.map((e, idx) => ({
        ...e,
        id: `appended_edge_${idx}_${Date.now().toString().slice(-4)}`,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
      }));

      setNodes([...diagram.nodes, ...shiftedNodes]);
      setEdges([...diagram.edges, ...shiftedEdges]);
    }

    commitSnapshot();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#232c3d] bg-[#0d111a] p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#232c3d]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c00000]/15 border border-[#c00000]/40 text-[#ff4040] text-xl shadow-inner">
              ✨
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Workflow Generator
                <span className="rounded-full bg-[#c00000]/20 border border-[#c00000]/50 px-2 py-0.5 text-[10px] font-semibold text-[#ffbfbf]">
                  Worxpertise Intelligence
                </span>
              </h2>
              <p className="text-xs text-[#858591] mt-0.5">
                Describe any process, system architecture, or decision logic in plain English to generate a live flowchart.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Prompt Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>What workflow would you like to create?</span>
              <span className="text-[10px] text-[#858591]">Supports arrows (&rarr;), numbers, or natural sentences</span>
            </label>
            <textarea
              autoFocus
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. User submits KYC application -> Verify Aadhaar/PAN OCR -> Score >= 700? Yes -> Auto approve and issue debit card. No -> Route to branch manager review."
              className="w-full rounded-xl border border-[#232c3d] bg-[#151b27] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#c00000] focus:ring-1 focus:ring-[#c00000] focus:outline-none transition leading-relaxed resize-none"
            />
          </div>

          {/* Quick Preset Pills */}
          <div>
            <div className="text-[11px] font-semibold text-[#858591] uppercase tracking-wider mb-2">
              Instant Workflow Presets
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => {
                    setPrompt(p.prompt);
                    setPreviewResult(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#232c3d] bg-[#151b27] px-2.5 py-1.5 text-xs text-slate-300 hover:border-[#c00000]/60 hover:text-white transition"
                >
                  <span>{p.icon}</span>
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#232c3d]">
            {/* Direction */}
            <div>
              <label className="block text-[11px] font-semibold text-[#858591] mb-1">Layout Direction</label>
              <div className="flex rounded-lg border border-[#232c3d] bg-[#151b27] p-1">
                <button
                  type="button"
                  onClick={() => setDirection("LR")}
                  className={`flex-1 rounded py-1 text-xs font-medium transition ${
                    direction === "LR"
                      ? "bg-[#c00000] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Horizontal (Left → Right)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("TB")}
                  className={`flex-1 rounded py-1 text-xs font-medium transition ${
                    direction === "TB"
                      ? "bg-[#c00000] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Vertical (Top ↓ Down)
                </button>
              </div>
            </div>

            {/* Canvas Target Mode */}
            <div>
              <label className="block text-[11px] font-semibold text-[#858591] mb-1">Canvas Placement</label>
              <div className="flex rounded-lg border border-[#232c3d] bg-[#151b27] p-1">
                <button
                  type="button"
                  onClick={() => setInsertMode("replace")}
                  className={`flex-1 rounded py-1 text-xs font-medium transition ${
                    insertMode === "replace"
                      ? "bg-[#c00000] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Replace Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setInsertMode("append")}
                  className={`flex-1 rounded py-1 text-xs font-medium transition ${
                    insertMode === "append"
                      ? "bg-[#c00000] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  + Append to Current
                </button>
              </div>
            </div>
          </div>

          {/* Generated Preview Summary Banner */}
          {previewResult && (
            <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-3 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-base">🎉</span>
                <div>
                  <div className="font-bold text-white">{previewResult.name}</div>
                  <div className="text-[11px] text-emerald-400">
                    Generated {previewResult.summary.nodeCount} blocks, {previewResult.summary.edgeCount} connectors, and {previewResult.summary.decisionCount} decision branches with automatic layout.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">
                Ready to Apply
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#232c3d]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#232c3d] bg-[#151b27] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!previewResult ? (
              <button
                type="button"
                disabled={!prompt.trim() || isGenerating}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 rounded-lg bg-[#c00000] hover:bg-[#ff4040] disabled:opacity-50 disabled:hover:bg-[#c00000] px-4 py-2 text-xs font-bold text-white transition shadow-md shadow-[#c00000]/30"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Synthesizing Flow...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Generate Flowchart</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  ↺ Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition shadow-md shadow-emerald-600/30"
                >
                  <span>✓</span>
                  <span>Insert into Canvas</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
