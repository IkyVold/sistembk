// models/konselingModel.js
// Akses data tabel `konseling` — pure query.
const pool = require('../database');

const SELECT_KONSELING_FULL = `
  k.id,
  k.guru_bk AS guru,
  DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal,
  TIME_FORMAT(k.jam, '%H:%i') AS jam,
  k.jenis,
  k.kategori,
  k.deskripsi,
  k.kelas_siswa,
  k.status,
  k.status_validasi,
  DATE_FORMAT(k.tanggal_validasi, '%Y-%m-%d') AS tanggal_validasi,
  TIME_FORMAT(k.jam_validasi, '%H:%i') AS jam_validasi,
  k.laporan,
  k.laporan_kesimpulan,
  k.laporan_rekomendasi,
  k.laporan_status_penanganan,
  k.laporan_catatan_tambahan,
  k.laporan_dibuat_oleh,
  DATE_FORMAT(k.laporan_tanggal, '%Y-%m-%d') AS laporan_tanggal,
  TIME_FORMAT(k.laporan_waktu, '%H:%i') AS laporan_waktu,
  k.laporan_created_at,
  k.created_at
`;

async function runAlter(sql) {
  await pool.query(sql);
}

async function insertPengajuan({
  siswaId, guru_bk, tanggal, jam, jenis, kategori, deskripsi, kelasSnapshot,
}) {
  const [result] = await pool.query(
    `INSERT INTO konseling (siswa_id, guru_bk, tanggal, jam, jenis, kategori, deskripsi, kelas_siswa, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Proses')`,
    [siswaId, guru_bk, tanggal, jam, jenis, kategori, deskripsi, kelasSnapshot]
  );
  return result;
}

async function listAll() {
  const [rows] = await pool.query(
    `SELECT
      ${SELECT_KONSELING_FULL},
      s.nis,
      s.nama AS nama_siswa,
      s.jenis_kelamin,
      DATE_FORMAT(s.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
      s.alamat
     FROM konseling k
     JOIN siswa s ON s.id = k.siswa_id
     ORDER BY k.tanggal DESC, k.jam DESC, k.id DESC`
  );
  return rows;
}

async function listByGuru(guru) {
  const [rows] = await pool.query(
    `SELECT
      ${SELECT_KONSELING_FULL},
      s.nis,
      s.nama AS nama_siswa,
      s.foto_profile AS foto_siswa
     FROM konseling k
     JOIN siswa s ON s.id = k.siswa_id
     WHERE k.guru_bk = ?
     ORDER BY k.tanggal DESC, k.jam DESC, k.id DESC`,
    [guru]
  );
  return rows;
}

async function findForValidasi(id) {
  const [rows] = await pool.query(
    `SELECT k.siswa_id, k.status_validasi,
            DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggalLama,
            TIME_FORMAT(k.jam, '%H:%i') AS jamLama
     FROM konseling k WHERE k.id = ?`,
    [id]
  );
  return rows;
}

async function updateValidasi(id, { tanggal, jam }) {
  const [result] = await pool.query(
    `UPDATE konseling
     SET tanggal = ?, jam = ?, tanggal_validasi = ?, jam_validasi = ?, status_validasi = 'Tervalidasi'
     WHERE id = ?`,
    [tanggal, jam, tanggal, jam, id]
  );
  return result;
}

async function findForStatus(id) {
  const [rows] = await pool.query(
    `SELECT siswa_id, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, TIME_FORMAT(jam, '%H:%i') AS jam
     FROM konseling WHERE id = ?`,
    [id]
  );
  return rows;
}

async function updateStatus(id, status) {
  const [result] = await pool.query(
    'UPDATE konseling SET status = ? WHERE id = ?',
    [status, id]
  );
  return result;
}

async function findLaporanCreatedAt(id) {
  const [rows] = await pool.query(
    'SELECT laporan_created_at FROM konseling WHERE id = ?',
    [id]
  );
  return rows;
}

async function updateLaporanEdit(id, {
  kesimpulan, rekomendasi, statusPenanganan, catatanTambahan,
}) {
  await pool.query(
    `UPDATE konseling
     SET laporan_kesimpulan = ?,
         laporan_rekomendasi = ?,
         laporan_status_penanganan = ?,
         laporan_catatan_tambahan = ?
     WHERE id = ?`,
    [kesimpulan, rekomendasi, statusPenanganan, catatanTambahan, id]
  );
}

async function updateLaporanFirst(id, {
  kesimpulan, rekomendasi, statusPenanganan, catatanTambahan, dibuatOleh,
}) {
  await pool.query(
    `UPDATE konseling
     SET laporan_kesimpulan = ?,
         laporan_rekomendasi = ?,
         laporan_status_penanganan = ?,
         laporan_catatan_tambahan = ?,
         laporan_dibuat_oleh = ?,
         laporan_tanggal = CURDATE(),
         laporan_waktu = CURTIME(),
         laporan_created_at = NOW(),
         status = 'Selesai'
     WHERE id = ?`,
    [kesimpulan, rekomendasi, statusPenanganan, catatanTambahan, dibuatOleh, id]
  );
}

async function insertWalkin({
  siswaId, guru_bk, tanggal, jam, jenis, kategori, deskripsiFinal, kelasSnapshot,
}) {
  const [result] = await pool.query(
    `INSERT INTO konseling
      (siswa_id, guru_bk, tanggal, jam, jenis, kategori, deskripsi, kelas_siswa, status, status_validasi, tanggal_validasi, jam_validasi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Proses', 'Tervalidasi', ?, ?)`,
    [siswaId, guru_bk, tanggal, jam, jenis, kategori, deskripsiFinal, kelasSnapshot, tanggal, jam]
  );
  return result;
}

async function findStatusById(id) {
  const [rows] = await pool.query('SELECT status FROM konseling WHERE id = ?', [id]);
  return rows;
}

async function deleteById(id) {
  await pool.query('DELETE FROM konseling WHERE id = ?', [id]);
}

async function listBySiswaId(siswaId) {
  const [rows] = await pool.query(
    `SELECT
      id,
      guru_bk AS guru,
      DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
      TIME_FORMAT(jam, '%H:%i') AS jam,
      jenis,
      kategori,
      deskripsi,
      kelas_siswa,
      status,
      status_validasi,
      DATE_FORMAT(tanggal_validasi, '%Y-%m-%d') AS tanggal_validasi,
      TIME_FORMAT(jam_validasi, '%H:%i') AS jam_validasi,
      laporan,
      DATE_FORMAT(laporan_tanggal, '%Y-%m-%d') AS laporan_tanggal,
      TIME_FORMAT(laporan_waktu, '%H:%i') AS laporan_waktu,
      laporan_dibuat_oleh,
      laporan_kesimpulan,
      laporan_rekomendasi,
      laporan_status_penanganan,
      laporan_catatan_tambahan,
      laporan_created_at,
      created_at
     FROM konseling
     WHERE siswa_id = ?
     ORDER BY tanggal DESC, jam DESC, id DESC`,
    [siswaId]
  );
  return rows;
}

async function findDetailById(id) {
  const [rows] = await pool.query(
    `SELECT
      ${SELECT_KONSELING_FULL},
      s.nis,
      s.nama AS nama_siswa
     FROM konseling k
     JOIN siswa s ON s.id = k.siswa_id
     WHERE k.id = ?`,
    [id]
  );
  return rows;
}

module.exports = {
  runAlter,
  insertPengajuan,
  listAll,
  listByGuru,
  findForValidasi,
  updateValidasi,
  findForStatus,
  updateStatus,
  findLaporanCreatedAt,
  updateLaporanEdit,
  updateLaporanFirst,
  insertWalkin,
  findStatusById,
  deleteById,
  listBySiswaId,
  findDetailById,
};
