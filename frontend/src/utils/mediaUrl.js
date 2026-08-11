const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/** Ubah path relatif /uploads/... jadi URL absolut ke backend. */
export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/uploads/')) return `${API_BASE}${path}`;
  return path;
}
