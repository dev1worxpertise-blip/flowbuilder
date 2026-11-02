import { useEffect, useState, useCallback, useMemo } from "react";
import type { Diagram } from "../../types";
import { createEmptyDiagram } from "../../types";
import { listDiagrams, saveDiagram, deleteDiagram } from "../../db/library";
import { diagramsApi, adminApi } from "../../lib/api";
import { buildHdlTemplate } from "../../templates/hdl";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { UserMenu } from "../auth/UserMenu";
import { AdminDashboard } from "../admin/AdminDashboard";
import { TemplateModal } from "../templates/TemplateModal";

export function Gallery({ onOpen }: { onOpen: (d: Diagram) => void }) {
  const [items, setItems] = useState<Diagram[]>([]);
  const [isCloud, setIsCloud] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<"my" | "all">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "name">("updated");
  const themeMode = useThemeStore((s) => s.theme);
  const toggleThemeMode = useThemeStore((s) => s.toggleTheme);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const isAdmin = user?.role === "ADMIN";

  const refresh = useCallback(async () => {
    setLoading(true);
    if (user) {
      try {
        if (isAdmin && viewScope === "all") {
          const allList = await adminApi.getAllDiagrams();
          setItems(allList);
          setIsCloud(true);
        } else {
          const cloudList = await diagramsApi.list();
          if (cloudList.length === 0) {
            const starter = buildHdlTemplate();
            await diagramsApi.save(starter);
            setItems([starter]);
          } else {
            setItems(cloudList);
          }
          setIsCloud(true);
        }
      } catch (err) {
        console.warn("Failed to load cloud diagrams, falling back to local storage:", err);
        let list = await listDiagrams();
        if (list.length === 0) {
          await saveDiagram(buildHdlTemplate());
          list = await listDiagrams();
        }
        setItems(list);
        setIsCloud(false);
      }
    } else {
      let list = await listDiagrams();
      if (list.length === 0) {
        await saveDiagram(buildHdlTemplate());
        list = await listDiagrams();
      }
      setItems(list);
      setIsCloud(false);
    }
    setLoading(false);
  }, [user, isAdmin, viewScope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const newDiagram = async () => {
    const d = createEmptyDiagram("Untitled Flow");
    if (user) {
      try {
        await diagramsApi.save(d);
      } catch (err) {
        console.error("Cloud save failed, saving locally:", err);
        await saveDiagram(d);
      }
    } else {
      await saveDiagram(d);
    }
    onOpen(d);
  };

  const handleSelectTemplate = async (d: Diagram) => {
    if (user) {
      try {
        await diagramsApi.save(d);
      } catch (err) {
        console.error("Cloud save failed, saving locally:", err);
        await saveDiagram(d);
      }
    } else {
      await saveDiagram(d);
    }
    onOpen(d);
  };

  const handleDelete = async (id: string) => {
    if (user && isCloud) {
      try {
        await diagramsApi.delete(id);
      } catch (err) {
        console.error("Cloud delete failed:", err);
      }
    }
    await deleteDiagram(id);
    setDeleteConfirmId(null);
    await refresh();
  };

  const handleOpenDiagram = async (diagram: Diagram) => {
    if (user && isCloud) {
      try {
        const fullDiagram = await diagramsApi.get(diagram.id);
        onOpen(fullDiagram);
        return;
      } catch (err) {
        console.warn("Could not load full cloud diagram, using cached version:", err);
      }
    }
    onOpen(diagram);
  };

  // Filter & sort diagrams
  const filteredItems = useMemo(() => {
    let result = items.filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const author = (d as any).user;
      return (
        d.name.toLowerCase().includes(q) ||
        author?.name?.toLowerCase().includes(q) ||
        author?.email?.toLowerCase().includes(q)
      );
    });

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result = [...result].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return result;
  }, [items, searchQuery, sortBy]);

  const isLight = themeMode === "light";

  return (
    <div
      className={`min-h-full w-full transition-colors duration-200 select-none ${
        isLight
          ? "bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] text-slate-800"
          : "bg-gradient-to-b from-[#0d111a] via-[#111827] to-[#0a0d15] text-slate-100"
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP CORPORATE NAVBAR                                       */}
      {/* ------------------------------------------------------------- */}
      <header
        className={`sticky top-0 z-30 w-full border-b backdrop-blur-md transition-colors duration-200 ${
          isLight
            ? "bg-white/95 border-slate-200/90 shadow-xs"
            : "bg-[#0d111a]/95 border-slate-800 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          {/* Brand Identity & Badges (Left) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Worxpertise Official Logo */}
            <div
              className={`p-1 px-1.5 rounded-xl border shadow-xs flex items-center justify-center shrink-0 transition ${
                isLight ? "bg-white border-slate-200" : "bg-white/95 border-slate-700/60"
              }`}
            >
              <img
                src="https://worxpertise.com/wp-content/themes/worxpertise/assets/images/worx-header-logo.png"
                alt="Worxpertise Logo"
                className="h-5 sm:h-6 w-auto object-contain"
                onError={(e) => {
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<span class="text-xs font-black text-[#c00000] tracking-wider uppercase">Worxpertise</span>';
                  }
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1
                  className={`text-lg sm:text-xl font-black tracking-tight ${
                    isLight ? "text-[#c00000]" : "text-white"
                  }`}
                >
                  FlowBuilder
                </h1>

                {user && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${
                      isLight
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                    }`}
                    title="Diagrams sync directly to PostgreSQL cloud database"
                  >
                    ☁️ Cloud Storage
                  </span>
                )}

                {isAdmin && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                      isLight
                        ? "bg-rose-50 text-[#c00000] border-[#c00000]/25 shadow-xs"
                        : "bg-amber-950/60 text-amber-300 border-amber-800"
                    }`}
                  >
                    👑 Admin Mode
                  </span>
                )}
              </div>

              <p
                className={`text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-xs sm:max-w-md ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {user
                  ? `Signed in as ${user.name} (${user.role}) — PostgreSQL synced`
                  : "Worxpertise Flow Studio — Execute. Enable. Excel."}
              </p>
            </div>
          </div>

          {/* Right Header Controls - Compact, No Overflow, Never Overlaps */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleThemeMode}
              title={`Switch to ${isLight ? "Dark" : "Light"} Palette`}
              className={`rounded-xl px-2 sm:px-2.5 py-1.5 text-xs font-semibold border transition flex items-center gap-1 shadow-xs shrink-0 ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-700"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
              }`}
            >
              <span>{isLight ? "🌙" : "☀️"}</span>
              <span className="hidden xl:inline">{isLight ? "Dark" : "Light"}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsAdminDashboardOpen(true)}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition flex items-center gap-1 shadow-xs shrink-0 ${
                  isLight
                    ? "bg-amber-50 hover:bg-amber-100/80 border-amber-300/80 text-amber-800"
                    : "bg-amber-950/40 hover:bg-amber-900/50 border-amber-800/80 text-amber-300"
                }`}
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition flex items-center gap-1 shadow-xs shrink-0 ${
                isLight
                  ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900"
                  : "bg-[#151b27] hover:bg-slate-800 border-[#232c3d] text-slate-200 hover:text-white"
              }`}
            >
              <span>📋</span>
              <span className="hidden sm:inline">Templates</span>
            </button>

            {/* User Profile Pill Menu */}
            <UserMenu onOpenAdmin={() => setIsAdminDashboardOpen(true)} />

            {/* + New Diagram Button in Worxpertise Crimson Red */}
            <button
              onClick={newDiagram}
              className="rounded-xl bg-[#c00000] hover:bg-[#a00000] active:scale-[0.98] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-[#c00000]/25 flex items-center gap-1 shrink-0"
              title="Create a new flowchart diagram"
            >
              <span className="text-sm leading-none">+</span>
              <span className="hidden xs:inline">New Diagram</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN GALLERY BODY                                          */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Offline / Guest Mode Notice */}
        {!user && (
          <div
            className={`flex items-center justify-between rounded-2xl border p-4 text-xs transition ${
              isLight
                ? "bg-rose-50/70 border-rose-200 text-slate-700"
                : "bg-sky-950/20 border-sky-900/40 text-sky-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🚀</span>
              <span>
                <strong>Multi-User Enabled:</strong> Sign in with your Worxpertise account to sync
                diagrams to PostgreSQL, assign permissions, and collaborate with your team!
              </span>
            </div>
          </div>
        )}

        {/* Hero & Search / Filter Section */}
        <div
          className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-xs ${
            isLight
              ? "bg-white/80 border-slate-200/90 shadow-sm"
              : "bg-[#0f172a]/70 border-slate-800/80 shadow-md"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Subtitle */}
            <div>
              <h2
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Enterprise Process Workflows
              </h2>
              <p
                className={`text-xs mt-0.5 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Create, simulate, and monitor interactive business flows and architecture workflows.
              </p>
            </div>

            {/* Scope Tabs (Admin only: My vs All) */}
            {isAdmin && (
              <div
                className={`flex items-center gap-1 p-1 rounded-xl border self-start md:self-auto ${
                  isLight ? "bg-slate-100/90 border-slate-200" : "bg-slate-900 border-slate-800"
                }`}
              >
                <button
                  onClick={() => setViewScope("my")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    viewScope === "my"
                      ? "bg-[#c00000] text-white shadow-xs"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📁 My Diagrams
                </button>
                <button
                  onClick={() => setViewScope("all")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                    viewScope === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>🌐</span>
                  <span>All Users (Admin)</span>
                </button>
              </div>
            )}
          </div>

          {/* Search & Sort Row */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workflows by title, date, or author..."
                className={`w-full rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium border transition focus:outline-none ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#c00000] focus:ring-2 focus:ring-[#c00000]/15"
                    : "bg-[#151b27] border-slate-700 text-white placeholder:text-slate-500 focus:border-[#c00000]"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & Count */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <span
                className={`px-2.5 py-1 rounded-lg border font-semibold ${
                  isLight
                    ? "bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-slate-800/80 border-slate-700 text-slate-300"
                }`}
              >
                {filteredItems.length} {filteredItems.length === 1 ? "workflow" : "workflows"}
              </span>

              <div className="flex items-center gap-1.5">
                <span className={isLight ? "text-slate-500" : "text-slate-400"}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "updated" | "name")}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold border transition focus:outline-none ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-700 focus:border-[#c00000]"
                      : "bg-[#151b27] border-slate-700 text-slate-200 focus:border-[#c00000]"
                  }`}
                >
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. WORKFLOW CARDS GRID                                        */}
        {/* ------------------------------------------------------------- */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#c00000] border-r-transparent" />
            <p className={isLight ? "text-slate-500 text-sm" : "text-slate-400 text-sm"}>
              Loading workflows from database...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            className={`py-16 text-center rounded-2xl border p-8 space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-[#111827] border-slate-800"
            }`}
          >
            <span className="text-3xl block">📋</span>
            <h3
              className={`text-base font-bold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {searchQuery ? "No matching workflows found" : "No workflows in this view"}
            </h3>
            <p className={`text-xs max-w-md mx-auto ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {searchQuery
                ? `No diagrams matched "${searchQuery}". Clear your search query to see all flows.`
                : "Get started by creating your first interactive workflow diagram or picking a business template."}
            </p>
            <div className="pt-2">
              <button
                onClick={newDiagram}
                className="rounded-xl bg-[#c00000] hover:bg-[#a00000] px-4 py-2 text-xs font-bold text-white transition shadow-sm"
              >
                + Create New Diagram
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Quick Create Action Card (First Item) */}
            <div
              onClick={newDiagram}
              className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all duration-200 cursor-pointer text-center min-h-[190px] ${
                isLight
                  ? "border-slate-300 bg-white/70 hover:border-[#c00000] hover:bg-rose-50/40 shadow-xs"
                  : "border-slate-700 bg-[#151b27]/40 hover:border-[#c00000] hover:bg-[#c00000]/10 shadow-sm"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition group-hover:scale-110 shadow-sm ${
                  isLight
                    ? "bg-rose-50 text-[#c00000] group-hover:bg-[#c00000] group-hover:text-white"
                    : "bg-[#c00000]/20 text-[#ff4040] group-hover:bg-[#c00000] group-hover:text-white"
                }`}
              >
                +
              </div>
              <div
                className={`mt-3 font-bold text-sm transition ${
                  isLight ? "text-slate-800 group-hover:text-[#c00000]" : "text-white group-hover:text-[#ff4040]"
                }`}
              >
                Create New Workflow
              </div>
              <p
                className={`text-[11px] mt-0.5 ${
                  isLight ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Start with a blank canvas
              </p>
            </div>

            {/* Diagram Items */}
            {filteredItems.map((d) => {
              const author = (d as any).user;
              const nodeCount = d.nodes?.length ?? 0;
              const edgeCount = d.edges?.length ?? 0;
              const isConfirmingDelete = deleteConfirmId === d.id;

              return (
                <div
                  key={d.id}
                  className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 p-5 overflow-hidden ${
                    isLight
                      ? "bg-white border-slate-200/90 shadow-xs hover:shadow-xl hover:border-[#c00000]/60"
                      : "bg-[#111827] border-slate-800 shadow-sm hover:shadow-xl hover:border-[#c00000]/70"
                  }`}
                >
                  {/* Top Red Accent Hover Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c00000] via-[#ff4040] to-[#c00000] opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Card Content Top */}
                  <div>
                    {/* Author & Badge Row */}
                    <div className="mb-2.5 flex items-center justify-between gap-1 text-[11px]">
                      {author ? (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate max-w-[140px] border ${
                            isLight
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                          title={author.email}
                        >
                          👤 {author.name}
                        </span>
                      ) : (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${
                            isLight
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-slate-800/60 text-slate-400 border-slate-700"
                          }`}
                        >
                          📊 Flow Diagram
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border ${
                          isLight
                            ? "bg-rose-50/80 text-[#c00000] border-rose-200/60"
                            : "bg-rose-950/40 text-rose-300 border-rose-900/60"
                        }`}
                      >
                        {nodeCount} {nodeCount === 1 ? "block" : "blocks"}
                      </span>
                    </div>

                    {/* Flow Name */}
                    <h3
                      onClick={() => handleOpenDiagram(d)}
                      className={`font-bold text-sm sm:text-base leading-snug cursor-pointer transition line-clamp-2 ${
                        isLight
                          ? "text-slate-900 group-hover:text-[#c00000]"
                          : "text-white group-hover:text-[#ff4040]"
                      }`}
                      title={d.name}
                    >
                      {d.name}
                    </h3>

                    {/* Stats & Timestamp */}
                    <div
                      className={`text-[11px] mt-2.5 space-y-1 ${
                        isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">🕒</span>
                        <span>{new Date(d.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                        <span>{nodeCount} Components</span>
                        <span>•</span>
                        <span>{edgeCount} Connectors</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Bottom */}
                  <div
                    className={`mt-4 pt-3 border-t flex items-center gap-2 ${
                      isLight ? "border-slate-100" : "border-slate-800/80"
                    }`}
                  >
                    <button
                      className="flex-1 rounded-xl bg-[#c00000] hover:bg-[#a00000] active:scale-[0.98] px-3.5 py-2 text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5"
                      onClick={() => handleOpenDiagram(d)}
                      title={`Open "${d.name}" in editor`}
                    >
                      <span>Open Flow</span>
                      <span className="text-[10px]">→</span>
                    </button>

                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1">
                        <button
                          className="rounded-xl bg-red-600 hover:bg-red-700 px-2.5 py-2 text-[11px] font-bold text-white transition"
                          onClick={() => handleDelete(d.id)}
                          title="Confirm deletion"
                        >
                          Confirm
                        </button>
                        <button
                          className={`rounded-xl px-2 py-2 text-[11px] font-semibold border transition ${
                            isLight
                              ? "bg-slate-100 text-slate-600 border-slate-300"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                          onClick={() => setDeleteConfirmId(null)}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className={`rounded-xl px-2.5 py-2 text-xs font-semibold border transition flex items-center justify-center ${
                          isLight
                            ? "border-slate-200 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-red-400 hover:bg-red-950/40 hover:border-red-800/60"
                        }`}
                        onClick={() => setDeleteConfirmId(d.id)}
                        title="Delete this workflow"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODALS (ADMIN DASHBOARD & TEMPLATES)                        */}
      {/* ------------------------------------------------------------- */}
      {isAdminDashboardOpen && (
        <AdminDashboard
          onClose={() => setIsAdminDashboardOpen(false)}
          onOpenDiagram={onOpen}
        />
      )}

      {isTemplateModalOpen && (
        <TemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      )}
    </div>
  );
}
