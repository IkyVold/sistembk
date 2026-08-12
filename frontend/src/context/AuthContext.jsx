import { createContext, useContext, useState, useCallback } from 'react';
import { clearToken, activateRoleToken } from '../api/tokenStore';
import { logout as apiLogout } from '../api/authService';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  siswa: 'isLoggedIn',
  guru: 'guruBKLoggedIn',
  kepsek: 'kepsekLoggedIn',
  admin: 'adminMasterLoggedIn',
};

function readInitialState() {
  const isSiswaLoggedIn = localStorage.getItem(STORAGE_KEYS.siswa) === 'true';
  const isGuruLoggedIn = localStorage.getItem(STORAGE_KEYS.guru) === 'true';
  const isKepsekLoggedIn = localStorage.getItem(STORAGE_KEYS.kepsek) === 'true';
  const isAdminLoggedIn = localStorage.getItem(STORAGE_KEYS.admin) === 'true';

  let guru = null;
  if (isGuruLoggedIn) {
    try {
      guru = JSON.parse(localStorage.getItem('guruBKData') || 'null');
    } catch {
      guru = { username: localStorage.getItem('guruBKUsername') };
    }
  }

  return {
    siswa: isSiswaLoggedIn
      ? {
          nis: localStorage.getItem('currentUser'),
          nama: localStorage.getItem('currentUserNama'),
          kelas: localStorage.getItem('currentUserKelas'),
          foto_profile: localStorage.getItem('currentUserFoto') || null,
        }
      : null,
    guru,
    kepsek: isKepsekLoggedIn
      ? {
          username: localStorage.getItem('kepsekUsername'),
          nama: localStorage.getItem('kepsekNama'),
          nip: localStorage.getItem('kepsekNip'),
          sekolah: localStorage.getItem('kepsekSekolah'),
        }
      : null,
    admin: isAdminLoggedIn
      ? {
          username: localStorage.getItem('adminUsername'),
          nama: localStorage.getItem('adminNama'),
        }
      : null,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readInitialState);

  const loginAsSiswa = useCallback((siswa) => {
    activateRoleToken('siswa');
    localStorage.setItem(STORAGE_KEYS.siswa, 'true');
    localStorage.setItem('currentUser', siswa.nis);
    localStorage.setItem('currentUserNama', siswa.nama);
    localStorage.setItem('currentUserKelas', siswa.kelas);
    if (siswa.foto_profile) {
      localStorage.setItem('currentUserFoto', siswa.foto_profile);
    } else {
      localStorage.removeItem('currentUserFoto');
    }
    localStorage.setItem(
      `userData_${siswa.nis}`,
      JSON.stringify({ nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas })
    );
    setSession((prev) => ({ ...prev, siswa }));
  }, []);

  const updateSiswaFoto = useCallback((fotoPath) => {
    if (fotoPath) {
      localStorage.setItem('currentUserFoto', fotoPath);
    } else {
      localStorage.removeItem('currentUserFoto');
    }
    setSession((prev) => ({
      ...prev,
      siswa: prev.siswa ? { ...prev.siswa, foto_profile: fotoPath || null } : prev.siswa,
    }));
  }, []);

  const loginAsGuru = useCallback((guru) => {
    activateRoleToken('guru');
    localStorage.setItem(STORAGE_KEYS.guru, 'true');
    localStorage.setItem('guruBKUsername', guru.username);
    // Simpan profil lengkap — dipakai filter konseling by nama (guru_bk)
    localStorage.setItem('guruBKData', JSON.stringify(guru));
    setSession((prev) => ({ ...prev, guru }));
  }, []);

  const loginAsKepsek = useCallback((kepsek) => {
    activateRoleToken('kepsek');
    localStorage.setItem(STORAGE_KEYS.kepsek, 'true');
    localStorage.setItem('kepsekUsername', kepsek.username);
    localStorage.setItem('kepsekNama', kepsek.nama);
    localStorage.setItem('kepsekNip', kepsek.nip || '');
    localStorage.setItem('kepsekSekolah', kepsek.sekolah || '');
    setSession((prev) => ({ ...prev, kepsek }));
  }, []);

  const loginAsAdmin = useCallback((admin) => {
    activateRoleToken('admin');
    localStorage.setItem(STORAGE_KEYS.admin, 'true');
    localStorage.setItem('adminUsername', admin.username);
    localStorage.setItem('adminNama', admin.nama || 'Admin');
    setSession((prev) => ({ ...prev, admin }));
  }, []);

  const logout = useCallback((role) => {
    // Hapus HttpOnly cookie di server (async, fire-and-forget)
    apiLogout(role).catch(() => {});
    if (role) clearToken(role);
    else clearToken();
    if (role === 'siswa') {
      localStorage.removeItem(STORAGE_KEYS.siswa);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserNama');
      localStorage.removeItem('currentUserKelas');
      localStorage.removeItem('currentUserFoto');
    } else if (role === 'guru') {
      localStorage.removeItem(STORAGE_KEYS.guru);
      localStorage.removeItem('guruBKUsername');
      localStorage.removeItem('guruBKData');
    } else if (role === 'kepsek') {
      localStorage.removeItem(STORAGE_KEYS.kepsek);
      localStorage.removeItem('kepsekUsername');
      localStorage.removeItem('kepsekNama');
      localStorage.removeItem('kepsekNip');
      localStorage.removeItem('kepsekSekolah');
    } else if (role === 'admin') {
      localStorage.removeItem(STORAGE_KEYS.admin);
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('adminNama');
    } else {
      localStorage.clear();
    }
    setSession((prev) => ({ ...prev, [role]: null }));
  }, []);

  const value = {
    siswa: session.siswa,
    guru: session.guru,
    kepsek: session.kepsek,
    admin: session.admin,
    loginAsSiswa,
    loginAsGuru,
    loginAsKepsek,
    loginAsAdmin,
    updateSiswaFoto,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  }
  return ctx;
}
