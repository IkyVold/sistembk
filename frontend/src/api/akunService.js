import axiosClient, { extractErrorMessage } from './axiosClient';

/** Daftar Guru BK aktif untuk halaman Pilih Guru (siswa). */
export async function fetchGuruBkPublic() {
  try {
    const { data } = await axiosClient.get('/api/guru-bk');
    return { success: true, data: data.data || [] };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal memuat daftar Guru BK'), data: [] };
  }
}

export async function fetchGuruBkAdmin() {
  try {
    const { data } = await axiosClient.get('/api/admin/guru-bk');
    return { success: true, data: data.data || [] };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error), data: [] };
  }
}

export async function createGuruBk(payload) {
  try {
    const { data } = await axiosClient.post('/api/admin/guru-bk', payload);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateGuruBk(id, payload) {
  try {
    const { data } = await axiosClient.put(`/api/admin/guru-bk/${id}`, payload);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteGuruBk(id) {
  try {
    const { data } = await axiosClient.delete(`/api/admin/guru-bk/${id}`);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function fetchKepsekAdmin() {
  try {
    const { data } = await axiosClient.get('/api/admin/kepsek');
    return { success: true, data: data.data || [] };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error), data: [] };
  }
}

export async function createKepsek(payload) {
  try {
    const { data } = await axiosClient.post('/api/admin/kepsek', payload);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateKepsek(id, payload) {
  try {
    const { data } = await axiosClient.put(`/api/admin/kepsek/${id}`, payload);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteKepsek(id) {
  try {
    const { data } = await axiosClient.delete(`/api/admin/kepsek/${id}`);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}


/** Upload foto profil Guru BK. */
export async function uploadFotoGuruBk(username, file) {
  try {
    const form = new FormData();
    form.append('foto', file);
    const { data } = await axiosClient.put(`/api/guru-bk/${encodeURIComponent(username)}/foto`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, foto_profile: data.foto_profile, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal mengunggah foto') };
  }
}

/** Hapus foto profil Guru BK. */
export async function deleteFotoGuruBk(username) {
  try {
    const { data } = await axiosClient.delete(`/api/guru-bk/${encodeURIComponent(username)}/foto`);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menghapus foto') };
  }
}
