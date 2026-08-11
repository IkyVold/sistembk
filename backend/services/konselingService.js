// services/konselingService.js
// Logika bisnis endpoint konseling (validasi, notifikasi, laporan, walk-in).
const HttpError = require('../utils/HttpError');
const { kirimNotifikasiJadwal } = require('./notifikasiDispatch');
const konselingModel = require('../models/konselingModel');
const siswaModel = require('../models/siswaModel');
const riwayatKelasModel = require('../models/riwayatKelasModel');

/** Migrasi kolom tabel konseling (idempotent). */
async function initMigrations() {
  const simple = [
    { sql: `ALTER TABLE konseling ADD COLUMN deskripsi TEXT NULL AFTER kategori`, label: 'deskripsi' },
    { sql: `ALTER TABLE konseling ADD COLUMN kelas_siswa VARCHAR(20) NULL AFTER deskripsi`, label: 'kelas_siswa' },
  ];
  for (const { sql, label } of simple) {
    try {
      await konselingModel.runAlter(sql);
      console.log(`✅ Kolom ${label} ditambahkan ke tabel konseling`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.error(`❌ Error menambahkan kolom ${label}:`, err.message);
      }
    }
  }

  const laporanCols = [
    `ADD COLUMN laporan_tanggal DATE NULL AFTER laporan`,
    `ADD COLUMN laporan_waktu TIME NULL AFTER laporan_tanggal`,
    `ADD COLUMN laporan_dibuat_oleh VARCHAR(100) NULL AFTER laporan_waktu`,
    `ADD COLUMN laporan_kesimpulan TEXT NULL AFTER laporan_dibuat_oleh`,
    `ADD COLUMN laporan_rekomendasi TEXT NULL AFTER laporan_kesimpulan`,
    `ADD COLUMN laporan_status_penanganan VARCHAR(50) NULL AFTER laporan_rekomendasi`,
    `ADD COLUMN laporan_catatan_tambahan TEXT NULL AFTER laporan_status_penanganan`,
    `ADD COLUMN laporan_created_at TIMESTAMP NULL AFTER laporan_catatan_tambahan`,
  ];
  for (const clause of laporanCols) {
    try {
      await konselingModel.runAlter(`ALTER TABLE konseling ${clause}`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.error('❌ Error migrasi kolom laporan:', clause, err.message);
      }
    }
  }
  console.log('✅ Kolom laporan terstruktur siap di tabel konseling');

  const validasiCols = [
    `ADD COLUMN status_validasi VARCHAR(20) DEFAULT 'Belum Divalidasi' AFTER status`,
    `ADD COLUMN tanggal_validasi DATE NULL AFTER status_validasi`,
    `ADD COLUMN jam_validasi TIME NULL AFTER tanggal_validasi`,
  ];
  for (const clause of validasiCols) {
    try {
      await konselingModel.runAlter(`ALTER TABLE konseling ${clause}`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.error('❌ Error migrasi kolom validasi:', clause, err.message);
      }
    }
  }
  console.log('✅ Kolom validasi jadwal siap di tabel konseling');
}

async function resolveKelasSnapshot(nis, fallbackKelas) {
  let kelasSnapshot = fallbackKelas || '-';
  try {
    const kelasAktifRows = await riwayatKelasModel.findAktifByNis(nis);
    if (kelasAktifRows.length > 0) {
      kelasSnapshot = kelasAktifRows[0].kelas;
    }
  } catch (e) {
    console.warn('Gagal ambil kelas aktif dari riwayat_kelas, pakai siswa.kelas:', e.message);
  }
  return kelasSnapshot;
}

/** POST /api/konseling — pengajuan baru oleh siswa. */
async function createPengajuan(body) {
  const { nis, guru_bk, tanggal, jam, jenis, kategori, deskripsi } = body;

  if (!nis || !guru_bk || !tanggal || !jam || !jenis || !kategori || !deskripsi) {
    throw new HttpError(400, 'Semua field harus diisi');
  }
  if (deskripsi.trim().length < 20) {
    throw new HttpError(400, 'Deskripsi minimal 20 karakter');
  }
  if (!['Luring', 'Daring'].includes(jenis)) {
    throw new HttpError(400, 'Jenis konseling tidak valid');
  }

  const siswaRows = await siswaModel.findIdAndKelasByNis(nis);
  if (siswaRows.length === 0) {
    throw new HttpError(404, 'Siswa tidak ditemukan');
  }
  const siswaId = siswaRows[0].id;
  const kelasSnapshot = await resolveKelasSnapshot(nis, siswaRows[0].kelas);

  const result = await konselingModel.insertPengajuan({
    siswaId, guru_bk, tanggal, jam, jenis, kategori,
    deskripsi: deskripsi.trim(), kelasSnapshot,
  });

  return {
    message: 'Pengajuan konseling berhasil disimpan',
    id: result.insertId,
  };
}

/** GET /api/konseling-all — semua sesi (dashboard kepsek). */
async function listAll() {
  return konselingModel.listAll();
}

/** GET /api/konseling-bk?guru= — sesi milik satu Guru BK. */
async function listByGuru(guru) {
  if (!guru) {
    throw new HttpError(400, 'Parameter guru wajib diisi');
  }
  return konselingModel.listByGuru(guru);
}

/** PUT /api/konseling/:id/validasi — tetapkan/ubah jadwal + notifikasi. */
async function validasi(id, { tanggal, jam }) {
  if (!tanggal || !jam) {
    throw new HttpError(400, 'Tanggal dan jam validasi wajib diisi');
  }

  const existingRows = await konselingModel.findForValidasi(id);
  if (existingRows.length === 0) {
    throw new HttpError(404, 'Data konseling tidak ditemukan');
  }
  const existing = existingRows[0];

  const result = await konselingModel.updateValidasi(id, { tanggal, jam });
  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Data konseling tidak ditemukan');
  }

  const sudahTervalidasi = existing.status_validasi === 'Tervalidasi';
  const jadwalBerubah = existing.tanggalLama !== tanggal || existing.jamLama !== jam;

  if (sudahTervalidasi && jadwalBerubah) {
    await kirimNotifikasiJadwal({
      siswaId: existing.siswa_id,
      konselingId: id,
      judul: 'Jadwal Konseling Diubah',
      pesan: `Guru BK mengubah jadwal konseling Anda dari ${existing.tanggalLama} pukul ${existing.jamLama} menjadi ${tanggal} pukul ${jam}.`,
      tanggalLama: existing.tanggalLama,
      jamLama: existing.jamLama,
      tanggalBaru: tanggal,
      jamBaru: jam,
    });
  } else if (!sudahTervalidasi) {
    await kirimNotifikasiJadwal({
      siswaId: existing.siswa_id,
      konselingId: id,
      judul: 'Jadwal Konseling Ditetapkan',
      pesan: `Guru BK telah menetapkan jadwal konseling Anda pada ${tanggal} pukul ${jam}.`,
      tanggalBaru: tanggal,
      jamBaru: jam,
    });
  }

  return { message: 'Jadwal berhasil divalidasi' };
}

/** PUT /api/konseling/:id/status — ubah status (mis. Dibatalkan). */
async function updateStatus(id, status) {
  if (!['Proses', 'Selesai', 'Dibatalkan'].includes(status)) {
    throw new HttpError(400, 'Status tidak valid');
  }

  const existingRows = await konselingModel.findForStatus(id);
  if (existingRows.length === 0) {
    throw new HttpError(404, 'Data konseling tidak ditemukan');
  }

  const result = await konselingModel.updateStatus(id, status);
  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Data konseling tidak ditemukan');
  }

  if (status === 'Dibatalkan') {
    const existing = existingRows[0];
    await kirimNotifikasiJadwal({
      siswaId: existing.siswa_id,
      konselingId: id,
      judul: 'Jadwal Konseling Dibatalkan',
      pesan: `Guru BK membatalkan jadwal konseling Anda pada ${existing.tanggal} pukul ${existing.jam}.`,
      tanggalLama: existing.tanggal,
      jamLama: existing.jam,
    });
  }

  return { message: 'Status berhasil diubah' };
}

/** PUT /api/konseling/:id/laporan — simpan laporan & set status Selesai. */
const LAPORAN_EDIT_WINDOW_HOURS = 72; // 3 x 24 jam

async function simpanLaporan(id, body) {
  const { kesimpulan, rekomendasi, statusPenanganan, catatanTambahan, dibuatOleh } = body;
  if (!kesimpulan || !rekomendasi) {
    throw new HttpError(400, 'Kesimpulan dan rekomendasi wajib diisi');
  }

  const rows = await konselingModel.findLaporanCreatedAt(id);
  if (rows.length === 0) {
    throw new HttpError(404, 'Data konseling tidak ditemukan');
  }

  const sudahPernahDisimpan = !!rows[0].laporan_created_at;

  if (sudahPernahDisimpan) {
    const createdAt = new Date(rows[0].laporan_created_at);
    const jamBerlalu = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (jamBerlalu > LAPORAN_EDIT_WINDOW_HOURS) {
      throw new HttpError(
        403,
        `Laporan ini sudah terkunci. Batas edit adalah ${LAPORAN_EDIT_WINDOW_HOURS} jam setelah pertama kali disimpan, dan itu sudah lewat.`
      );
    }

    await konselingModel.updateLaporanEdit(id, {
      kesimpulan: kesimpulan.trim(),
      rekomendasi: rekomendasi.trim(),
      statusPenanganan: statusPenanganan || 'Selesai - Masalah Teratasi',
      catatanTambahan: (catatanTambahan || '').trim() || '-',
    });
    return { message: 'Laporan berhasil diperbarui', edited: true };
  }

  await konselingModel.updateLaporanFirst(id, {
    kesimpulan: kesimpulan.trim(),
    rekomendasi: rekomendasi.trim(),
    statusPenanganan: statusPenanganan || 'Selesai - Masalah Teratasi',
    catatanTambahan: (catatanTambahan || '').trim() || '-',
    dibuatOleh: dibuatOleh || 'Guru BK',
  });
  return { message: 'Laporan berhasil disimpan', edited: false };
}

/** POST /api/konseling/walkin — input manual Guru BK. */
async function createWalkin(body) {
  const { nis, guru_bk, tanggal, jam, jenis, kategori, deskripsi, catatan } = body;
  if (!nis || !guru_bk || !tanggal || !jam || !jenis || !kategori || !deskripsi) {
    throw new HttpError(400, 'Semua field wajib diisi');
  }

  const siswaRows = await siswaModel.findIdAndKelasByNis(nis);
  if (siswaRows.length === 0) {
    throw new HttpError(404, 'Siswa dengan NIS tersebut belum terdaftar. Daftarkan akun siswa terlebih dahulu.');
  }
  const siswaId = siswaRows[0].id;

  let kelasSnapshot = siswaRows[0].kelas || '-';
  try {
    const kelasAktifRows = await riwayatKelasModel.findAktifByNis(nis);
    if (kelasAktifRows.length > 0) kelasSnapshot = kelasAktifRows[0].kelas;
  } catch (e) {
    console.warn('Gagal ambil kelas aktif untuk walk-in, pakai siswa.kelas:', e.message);
  }

  const deskripsiFinal = catatan && catatan.trim()
    ? deskripsi.trim() + '\n\nCatatan tambahan: ' + catatan.trim()
    : deskripsi.trim();

  const result = await konselingModel.insertWalkin({
    siswaId, guru_bk, tanggal, jam, jenis, kategori, deskripsiFinal, kelasSnapshot,
  });

  return {
    message: 'Data konseling walk-in berhasil disimpan',
    id: result.insertId,
  };
}

/** DELETE /api/konseling/:id — batalkan pengajuan (hanya status Proses). */
async function batalkan(id) {
  const rows = await konselingModel.findStatusById(id);
  if (rows.length === 0) {
    throw new HttpError(404, 'Data konseling tidak ditemukan');
  }
  if (rows[0].status !== 'Proses') {
    throw new HttpError(400, 'Hanya pengajuan berstatus Proses yang bisa dibatalkan');
  }
  await konselingModel.deleteById(id);
  return { message: 'Pengajuan konseling berhasil dibatalkan' };
}

/** GET /api/konseling/:nis — riwayat milik satu siswa. */
async function listByNis(nis) {
  const siswaRows = await siswaModel.findIdOnlyByNis(nis);
  if (siswaRows.length === 0) {
    throw new HttpError(404, 'Siswa tidak ditemukan');
  }
  return konselingModel.listBySiswaId(siswaRows[0].id);
}

/** GET /api/konseling/detail/:id */
async function getDetail(id) {
  const rows = await konselingModel.findDetailById(id);
  if (rows.length === 0) {
    throw new HttpError(404, 'Data konseling tidak ditemukan');
  }
  return rows[0];
}

module.exports = {
  initMigrations,
  createPengajuan,
  listAll,
  listByGuru,
  validasi,
  updateStatus,
  simpanLaporan,
  createWalkin,
  batalkan,
  listByNis,
  getDetail,
};
