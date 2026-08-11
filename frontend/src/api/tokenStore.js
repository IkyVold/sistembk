// JWT per-role: siswa/guru/kepsek/admin tidak saling menimpa.
const ACTIVE_KEY = 'authToken';
const ACTIVE_ROLE_KEY = 'authActiveRole';

function roleKey(role) {
  return `authToken_${role}`;
}

export function getActiveRole() {
  return localStorage.getItem(ACTIVE_ROLE_KEY) || null;
}

export function getToken() {
  const role = getActiveRole();
  if (role) {
    const t = localStorage.getItem(roleKey(role));
    if (t) return t;
  }
  return localStorage.getItem(ACTIVE_KEY);
}

export function getTokenForRole(role) {
  return localStorage.getItem(roleKey(role));
}

/** Simpan token untuk role & jadikan aktif. */
export function setToken(token, role) {
  if (!token) {
    localStorage.removeItem(ACTIVE_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_KEY, token);
  if (role) {
    localStorage.setItem(roleKey(role), token);
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
  }
}

/** Aktifkan token role tertentu sebelum request halaman itu. */
export function activateRoleToken(role) {
  const t = localStorage.getItem(roleKey(role));
  if (t) {
    localStorage.setItem(ACTIVE_KEY, t);
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    return t;
  }
  return null;
}

export function clearToken(role) {
  if (role) {
    localStorage.removeItem(roleKey(role));
    if (getActiveRole() === role) {
      localStorage.removeItem(ACTIVE_KEY);
      localStorage.removeItem(ACTIVE_ROLE_KEY);
    }
  } else {
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    ['siswa', 'guru', 'kepsek', 'admin'].forEach((r) => {
      localStorage.removeItem(roleKey(r));
    });
  }
}
