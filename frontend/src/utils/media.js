const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Path foto dari backend berbentuk relatif, mis. "/uploads/siswa/xxxx.jpg".
// Karena file itu disajikan oleh backend (bukan Vite dev server), perlu
// digabung dengan base URL backend supaya <img> bisa memuatnya.
export function resolveMediaUrl(relativePath) {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${API_BASE_URL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}
