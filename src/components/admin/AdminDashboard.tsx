import { useState, useEffect, useCallback } from "react";
import { adminApi, type AdminStats, type Activity, type User, type Role } from "../../lib/api";
import type { Diagram } from "../../types";

export function AdminDashboard({
  onClose,
  onOpenDiagram,
}: {
  onClose: () => void;
  onOpenDiagram: (diagram: Diagram) => void;
}) {
  const [activeTab, setActiveTab] = useState<"activities" | "users" | "diagrams">("activities");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<Role>("USER");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Set Password Modal State
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminPasswordLoading, setAdminPasswordLoading] = useState(false);
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [adminPasswordSuccess, setAdminPasswordSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, activitiesData, usersData, diagramsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getActivities(100),
        adminApi.getUsers(),
        adminApi.getAllDiagrams(),
      ]);
      setStats(statsData);
      setActivities(activitiesData);
      setUsers(usersData);
      setDiagrams(diagramsData);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      setUpdatingUserId(userId);
      await adminApi.updateUserRole(userId, newRole);
      await loadData();
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createName || !createEmail || !createPassword) {
      setCreateError("All fields are required");
      return;
    }

    if (createPassword.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await adminApi.createUser({
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
      });
      setCreateSuccess(res.message || "User created successfully!");
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("USER");
      await loadData();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1400);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    setAdminPasswordError(null);
    setAdminPasswordSuccess(null);

    if (!adminNewPassword || adminNewPassword.length < 6) {
      setAdminPasswordError("New password must be at least 6 characters");
      return;
    }

    setAdminPasswordLoading(true);
    try {
      const res = await adminApi.changeUserPassword(passwordResetUser.id, adminNewPassword);
      setAdminPasswordSuccess(res.message || "Password updated successfully!");
      setAdminNewPassword("");
      await loadData();
      setTimeout(() => {
        setPasswordResetUser(null);
        setAdminPasswordSuccess(null);
      }, 1400);
    } catch (err: any) {
      setAdminPasswordError(err.message || "Failed to update user password");
    } finally {
      setAdminPasswordLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "USER_REGISTERED":
      case "USER_CREATED_BY_ADMIN":
        return <span className="rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">User Created</span>;
      case "USER_LOGIN":
        return <span className="rounded bg-sky-950/70 border border-sky-800 text-sky-300 px-2 py-0.5 text-[10px] font-semibold">User Login</span>;
      case "PASSWORD_RESET":
      case "PASSWORD_CHANGED":
      case "USER_PASSWORD_RESET_BY_ADMIN":
        return <span className="rounded bg-amber-950/70 border border-amber-800 text-amber-300 px-2 py-0.5 text-[10px] font-semibold">Password Changed</span>;
      case "DIAGRAM_CREATED":
        return <span className="rounded bg-purple-950/70 border border-purple-800 text-purple-300 px-2 py-0.5 text-[10px] font-semibold">Diagram Created</span>;
      case "DIAGRAM_UPDATED":
        return <span className="rounded bg-amber-950/70 border border-amber-800 text-amber-300 px-2 py-0.5 text-[10px] font-semibold">Diagram Updated</span>;
      case "DIAGRAM_DELETED":
        return <span className="rounded bg-rose-950/70 border border-rose-800 text-rose-300 px-2 py-0.5 text-[10px] font-semibold">Diagram Deleted</span>;
      default:
        return <span className="rounded bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 text-[10px] font-semibold">{action}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl border border-[#232c3d] bg-[#0d111a] shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c3d] bg-[#151b27] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">👑</span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Admin Control Center</span>
                <span className="rounded bg-amber-950/70 border border-amber-800 text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
                  Worxpertise
                </span>
              </h2>
              <p className="text-xs text-slate-400">Monitor all user activities, workflows, and account credentials</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-lg border border-[#232c3d] bg-[#0d111a] px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500 hover:text-white transition disabled:opacity-50"
            >
              🔄 Refresh
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-[#232c3d] bg-[#0d111a] px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-500 hover:text-white transition"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[#0f1422] border-b border-[#232c3d]">
            <div className="rounded-xl border border-[#232c3d] bg-[#151b27]/80 p-4">
              <div className="text-xs font-medium text-slate-400">Total Users</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Provisioned accounts</div>
            </div>
            <div className="rounded-xl border border-[#232c3d] bg-[#151b27]/80 p-4">
              <div className="text-xs font-medium text-slate-400">Total Diagrams</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalDiagrams}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across all users</div>
            </div>
            <div className="rounded-xl border border-[#232c3d] bg-[#151b27]/80 p-4">
              <div className="text-xs font-medium text-slate-400">Total Activities</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">{stats.totalActivities}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Audited events</div>
            </div>
            <div className="rounded-xl border border-[#232c3d] bg-[#151b27]/80 p-4">
              <div className="text-xs font-medium text-slate-400">Last 24h Activity</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{stats.recentActivities24h}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Recent user actions</div>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-[#232c3d] bg-[#151b27] px-6">
          <button
            onClick={() => setActiveTab("activities")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "activities"
                ? "border-[#c00000] text-[#ff4040]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📜</span> User Activity Stream ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "users"
                ? "border-[#c00000] text-[#ff4040]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>👥</span> Users & Roles ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("diagrams")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "diagrams"
                ? "border-[#c00000] text-[#ff4040]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📊</span> All System Diagrams ({diagrams.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-500">Loading data...</div>
          ) : activeTab === "activities" ? (
            /* ACTIVITIES STREAM */
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No activity recorded yet.</div>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#232c3d] bg-[#151b27]/60 px-4 py-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d111a] text-xs font-bold text-slate-200 border border-[#232c3d]">
                        {act.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-slate-200 truncate">{act.user.name}</span>
                          <span className="text-[11px] text-slate-500 truncate">({act.user.email})</span>
                          {getActionBadge(act.action)}
                        </div>
                        {act.details && <p className="text-xs text-slate-400 mt-0.5 truncate">{act.details}</p>}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 shrink-0 text-right">
                      {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "users" ? (
            /* USERS TABLE & ACTIONS */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-white">User Accounts & Credentials</h3>
                  <p className="text-xs text-slate-400">Manage access levels, create new users, and reset passwords</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#c00000] hover:bg-[#ff4040] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#c00000]/30 transition"
                >
                  <span>+</span>
                  <span>Create User</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#232c3d] bg-[#151b27]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#232c3d] bg-[#151b27] text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Diagrams</th>
                      <th className="py-3 px-4">Activities</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232c3d]/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#151b27]/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                              u.role === "ADMIN"
                                ? "bg-amber-950/60 border-amber-800 text-amber-300"
                                : "bg-[#0d111a] border-slate-700 text-slate-300"
                            }`}
                          >
                            {u.role === "ADMIN" ? "👑 ADMIN" : "USER"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{u._count?.diagrams ?? 0}</td>
                        <td className="py-3 px-4 text-slate-400">{u._count?.activities ?? 0}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(u.createdAt || "").toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setPasswordResetUser(u);
                                setAdminNewPassword("");
                                setAdminPasswordError(null);
                                setAdminPasswordSuccess(null);
                              }}
                              className="rounded border border-amber-800/60 bg-amber-950/30 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-900/50 hover:border-amber-600 transition"
                              title="Reset this user's password"
                            >
                              🔑 Set Password
                            </button>
                            <button
                              disabled={updatingUserId === u.id}
                              onClick={() => handleRoleChange(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}
                              className="rounded border border-[#232c3d] bg-[#0d111a] px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:text-white transition disabled:opacity-50"
                            >
                              {updatingUserId === u.id ? "..." : u.role === "ADMIN" ? "Demote" : "Promote to Admin"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ALL SYSTEM DIAGRAMS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {diagrams.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-[#232c3d] bg-[#151b27]/60 p-4 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-slate-200 truncate">{d.name}</h4>
                      <span className="rounded bg-sky-950/60 border border-sky-800/80 px-1.5 py-0.5 text-[9px] text-sky-300">
                        {d.user?.name || "User"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Creator: {d.user?.email}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Updated: {new Date(d.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#232c3d] flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDiagram({
                          ...d,
                          createdAt: new Date(d.createdAt).getTime(),
                          updatedAt: new Date(d.updatedAt).getTime(),
                        });
                      }}
                      className="rounded border border-[#232c3d] bg-[#0d111a] px-3 py-1 text-xs text-[#ff4040] hover:border-[#c00000] hover:text-white transition"
                    >
                      Open Diagram →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#232c3d] bg-[#0d111a] p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c00000]/20 border border-[#c00000]/50 text-base text-[#ff4040]">
                👤
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create New User Account</h3>
                <p className="text-[11px] text-slate-400">Provision a new account with customized role</p>
              </div>
            </div>

            {createError && (
              <div className="my-3 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="my-3 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <span>✓</span>
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rahul.sharma@worxpertise.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters..."
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">System Role</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 focus:border-[#c00000] focus:outline-none"
                >
                  <option value="USER">USER (Standard Member)</option>
                  <option value="ADMIN">ADMIN (Full System Administrator)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg bg-[#c00000] hover:bg-[#ff4040] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#c00000]/30 disabled:opacity-50 transition"
                >
                  {createLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN SET USER PASSWORD MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#232c3d] bg-[#0d111a] p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setPasswordResetUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/60 border border-amber-800 text-base text-amber-300">
                🔑
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset User Password</h3>
                <p className="text-[11px] text-slate-400">
                  Setting new password for: <strong className="text-white">{passwordResetUser.name}</strong> ({passwordResetUser.email})
                </p>
              </div>
            </div>

            {adminPasswordError && (
              <div className="my-3 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
                {adminPasswordError}
              </div>
            )}

            {adminPasswordSuccess && (
              <div className="my-3 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <span>✓</span>
                <span>{adminPasswordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 6 chars)..."
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-[#c00000] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="rounded-lg border border-[#232c3d] bg-[#151b27] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminPasswordLoading}
                  className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-amber-600/30 disabled:opacity-50 transition"
                >
                  {adminPasswordLoading ? "Saving..." : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
