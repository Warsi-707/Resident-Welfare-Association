import {
  User,
  Member,
  Challan,
  Payment,
  Staff,
  ActivityLog,
  AssociationSettings,
  LedgerEntry,
} from '../types';

const BACKEND_URL = (((import.meta as any).env?.VITE_API_URL as string) || '').replace(/\/$/, '');
const API_BASE = `${BACKEND_URL}/api`;

/**
 * Centralized API client helper that automatically attaches
 * the JWT authorization header to all protected requests
 * and handles 401/403 session expiration.
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rwa_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    // Clear session on authentication failure
    localStorage.removeItem('rwa_auth_token');
    localStorage.removeItem('rwa_current_user');
    window.dispatchEvent(new CustomEvent('rwa:session-expired', { detail: { status: res.status } }));
  }

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        errorMsg = data.message || data.error || data.details || errorMsg;
      } catch {
        if (text && text.trim()) {
          const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          errorMsg = clean.slice(0, 300) || `${errorMsg}: ${res.statusText || 'Server Error'}`;
        } else {
          errorMsg = `${errorMsg}: ${res.statusText || 'Server Error'}`;
        }
      }
    } catch {
      errorMsg = `${errorMsg}: ${res.statusText || 'Server Error'}`;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(username: string, password?: string): Promise<{ success: boolean; token: string; user: User }> {
    const data = await apiFetch<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      localStorage.setItem('rwa_auth_token', data.token);
      localStorage.setItem('rwa_current_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe(): Promise<User> {
    const data = await apiFetch<{ user: User }>('/auth/me');
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('rwa_auth_token');
      localStorage.removeItem('rwa_current_user');
    }
  },

  async getDemoAccounts(): Promise<Array<{ username: string; fullName: string; role: string; memberId?: string }>> {
    const data = await apiFetch<{ accounts: Array<{ username: string; fullName: string; role: string; memberId?: string }> }>('/auth/demo-accounts');
    return data.accounts;
  },

  // Members
  async getMembers(): Promise<Member[]> {
    return apiFetch<Member[]>('/members');
  },

  async getMember(id: string): Promise<Member> {
    return apiFetch<Member>(`/members/${id}`);
  },

  async addMember(data: any): Promise<Member> {
    return apiFetch<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMember(id: string, data: Partial<Member>): Promise<Member> {
    return apiFetch<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleMemberStatus(id: string): Promise<{ id: string; memberId: string; status: string }> {
    return apiFetch<{ id: string; memberId: string; status: string }>(`/members/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  async getMemberLedger(id: string): Promise<LedgerEntry[]> {
    return apiFetch<LedgerEntry[]>(`/members/${id}/ledger`);
  },

  async deleteMember(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/members/${id}`, {
      method: 'DELETE',
    });
  },

  // Staff
  async getStaff(): Promise<Staff[]> {
    return apiFetch<Staff[]>('/staff');
  },

  async addStaff(data: any): Promise<Staff> {
    return apiFetch<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    return apiFetch<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleStaffStatus(id: string): Promise<{ id: string; status: string }> {
    return apiFetch<{ id: string; status: string }>(`/staff/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  // Challans
  async getChallans(params?: { month?: string; year?: number; status?: string; memberId?: string }): Promise<Challan[]> {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.year) query.set('year', String(params.year));
    if (params?.status) query.set('status', params.status);
    if (params?.memberId) query.set('memberId', params.memberId);

    const queryString = query.toString();
    return apiFetch<Challan[]>(`/challans${queryString ? `?${queryString}` : ''}`);
  },

  async getChallan(id: string): Promise<Challan> {
    return apiFetch<Challan>(`/challans/${id}`);
  },

  async deleteChallan(id: string): Promise<{ success: boolean; message: string; id: string; challanNumber: string }> {
    return apiFetch<{ success: boolean; message: string; id: string; challanNumber: string }>(`/challans/${id}`, {
      method: 'DELETE',
    });
  },

  async generateChallans(options: {
    month: string;
    year: number;
    dueDate: string;
    target: 'all' | 'selected' | 'single';
    memberIds: string[];
  }): Promise<{
    success: boolean;
    count: number;
    totalAmount: number;
    whatsappSummary: {
      generated: number;
      sent: number;
      failed: number;
      duplicatesSkipped: number;
      failures: Array<{
        challanNumber?: string;
        memberId: string;
        memberName: string;
        contactNumber?: string;
        reason: string;
      }>;
    };
    challans: Challan[];
  }> {
    return apiFetch<{
      success: boolean;
      count: number;
      totalAmount: number;
      whatsappSummary: {
        generated: number;
        sent: number;
        failed: number;
        duplicatesSkipped: number;
        failures: Array<{
          challanNumber?: string;
          memberId: string;
          memberName: string;
          contactNumber?: string;
          reason: string;
        }>;
      };
      challans: Challan[];
    }>('/challans/generate', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  async sendChallanWhatsApp(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    whatsappStatus: string;
    whatsappSentAt?: string;
    whatsappMessageId?: string;
    challan?: Partial<Challan>;
  }> {
    return apiFetch<{
      success: boolean;
      message?: string;
      error?: string;
      whatsappStatus: string;
      whatsappSentAt?: string;
      whatsappMessageId?: string;
      challan?: Partial<Challan>;
    }>(`/challans/${id}/send-whatsapp`, {
      method: 'POST',
    });
  },

  // Payments
  async getPayments(params?: { memberId?: string; status?: string; paymentMethod?: string }): Promise<Payment[]> {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.status) query.set('status', params.status);
    if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);

    const queryString = query.toString();
    return apiFetch<Payment[]>(`/payments${queryString ? `?${queryString}` : ''}`);
  },

  async getPayment(id: string): Promise<Payment> {
    return apiFetch<Payment>(`/payments/${id}`);
  },

  async collectPayment(data: {
    memberId: string;
    paidAmount: number;
    paymentDate: string;
    paymentType: 'Full Paid' | 'Partial Paid';
    paymentMethod: 'Cash' | 'Online';
    notes?: string;
    referenceNumber?: string;
    challanId?: string;
  }): Promise<Payment> {
    return apiFetch<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voidPayment(id: string, reason: string): Promise<{ message: string; receiptNumber: string; status: string }> {
    return apiFetch<{ message: string; receiptNumber: string; status: string }>(`/payments/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Dashboard Summary
  async getDashboardSummary(): Promise<any> {
    return apiFetch<any>('/dashboard/summary');
  },

  // Reports
  async getMonthlyReport(year: number = 2024): Promise<any> {
    return apiFetch<any>(`/reports/monthly?year=${year}`);
  },

  async getStatusReport(): Promise<any> {
    return apiFetch<any>('/reports/status');
  },

  async getStaffReport(): Promise<any> {
    return apiFetch<any>('/reports/staff');
  },

  // Settings
  async getSettings(): Promise<AssociationSettings> {
    return apiFetch<AssociationSettings>('/settings');
  },

  async updateSettings(data: Partial<AssociationSettings>): Promise<AssociationSettings> {
    return apiFetch<AssociationSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadLogo(imageBase64: string, filename?: string): Promise<{ success: boolean; logoUrl: string; settings: AssociationSettings }> {
    return apiFetch<{ success: boolean; logoUrl: string; settings: AssociationSettings }>('/settings/upload-logo', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, filename }),
    });
  },

  async removeLogo(): Promise<{ success: boolean; logoUrl: null; settings: AssociationSettings }> {
    return apiFetch<{ success: boolean; logoUrl: null; settings: AssociationSettings }>('/settings/logo', {
      method: 'DELETE',
    });
  },

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return apiFetch<ActivityLog[]>('/activity');
  },

  // Reset database to sample records
  async resetDatabase(options?: { wipeMembers?: boolean }): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>('/reset-sample-data', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },
};
