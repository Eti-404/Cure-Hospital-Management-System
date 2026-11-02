/**
 * "নিরাময়" (Niramoy) - Dedicated Medicine & Dispensary Routes
 * /api/medicines
 */

const express = require('express');
const router = express.Router();
const {
  getInventory,
  stockInMedicine,
  dispensePrescriptionItem,
} = require('../controllers/pharmacyController');
const { getFreeMedicinesDirectory } = require('../controllers/publicController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public citizen free medicine directory
router.get('/free', getFreeMedicinesDirectory);

// Dispensary inventory & stock operations
router.get('/', getInventory);
router.post('/stock-in', verifyToken, authorizeRoles('pharmacy', 'admin'), stockInMedicine);
router.post('/dispense', verifyToken, authorizeRoles('pharmacy', 'admin'), dispensePrescriptionItem);

module.exports = router;
