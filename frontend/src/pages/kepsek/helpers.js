function normalizeStatusKonfirmasi(v) {
  if (!v) return 'Belum Dikonfirmasi';
  if (v === 'Tervalidasi' || v === 'Terkonfirmasi') return 'Terkonfirmasi';
  if (v === 'Belum Divalidasi' || v === 'Belum Dikonfirmasi') return 'Belum Dikonfirmasi';
  return v;
}

import { KATEGORI_COLORS, GURU_BK_LIST } from './constants';

export function formatTanggal(tanggal) {
  if (!tanggal || tanggal === '-') return '-';
  try {
    if (String(tanggal).includes('-')) {
      const [year, month, day] = String(tanggal).split('-');
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `${parseInt(day, 10)} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
    }
    return tanggal;
  } catch {
    return tanggal;
  }
}

// Ubah satu baris hasil GET /api/konseling-all jadi bentuk object yang
// dipakai seluruh komponen dashboard kepsek.
export function mapKonselingRow(row) {
  const hasLaporan = !!(row.laporan_kesimpulan || row.laporan_rekomendasi || row.laporan_status_penanganan);
  return {
    id: row.id,
    guru: row.guru,
    username: row.nis,
    namaSiswa: row.nama_siswa || row.nis,
    nisnSiswa: row.nis,
    ttlSiswa: row.tanggal_lahir ? formatTanggal(row.tanggal_lahir) : '-',
    jenisKelaminSiswa: row.jenis_kelamin || '-',
    alamatSiswa: row.alamat || '-',
    tanggal: formatTanggal(row.tanggal),
    jam: row.jam,
    tanggalKonfirmasi: row.tanggal_konfirmasi ? formatTanggal(row.tanggal_konfirmasi) : formatTanggal(row.tanggal),
    jamKonfirmasi: row.jam_konfirmasi || row.jam,
    statusKonfirmasi: normalizeStatusKonfirmasi(row.status_konfirmasi),
    status: row.status || 'Proses',
    jenis: row.jenis,
    kategori: row.kategori,
    deskripsi: row.deskripsi || 'Tidak ada deskripsi',
    laporanGuru: hasLaporan
      ? {
          kesimpulan: row.laporan_kesimpulan,
          rekomendasi: row.laporan_rekomendasi,
          statusPenanganan: row.laporan_status_penanganan,
          catatanTambahan: row.laporan_catatan_tambahan,
          tanggalLaporan: row.laporan_tanggal ? formatTanggal(row.laporan_tanggal) : '-',
          waktuLaporan: row.laporan_waktu || '-',
          dibuatOleh: row.laporan_dibuat_oleh || row.guru,
    inputManual: !!row.input_manual,
    catatanWalkin: row.catatan_walkin || null,
        }
      : null,
  };
}

export function hitungStatistik(semuaKonseling) {
  const total = semuaKonseling.length;
  const byKategori = {};
  KATEGORI_COLORS.forEach((k) => {
    byKategori[k.key] = semuaKonseling.filter((item) => item.kategori === k.label).length;
  });

  const proses = semuaKonseling.filter((item) => item.status === 'Proses').length;
  const selesai = semuaKonseling.filter((item) => item.status === 'Selesai').length;
  const dibatalkan = semuaKonseling.filter((item) => item.status === 'Dibatalkan').length;
  const terkonfirmasi = semuaKonseling.filter((item) => item.statusKonfirmasi === 'Terkonfirmasi').length;

  const siswaAktif = new Set(semuaKonseling.map((item) => item.username)).size;
  const guruAktif = new Set(semuaKonseling.map((item) => item.guru)).size;

  return { total, ...byKategori, proses, selesai, dibatalkan, terkonfirmasi, siswaAktif, guruAktif };
}

export function getTopKategori(stats) {
  const categories = [
    { name: 'Akademik', value: stats.akademik },
    { name: 'Sosial', value: stats.sosial },
    { name: 'Pribadi', value: stats.pribadi },
    { name: 'Karir', value: stats.karir || 0 },
    { name: 'Bullying', value: stats.bullying },
    { name: 'Keluarga', value: stats.keluarga || 0 },
  ];
  return categories.sort((a, b) => b.value - a.value)[0];
}

export function getTopGuru(semuaKonseling) {
  const guruStats = GURU_BK_LIST.map((guru) => ({
    nama: guru.nama,
    total: semuaKonseling.filter((item) => item.guru === guru.nama && item.status === 'Selesai').length,
  })).sort((a, b) => b.total - a.total);
  return guruStats[0]?.nama || '-';
}

export function pct(value, total) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
}
