// controllers/notifikasiController.js
const notifikasiService = require('../services/notifikasiService');
const { asyncHandler } = require('../middleware/errorHandler');

const getVapidPublicKey = asyncHandler(async (req, res) => {
  const result = notifikasiService.getVapidKey();
  res.json(result);
});

const subscribe = asyncHandler(async (req, res) => {
  const result = await notifikasiService.subscribe(req.body);
  res.json({ success: true, message: result.message });
});

const unsubscribe = asyncHandler(async (req, res) => {
  const result = await notifikasiService.unsubscribe(req.body);
  res.json({ success: true, message: result.message });
});

const list = asyncHandler(async (req, res) => {
  const data = await notifikasiService.listByNis(req.params.nis, req.query.limit);
  res.json(data);
});

const markRead = asyncHandler(async (req, res) => {
  await notifikasiService.markRead(req.params.id);
  res.json({ success: true });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notifikasiService.markAllRead(req.params.nis);
  res.json({ success: true });
});

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  list,
  markRead,
  markAllRead,
};
