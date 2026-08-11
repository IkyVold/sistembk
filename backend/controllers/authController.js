// controllers/authController.js
const authService = require('../services/authService');
const { signToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const login = asyncHandler(async (req, res) => {
  const siswa = await authService.loginSiswa(req.body);
  const token = signToken({
    role: 'siswa',
    id: siswa.id,
    nis: siswa.nis,
    nama: siswa.nama,
  });
  res.json({ success: true, token, siswa });
});

module.exports = { login };
