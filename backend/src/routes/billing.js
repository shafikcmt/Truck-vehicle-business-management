const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/invoice/:tripId', billingController.invoice);
router.get('/challan/:tripId', billingController.challan);

module.exports = router;
