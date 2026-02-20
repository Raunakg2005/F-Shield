// api.ts
import { auth } from '../firebase/firebase';
import { Transaction, Alert, DashboardStats, Business } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No authenticated user, API request might fail.");
    return { 'Content-Type': 'application/json' };
  }
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...(await getAuthHeaders()),
    ...options.headers,
  };

  // If uploading FormData, remove Content-Type so browser can set boundary
  if (options.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new ApiError('Invalid JSON response', response.status);
  }

  if (!response.ok || data.error) {
    throw new ApiError(data.error || 'API Request failed', response.status);
  }

  return data.data as T;
}

export const api = {
  business: {
    // Create new business record (called after Firebase signup)
    create: (data: { name: string; industry: string; country: string }) =>
      request<Business>('/business', { method: 'POST', body: JSON.stringify(data) }),

    // Get current user's business
    get: () => request<Business>('/business'),
  },

  transactions: {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      // No JSON body here, let boundary handle it
      return request<{ job_id?: string; processed: number; errors: any[] }>('/transactions/upload', {
        method: 'POST',
        body: formData,
      });
    },

    list: (page = 1, limit = 50, risk_level?: string) => {
      let query = `?page=${page}&limit=${limit}`;
      if (risk_level) query += `&risk_level=${risk_level}`;
      return request<{ transactions: Transaction[]; total: number; page: number; pages: number }>(`/transactions${query}`);
    },

    get: (id: number) => request<Transaction>(`/transactions/${id}`),

    explain: (id: number) => request<{ top_reasons: Array<{ feature: string; impact: string }> }>(`/transactions/${id}/explain`),

    review: (id: number, status: 'confirmed_fraud' | 'false_positive') =>
      request<Transaction>(`/transactions/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ review_status: status }),
      }),
  },

  fraud: {
    stats: () => request<DashboardStats>('/fraud/stats'),

    alerts: (page = 1, limit = 50, status?: string) => {
      let query = `?page=${page}&limit=${limit}`;
      if (status) query += `&status=${status}`;
      return request<{ alerts: Alert[]; total: number; page: number; pages: number }>(`/fraud/alerts${query}`);
    },

    network: () => request<any>('/fraud/network'),

    health: () => request<any>('/fraud/model/health'),
  }
};
