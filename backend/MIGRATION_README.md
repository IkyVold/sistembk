# Backend Refactor — Stop Bullying (BK System)

Refactor bertahap dari `server.js` monolitik menuju pola
`services/` → `controllers/` → `routes/`, dengan penanganan error
terpusat (`middleware/errorHandler.js` + `utils/HttpError.js`).

## Yang sudah direfactor (tahap 1)
- `POST /api/register` dan `POST /api/login` (auth siswa)
  - `services/authService.js` — semua query database
  - `controllers/authController.js` — request/response
  - `routes/authRoutes.js` — definisi route, dipasang di `server.js`
    lewat `app.use('/api', authRoutes)`

Semua route lain (profile, konseling, chat, siswa, dsb) **masih di
`server.js` seperti aslinya** — sengaja belum disentuh supaya perubahan
bisa diverifikasi bertahap, sesuai pola yang sama dipakai di refactor
sistem monitoring Poktan sebelumnya (services layer + HttpError +
error handler terpusat, dipasang modul demi modul).

## Menjalankan

```bash
npm install
cp .env.example .env   # kalau belum ada, isi kredensial Groq API, dsb
```

Pastikan `database.js` mengarah ke MySQL yang benar (host/user/password/
nama database), lalu:

```bash
npm start        # atau: npm run dev (pakai nodemon)
```

## Struktur baru

```
services/authService.js       # query siswa: register & login
controllers/authController.js # req/res handling, pakai asyncHandler
routes/authRoutes.js           # POST /register, POST /login
middleware/errorHandler.js     # asyncHandler + errorHandler
utils/HttpError.js             # class error dengan statusCode
```

## Pola untuk migrasi modul berikutnya
Setiap kelompok endpoint (mis. `konseling`, `siswa`, `profile`) bisa
dipindah dengan pola yang sama:

1. Pindahkan query DB ke `services/<nama>Service.js`, lempar
   `throw new HttpError(status, pesan)` untuk kondisi gagal.
2. Buat `controllers/<nama>Controller.js` yang membungkus pemanggilan
   service dengan `asyncHandler`.
3. Buat `routes/<nama>Routes.js`, lalu mount di `server.js` dengan
   `app.use('/api', xRoutes)`.
4. Hapus handler lama yang sudah dipindah dari `server.js`.

`app.use(errorHandler)` sudah dipasang paling akhir di `server.js`,
jadi begitu satu modul dipindah ke pola `asyncHandler`, error di
dalamnya otomatis tertangani tanpa perlu try/catch manual lagi.
