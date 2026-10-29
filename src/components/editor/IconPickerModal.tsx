import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { POPULAR_ICONS, ICON_CATEGORIES, type IconItem } from "../../lib/iconLibrary";

export function IconPickerModal({
  currentIconify,
  currentEmoji,
  onSelect,
  onClose,
}: {
  currentIconify?: string;
  currentEmoji?: string;
  onSelect: (selected: { iconify?: string; icon?: string }) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [customInput, setCustomInput] = useState("");

  const filteredIcons = useMemo(() => {
    return POPULAR_ICONS.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesSearch =
        search.trim() === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const handleSelect = (item: IconItem) => {
    if (item.isEmoji) {
      onSelect({ icon: item.id, iconify: undefined });
    } else {
      onSelect({ iconify: item.id, icon: undefined });
    }
    onClose();
  };

  const handleApplyCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onSelect({ iconify: trimmed, icon: undefined });
    onClose();
  };

  const handleClear = () => {
    onSelect({ iconify: undefined, icon: undefined });
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-[#0d121f] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-[#0a0e1a]">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-base font-bold text-gray-100">Choose Block Icon</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Search & Categories */}
        <div className="border-b border-gray-800 bg-[#0b0f19] p-4 space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-gray-500">🔍</span>
            <input
              autoFocus
              type="text"
              placeholder="Search icons (e.g. AWS, Docker, React, Database, Security)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900/90 pl-9 pr-4 py-2 text-xs text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ICON_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  category === cat.id
                    ? "bg-sky-500 text-slate-950 font-semibold shadow-sm"
                    : "bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredIcons.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No matching icons found for "{search}". You can still type a custom Iconify ID below!
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {filteredIcons.map((item) => {
                const isCurrent =
                  (item.isEmoji && currentEmoji === item.id) ||
                  (!item.isEmoji && currentIconify === item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition hover:scale-105 ${
                      isCurrent
                        ? "border-sky-500 bg-sky-950/50 shadow-md ring-1 ring-sky-500/50"
                        : "border-gray-800 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/80"
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center">
                      {item.isEmoji ? (
                        <span className="text-2xl leading-none">{item.id}</span>
                      ) : (
                        <Icon icon={item.id} width={30} height={30} />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-300 truncate max-w-full font-medium">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Input & Footer */}
        <div className="border-t border-gray-800 bg-[#0a0e1a] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <span className="text-xs text-gray-400 whitespace-nowrap">Custom ID:</span>
            <input
              type="text"
              placeholder="e.g. logos:deno or carbon:ibm-cloud"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full sm:w-60 rounded-lg border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:border-sky-500 focus:outline-none"
            />
            {customInput && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-700 bg-gray-900">
                <Icon icon={customInput.trim()} width={18} height={18} />
              </div>
            )}
            <button
              onClick={handleApplyCustom}
              disabled={!customInput.trim()}
              className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white px-3 py-1.5 text-xs font-semibold transition"
            >
              Apply
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(currentIconify || currentEmoji) && (
              <button
                onClick={handleClear}
                className="rounded-lg border border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-900/50 px-3 py-1.5 text-xs font-medium transition"
              >
                Clear Icon
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-1.5 text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
