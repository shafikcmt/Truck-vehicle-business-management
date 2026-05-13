const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/summary', reportController.getSummaryReport);
router.get('/profit-loss', reportController.getProfitLossReport);
router.get('/vehicles', reportController.getVehicleReport);
router.get('/drivers', reportController.getDriverReport);
router.get('/customers', reportController.getCustomerReport);
router.get('/dues', reportController.getDueReport);
router.get('/expenses', reportController.getExpenseReport);
router.get('/owners', reportController.getOwnerReport);

module.exports = router;
