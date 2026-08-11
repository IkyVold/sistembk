import axios from 'axios';
import { getToken, getTokenForRole, getActiveRole } from './tokenStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Pilih token yang paling cocok untuk URL.
 * Endpoint khusus guru tidak boleh ikut token siswa (penyebab 403).
 */
function resolveTokenForRequest(config) {
  const url = String(config.url || '');
  const method = String(config.method || 'get').toLowerCase();

  // Endpoint hanya untuk Guru BK (dan admin)
  const isGuruEndpoint =
    url.includes('/konseling-bk') ||
    url.includes('/konseling/walkin') ||
    url.includes('/validasi') ||
    url.includes('/siswa/import') ||
    url.includes('/api/siswa') ||
    url.endsWith('/siswa') ||
    (url.includes('/konseling/') && (method === 'put' || method === 'delete' || method === 'post')) ||
    (url.includes('/guru-bk/') && url.includes('/foto')) ||
    (url.includes('/riwayat-kelas') && method !== 'get') ||
    (url.includes('/informasi') && method !== 'get');

  // Admin endpoints
  const isAdminEndpoint = url.includes('/api/admin/');

  // Kepsek
  const isKepsekEndpoint = url.includes('/konseling-all');

  if (isAdminEndpoint) {
    return getTokenForRole('admin') || getToken();
  }
  if (isKepsekEndpoint) {
    return getTokenForRole('kepsek') || getTokenForRole('admin') || getToken();
  }
  if (isGuruEndpoint) {
    return getTokenForRole('guru') || getTokenForRole('admin') || getToken();
  }

  return getToken();
}

axiosClient.interceptors.request.use((config) => {
  const token = resolveTokenForRequest(config);
  if (token) {
    config.headers = config.headers || {};
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);

export function extractErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.request) {
    return `Koneksi ke server gagal. Pastikan backend berjalan di ${axiosClient.defaults.baseURL}.`;
  }
  return fallback;
}

export default axiosClient;
