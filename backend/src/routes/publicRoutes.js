const express = require('express');
const router = express.Router();
const {
  getLiveBedStats,
  getPublicDoctorRoster,
  getFreeMedicinesDirectory,
  submitEmergencyReferral,
} = require('../controllers/publicController');

// Public endpoints - No authentication required
router.get('/beds-live', getLiveBedStats);
router.get('/doctor-roster', getPublicDoctorRoster);
router.get('/free-medicines', getFreeMedicinesDirectory);
router.post('/emergency-referral', submitEmergencyReferral);

module.exports = router;
