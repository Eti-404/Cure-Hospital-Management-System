const express = require('express');
const router = express.Router();
const {
  bookTicket,
  getMyTickets,
  getTicketSlip,
  getMyPrescriptions,
} = require('../controllers/ticketController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Patient specific endpoints
router.post('/book', verifyToken, authorizeRoles('patient'), bookTicket);
router.get('/my-tickets', verifyToken, authorizeRoles('patient'), getMyTickets);
router.get('/my-prescriptions', verifyToken, authorizeRoles('patient'), getMyPrescriptions);

// Ticket slip print (allowed for patient, doctor, and admin)
router.get('/:id/slip', verifyToken, getTicketSlip);

module.exports = router;
