import { useEffect, useState } from "react";
import type { Diagram } from "./types";
import { useEditorStore } from "./store/editorStore";
import { useAuthStore } from "./store/authStore";
import { Gallery } from "./components/gallery/Gallery";
import { EditorView } from "./components/editor/EditorView";
import { AuthModal } from "./components/auth/AuthModal";
import { ShareView } from "./components/share/ShareView";

function getShareId(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/share\/([^/]+)/);
  if (match) return match[1];
  const params = new URLSearchParams(window.location.search);
  return params.get("share");
}

export default function App() {
  const [shareId, setShareId] = useState<string | null>(getShareId());
  const [view, setView] = useState<"gallery" | "editor" | "share">(shareId ? "share" : "gallery");
  const loadDiagram = useEditorStore((s) => s.loadDiagram);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  useEffect(() => {
    const handlePopState = () => {
      const id = getShareId();
      setShareId(id);
      if (id) setView("share");
      else setView("gallery");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const open = (d: Diagram) => {
    loadDiagram(d);
    setView("editor");
  };

  const handleGoHome = () => {
    window.history.pushState({}, "", "/");
    setShareId(null);
    setView("gallery");
  };

  return (
    <div className="h-full w-full overflow-hidden">
      {view === "share" && shareId ? (
        <ShareView diagramId={shareId} onGoHome={handleGoHome} />
      ) : view === "gallery" ? (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
          <Gallery onOpen={open} />
        </div>
      ) : (
        <EditorView onBack={() => setView("gallery")} />
      )}
      <AuthModal />
    </div>
  );
}
