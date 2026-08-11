import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { activateRoleToken } from '../api/tokenStore';

/**
 * Bungkus halaman yang butuh login sesuai role tertentu.
 * Kalau belum login, redirect ke halaman login yang sesuai (meniru
 * `alert('Silakan login...'); window.location.href = 'login.html'` di versi lama).
 */
export default function ProtectedRoute({ role, redirectTo, children }) {
  const auth = useAuth();
  const isLoggedIn = Boolean(auth[role]);

  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  // Aktifkan JWT sesuai role halaman ini (cegah 403 salah role)
  activateRoleToken(role);

  return children;
}
