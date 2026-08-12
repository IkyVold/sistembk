// Data akun demo Guru BK. Backend belum punya endpoint /api/login-guru,
// jadi konfirmasi ini masih dilakukan di sisi client seperti aslinya.
// TODO: pindahkan ke backend (tabel guru_bk + endpoint /api/login-guru) saat refactor backend berlanjut.
export const GURU_BK_LIST = [
  {
    id: 1,
    username: 'joko_bk',
    password: 'guru123',
    nama: 'Joko Ardianto S.Pd',
    spesialisasi: 'Guru BK',
    npsn: '023497329432',
    alamat: 'Blitar',
    avatar: 'JA',
  },
  {
    id: 2,
    username: 'wiwiek_bk',
    password: 'guru123',
    nama: 'wiwiek Hariati S.Pd',
    spesialisasi: 'Guru BK',
    npsn: '023497329432',
    alamat: 'Blitar',
    avatar: 'WH',
  },
  {
    id: 3,
    username: 'dicky_bk',
    password: 'guru123',
    nama: 'Dicky Ardiansyah S.Pd',
    spesialisasi: 'Guru BK',
    npsn: '023497329432',
    alamat: 'Blitar',
    avatar: 'DA',
  },
];
