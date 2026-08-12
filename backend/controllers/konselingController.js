// controllers/konselingController.js
const konselingService = require('../services/konselingService');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const result = await konselingService.createPengajuan(req.body);
  res.json({ success: true, message: result.message, id: result.id });
});

const listAll = asyncHandler(async (req, res) => {
  res.json(await konselingService.listAll());
});

const listByGuru = asyncHandler(async (req, res) => {
  res.json(await konselingService.listByGuru(req.query.guru));
});

const konfirmasi = asyncHandler(async (req, res) => {
  const result = await konselingService.konfirmasi(req.params.id, req.body);
  res.json({ success: true, message: result.message });
});

const updateStatus = asyncHandler(async (req, res) => {
  const result = await konselingService.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, message: result.message });
});

const simpanLaporan = asyncHandler(async (req, res) => {
  const result = await konselingService.simpanLaporan(req.params.id, req.body);
  res.json({ success: true, message: result.message, edited: result.edited });
});

const walkin = asyncHandler(async (req, res) => {
  const result = await konselingService.createWalkin(req.body);
  res.json({ success: true, message: result.message, id: result.id });
});

const batalkan = asyncHandler(async (req, res) => {
  const result = await konselingService.batalkan(req.params.id);
  res.json({ success: true, message: result.message });
});

const batalkanOlehSiswa = asyncHandler(async (req, res) => {
  const result = await konselingService.batalkanOlehSiswa(
    req.params.id,
    { alasan: req.body.alasan },
    req.user
  );
  res.json({ success: true, message: result.message, alasan: result.alasan });
});

const createLanjutan = asyncHandler(async (req, res) => {
  const result = await konselingService.createLanjutan(req.body, req.user);
  res.json({
    success: true,
    message: result.message,
    id: result.id,
    pengajuan_sebelumnya_id: result.pengajuan_sebelumnya_id,
  });
});

const listByNis = asyncHandler(async (req, res) => {
  res.json(await konselingService.listByNis(req.params.nis));
});

const getDetail = asyncHandler(async (req, res) => {
  res.json(await konselingService.getDetail(req.params.id));
});

module.exports = {
  create,
  listAll,
  listByGuru,
  konfirmasi,
  updateStatus,
  simpanLaporan,
  walkin,
  batalkan,
  batalkanOlehSiswa,
  createLanjutan,
  listByNis,
  getDetail,
};
