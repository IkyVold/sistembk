// Daftar guru BK yang ditampilkan di halaman "Pilih Guru BK".
// Diambil dari GURU_BK_LIST supaya satu sumber data, ditambah avatar untuk tampilan.
import { GURU_BK_LIST } from './guruBkList';

const AVATARS = [
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=33',
];

export const COUNSELOR_LIST = GURU_BK_LIST.map((guru, index) => ({
  nama: guru.nama,
  spesialisasi: guru.spesialisasi,
  npsn: guru.npsn,
  alamat: guru.alamat,
  avatar: AVATARS[index % AVATARS.length],
}));
