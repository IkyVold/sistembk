import axiosClient, { extractErrorMessage } from './axiosClient';
import { setToken, clearToken } from './tokenStore';

export async function loginSiswa(nis, password) {
  try {
    const { data } = await axiosClient.post('/api/login', { nis, password });
    if (data.token) setToken(data.token, 'siswa');
    else setToken(null, 'siswa');
    return { success: true, siswa: data.siswa };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'NIS atau password salah.') };
  }
}

export async function registerSiswa() {
  return {
    success: false,
    error: 'Registrasi mandiri tidak tersedia. Hubungi Guru BK untuk pembuatan akun.',
  };
}

export async function loginGuruBk(username, password) {
  try {
    const { data } = await axiosClient.post('/api/login-guru', { username, password });
    if (data.token) setToken(data.token, 'guru');
    else setToken(null, 'guru');
    return { success: true, guru: data.guru };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Username atau password salah!') };
  }
}

export async function loginKepsek(username, password) {
  try {
    const { data } = await axiosClient.post('/api/login-kepsek', { username, password });
    if (data.token) setToken(data.token, 'kepsek');
    else setToken(null, 'kepsek');
    return { success: true, kepsek: data.kepsek };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Username atau password salah!') };
  }
}

export async function loginAdmin(username, password) {
  try {
    const { data } = await axiosClient.post('/api/login-admin', { username, password });
    if (data.token) setToken(data.token, 'admin');
    else setToken(null, 'admin');
    return { success: true, admin: data.admin };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Username atau password salah!') };
  }
}

export async function logout(role) {
  try {
    if (role === 'siswa') {
      await axiosClient.post('/api/logout', { role });
    } else {
      await axiosClient.post('/api/logout-role', { role });
    }
  } catch {
    // ignore
  }
  clearToken(role);
}
