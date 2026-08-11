import axiosClient, { extractErrorMessage } from '../../../api/axiosClient';
import { activateRoleToken } from '../../../api/tokenStore';

export async function fetchAllSiswa() {
  activateRoleToken('guru');
  const { data } = await axiosClient.get('/api/siswa');
  return data;
}

export async function tambahSiswaManual(payload) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.post('/api/siswa', payload);
    if (!data.success) throw new Error(data.error || 'Gagal menambahkan siswa');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menambahkan siswa') };
  }
}

export async function importSiswaExcel(file) {
  activateRoleToken('guru');
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axiosClient.post('/api/siswa/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!data.success) throw new Error(data.error || 'Gagal memproses import');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal memproses import') };
  }
}

export async function previewImportAbsen(file) {
  activateRoleToken('guru');
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axiosClient.post('/api/siswa/import-absen/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!data.success) throw new Error(data.error || 'Gagal membaca file');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal membaca file') };
  }
}

export async function importAbsenRows(rows) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.post('/api/siswa/import-rows', { rows });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menyimpan data') };
  }
}
