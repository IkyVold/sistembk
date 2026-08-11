// routes/profileRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const profileController = require('../controllers/profileController');
const HttpError = require('../utils/HttpError');
const { authenticate, requireSelfOrStaff } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const FOTO_SISWA_DIR = path.join(UPLOADS_DIR, 'siswa');
if (!fs.existsSync(FOTO_SISWA_DIR)) {
  fs.mkdirSync(FOTO_SISWA_DIR, { recursive: true });
}

const FOTO_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const uploadFoto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, FOTO_SISWA_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const nis = String(req.params.nis || '').replace(/[^a-zA-Z0-9_-]/g, '');
      cb(null, `${nis}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!FOTO_ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Format file harus JPG, PNG, atau WEBP'));
    }
    cb(null, true);
  },
});

// Middleware: jalankan multer, ubah error multer jadi HttpError supaya
// errorHandler terpusat yang mengurus respons (bukan try/catch manual).
function handleFotoUpload(req, res, next) {
  uploadFoto.single('foto')(req, res, (err) => {
    if (err) {
      return next(new HttpError(400, err.message || 'Gagal mengunggah foto'));
    }
    next();
  });
}

router.get('/profile/:nis', authenticate, requireSelfOrStaff('nis'), profileController.get);
router.put('/profile/:nis', authenticate, requireSelfOrStaff('nis'), profileController.update);
router.put('/profile/:nis/foto', authenticate, requireSelfOrStaff('nis'), handleFotoUpload, profileController.updateFoto);
router.delete('/profile/:nis/foto', authenticate, requireSelfOrStaff('nis'), profileController.deleteFoto);

module.exports = router;
