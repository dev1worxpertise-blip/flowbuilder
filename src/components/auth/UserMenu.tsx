import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { ChangePasswordModal } from "./ChangePasswordModal";

export function UserMenu({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";
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
          className="rounded-lg bg-[#c00000] hover:bg-[#a50000] active:scale-95 px-2.5 py-1 text-xs font-bold text-white transition shrink-0 shadow-sm flex items-center gap-1.5"
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
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition shrink-0 ${
          isDark
            ? "border border-[#232c3d] bg-[#151b27] text-slate-200 hover:border-slate-500 hover:text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900 shadow-xs"
        }`}
        title={`${user.name} (${user.role})`}
      >
        <span
          className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full font-bold text-[10px] text-white shadow-sm ${
            isAdmin ? "bg-amber-600" : "bg-[#c00000]"
          }`}
        >
          {initials}
        </span>
        <span className="hidden xl:inline max-w-[90px] truncate font-medium text-xs">
          {user.name}
        </span>
        {isAdmin && (
          <span className={`hidden xl:inline rounded px-1 py-0.2 text-[9px] font-bold ${
            isDark
              ? "bg-amber-950/70 border border-amber-800 text-amber-300"
              : "bg-amber-100 border border-amber-300 text-amber-800"
          }`}>
            ADMIN
          </span>
        )}
        <span className="text-slate-400 text-[9px]">▼</span>
      </button>

      {menuOpen && (
        <div
          className={`absolute right-0 mt-2 w-52 rounded-xl border py-1 shadow-2xl z-50 text-xs animate-in fade-in ${
            isDark
              ? "border-gray-800 bg-[#0f172a] text-slate-200"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          <div className={`border-b px-3 py-2 ${isDark ? "border-gray-800" : "border-slate-100"}`}>
            <div className="flex items-center justify-between">
              <p className={`font-semibold truncate ${isDark ? "text-gray-200" : "text-slate-900"}`}>{user.name}</p>
              {isAdmin && <span className="text-[10px] text-amber-500 font-bold">👑 Admin</span>}
            </div>
            <p className={`text-[11px] truncate mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{user.email}</p>
          </div>

          {isAdmin && onOpenAdmin && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenAdmin();
              }}
              className={`w-full text-left px-3 py-2 transition flex items-center gap-2 border-b ${
                isDark
                  ? "text-sky-400 hover:bg-sky-950/30 border-gray-800/60"
                  : "text-sky-600 hover:bg-sky-50 border-slate-100"
              }`}
            >
              <span>⚙️</span> Admin Dashboard
            </button>
          )}

          <button
            onClick={() => {
              setMenuOpen(false);
              setShowChangePassword(true);
            }}
            className={`w-full text-left px-3 py-2 transition flex items-center gap-2 border-b ${
              isDark
                ? "text-slate-300 hover:bg-slate-800 border-gray-800/60"
                : "text-slate-700 hover:bg-slate-50 border-slate-100"
            }`}
          >
            <span>🔑</span> Change Password
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className={`w-full text-left px-3 py-2 transition flex items-center gap-2 ${
              isDark
                ? "text-red-400 hover:bg-red-950/30"
                : "text-red-600 hover:bg-red-50"
            }`}
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
