/**
 * MedInsight AI — Axios API Client
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
  changePassword: (data: any) => api.put('/auth/me/password', data),
  deleteMyAccount: () => api.delete('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) => api.post('/auth/reset-password', { token, new_password }),
};

// ── Datasets ──────────────────────────────────────────────────────────────────
export const datasetsApi = {
  list: (skip = 0, limit = 20) => api.get(`/datasets/?skip=${skip}&limit=${limit}`),
  get: (id: number) => api.get(`/datasets/${id}`),
  getColumns: (id: number) => api.get(`/datasets/${id}/columns`),
  preview: (id: number, rows = 50) => api.get(`/datasets/${id}/preview?rows=${rows}`),
  upload: (formData: FormData) => api.post('/datasets/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/datasets/${id}`),
  update: (id: number, data: any) => api.put(`/datasets/${id}`, null, { params: data }),
};

// ── Quality ───────────────────────────────────────────────────────────────────
export const qualityApi = {
  run: (datasetId: number) => api.post(`/quality/${datasetId}/run`),
  listReports: (datasetId: number) => api.get(`/quality/${datasetId}/reports`),
  getReport: (reportId: number) => api.get(`/quality/report/${reportId}`),
};

// ── Preprocessing ─────────────────────────────────────────────────────────────
export const preprocessingApi = {
  run: (datasetId: number, config: any) => api.post(`/preprocessing/${datasetId}/run`, config),
  listJobs: (datasetId: number) => api.get(`/preprocessing/${datasetId}/jobs`),
};

// ── EDA ───────────────────────────────────────────────────────────────────────
export const edaApi = {
  summary: (datasetId: number) => api.get(`/eda/${datasetId}/summary`),
  histogram: (datasetId: number, column: string, bins = 20) =>
    api.get(`/eda/${datasetId}/histogram?column=${encodeURIComponent(column)}&bins=${bins}`),
  boxplot: (datasetId: number, column: string, groupBy?: string) =>
    api.get(`/eda/${datasetId}/boxplot?column=${encodeURIComponent(column)}${groupBy ? `&group_by=${encodeURIComponent(groupBy)}` : ''}`),
  scatter: (datasetId: number, x: string, y: string, color?: string) =>
    api.get(`/eda/${datasetId}/scatter?x_col=${encodeURIComponent(x)}&y_col=${encodeURIComponent(y)}${color ? `&color_col=${encodeURIComponent(color)}` : ''}`),
  correlation: (datasetId: number, method = 'pearson') =>
    api.get(`/eda/${datasetId}/correlation?method=${method}`),
  missingHeatmap: (datasetId: number) => api.get(`/eda/${datasetId}/missing-heatmap`),
  valueCounts: (datasetId: number, column: string, topN = 20) =>
    api.get(`/eda/${datasetId}/value-counts?column=${encodeURIComponent(column)}&top_n=${topN}`),
  biomedicalAnalytics: (datasetId: number) => api.get(`/eda/${datasetId}/biomedical-analytics`),
};

// ── ML ────────────────────────────────────────────────────────────────────────
export const mlApi = {
  train: (data: any) => api.post('/ml/train', data),
  listExperiments: (skip = 0, limit = 20) => api.get(`/ml/experiments?skip=${skip}&limit=${limit}`),
  getExperiment: (id: number) => api.get(`/ml/experiments/${id}`),
  listModels: (skip = 0, limit = 20) => api.get(`/ml/models?skip=${skip}&limit=${limit}`),
  getModel: (id: number) => api.get(`/ml/models/${id}`),
  availableAlgorithms: () => api.get('/ml/available-algorithms'),
};

// ── Predictions ───────────────────────────────────────────────────────────────
export const predictionsApi = {
  predict: (modelId: number, inputData: any) => api.post('/predictions/predict', { model_id: modelId, input_data: inputData }),
  history: (skip = 0, limit = 20) => api.get(`/predictions/history?skip=${skip}&limit=${limit}`),
  get: (id: number) => api.get(`/predictions/${id}`),
};

// ── XAI ───────────────────────────────────────────────────────────────────────
export const xaiApi = {
  explain: (data: any) => api.post('/xai/explain', data),
  globalImportance: (modelId: number) => api.get(`/xai/global/${modelId}`),
};

// ── Anomaly ───────────────────────────────────────────────────────────────────
export const anomalyApi = {
  run: (datasetId: number, config: any) => api.post(`/anomaly/${datasetId}/run`, config),
  listJobs: (datasetId: number) => api.get(`/anomaly/${datasetId}/jobs`),
  getResults: (jobId: number) => api.get(`/anomaly/job/${jobId}/results`),
};

// ── Signals ───────────────────────────────────────────────────────────────────
export const signalsApi = {
  analyze: (formData: FormData) => api.post('/signals/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listJobs: () => api.get('/signals/jobs'),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  upload: (formData: FormData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: (skip = 0, limit = 20) => api.get(`/documents/?skip=${skip}&limit=${limit}`),
  summary: (id: number) => api.get(`/documents/${id}/summary`),
  ask: (id: number, question: string) => api.post(`/documents/${id}/ask?question=${encodeURIComponent(question)}`),
  delete: (id: number) => api.delete(`/documents/${id}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  generate: (data: any) => api.post('/reports/generate', data),
  list: () => api.get('/reports/'),
  download: (id: number) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  listUsers: (skip = 0, limit = 50) => api.get(`/admin/users?skip=${skip}&limit=${limit}`),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  updateRole: (id: number, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  updateStatus: (id: number, is_active: boolean) => api.put(`/admin/users/${id}/status`, { is_active }),
  approvePassword: (id: number) => api.post(`/admin/users/${id}/approve-password`),
  rejectPassword: (id: number) => api.post(`/admin/users/${id}/reject-password`),
  resetPassword: (id: number, new_password: string) => api.post(`/admin/users/${id}/reset-password`, { new_password }),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  getGovernance: () => api.get('/admin/governance'),
  updateMaxAdmins: (max_admins: number) => api.put('/admin/governance/max-admins', { max_admins }),
};

// ── Activity ──────────────────────────────────────────────────────────────────
export const activityApi = {
  list: (skip = 0, limit = 50) => api.get(`/activity/?skip=${skip}&limit=${limit}`),
  count: () => api.get('/activity/count'),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => axios.get('/api/health'),
};
