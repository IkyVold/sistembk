import axiosClient, { extractErrorMessage } from '../../../api/axiosClient';

export async function fetchRiwayatKelas(nis) {
  const { data } = await axiosClient.get(`/api/riwayat-kelas/${nis}`);
  return data;
}

export async function simpanRiwayatKelas({ nis, tahun_ajaran, kelas, status }) {
  try {
    const { data } = await axiosClient.post('/api/riwayat-kelas', { nis, tahun_ajaran, kelas, status });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menyimpan riwayat kelas') };
  }
}

export async function hapusRiwayatKelas(id) {
  try {
    const { data } = await axiosClient.delete(`/api/riwayat-kelas/${id}`);
    if (!data.success) throw new Error(data.error || 'Gagal menghapus');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menghapus riwayat kelas') };
  }
}
