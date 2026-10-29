import { createPortal } from "react-dom";

export function ShortcutsHelpModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: "Ctrl + F", desc: "Find block on canvas (Spotlight Search)" },
    { key: "Ctrl + Z", desc: "Undo last change" },
    { key: "Ctrl + Y  /  Ctrl + Shift + Z", desc: "Redo change" },
    { key: "Ctrl + C", desc: "Copy selected block" },
    { key: "Ctrl + V", desc: "Paste copied block at offset" },
    { key: "Ctrl + D", desc: "Duplicate selected block instantly" },
    { key: "Delete / Backspace", desc: "Delete selected block or connector" },
    { key: "Esc", desc: "Deselect block / Exit present mode" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-800 bg-[#0f172a] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⌨️</span>
            <h3 className="text-sm font-bold text-gray-200">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-base font-bold transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-800/80 bg-gray-900/60 px-3 py-2 text-xs"
            >
              <span className="text-gray-300 font-medium">{s.desc}</span>
              <kbd className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-300 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-gray-800 text-center">
          <button
            onClick={onClose}
            className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
