// Role aktif di localStorage; JWT fallback di sessionStorage (per-tab).
// Preferensi utama tetap HttpOnly cookie; Bearer dipakai jika cookie tidak terkirim (dev beda port).
const ACTIVE_ROLE_KEY = 'authActiveRole';

function roleKey(role) {
  return `authToken_${role}`;
}

export function getActiveRole() {
  return localStorage.getItem(ACTIVE_ROLE_KEY) || null;
}

export function setActiveRole(role) {
  if (role) localStorage.setItem(ACTIVE_ROLE_KEY, role);
  else localStorage.removeItem(ACTIVE_ROLE_KEY);
}

export function getToken() {
  const role = getActiveRole();
  if (role) {
    const t = sessionStorage.getItem(roleKey(role));
    if (t) return t;
  }
  return sessionStorage.getItem('authToken') || null;
}

export function getTokenForRole(role) {
  return sessionStorage.getItem(roleKey(role)) || null;
}

export function setToken(token, role) {
  if (role) setActiveRole(role);
  if (!token) return;
  sessionStorage.setItem('authToken', token);
  if (role) sessionStorage.setItem(roleKey(role), token);
  // bersihkan sisa localStorage lama
  localStorage.removeItem('authToken');
  if (role) localStorage.removeItem(roleKey(role));
}

export function activateRoleToken(role) {
  if (role) setActiveRole(role);
  const t = role ? sessionStorage.getItem(roleKey(role)) : null;
  if (t) sessionStorage.setItem('authToken', t);
  return t || getToken();
}

export function clearToken(role) {
  if (role) {
    sessionStorage.removeItem(roleKey(role));
    if (getActiveRole() === role) {
      localStorage.removeItem(ACTIVE_ROLE_KEY);
      sessionStorage.removeItem('authToken');
    }
  } else {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    sessionStorage.removeItem('authToken');
    ['siswa', 'guru', 'kepsek', 'admin'].forEach((r) => {
      sessionStorage.removeItem(roleKey(r));
      localStorage.removeItem(roleKey(r));
    });
    localStorage.removeItem('authToken');
  }
}

export function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}
