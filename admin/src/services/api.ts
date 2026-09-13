const API_BASE = '/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('zubeen_admin_token');
  }

  public static setToken(token: string) {
    localStorage.setItem('zubeen_admin_token', token);
  }

  public static removeToken() {
    localStorage.removeItem('zubeen_admin_token');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth
  public static async login(credentials: { email: string; password: string }) {
    return this.request<{ data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  public static async me() {
    return this.request<{ data: { user: any } }>('/auth/me');
  }

  // Admin APIs
  public static async getDashboard() {
    return this.request<{ data: { stats: any; daily_streams_chart: any[] } }>('/admin/dashboard');
  }

  public static async getApplications(params: { status?: string; page?: number } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/admin/applications?${query}`);
  }

  public static async reviewApplication(id: number, data: { action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'; admin_notes?: string }) {
    return this.request<any>(`/admin/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async getReleases(params: { status?: string; page?: number } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/admin/releases?${query}`);
  }

  public static async reviewRelease(id: number, data: { action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'PUBLISH' | 'TAKEDOWN'; notes?: string }) {
    return this.request<any>(`/admin/releases/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async getSongs(page: number = 1) {
    return this.request<any>(`/admin/songs?page=${page}`);
  }

  public static async updateSongStatus(id: number, status: 'PUBLISHED' | 'TAKEN_DOWN', reason?: string) {
    return this.request<any>(`/admin/songs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  public static async getAlbums(page: number = 1) {
    return this.request<any>(`/albums?page=${page}`);
  }

  public static async getReports(page: number = 1) {
    return this.request<any>(`/admin/reports?page=${page}`);
  }

  public static async resolveReport(id: number, data: { action: 'TAKEDOWN' | 'DISMISS'; notes: string }) {
    return this.request<any>(`/admin/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async getAuditLogs() {
    return this.request<any>('/admin/audit-logs');
  }

  public static async getUsers(page: number = 1) {
    return this.request<any>(`/admin/users?page=${page}`);
  }
}
