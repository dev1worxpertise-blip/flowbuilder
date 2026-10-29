import { useEffect, useState, useCallback } from "react";
import type { Diagram } from "../../types";
import { createEmptyDiagram } from "../../types";
import { listDiagrams, saveDiagram, deleteDiagram } from "../../db/library";
import { diagramsApi, adminApi } from "../../lib/api";
import { buildHdlTemplate } from "../../templates/hdl";
import { useAuthStore } from "../../store/authStore";
import { UserMenu } from "../auth/UserMenu";
import { AdminDashboard } from "../admin/AdminDashboard";
import { TemplateModal } from "../templates/TemplateModal";

export function Gallery({ onOpen }: { onOpen: (d: Diagram) => void }) {
  const [items, setItems] = useState<Diagram[]>([]);
  const [isCloud, setIsCloud] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<"my" | "all">("my");
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-white/95 px-2.5 py-1 rounded-xl border border-slate-700/50 shadow-sm flex items-center shrink-0">
              <img
                src="https://worxpertise.com/wp-content/themes/worxpertise/assets/images/worx-header-logo.png"
                alt="Worxpertise Logo"
                className="h-6 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              FlowBuilder
            </h1>
            {user && (
              <span className="rounded-full bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                ☁️ Cloud Storage
              </span>
            )}
            {isAdmin && (
              <span className="rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1">
                👑 Admin Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {user
              ? `Signed in as ${user.name} (${user.role}) — diagrams sync to PostgreSQL`
              : "Worxpertise Flow Studio — Execute. Enable. Excel."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsAdminDashboardOpen(true)}
              className="rounded-lg border border-amber-800/80 bg-amber-950/40 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 hover:border-amber-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>⚙️</span> Admin Dashboard
            </button>
          )}
          <UserMenu onOpenAdmin={() => setIsAdminDashboardOpen(true)} />
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="rounded-lg border border-[#232c3d] bg-[#151b27] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <span>📋</span> Templates
          </button>
          <button
            className="rounded-lg bg-[#c00000] hover:bg-[#ff4040] px-4 py-2 text-sm font-bold text-white transition shadow-md shadow-[#c00000]/30"
            onClick={newDiagram}
          >
            + New Diagram
          </button>
        </div>
      </div>

      {!user && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-sky-900/40 bg-sky-950/20 p-4 text-xs text-sky-300">
          <div className="flex items-center gap-2">
            <span className="text-base">🚀</span>
            <span>
              <strong>Multi-user enabled:</strong> Create an account or sign in to save diagrams to PostgreSQL and collaborate!
            </span>
          </div>
        </div>
      )}

      {/* Admin Scope Filter Tabs */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewScope("my")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              viewScope === "my"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-gray-200"
            }`}
          >
            📁 My Diagrams
          </button>
          <button
            onClick={() => setViewScope("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
              viewScope === "all"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>🌐</span> All Users' Diagrams (Admin View)
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-500">Loading diagrams...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-500">
          {viewScope === "all"
            ? "No diagrams created by any user in the system yet."
            : "No diagrams found. Click \"+ New Diagram\" to create your first workflow!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((d) => {
            const author = (d as any).user;
            return (
              <div
                key={d.id}
                className="group flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-gray-700 transition"
              >
                <div>
                  {author && (
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <span className="rounded bg-sky-950/60 border border-sky-800/80 px-1.5 py-0.5 text-[10px] text-sky-300 font-medium truncate max-w-[140px]">
                        👤 {author.name}
                      </span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                        {author.email}
                      </span>
                    </div>
                  )}

                  <div className="font-semibold text-gray-200 group-hover:text-sky-300 transition truncate">
                    {d.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <span>🕒</span>
                    <span>{new Date(d.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2 pt-3 border-t border-gray-800/80">
                  <button
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-gray-500 hover:bg-gray-800 transition"
                    onClick={() => handleOpenDiagram(d)}
                  >
                    Open Flow
                  </button>
                  <button
                    className="rounded-lg border border-gray-700/60 bg-transparent px-3 py-1.5 text-xs text-red-400 hover:border-red-500/50 hover:bg-red-950/30 transition"
                    onClick={() => handleDelete(d.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {isAdminDashboardOpen && (
        <AdminDashboard
          onClose={() => setIsAdminDashboardOpen(false)}
          onOpenDiagram={onOpen}
        />
      )}

      {/* Template Library Modal */}
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
