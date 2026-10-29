import type { Diagram } from "../types";

const TOKEN_KEY = "flowbuilder_token";

export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  createdAt?: string;
  _count?: {
    diagrams: number;
    activities: number;
  };
}

export interface Activity {
  id: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalDiagrams: number;
  totalActivities: number;
  recentActivities24h: number;
}

export interface AuthResponse {
  message?: string;
  user: User;
  token: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

// Authentication API
export const authApi = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setToken(res.token);
    return res;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setToken(res.token);
    return res;
  },

  async me(): Promise<{ user: User }> {
    return request<{ user: User }>("/api/auth/me");
  },

  logout(): void {
    removeToken();
  },
};

// Diagram Cloud API
export const diagramsApi = {
  async list(): Promise<Diagram[]> {
    const res = await request<{ diagrams: any[] }>("/api/diagrams");
    return res.diagrams.map((d) => ({
      ...d,
      createdAt: new Date(d.createdAt).getTime(),
      updatedAt: new Date(d.updatedAt).getTime(),
      nodes: d.nodes || [],
      edges: d.edges || [],
    }));
  },

  async get(id: string): Promise<Diagram> {
    const res = await request<{ diagram: any }>(`/api/diagrams/${id}`);
    const d = res.diagram;
    return {
      ...d,
      createdAt: new Date(d.createdAt).getTime(),
      updatedAt: new Date(d.updatedAt).getTime(),
      nodes: d.nodes || [],
      edges: d.edges || [],
    };
  },

  async save(diagram: Diagram): Promise<Diagram> {
    try {
      const res = await request<{ diagram: any }>(`/api/diagrams/${diagram.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: diagram.name,
          nodes: diagram.nodes,
          edges: diagram.edges,
          theme: diagram.theme,
          thumbnail: diagram.thumbnail,
        }),
      });
      const d = res.diagram;
      return {
        ...d,
        createdAt: new Date(d.createdAt).getTime(),
        updatedAt: new Date(d.updatedAt).getTime(),
      };
    } catch (err: any) {
      if (err.message?.includes("not found") || err.message?.includes("404")) {
        const res = await request<{ diagram: any }>("/api/diagrams", {
          method: "POST",
          body: JSON.stringify({
            id: diagram.id,
            name: diagram.name,
            nodes: diagram.nodes,
            edges: diagram.edges,
            theme: diagram.theme,
            thumbnail: diagram.thumbnail,
          }),
        });
        const d = res.diagram;
        return {
          ...d,
          createdAt: new Date(d.createdAt).getTime(),
          updatedAt: new Date(d.updatedAt).getTime(),
        };
      }
      throw err;
    }
  },

  async delete(id: string): Promise<void> {
    await request(`/api/diagrams/${id}`, { method: "DELETE" });
  },
};

// Admin API
export const adminApi = {
  async getStats(): Promise<AdminStats> {
    const res = await request<{ stats: AdminStats }>("/api/admin/stats");
    return res.stats;
  },

  async getUsers(): Promise<User[]> {
    const res = await request<{ users: User[] }>("/api/admin/users");
    return res.users;
  },

  async getActivities(limit = 50, userId?: string): Promise<Activity[]> {
    const query = new URLSearchParams();
    if (limit) query.set("limit", String(limit));
    if (userId) query.set("userId", userId);
    const res = await request<{ activities: Activity[] }>(`/api/admin/activities?${query.toString()}`);
    return res.activities;
  },

  async getAllDiagrams(): Promise<any[]> {
    const res = await request<{ diagrams: any[] }>("/api/admin/diagrams");
    return res.diagrams;
  },

  async updateUserRole(userId: string, role: Role): Promise<User> {
    const res = await request<{ user: User }>(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
    return res.user;
  },
};
