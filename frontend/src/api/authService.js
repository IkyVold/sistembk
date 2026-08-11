import axiosClient, { extractErrorMessage } from './axiosClient';
import { setToken } from './tokenStore';

/**
 * Login siswa lewat backend (tabel siswa, password di-hash MD5 di server).
 */
export async function loginSiswa(nis, password) {
  try {
    const { data } = await axiosClient.post('/api/login', { nis, password });
    if (data.token) setToken(data.token, 'siswa');
    return { success: true, siswa: data.siswa, token: data.token };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'NIS atau password salah.') };
  }
}

/**
 * Registrasi mandiri dinonaktifkan — akun dibuat oleh Guru BK.
 */
export async function registerSiswa() {
  return {
    success: false,
    error: 'Registrasi mandiri tidak tersedia. Hubungi Guru BK untuk pembuatan akun.',
  };
}

/** Login Guru BK lewat backend (tabel guru_bk). */
export async function loginGuruBk(username, password) {
  try {
    const { data } = await axiosClient.post('/api/login-guru', { username, password });
    if (data.token) setToken(data.token, 'guru');
    return { success: true, guru: data.guru, token: data.token };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Username atau password salah!') };
  }
}

/** Login Kepala Sekolah lewat backend (tabel kepala_sekolah). */
export async function loginKepsek(username, password) {
  try {
    const { data } = await axiosClient.post('/api/login-kepsek', { username, password });
    if (data.token) setToken(data.token, 'kepsek');
    return { success: true, kepsek: data.kepsek, token: data.token };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Username atau password salah!') };
  }
}

/** Login Admin. */
export async function loginAdmin(username, password) {
  try {
    const { data } = await axiosClient.post('/api/login-admin', { username, password });
    if (data.token) setToken(data.token, 'admin');
    return { success: true, admin: data.admin, token: data.token };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Username atau password salah!') };
  }
}
