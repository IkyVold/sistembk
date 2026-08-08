import axiosClient, { extractErrorMessage } from '../../../api/axiosClient';

export async function fetchAllInformasi() {
  const { data } = await axiosClient.get('/api/informasi');
  return data;
}

export async function simpanInformasi({ id, judul, kategori, isi, guruBk }) {
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
  try {
    const { data } = await axiosClient.delete(`/api/informasi/${id}`);
    if (!data.success) throw new Error(data.error || 'Gagal menghapus informasi');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menghapus informasi') };
  }
}
