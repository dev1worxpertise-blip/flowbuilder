import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { useReactFlow } from "@xyflow/react";
import { useEditorStore } from "../../store/editorStore";
import {
  NODE_LABELS,
  HEALTH_STATUS_CONFIG,
  type FlowNode,
  type NodeHealthStatus,
  type NodeKind,
} from "../../types";
import { HealthBadge } from "../nodes/HealthBadge";

interface NodeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (id: string) => void;
}

export function NodeSearchModal({ isOpen, onClose, onSelectNode }: NodeSearchModalProps) {
  const diagram = useEditorStore((s) => s.diagram);
  const flashNode = useEditorStore((s) => s.flashNode);
  const { setCenter } = useReactFlow();

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<NodeHealthStatus | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setFilterStatus("all");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const nodes = useMemo(() => diagram?.nodes ?? [], [diagram?.nodes]);

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nodes.filter((node) => {
      // Status filter
      if (filterStatus !== "all" && node.data.healthStatus !== filterStatus) {
        return false;
      }
      if (!q) return true;

      const title = (node.data.title || "").toLowerCase();
      const subtitle = (node.data.subtitle || "").toLowerCase();
      const kind = (node.type || "").toLowerCase();
      const kindLabel = (NODE_LABELS[node.type as NodeKind] || "").toLowerCase();
      const status = (node.data.healthStatus || "").toLowerCase();
      const metric = (node.data.metric || "").toLowerCase();
      const icon = (node.data.iconify || node.data.icon || "").toLowerCase();

      return (
        title.includes(q) ||
        subtitle.includes(q) ||
        kind.includes(q) ||
        kindLabel.includes(q) ||
        status.includes(q) ||
        metric.includes(q) ||
        icon.includes(q)
      );
    });
  }, [nodes, query, filterStatus]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex((prev) => (filteredNodes.length > 0 ? Math.min(prev, filteredNodes.length - 1) : 0));
  }, [filteredNodes.length]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (typeof activeEl?.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (node: FlowNode) => {
    const w = node.data.width || 180;
    const h = node.data.height || 80;
    const centerX = node.position.x + w / 2;
    const centerY = node.position.y + h / 2;

    // Smoothly fly camera to center and zoom on node
    setCenter(centerX, centerY, { duration: 600, zoom: 1.25 });

    // Select the node in inspector/canvas
    onSelectNode(node.id);

    // Trigger visual spotlight glowing pulse
    flashNode(node.id, 2600);

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredNodes.length ? (prev + 1) % filteredNodes.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredNodes.length ? (prev - 1 + filteredNodes.length) % filteredNodes.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredNodes[selectedIndex]) {
        handleSelect(filteredNodes[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Canvas Quick Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-black/70 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-700/80 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="relative border-b border-gray-800 p-4">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-gray-400 text-base">🔍</span>
            <input
              ref={inputRef}
              type="text"
              role="searchbox"
              aria-label="Search canvas blocks"
              placeholder="Search blocks by title, subtitle, kind, or status (e.g. healthy, db, worker)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full rounded-xl border border-gray-700 bg-gray-900/90 pl-11 pr-20 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-gray-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              )}
              <kbd className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-400">
                ESC
              </kbd>
            </div>
          </div>

          {/* Quick Filter Status Pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto text-xs pb-0.5">
            <span className="text-[11px] text-gray-500 font-medium shrink-0 mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => {
                setFilterStatus("all");
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition shrink-0 ${
                filterStatus === "all"
                  ? "bg-sky-500 text-white font-semibold shadow-sm"
                  : "bg-gray-800/80 text-gray-400 hover:text-gray-200 border border-gray-700/60"
              }`}
            >
              All ({nodes.length})
            </button>
            {(Object.entries(HEALTH_STATUS_CONFIG) as [NodeHealthStatus, typeof HEALTH_STATUS_CONFIG[NodeHealthStatus]][]).map(([st, cfg]) => {
              const count = nodes.filter((n) => n.data.healthStatus === st).length;
              if (count === 0 && filterStatus !== st) return null;
              const isSelected = filterStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setFilterStatus(isSelected ? "all" : st);
                    setSelectedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? "ring-1 font-semibold"
                      : "bg-gray-800/80 text-gray-300 hover:text-white border border-gray-700/60"
                  }`}
                  style={isSelected ? {
                    backgroundColor: cfg.bg,
                    borderColor: cfg.border,
                    color: cfg.color,
                  } : undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  <span>{cfg.label} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNodes.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <div className="text-2xl mb-2">🔍</div>
              <p className="font-medium text-gray-400">No blocks found matching "{query}"</p>
              <p className="text-xs text-gray-600 mt-1">Try searching by card title, subtitle, or kind.</p>
            </div>
          ) : (
            filteredNodes.map((node, idx) => {
              const isSelected = idx === selectedIndex;
              const kindLabel = NODE_LABELS[node.type as NodeKind] ?? node.type;

              return (
                <div
                  key={node.id}
                  data-index={idx}
                  onClick={() => handleSelect(node)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? "border-sky-500/80 bg-sky-950/40 text-white shadow-md ring-1 ring-sky-500/30"
                      : "border-transparent bg-gray-900/40 text-gray-300 hover:bg-gray-800/60 hover:border-gray-700/50"
                  }`}
                >
                  {/* Left: Icon + Title & Subtitle */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-800 border border-gray-700/80 text-base shadow-sm">
                      {node.data.iconify ? (
                        <Icon icon={node.data.iconify} width={22} height={22} />
                      ) : node.data.icon ? (
                        <span className="text-lg leading-none">{node.data.icon}</span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">
                          {node.data.title.charAt(0) || "■"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate text-gray-100 group-hover:text-white">
                          {node.data.title || "Untitled Block"}
                        </span>
                        <span className="rounded bg-gray-800/90 border border-gray-700 px-1.5 py-0.2 text-[10px] font-medium text-gray-400">
                          {kindLabel}
                        </span>
                      </div>
                      {node.data.subtitle && (
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {node.data.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Health Badge & Coordinates */}
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {node.data.healthStatus && (
                      <HealthBadge
                        status={node.data.healthStatus}
                        metric={node.data.metric}
                        size="sm"
                      />
                    )}
                    <div className="hidden sm:flex flex-col items-end text-[10px] text-gray-500 font-mono">
                      <span>x: {Math.round(node.position.x)}, y: {Math.round(node.position.y)}</span>
                    </div>
                    <span className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition">
                      Jump →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-800/80 bg-gray-950/80 px-4 py-2.5 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-gray-300">{filteredNodes.length}</strong> block{filteredNodes.length === 1 ? "" : "s"} found
            </span>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-800 bg-gray-900 px-1 py-0.2 font-mono text-[10px] text-gray-400">↑</kbd>
              <kbd className="rounded border border-gray-800 bg-gray-900 px-1 py-0.2 font-mono text-[10px] text-gray-400">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-800 bg-gray-900 px-1 py-0.2 font-mono text-[10px] text-gray-400">↵ Enter</kbd>
              <span>to jump</span>
            </span>
          </div>
          <span className="text-gray-400 font-medium">Spotlight Canvas Search</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
