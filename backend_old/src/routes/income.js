const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', incomeController.getIncome);
router.post('/', incomeController.createIncome);
router.get('/by-trip/:tripId', incomeController.getIncomeByTrip);
router.get('/by-date-range', incomeController.getIncomeByDateRange);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
