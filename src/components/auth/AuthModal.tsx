import { useState } from "react";
import { useAuthStore } from "../../store/authStore";

export function AuthModal() {
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen);
  const authModalTab = useAuthStore((s) => s.authModalTab);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const error = useAuthStore((s) => s.error);
  const successMessage = useAuthStore((s) => s.successMessage);
  const clearError = useAuthStore((s) => s.clearError);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [tab, setTab] = useState<"login" | "register" | "reset">(authModalTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "login") {
      await login(email, password);
    } else if (tab === "register") {
      await register(name, email, password);
    } else {
      const ok = await resetPassword(email, newPassword);
      if (ok) {
        setTab("login");
        setPassword("");
      }
    }
  };

  const switchTab = (t: "login" | "register" | "reset") => {
    setTab(t);
    clearError();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-[#232c3d] bg-[#0d111a] p-6 shadow-2xl text-slate-100">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold transition"
          title="Close modal"
        >
          ✕
        </button>

        {/* Worxpertise Header Brand */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-white/95 px-2 py-0.5 rounded border border-slate-700/40 shadow-sm flex items-center">
            <img
              src="https://worxpertise.com/wp-content/themes/worxpertise/assets/images/worx-header-logo.png"
              alt="Worxpertise Logo"
              className="h-4 w-auto object-contain"
            />
          </div>
          <span className="text-[11px] font-black text-[#ff4040] uppercase tracking-wider">
            Flow Authentication
          </span>
        </div>

        <h2 className="text-lg font-bold text-white text-center mb-1">
          {tab === "login"
            ? "Sign In to Worxpertise Flow"
            : tab === "register"
            ? "Create an Account"
            : "Reset Account Password"}
        </h2>
        <p className="text-xs text-slate-400 text-center mb-5">
          {tab === "login"
            ? "Access your cloud diagrams, sync workflows, and NOC boards"
            : tab === "register"
            ? "Save diagrams in the cloud and collaborate with teammates"
            : "Enter your email and a new password to recover access"}
        </p>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#232c3d] mb-5">
          <button
            type="button"
            className={`flex-1 pb-2.5 text-xs font-semibold transition border-b-2 ${
              tab === "login"
                ? "border-[#c00000] text-[#ff4040]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => switchTab("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-2.5 text-xs font-semibold transition border-b-2 ${
              tab === "register"
                ? "border-[#c00000] text-[#ff4040]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => switchTab("register")}
          >
            Register
          </button>
          <button
            type="button"
            className={`flex-1 pb-2.5 text-xs font-semibold transition border-b-2 ${
              tab === "reset"
                ? "border-[#c00000] text-[#ff4040]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => switchTab("reset")}
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sachin Chauhan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="sachin.chauhan@worxpertise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
            />
          </div>

          {tab !== "reset" ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={() => switchTab("reset")}
                    className="text-[11px] text-[#ff4040] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="Enter your new password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 rounded-lg bg-[#c00000] hover:bg-[#ff4040] py-2 text-xs font-bold text-white shadow-md shadow-[#c00000]/30 focus:outline-none disabled:opacity-50 transition"
          >
            {isLoading
              ? "Please wait..."
              : tab === "login"
              ? "Sign In"
              : tab === "register"
              ? "Create Account"
              : "Update Password"}
          </button>
        </form>

        {tab === "reset" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => switchTab("login")}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
