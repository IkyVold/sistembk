# Frontend React — Stop Bullying (BK System)

Migrasi bertahap dari HTML/vanilla JS ke React (Vite + React Router).

## Yang sudah dimigrasi (tahap 1)
- Login Siswa (`/login`)
- Login Guru BK (`/login-guru`)
- Login Kepala Sekolah (`/login-kepsek`)
- Registrasi Siswa (`/registrasi`)
- Pilih Guru BK (`/pilih`) — halaman terproteksi, wajib login siswa

Halaman lain (`/`, `/status`, `/jadwal`, `/guru-bk`, `/dashboard-kepsek`) masih
placeholder ("Coming Soon") menunggu tahap migrasi berikutnya, tapi routing
dan proteksi login-nya sudah disiapkan.

## Menjalankan

```bash
npm install
cp .env.example .env   # sesuaikan VITE_API_BASE_URL dengan backend kamu
npm run dev
```

Build production:

```bash
npm run build
```

## Struktur penting

```
src/
  api/
    axiosClient.js     # instance axios terpusat + helper pesan error
    authService.js      # semua logika login/register siswa/guru/kepsek
  context/
    AuthContext.jsx      # session state (siswa/guru/kepsek), pengganti
                          # localStorage manual di tiap halaman
  components/
    ProtectedRoute.jsx   # route guard berdasarkan role
    Navbar.jsx
  data/
    guruBkList.js        # data statis Guru BK (lihat catatan TODO di file)
    kepsekList.js         # data statis Kepsek (lihat catatan TODO di file)
    counselorList.js
  pages/
    auth/                # LoginSiswa, LoginGuru, LoginKepsek, Registrasi
    PilihGuru.jsx
    ComingSoon.jsx        # placeholder untuk halaman yang belum dimigrasi
```

## Catatan penting
- Login Guru BK dan Kepala Sekolah **masih divalidasi di client** (data statis
  di `src/data/`), persis seperti versi HTML lama, karena backend belum
  punya endpoint untuk role tersebut. Ini ditandai dengan komentar `TODO` di
  masing-masing file — sebaiknya dipindah ke backend (tabel + endpoint) di
  tahap refactor backend berikutnya, supaya kredensial tidak ada di bundle JS.
- `daftar.html` dari project lama **tidak dimigrasikan** karena merupakan file
  usang tanpa handler submit (sudah digantikan `registrasi.html`).
- Halaman yang belum dimigrasi tetap bisa diakses lewat React Router (menuju
  `ComingSoon`), supaya tidak ada link mati saat migrasi berlanjut bertahap.
