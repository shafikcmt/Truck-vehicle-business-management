const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.get('/by-trip/:tripId', expenseController.getExpensesByTrip);
router.get('/by-vehicle/:vehicleId', expenseController.getExpensesByVehicle);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
