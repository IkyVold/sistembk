import { LAPORAN_EDIT_WINDOW_HOURS } from './constants';

// Format tanggal 'YYYY-MM-DD' -> "5 Januari 2026" (sama seperti versi lama)
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

export function isLaporanMasihBisaEdit(laporanCreatedAt) {
  if (!laporanCreatedAt) return false;
  const jamBerlalu = (Date.now() - new Date(laporanCreatedAt).getTime()) / (1000 * 60 * 60);
  return jamBerlalu <= LAPORAN_EDIT_WINDOW_HOURS;
}

export function sisaWaktuEditText(laporanCreatedAt) {
  if (!laporanCreatedAt) return '';
  const jamBerlalu = (Date.now() - new Date(laporanCreatedAt).getTime()) / (1000 * 60 * 60);
  const sisaJam = Math.max(0, LAPORAN_EDIT_WINDOW_HOURS - jamBerlalu);
  if (sisaJam <= 0) return 'Waktu edit sudah habis';
  if (sisaJam < 1) return `Sisa ${Math.round(sisaJam * 60)} menit lagi bisa diedit`;
  const sisaHari = Math.floor(sisaJam / 24);
  const sisaJamBulat = Math.floor(sisaJam % 24);
  if (sisaHari > 0) return `Sisa ${sisaHari} hari ${sisaJamBulat} jam lagi bisa diedit`;
  return `Sisa ${sisaJamBulat} jam lagi bisa diedit`;
}

// Ubah satu baris hasil GET /api/konseling-bk jadi bentuk object yang
// dipakai seluruh komponen React (nama field dipertahankan sama seperti
// versi lama supaya logic lain tidak perlu diubah).
export function mapKonselingRow(row, currentGuru) {
  const hasLaporan = !!(row.laporan_kesimpulan || row.laporan_rekomendasi || row.laporan_status_penanganan);

  let tahunAjaran = '-';
  if (row.tanggal) {
    try {
      const tgl = new Date(row.tanggal);
      const thn = tgl.getFullYear();
      const bln = tgl.getMonth() + 1;
      const taStart = bln >= 7 ? thn : thn - 1;
      tahunAjaran = `${taStart}/${taStart + 1}`;
    } catch {
      tahunAjaran = '-';
    }
  }

  return {
    id: row.id,
    guru: row.guru,
    npsn: currentGuru?.npsn,
    namaSiswa: row.nama_siswa || row.nis,
    fotoSiswa: row.foto_siswa || null,
    nisnSiswa: row.nis,
    kelasSiswa: row.kelas_siswa || '-',
    tahunAjaran,
    tanggalRaw: row.tanggal,
    tanggal: formatTanggal(row.tanggal),
    jam: row.jam,
    tanggalValidasi: row.tanggal_validasi ? formatTanggal(row.tanggal_validasi) : formatTanggal(row.tanggal),
    jamValidasi: row.jam_validasi || row.jam,
    statusValidasi: row.status_validasi || 'Belum Divalidasi',
    status: row.status || 'Proses',
    jenis: row.jenis,
    kategori: row.kategori,
    deskripsi: row.deskripsi || 'Tidak ada deskripsi masalah',
    alasanBatal: row.alasan_batal || null,
    tanggalPengajuan: row.created_at
      ? formatTanggal(String(row.created_at).split('T')[0])
      : row.tanggal
        ? formatTanggal(row.tanggal)
        : '-',
    inputManual: false,
    laporanGuru: hasLaporan
      ? {
          kesimpulan: row.laporan_kesimpulan,
          rekomendasi: row.laporan_rekomendasi,
          statusPenanganan: row.laporan_status_penanganan,
          catatanTambahan: row.laporan_catatan_tambahan,
          tanggalLaporan: row.laporan_tanggal ? formatTanggal(row.laporan_tanggal) : '-',
          waktuLaporan: row.laporan_waktu || '-',
          dibuatOleh: row.laporan_dibuat_oleh || row.guru,
        }
      : null,
    laporanCreatedAt: row.laporan_created_at || null,
    canEditLaporan: hasLaporan ? isLaporanMasihBisaEdit(row.laporan_created_at) : false,
  };
}

export function escapeHtml(text) {
  if (!text) return text;
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
