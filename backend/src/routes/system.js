const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(authMiddleware);
router.get('/settings', systemController.getSettings);
router.put('/settings', authorize('admin'), systemController.updateSettings);
router.get('/backup', authorize('admin'), systemController.createBackup);

module.exports = router;
