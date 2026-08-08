import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  siswa: 'isLoggedIn',
  guru: 'guruBKLoggedIn',
  kepsek: 'kepsekLoggedIn',
};

// Baca session yang mungkin sudah tersimpan dari localStorage saat pertama kali load,
// supaya perilaku "tetap login setelah refresh" seperti versi HTML lama tetap jalan.
function readInitialState() {
  const isSiswaLoggedIn = localStorage.getItem(STORAGE_KEYS.siswa) === 'true';
  const isGuruLoggedIn = localStorage.getItem(STORAGE_KEYS.guru) === 'true';
  const isKepsekLoggedIn = localStorage.getItem(STORAGE_KEYS.kepsek) === 'true';

  return {
    siswa: isSiswaLoggedIn
      ? {
          nis: localStorage.getItem('currentUser'),
          nama: localStorage.getItem('currentUserNama'),
          kelas: localStorage.getItem('currentUserKelas'),
          foto_profile: localStorage.getItem('currentUserFoto') || null,
        }
      : null,
    guru: isGuruLoggedIn
      ? { username: localStorage.getItem('guruBKUsername') }
      : null,
    kepsek: isKepsekLoggedIn
      ? {
          username: localStorage.getItem('kepsekUsername'),
          nama: localStorage.getItem('kepsekNama'),
          nip: localStorage.getItem('kepsekNip'),
          sekolah: localStorage.getItem('kepsekSekolah'),
        }
      : null,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readInitialState);

  const loginAsSiswa = useCallback((siswa) => {
    localStorage.setItem(STORAGE_KEYS.siswa, 'true');
    localStorage.setItem('currentUser', siswa.nis);
    localStorage.setItem('currentUserNama', siswa.nama);
    localStorage.setItem('currentUserKelas', siswa.kelas);
    if (siswa.foto_profile) {
      localStorage.setItem('currentUserFoto', siswa.foto_profile);
    } else {
      localStorage.removeItem('currentUserFoto');
    }
    // Data per-user disimpan juga agar bisa diakses halaman guru-bk, sesuai perilaku lama.
    localStorage.setItem(
      `userData_${siswa.nis}`,
      JSON.stringify({ nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas })
    );
    setSession((prev) => ({ ...prev, siswa }));
  }, []);

  // Dipanggil setelah upload/hapus foto profil, supaya Navbar & halaman lain
  // langsung ikut update tanpa perlu logout-login ulang.
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
    localStorage.setItem(STORAGE_KEYS.guru, 'true');
    localStorage.setItem('guruBKUsername', guru.username);
    setSession((prev) => ({ ...prev, guru }));
  }, []);

  const loginAsKepsek = useCallback((kepsek) => {
    localStorage.setItem(STORAGE_KEYS.kepsek, 'true');
    localStorage.setItem('kepsekUsername', kepsek.username);
    localStorage.setItem('kepsekNama', kepsek.nama);
    localStorage.setItem('kepsekNip', kepsek.nip);
    localStorage.setItem('kepsekSekolah', kepsek.sekolah);
    setSession((prev) => ({ ...prev, kepsek }));
  }, []);

  const logout = useCallback((role) => {
    if (role === 'siswa') {
      localStorage.removeItem(STORAGE_KEYS.siswa);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserNama');
      localStorage.removeItem('currentUserKelas');
      localStorage.removeItem('currentUserFoto');
    } else if (role === 'guru') {
      localStorage.removeItem(STORAGE_KEYS.guru);
      localStorage.removeItem('guruBKUsername');
    } else if (role === 'kepsek') {
      localStorage.removeItem(STORAGE_KEYS.kepsek);
      localStorage.removeItem('kepsekUsername');
      localStorage.removeItem('kepsekNama');
      localStorage.removeItem('kepsekNip');
      localStorage.removeItem('kepsekSekolah');
    } else {
      localStorage.clear();
    }
    setSession((prev) => ({ ...prev, [role]: null }));
  }, []);

  const value = {
    siswa: session.siswa,
    guru: session.guru,
    kepsek: session.kepsek,
    loginAsSiswa,
    loginAsGuru,
    loginAsKepsek,
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
