const express = require('express');
const router = express.Router();
const {
  getDoctorsList,
  toggleDoctorLeave,
  getBedMatrix,
  updateBedStatus,
  getEmergencyReferrals,
  reviewEmergencyReferral,
} = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All admin routes protected for role: 'admin'
router.use(verifyToken, authorizeRoles('admin'));

router.get('/doctors', getDoctorsList);
router.patch('/doctors/:id/leave', toggleDoctorLeave);
router.get('/beds', getBedMatrix);
router.patch('/beds/:id/status', updateBedStatus);
router.get('/referrals', getEmergencyReferrals);
router.patch('/referrals/:id/review', reviewEmergencyReferral);

module.exports = router;
