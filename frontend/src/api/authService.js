import axiosClient, { extractErrorMessage } from './axiosClient';
import { GURU_BK_LIST } from '../data/guruBkList';
import { KEPSEK_LIST } from '../data/kepsekList';

/**
 * Login siswa lewat backend (tabel siswa, password di-hash MD5 di server).
 */
export async function loginSiswa(nis, password) {
  try {
    const { data } = await axiosClient.post('/api/login', { nis, password });
    return { success: true, siswa: data.siswa };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'NIS atau password salah.') };
  }
}

/**
 * Registrasi siswa baru lewat backend.
 */
export async function registerSiswa(payload) {
  try {
    const { data } = await axiosClient.post('/api/register', payload);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Registrasi gagal.') };
  }
}

/**
 * Login Guru BK. Masih dicocokkan ke data statis di client (lihat data/guruBkList.js)
 * karena backend belum menyediakan endpoint untuk role ini.
 */
export function loginGuruBk(username, password) {
  const guru = GURU_BK_LIST.find((g) => g.username === username && g.password === password);
  if (!guru) {
    return { success: false, error: 'Username atau password salah!' };
  }
  return { success: true, guru };
}

/**
 * Login Kepala Sekolah. Sama seperti Guru BK, masih dicocokkan di client.
 */
export function loginKepsek(username, password) {
  const kepsek = KEPSEK_LIST.find((k) => k.username === username && k.password === password);
  if (!kepsek) {
    return { success: false, error: 'Username atau password salah!' };
  }
  return { success: true, kepsek };
}
