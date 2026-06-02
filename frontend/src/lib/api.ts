const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("instaflow_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers = { ...this.getHeaders(), ...options.headers };
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("instaflow_token");
        localStorage.removeItem("instaflow_username");
        localStorage.removeItem("instaflow_role");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.location.href = "/login";
        }
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Request failed");
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth Operations
  async login(email: string, password: string): Promise<any> {
    const res = await this.request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.access_token) {
      localStorage.setItem("instaflow_token", res.access_token);
      localStorage.setItem("instaflow_username", res.username);
      localStorage.setItem("instaflow_role", res.role);
    }
    return res;
  }

  async register(payload: any): Promise<any> {
    return this.request<any>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async loginWithGoogle(token: string): Promise<any> {
    const res = await this.request<any>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    if (res.access_token) {
      localStorage.setItem("instaflow_token", res.access_token);
      localStorage.setItem("instaflow_username", res.username);
      localStorage.setItem("instaflow_role", res.role);
    }
    return res;
  }

  logout(): void {
    localStorage.removeItem("instaflow_token");
    localStorage.removeItem("instaflow_username");
    localStorage.removeItem("instaflow_role");
    window.location.href = "/login";
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("instaflow_token");
  }

  getUserDetails(): { username: string | null; role: string | null } {
    if (typeof window === "undefined") return { username: null, role: null };
    return {
      username: localStorage.getItem("instaflow_username"),
      role: localStorage.getItem("instaflow_role"),
    };
  }

  // Instagram Accounts
  async getAccounts(): Promise<any[]> {
    return this.request<any[]>("/api/accounts");
  }

  async connectAccount(accessToken?: string, code?: string, redirectUri?: string): Promise<any> {
    return this.request<any>("/api/accounts/connect", {
      method: "POST",
      body: JSON.stringify({
        access_token: accessToken,
        code: code,
        redirect_uri: redirectUri
      }),
    });
  }

  async disconnectAccount(accountId: string): Promise<void> {
    return this.request<void>(`/api/accounts/${accountId}`, {
      method: "DELETE",
    });
  }

  async getAccountPosts(accountId: string): Promise<any[]> {
    return this.request<any[]>(`/api/accounts/${accountId}/posts`);
  }

  // Automations CRUD
  async getAutomations(params: { status?: string; keyword?: string; search?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.keyword) query.append("keyword", params.keyword);
    if (params.search) query.append("search", params.search);

    const queryString = query.toString();
    return this.request<any[]>(`/api/automations${queryString ? `?${queryString}` : ""}`);
  }

  async getAutomation(id: string): Promise<any> {
    return this.request<any>(`/api/automations/${id}`);
  }

  async createAutomation(payload: any): Promise<any> {
    return this.request<any>("/api/automations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateAutomation(id: string, payload: any): Promise<any> {
    return this.request<any>(`/api/automations/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteAutomation(id: string): Promise<void> {
    return this.request<void>(`/api/automations/${id}`, {
      method: "DELETE",
    });
  }

  async duplicateAutomation(id: string): Promise<any> {
    return this.request<any>(`/api/automations/${id}/duplicate`, {
      method: "POST",
    });
  }

  // Webhook Simulator
  async simulateComment(payload: {
    username: string;
    comment_text: string;
    media_id: string;
    instagram_account_id: string;
  }): Promise<any> {
    return this.request<any>("/api/webhooks/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Analytics
  async getAnalyticsSummary(): Promise<any> {
    return this.request<any>("/api/analytics/summary");
  }

  async getAnalyticsCharts(): Promise<any[]> {
    return this.request<any[]>("/api/analytics/charts");
  }

  // Logs
  async getActivityLogs(params: { status?: string; username?: string; automationId?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.username) query.append("username", params.username);
    if (params.automationId) query.append("automation_id", params.automationId);

    const queryString = query.toString();
    return this.request<any[]>(`/api/logs/activity${queryString ? `?${queryString}` : ""}`);
  }

  async getWebhookLogs(): Promise<any[]> {
    return this.request<any[]>("/api/logs/webhooks");
  }

  // Settings
  async getSettings(): Promise<any> {
    return this.request<any>("/api/settings");
  }

  async updateSettings(payload: any): Promise<any> {
    return this.request<any>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // AI Helpers
  async suggestKeywords(automationName: string, description: string): Promise<string[]> {
    const res = await this.request<{ keywords: string[] }>("/api/ai/suggest-keywords", {
      method: "POST",
      body: JSON.stringify({ automation_name: automationName, description }),
    });
    return res.keywords;
  }

  async generateReply(prompt: string, tone: string, resourceType: string): Promise<string> {
    const res = await this.request<{ message: string }>("/api/ai/generate-reply", {
      method: "POST",
      body: JSON.stringify({ prompt, tone, resource_type: resourceType }),
    });
    return res.message;
  }
}

export const api = new ApiClient();
export default api;
