/**
 * ============================================================================
 * Cure Hospital (কিওর হসপিটাল) - Management System
 * Express Router for Problem 5 Endpoints
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Doctor endpoints
router.get('/doctors', appointmentController.getDoctors);
router.get('/doctors/:id/slots', appointmentController.getDoctorSlots);
router.post('/doctors', appointmentController.addDoctor);
router.delete('/doctors/:id', appointmentController.deleteDoctor);

// Patient lookup
router.get('/patients/lookup', appointmentController.lookupPatient);

// Appointments CRUD & Actions
router.post('/appointments', appointmentController.requestAppointment);
router.post('/appointments/walkin', appointmentController.createWalkInAppointment);
router.get('/appointments', appointmentController.getAppointments);
router.get('/appointments/track', appointmentController.trackAppointments);
router.patch('/appointments/:id/confirm', appointmentController.confirmAppointment);
router.patch('/appointments/:id/cancel', appointmentController.cancelAppointment);

// Demo helper
router.post('/demo/reset', appointmentController.resetDemo);

module.exports = router;
