import { useState } from "react";
import { createPortal } from "react-dom";
import type { Diagram } from "../../types";
import { diagramsApi } from "../../lib/api";

export function ShareModal({
  diagram,
  isOpen,
  onClose,
}: {
  diagram: Diagram;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const shareUrl = `${window.location.origin}/share/${diagram.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  const handleTogglePublic = async () => {
    setLoading(true);
    try {
      const res = await diagramsApi.toggleShare(diagram.id, !isPublic);
      setIsPublic(res.isPublic);
    } catch (e) {
      console.error("Failed to toggle share status:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-lg rounded-2xl border border-gray-800 bg-[#0d121f] shadow-2xl text-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-gray-950/40">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-lg">
              🔗
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-100">Share Flowchart</h2>
              <p className="text-[11px] text-gray-400">Generate an interactive read-only link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Public Access Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div>
              <div className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                <span>🌐</span> Public Access
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Anyone with the link can view & simulate this diagram without logging in.
              </p>
            </div>
            <button
              onClick={handleTogglePublic}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPublic ? "bg-sky-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Share Link Input & Copy */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Interactive View Link
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-sky-300 font-mono focus:outline-none truncate selection:bg-sky-500/30"
              />
              <button
                onClick={handleCopy}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold shadow transition flex items-center gap-1.5 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-sky-600 hover:bg-sky-500 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <span>✓</span> Copied!
                  </>
                ) : (
                  <>
                    <span>📋</span> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Features info card */}
          <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 p-3.5 text-xs text-gray-300 space-y-1.5">
            <div className="font-semibold text-sky-400 flex items-center gap-1">
              <span>✨</span> What viewers can do:
            </div>
            <ul className="text-[11px] text-gray-400 space-y-1 list-disc list-inside">
              <li>Pan, zoom, and inspect full flowchart details</li>
              <li>Run the interactive <strong>Step-by-Step Flow Simulation</strong></li>
              <li>View in full-screen presentation mode</li>
              <li>Diagram is protected in <strong>read-only mode</strong> (cannot be edited)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-800 px-6 py-3 bg-gray-950/30">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
