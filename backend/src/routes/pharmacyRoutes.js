const express = require('express');
const router = express.Router();
const {
  getInventory,
  stockInMedicine,
  getPendingPrescriptions,
  dispensePrescriptionItem,
} = require('../controllers/pharmacyController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Dispensary / Pharmacy protected routes (accessible by pharmacy and admin)
router.use(verifyToken, authorizeRoles('pharmacy', 'admin'));

router.get('/medicines', getInventory);
router.post('/stock-in', stockInMedicine);
router.get('/prescriptions', getPendingPrescriptions);
router.post('/dispense-item', dispensePrescriptionItem);

module.exports = router;
