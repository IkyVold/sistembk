import axios from 'axios';

// Semua request ke backend lewat satu instance ini, biar base URL
// dan penanganan error konsisten di seluruh aplikasi.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ambil pesan error dari response backend dengan format yang konsisten,
// fallback ke pesan default kalau backend tidak merespons (server mati, dsb).
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
