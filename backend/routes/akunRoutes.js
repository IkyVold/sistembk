// routes/akunRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const akunController = require('../controllers/akunController');
const akunService = require('../services/akunService');
const HttpError = require('../utils/HttpError');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Init tabel + seed saat module di-load
akunService.initAkunTables();

const FOTO_GURU_DIR = path.join(__dirname, '..', 'uploads', 'guru');
if (!fs.existsSync(FOTO_GURU_DIR)) {
  fs.mkdirSync(FOTO_GURU_DIR, { recursive: true });
}

const uploadFotoGuru = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, FOTO_GURU_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const user = String(req.params.username || 'guru').replace(/[^a-zA-Z0-9_-]/g, '');
      cb(null, `${user}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Format file harus JPG, PNG, atau WEBP'));
    }
    cb(null, true);
  },
});

function handleFotoGuruUpload(req, res, next) {
  uploadFotoGuru.single('foto')(req, res, (err) => {
    if (err) return next(new HttpError(400, err.message || 'Gagal mengunggah foto'));
    next();
  });
}


// Login
router.post('/login-guru', akunController.loginGuru);
router.post('/login-kepsek', akunController.loginKepsek);
router.post('/login-admin', akunController.loginAdmin);

// Publik: daftar Guru BK aktif untuk siswa (Pilih Guru)
router.get('/guru-bk', authenticate, requireRole('siswa', 'guru', 'admin', 'kepsek'), akunController.listGuruPublic);

// Admin — kelola akun Guru BK
router.get('/admin/guru-bk', authenticate, requireRole('admin'), akunController.listGuruAdmin);
router.post('/admin/guru-bk', authenticate, requireRole('admin'), akunController.createGuru);
router.put('/admin/guru-bk/:id', authenticate, requireRole('admin'), akunController.updateGuru);
router.delete('/admin/guru-bk/:id', authenticate, requireRole('admin'), akunController.deleteGuru);

// Admin — kelola akun Kepala Sekolah
router.get('/admin/kepsek', authenticate, requireRole('admin'), akunController.listKepsekAdmin);
router.post('/admin/kepsek', authenticate, requireRole('admin'), akunController.createKepsek);
router.put('/admin/kepsek/:id', authenticate, requireRole('admin'), akunController.updateKepsek);
router.delete('/admin/kepsek/:id', authenticate, requireRole('admin'), akunController.deleteKepsek);

// Foto profil Guru BK
router.put('/guru-bk/:username/foto', authenticate, requireRole('guru'), handleFotoGuruUpload, akunController.updateFotoGuru);
router.delete('/guru-bk/:username/foto', authenticate, requireRole('guru'), akunController.deleteFotoGuru);

module.exports = router;

