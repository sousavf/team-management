import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const userApi = {
  getUsers: () => api.get('/users'),
  getPublicUsers: () => api.get('/users/public'),
  getUser: (id: string) => api.get(`/users/${id}`),
  getCurrentUser: () => api.get('/users/me'),
  createUser: (userData: any) => api.post('/users', userData),
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  changePassword: (data: any) => api.post('/users/change-password', data),
};

export const capacityApi = {
  getAllocations: (params?: any) => api.get('/capacity/allocations', { params }),
  getTeamOverview: (params?: any) => api.get('/capacity/team-overview', { params }),
  getTodoCapacity: () => api.get('/capacity/todo-capacity'),
  getNextWeekTodoCapacity: () => api.get('/capacity/next-week-todo-capacity'),
  updateAllocation: (userId: string, weekStart: string, data: any) =>
    api.put(`/capacity/allocations/${userId}/${weekStart}`, data),
  copyFromPreviousWeek: (weekStart: string) =>
    api.post('/capacity/copy-from-previous-week', { weekStart }),
  extractHistoricalCapacity: (params?: any) => api.get('/capacity/extract-historical', { params }),
  exportToExcel: (params?: any) => api.get('/capacity/export-excel', {
    params,
    responseType: 'blob'
  }),
};

export const timeOffApi = {
  getRequests: (params?: any) => api.get('/time-off', { params }),
  getCalendarRequests: (params?: any) => api.get('/time-off/calendar', { params }),
  getPublicCalendarRequests: (params?: any) => api.get('/time-off/calendar/public', { params }),
  getPendingCount: () => api.get('/time-off/dashboard/pending-count'),
  createRequest: (data: any) => api.post('/time-off', data),
  createAdminHoliday: (data: any) => api.post('/time-off/admin/create-holiday', data),
  updateRequest: (id: string, data: any) => api.put(`/time-off/${id}`, data),
  cancelRequest: (id: string, data: any) => api.post(`/time-off/${id}/cancel`, data),
  deleteRequest: (id: string) => api.delete(`/time-off/${id}`),
};

export default api;