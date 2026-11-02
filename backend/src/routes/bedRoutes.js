/**
 * "নিরাময়" (Niramoy) - Dedicated Bed Management Routes
 * /api/beds
 */

const express = require('express');
const router = express.Router();
const {
  getBedMatrix,
  updateBedStatus,
  getEmergencyReferrals,
  reviewEmergencyReferral,
} = require('../controllers/adminController');
const { getLiveBedStats, submitEmergencyReferral } = require('../controllers/publicController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public live bed vacancy overview & emergency referral submission
router.get('/live', getLiveBedStats);
router.post('/emergency-referral', submitEmergencyReferral);

// Bed matrix management
router.get('/', getBedMatrix);
router.patch('/:id/status', verifyToken, authorizeRoles('admin'), updateBedStatus);

// Emergency referrals review queue (Admin)
router.get('/referrals/all', verifyToken, authorizeRoles('admin'), getEmergencyReferrals);
router.patch('/referrals/:id/review', verifyToken, authorizeRoles('admin'), reviewEmergencyReferral);

module.exports = router;
