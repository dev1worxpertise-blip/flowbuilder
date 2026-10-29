import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { ChangePasswordModal } from "./ChangePasswordModal";

export function UserMenu({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center shrink-0">
        <button
          onClick={() => setAuthModalOpen(true, "login")}
          className="rounded-lg bg-[#c00000] hover:bg-[#ff4040] px-2.5 py-1 text-xs font-bold text-white transition shrink-0 shadow-md shadow-[#c00000]/30 flex items-center gap-1"
          title="Sign in to save and sync diagrams"
        >
          <span>👤</span>
          <span>Sign In</span>
        </button>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-[#232c3d] bg-[#151b27] px-2 py-1 text-xs text-slate-200 hover:border-slate-500 hover:text-white transition shrink-0"
        title={`${user.name} (${user.role})`}
      >
        <span
          className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full font-bold text-[10px] text-white shadow-sm ${
            isAdmin ? "bg-amber-600" : "bg-[#c00000]"
          }`}
        >
          {initials}
        </span>
        <span className="hidden 2xl:inline max-w-[100px] truncate font-medium text-xs">
          {user.name}
        </span>
        {isAdmin && (
          <span className="hidden 2xl:inline rounded bg-amber-950/70 border border-amber-800 text-amber-300 px-1 py-0.2 text-[9px] font-bold">
            ADMIN
          </span>
        )}
        <span className="text-slate-400 text-[9px]">▼</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-800 bg-[#0f172a] py-1 shadow-2xl z-50 text-xs">
          <div className="border-b border-gray-800 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-200 truncate">{user.name}</p>
              {isAdmin && <span className="text-[10px] text-amber-400 font-bold">👑 Admin</span>}
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
          </div>

          {isAdmin && onOpenAdmin && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full text-left px-3 py-2 text-sky-400 hover:bg-sky-950/30 transition flex items-center gap-2 border-b border-gray-800/60"
            >
              <span>⚙️</span> Admin Dashboard
            </button>
          )}

          <button
            onClick={() => {
              setMenuOpen(false);
              setShowChangePassword(true);
            }}
            className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 transition flex items-center gap-2 border-b border-gray-800/60"
          >
            <span>🔑</span> Change Password
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/30 transition flex items-center gap-2"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}

      {showChangePassword && (
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
