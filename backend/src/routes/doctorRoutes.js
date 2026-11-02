const express = require('express');
const router = express.Router();
const {
  getDoctorQueue,
  updateTicketStatus,
  generatePrescription,
} = require('../controllers/doctorController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All doctor routes are protected for role: 'doctor' or 'admin'
router.use(verifyToken, authorizeRoles('doctor', 'admin'));

router.get('/queue', getDoctorQueue);
router.patch('/queue/:ticketId/status', updateTicketStatus);
router.post('/prescribe', generatePrescription);

module.exports = router;
