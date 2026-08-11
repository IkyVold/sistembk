// middleware/auth.js
// JWT authentication & role authorization.
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');

const JWT_SECRET = process.env.JWT_SECRET || 'bk-system-dev-secret-ganti-di-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

/** Buat token setelah login sukses. */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Verifikasi token mentah (untuk Socket.IO handshake juga). */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Wajib header: Authorization: Bearer <token>
 * Menyimpan payload di req.user
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return next(new HttpError(401, 'Autentikasi diperlukan. Silakan login terlebih dahulu.'));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return next(new HttpError(401, 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.'));
  }
}

/**
 * Hanya izinkan role tertentu.
 * Contoh: requireRole('guru', 'admin')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Autentikasi diperlukan.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Anda tidak memiliki akses ke resource ini.'));
    }
    next();
  };
}

/**
 * Siswa hanya boleh akses data NIS sendiri.
 * Guru / admin / kepsek boleh akses semua.
 * Cek dari req.params.nis atau req.body.nis / req.query.nis
 */
function requireSelfOrStaff(param = 'nis') {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Autentikasi diperlukan.'));
    }
    const staff = ['guru', 'admin', 'kepsek'];
    if (staff.includes(req.user.role)) return next();

    if (req.user.role === 'siswa') {
      const target =
        req.params[param] ||
        req.body?.[param] ||
        req.query?.[param];
      if (target != null && String(target) === String(req.user.nis)) {
        return next();
      }
      return next(new HttpError(403, 'Anda hanya dapat mengakses data milik sendiri.'));
    }

    return next(new HttpError(403, 'Akses ditolak.'));
  };
}

module.exports = {
  JWT_SECRET,
  signToken,
  verifyToken,
  authenticate,
  requireRole,
  requireSelfOrStaff,
};
