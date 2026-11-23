const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const expenseService = {
  async getExpenses(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/expenses?${query}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async getExpense(id: number | string) {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch expense details');
    return res.json();
  },

  async createExpense(data: any) {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create expense');
    }
    return res.json();
  },

  async updateExpense(id: number | string, data: any) {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update expense');
    }
    return res.json();
  },

  async deleteExpense(id: number | string) {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
  },

  async submitExpense(id: number | string) {
    const res = await fetch(`${API_URL}/expenses/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit expense');
    }
    return res.json();
  },

  // Advances
  async getAdvances(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/advances?${query}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch advances');
    return res.json();
  },

  async createAdvance(data: any) {
    const res = await fetch(`${API_URL}/advances`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request advance');
    }
    return res.json();
  },

  async submitAdvance(id: number | string) {
    const res = await fetch(`${API_URL}/advances/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to submit advance');
    return res.json();
  },

  // Approvals
  async getPendingApprovals() {
    const res = await fetch(`${API_URL}/expense-approvals`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch pending approvals');
    return res.json();
  },

  async approveExpense(id: number | string, comments: string = '') {
    const res = await fetch(`${API_URL}/expense-approvals/expenses/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    if (!res.ok) throw new Error('Failed to approve expense');
    return res.json();
  },

  async rejectExpense(id: number | string, comments: string = '') {
    const res = await fetch(`${API_URL}/expense-approvals/expenses/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    if (!res.ok) throw new Error('Failed to reject expense');
    return res.json();
  },

  async approveAdvance(id: number | string, comments: string = '') {
    const res = await fetch(`${API_URL}/expense-approvals/advances/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    if (!res.ok) throw new Error('Failed to approve advance');
    return res.json();
  },

  async rejectAdvance(id: number | string, comments: string = '') {
    const res = await fetch(`${API_URL}/expense-approvals/advances/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    if (!res.ok) throw new Error('Failed to reject advance');
    return res.json();
  },

  // Reports & Stats
  async getDashboardStats() {
    const res = await fetch(`${API_URL}/expense-reports/dashboard`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getPoSoReport(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/expense-reports/poso?${query}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch POSO report');
    return res.json();
  },

  async uploadReceipt(file: File) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await fetch(`${API_URL}/expenses/upload/receipt`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload receipt');
    return res.json();
  },
};
