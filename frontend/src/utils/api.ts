/*
 * Team Management System
 * Copyright (C) 2025
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
  register: (email: string, name: string, password: string, role?: string) =>
    api.post('/auth/register', { email, name, password, role }),
};

export const userApi = {
  getUsers: () => api.get('/users'),
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
  getJiraTickets: () => api.get('/capacity/jira-tickets'),
  updateAllocation: (userId: string, weekStart: string, data: any) =>
    api.put(`/capacity/allocations/${userId}/${weekStart}`, data),
  copyFromPreviousWeek: (weekStart: string) =>
    api.post('/capacity/copy-from-previous-week', { weekStart }),
};

export const timeOffApi = {
  getRequests: (params?: any) => api.get('/time-off', { params }),
  getCalendarRequests: (params?: any) => api.get('/time-off/calendar', { params }),
  getPendingCount: () => api.get('/time-off/dashboard/pending-count'),
  createRequest: (data: any) => api.post('/time-off', data),
  createAdminHoliday: (data: any) => api.post('/time-off/admin/create-holiday', data),
  updateRequest: (id: string, data: any) => api.put(`/time-off/${id}`, data),
  cancelRequest: (id: string, data: any) => api.post(`/time-off/${id}/cancel`, data),
  deleteRequest: (id: string) => api.delete(`/time-off/${id}`),
};

export default api;