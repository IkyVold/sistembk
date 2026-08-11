import axiosClient, { extractErrorMessage } from '../../../api/axiosClient';
import { activateRoleToken } from '../../../api/tokenStore';

export async function fetchAllInformasi() {
  activateRoleToken('guru');
  const { data } = await axiosClient.get('/api/informasi');
  return data;
}

export async function simpanInformasi({ id, judul, kategori, isi, guruBk }) {
  activateRoleToken('guru');
  try {
    let data;
    if (id) {
      ({ data } = await axiosClient.put(`/api/informasi/${id}`, { judul, kategori, isi }));
    } else {
      ({ data } = await axiosClient.post('/api/informasi', { judul, kategori, isi, guru_bk: guruBk }));
    }
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan informasi');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menyimpan informasi') };
  }
}

export async function hapusInformasi(id) {
  activateRoleToken('guru');
  try {
    const { data } = await axiosClient.delete(`/api/informasi/${id}`);
    if (!data.success) throw new Error(data.error || 'Gagal menghapus informasi');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menghapus informasi') };
  }
}
