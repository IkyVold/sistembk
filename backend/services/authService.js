// services/authService.js
// Semua query database terkait registrasi & login siswa dikumpulkan di sini,
// supaya controller cuma urus request/response, bukan detail SQL.
const pool = require('../database');
const HttpError = require('../utils/HttpError');

async function registerSiswa({ nis, nama, kelas, jenis_kelamin, password }) {
  if (!nis || !nama || !kelas || !jenis_kelamin || !password) {
    throw new HttpError(400, 'Semua field harus diisi');
  }

  const [existing] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
  if (existing.length > 0) {
    throw new HttpError(400, 'NIS sudah terdaftar');
  }

  const [result] = await pool.query(
    'INSERT INTO siswa (nis, nama, kelas, jenis_kelamin, password) VALUES (?, ?, ?, ?, MD5(?))',
    [nis, nama, kelas, jenis_kelamin, password]
  );

  return { siswaId: result.insertId };
}

async function loginSiswa({ nis, password }) {
  if (!nis || !password) {
    throw new HttpError(400, 'NIS dan password harus diisi');
  }

  const [rows] = await pool.query(
    'SELECT id, nis, nama, kelas, foto_profile FROM siswa WHERE nis = ? AND password = MD5(?)',
    [nis, password]
  );

  if (rows.length === 0) {
    throw new HttpError(401, 'NIS atau password salah');
  }

  return rows[0];
}

module.exports = { registerSiswa, loginSiswa };
