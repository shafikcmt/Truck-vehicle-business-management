const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ownerController.getOwners);
router.post('/', ownerController.createOwner);
router.get('/:id', ownerController.getOwnerById);
router.put('/:id', ownerController.updateOwner);
router.delete('/:id', ownerController.deleteOwner);
router.post('/:id/payments', ownerController.recordOwnerPayment);

module.exports = router;
