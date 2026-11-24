import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', timeout: 20000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('citylens.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  const message = error.response?.data?.message || error.message || 'Unable to connect to CityLens API.';
  return Promise.reject(new Error(message));
});
export const assetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${apiBase.replace(/\/api\/?$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
};
export const fetchReports = async (params = {}) => (await api.get('/reports', { params })).data;
export const fetchReport = async (id) => (await api.get(`/reports/${id}`)).data;
export const submitReport = async (payload) => (await api.post('/reports', payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
export default api;
