const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...fetchOptions,
          headers,
        });
        if (!retryResponse.ok) {
          throw new Error(`API error: ${retryResponse.status}`);
        }
        return retryResponse.json();
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.accessToken = data.accessToken;
      return true;
    } catch {
      return false;
    }
  }

  async login(email: string, password: string) {
    return this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  }

  async setPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      skipAuth: true,
    });
  }

  async logout(refreshToken?: string) {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe() {
    return this.request<any>('/organizations/me');
  }

  async getOrgUsers() {
    return this.request<any[]>('/organizations/users');
  }

  async getOrgActivities() {
    return this.request<any[]>('/organizations/activities');
  }

  async toggleActivity(activityId: string, isEnabled: boolean) {
    return this.request<any>(`/organizations/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isEnabled }),
    });
  }

  async inviteUser(data: { email: string; firstName: string; lastName: string; role: string }) {
    return this.request<any>('/auth/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAllActivities() {
    return this.request<any[]>('/activities');
  }

  async getMyAssignments() {
    return this.request<any[]>('/assignments/mine');
  }

  async getPatientAssignments(patientId: string) {
    return this.request<any[]>(`/assignments/patient/${patientId}`);
  }

  async createAssignment(data: { patientId: string; activityId: string; config?: any }) {
    return this.request<any>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssignmentSessions(assignmentId: string) {
    return this.request<any[]>(`/assignments/${assignmentId}/sessions`);
  }

  async createSession(data: { assignmentId: string; startedAt: string; endedAt?: string; rawResult: any }) {
    return this.request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPatientReporting(patientId: string) {
    return this.request<any>(`/reporting/patient/${patientId}`);
  }

  async getOrgReporting() {
    return this.request<any>('/reporting/org');
  }
}

export const apiClient = new ApiClient();
