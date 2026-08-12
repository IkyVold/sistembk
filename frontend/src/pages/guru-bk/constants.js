// Konstanta yang dipakai berulang di seluruh dashboard Guru BK.
export const KELAS_OPTIONS = ['X', 'XI', 'XII'].flatMap((tingkat) =>
  Array.from({ length: 10 }, (_, i) => `${tingkat} - ${i + 1}`)
);

export const KELAS_OPTIONS_BY_TINGKAT = {
  X: KELAS_OPTIONS.filter((k) => k.startsWith('X - ')),
  XI: KELAS_OPTIONS.filter((k) => k.startsWith('XI - ')),
  XII: KELAS_OPTIONS.filter((k) => k.startsWith('XII - ')),
};

export const JAM_LIST = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

export const KATEGORI_MASALAH_LIST = [
  'Akademik',
  'Sosial',
  'Pribadi',
  'Karir',
  'Bullying',
  'Keluarga',
  'Lainnya',
];

export const KATEGORI_INFORMASI_LIST = [
  'Beasiswa',
  'Pendaftaran Perguruan Tinggi',
  'Bimbingan Karir',
  'Informasi Sekolah',
  'Informasi BK',
  'Umum',
];

export const STATUS_PENANGANAN_OPTIONS = [
  { value: 'Selesai - Masalah Teratasi', label: '✅ Selesai - Masalah Teratasi' },
  { value: 'Monitoring', label: '📊 Perlu Monitoring Lanjutan' },
  { value: 'Rujuk', label: '🔄 Dirujuk ke pihak lain (Guru Mapel/Wali Kelas)' },
  { value: 'Rujuk BK Lain', label: '👨‍🏫 Dirujuk ke Guru BK Lain' },
  { value: 'Orang Tua', label: '👨‍👩‍👧 Perlu keterlibatan Orang Tua' },
];

// Batas edit laporan — samain dengan LAPORAN_EDIT_WINDOW_HOURS di server.js
export const LAPORAN_EDIT_WINDOW_HOURS = 72; // 3 x 24 jam
