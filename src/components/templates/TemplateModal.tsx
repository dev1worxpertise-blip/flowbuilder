import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { TEMPLATE_CATALOG } from "../../templates/templates";
import type { Diagram } from "../../types";

export function TemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (diagram: Diagram) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = useMemo(() => {
    const cats = new Set(TEMPLATE_CATALOG.map((t) => t.category));
    return ["All", ...Array.from(cats)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return TEMPLATE_CATALOG.filter((t) => {
      const matchesCategory =
        selectedCategory === "All" || t.category === selectedCategory;
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[85vh] rounded-2xl border border-gray-800 bg-[#0d121f] shadow-2xl text-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-gray-950/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-xl">
              📋
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-100">
                Template Library
              </h2>
              <p className="text-xs text-gray-400">
                Choose a production-ready workflow template to jumpstart your diagram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-800/80 px-6 py-3.5 bg-gray-950/20">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? "bg-sky-600 text-white shadow-sm font-semibold"
                    : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900/40 p-5 hover:border-sky-500/50 hover:bg-gray-900/80 transition shadow-sm hover:shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-800/70 text-2xl border border-gray-700/60 shadow-inner group-hover:scale-105 transition">
                    {template.icon}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-sky-950/60 border border-sky-800/60 px-2.5 py-0.5 text-[10px] font-medium text-sky-300">
                      {template.category}
                    </span>
                    <span className="rounded-full bg-gray-800 border border-gray-700 px-2 py-0.5 text-[10px] text-gray-400">
                      {template.nodeCount} steps
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-gray-100 group-hover:text-sky-300 transition">
                  {template.name}
                </h3>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                  {template.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Ready to customize & animate
                </span>
                <button
                  onClick={() => {
                    const built = template.build();
                    onSelectTemplate(built);
                    onClose();
                  }}
                  className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500 active:scale-95 transition"
                >
                  Use Template →
                </button>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 text-xs">
              No templates found matching "{searchQuery}".
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
