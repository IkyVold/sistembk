import axiosClient, { extractErrorMessage } from '../../../api/axiosClient';
import { activateRoleToken } from '../../../api/tokenStore';

export async function fetchKonselingByGuru(guruNama) {
  activateRoleToken('guru');
  const { data } = await axiosClient.get('/api/konseling-bk', {
    params: { guru: guruNama },
  });
  return data;
}

export async function lookupSiswaByNis(nis) {
  activateRoleToken('guru');
  const { data } = await axiosClient.get(`/api/profile/${nis}`);
  return data;
}

export async function konfirmasiJadwalKonseling(id, { tanggal, jam }) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.put(`/api/konseling/${id}/konfirmasi`, { tanggal, jam });
    if (!data.success) throw new Error(data.error || 'Gagal memkonfirmasi jadwal');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal memkonfirmasi jadwal') };
  }
}

export async function ubahStatusKonseling(id, status) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.put(`/api/konseling/${id}/status`, { status });
    if (!data.success) throw new Error(data.error || 'Gagal mengubah status');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal mengubah status') };
  }
}

export async function simpanLaporanKonseling(id, payload) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.put(`/api/konseling/${id}/laporan`, payload);
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan laporan');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menyimpan laporan') };
  }
}

export async function simpanWalkinKonseling(payload) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.post('/api/konseling/walkin', payload);
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan data');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menyimpan data walk-in') };
  }
}

export async function buatSesiLanjutan(payload) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.post('/api/konseling/lanjutan', payload);
    if (!data.success) throw new Error(data.error || 'Gagal membuat sesi lanjutan');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal membuat sesi lanjutan') };
  }
}
