import axios from 'axios';
import { getActiveRole, getToken, getCookie, clearToken } from './tokenStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  const role = getActiveRole();
  if (role) {
    config.headers['X-Auth-Role'] = role;
  }

  // Bearer fallback jika cookie HttpOnly tidak terkirim (dev localhost beda port)
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = String(config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const csrf = getCookie('csrf_token');
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }

  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      const role = getActiveRole();
      if (role) clearToken(role);
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error, fallback = 'Terjadi kesalahan') {
  if (error?.response?.data?.error) {
    const e = error.response.data.error;
    return typeof e === 'string' ? e : e.message || fallback;
  }
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallback;
}

export default axiosClient;
