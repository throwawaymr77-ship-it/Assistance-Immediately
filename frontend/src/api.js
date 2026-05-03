import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  getMe: () => api.get('/users/me/'),
};

export const ticketsAPI = {
  list: (params) => api.get('/tickets/', { params }),
  get: (id) => api.get(`/tickets/${id}/`),
  create: (data) => api.post('/tickets/', data),
  update: (id, data) => api.put(`/tickets/${id}/`, data),
  assign: (id, userId) => api.post(`/tickets/${id}/assign/`, { user_id: userId }),
  resolve: (id, data) => api.post(`/tickets/${id}/resolve/`, data),
  close: (id) => api.post(`/tickets/${id}/close/`),
  reopen: (id) => api.post(`/tickets/${id}/reopen/`),
  dashboard: () => api.get('/tickets/dashboard/'),
};

export const usersAPI = {
  list: (params) => api.get('/users/', { params }),
  get: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}/`, data),
  technicians: () => api.get('/users/technicians/'),
};

export const categoriesAPI = {
  list: () => api.get('/categories/'),
  all: () => api.get('/categories/all_categories/'),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
};

export const commentsAPI = {
  list: (ticketId) => api.get('/comments/', { params: { ticket: ticketId } }),
  create: (data) => api.post('/comments/', data),
  update: (id, data) => api.put(`/comments/${id}/`, data),
  delete: (id) => api.delete(`/comments/${id}/`),
};

export const attachmentsAPI = {
  list: (ticketId) => api.get('/attachments/', { params: { ticket: ticketId } }),
  upload: (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('ticket', data.ticket);
    if (data.comment) formData.append('comment', data.comment);
    return api.post('/attachments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const knowledgeBaseAPI = {
  list: (params) => api.get('/knowledge-base/', { params }),
  get: (id) => api.get(`/knowledge-base/${id}/`),
  create: (data) => api.post('/knowledge-base/', data),
  update: (id, data) => api.put(`/knowledge-base/${id}/`, data),
  delete: (id) => api.delete(`/knowledge-base/${id}/`),
  publish: (id) => api.post(`/knowledge-base/${id}/publish/`),
  rate: (id, helpful) => api.post(`/knowledge-base/${id}/rate/`, { helpful }),
};

export const assetsAPI = {
  list: (params) => api.get('/assets/', { params }),
  get: (id) => api.get(`/assets/${id}/`),
  create: (data) => api.post('/assets/', data),
  update: (id, data) => api.put(`/assets/${id}/`, data),
  delete: (id) => api.delete(`/assets/${id}/`),
  statistics: () => api.get('/assets/statistics/'),
};

export const changeRequestsAPI = {
  list: (params) => api.get('/change-requests/', { params }),
  get: (id) => api.get(`/change-requests/${id}/`),
  create: (data) => api.post('/change-requests/', data),
  update: (id, data) => api.put(`/change-requests/${id}/`, data),
  approve: (id) => api.post(`/change-requests/${id}/approve/`),
  reject: (id) => api.post(`/change-requests/${id}/reject/`),
};

export const slaAPI = {
  listPolicies: () => api.get('/sla-policies/'),
  createPolicy: (data) => api.post('/sla-policies/', data),
  updatePolicy: (id, data) => api.put(`/sla-policies/${id}/`, data),
  deletePolicy: (id) => api.delete(`/sla-policies/${id}/`),
  listRecords: () => api.get('/sla-records/'),
};

export const auditLogAPI = {
  list: (params) => api.get('/audit-logs/', { params }),
};

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats/'),
};

export default api;
