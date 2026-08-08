// controllers/authController.js
const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  const { siswaId } = await authService.registerSiswa(req.body);
  res.json({
    success: true,
    message: 'Registrasi berhasil',
    siswaId,
  });
});

const login = asyncHandler(async (req, res) => {
  const siswa = await authService.loginSiswa(req.body);
  res.json({ success: true, siswa });
});

module.exports = { register, login };
