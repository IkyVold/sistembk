// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /register dinonaktifkan — akun siswa dibuat oleh Guru BK (endpoint /api/siswa).
router.post('/login', authController.login);

module.exports = router;
