const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/all', paymentController.getPayments);
router.post('/', paymentController.createPayment);
router.get('/dues', paymentController.getDues);
router.put('/entry/:id', paymentController.updatePayment);
router.delete('/entry/:id', paymentController.deletePayment);
router.get('/:tripId', paymentController.getTripDue);

module.exports = router;
