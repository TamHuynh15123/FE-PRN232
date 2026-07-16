// Khi chạy dev: Vite proxy sẽ forward /api/* -> https://localhost:7117/api
// (xem vite.config.ts) → giải quyết CORS + HTTPS self-signed cert
const BASE_URL = '/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  studentCode?: string;
  isFptStudent?: boolean;
  universityName?: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API Error ${res.status}`);
  }
  return await res.json();
};

const downloadFile = async (path: string, options: RequestInit = {}): Promise<Blob> => {
  const token = localStorage.getItem('access_token');
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`Download Error ${res.status}`);
  }
  return await res.blob();
};

export const api = {
  auth: {
    login: (body: any) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    getPending: () => request<any[]>('/accounts/pending'),
    reviewPending: (body: any) => request<any>('/accounts/review', { method: 'POST', body: JSON.stringify(body) }),
    createJudge: (body: any) => request<any>('/accounts/guest-judge', { method: 'POST', body: JSON.stringify(body) }),
  },
  events: {
    getAll: () => request<any[]>('/events'),
    getById: (id: string) => request<any>(`/events/${id}`),
    create: (body: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (id: string, body: any) => request<any>(`/events/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
    updateCriteria: (id: string, body: any) => request<any>(`/events/${id}/criteria`, { method: 'PUT', body: JSON.stringify(body) }),
    createCategory: (id: string, body: any) => request<any>(`/events/${id}/categories`, { method: 'POST', body: JSON.stringify(body) }),
    updateCategory: (eventId: string, catId: string, body: any) => request<any>(`/events/${eventId}/categories/${catId}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCategory: (eventId: string, catId: string) => request<any>(`/events/${eventId}/categories/${catId}`, { method: 'DELETE' }),
    createRound: (id: string, body: any) => request<any>(`/events/${id}/rounds`, { method: 'POST', body: JSON.stringify(body) }),
  },
  teams: {
    create: (body: any) => request<any>('/teams', { method: 'POST', body: JSON.stringify(body) }),
    join: (body: any) => request<any>('/teams/join', { method: 'POST', body: JSON.stringify(body) }),
    leave: (id: string) => request<any>(`/teams/${id}/leave`, { method: 'POST' }),
    getMyTeams: () => request<any[]>('/teams/my'),
    getStudentTeam: (eventId: string) => request<any>(`/teams/student/event/${eventId}`),
    getById: (id: string) => request<any>(`/teams/${id}`),
  },
  submissions: {
    submit: (body: any) => request<any>('/submissions', { method: 'POST', body: JSON.stringify(body) }),
    getByTeam: (teamId: string) => request<any[]>(`/submissions/team/${teamId}`),
    getByRound: (roundId: string) => request<any[]>(`/submissions/round/${roundId}`),
  },
  scoring: {
    submitScores: (submissionId: string, body: any) => request<any>(`/scoring/submissions/${submissionId}`, { method: 'POST', body: JSON.stringify(body) }),
    getScores: (submissionId: string) => request<any[]>(`/scoring/submissions/${submissionId}`),
    getMyScore: (submissionId: string) => request<any>(`/scoring/submissions/${submissionId}/my-scores`),
  },
  ranking: {
    calculate: (roundId: string) => request<any>(`/ranking/rounds/${roundId}/calculate`, { method: 'POST' }),
    getRound: (roundId: string) => request<any>(`/ranking/rounds/${roundId}`),
    getEvent: (eventId: string) => request<any>(`/ranking/events/${eventId}`),
    getCategory: (roundId: string, categoryId: string) => request<any>(`/ranking/rounds/${roundId}/categories/${categoryId}`),
    getSummary: (roundId: string) => request<any>(`/ranking/rounds/${roundId}/score-summary`),
  },
  awards: {
    getSuggestions: (eventId: string) => request<any[]>(`/awards/events/${eventId}/suggestions`),
    getByEvent: (eventId: string) => request<any[]>(`/awards/events/${eventId}`),
    grant: (body: any) => request<any>('/awards/grant', { method: 'POST', body: JSON.stringify(body) }),
  },
  users: {
    getMe: () => request<any>('/users/me'),
    updateMe: (body: any) => request<any>('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
    getAll: (params?: { status?: string; role?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.role) qs.set('role', params.role);
      if (params?.page) qs.set('page', String(params.page));
      return request<any>(`/users?${qs.toString()}`);
    },
  },
  auditLogs: {
    getAll: (params?: { action?: string; targetType?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.action) qs.set('action', params.action);
      if (params?.targetType) qs.set('targetType', params.targetType);
      if (params?.page) qs.set('page', String(params.page));
      return request<any>(`/audit-logs?${qs.toString()}`);
    },
  },
  judgeAssignments: {
    assign: (roundId: string, judgeId: string) =>
      request<any>(`/JudgeAssignments/rounds/${roundId}/judges`, { method: 'POST', body: JSON.stringify({ judgeId }) }),
    remove: (roundId: string, judgeId: string) =>
      request<any>(`/JudgeAssignments/rounds/${roundId}/judges/${judgeId}`, { method: 'DELETE' }),
    getByRound: (roundId: string) =>
      request<any[]>(`/JudgeAssignments/rounds/${roundId}`),
    getByJudge: (judgeId: string) =>
      request<any[]>(`/JudgeAssignments/judges/${judgeId}`),
  },
  exports: {
    downloadExcel: async (eventId: string) => {
      const blob = await downloadFile(`/exports/events/${eventId}/ranking/excel`);
      // Tạo link tải file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BangXepHang_${eventId.substring(0,6)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  notifications: {
    getMy: () => request<any[]>('/notifications/me'),
    markAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  },
};
