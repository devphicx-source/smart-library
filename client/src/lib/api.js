let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
if (API_BASE && !API_BASE.endsWith('/api')) {
  API_BASE = API_BASE.replace(/\/$/, '') + '/api';
}

/**
 * Fetch wrapper with JWT auth and error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('slms_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ── Auth ──
export const sendOtp = (phone, name) => apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone, name }) });
export const verifyOtp = (phone, otp) => apiFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) });
export const getMe = () => apiFetch('/auth/me');
export const updateProfile = (name) => apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name }) });
export const firebaseLogin = (idToken, name) => apiFetch('/auth/firebase-login', { method: 'POST', body: JSON.stringify({ idToken, name }) });
export const checkUser = (phone) => apiFetch('/auth/check-user', { method: 'POST', body: JSON.stringify({ phone }) });

// ── Sessions ──
export const checkIn = (deskId) => apiFetch('/sessions/check-in', { method: 'POST', body: JSON.stringify({ deskId }) });
export const checkOut = () => apiFetch('/sessions/check-out', { method: 'POST' });
export const startBreak = () => apiFetch('/sessions/start-break', { method: 'POST' });
export const endBreak = () => apiFetch('/sessions/end-break', { method: 'POST' });
export const getActiveSession = () => apiFetch('/sessions/active');
export const getSessionHistory = (page = 1) => apiFetch(`/sessions/history?page=${page}`);
export const getDesks = () => apiFetch('/sessions/desks');

// ── Leaderboard & Stats ──
export const getLeaderboard = (limit = 20) => apiFetch(`/leaderboard?limit=${limit}`);
export const getDailyStats = (date) => apiFetch(`/stats/daily${date ? `?date=${date}` : ''}`);
export const getWeeklyTrend = () => apiFetch('/stats/weekly');

// ── Fees ──
export const getMyFees = () => apiFetch('/fees/my');
export const getAllFees = (status, page = 1) => apiFetch(`/fees?page=${page}${status ? `&status=${status}` : ''}`);
export const createFee = (data) => apiFetch('/fees', { method: 'POST', body: JSON.stringify(data) });
export const updateFee = (id, status) => apiFetch(`/fees/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const payFee = (id) => apiFetch(`/fees/${id}/pay`, { method: 'PATCH' });
export const notifyPayment = (id, data) => apiFetch(`/fees/${id}/notify-payment`, { method: 'PATCH', body: JSON.stringify(data) });

// ── Admin ──
export const getOccupancy = () => apiFetch('/admin/occupancy');
export const getRecentActivity = () => apiFetch('/admin/activity');
export const getAllStudents = (search = '') => apiFetch(`/admin/students${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const getAnalytics = () => apiFetch('/admin/analytics');
export const getNotifications = (since) => apiFetch(`/admin/notifications${since ? `?since=${encodeURIComponent(since)}` : ''}`);
export const createStudent = (data) => apiFetch('/admin/students', { method: 'POST', body: JSON.stringify(data) });
