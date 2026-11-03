/**
 * ============================================================================
 * Cure Hospital (কিওর হসপিটাল) - Management System
 * Express Controller for Appointments, Doctors, & 30-Minute Slots
 * ============================================================================
 */

const appointmentService = require('../services/appointmentService');

/**
 * 1. Get all Doctors
 * GET /api/doctors
 */
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await appointmentService.getDoctors();
    res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get 30-Minute Slots for Doctor on a specific date
 * GET /api/doctors/:id/slots?date=YYYY-MM-DD
 */
exports.getDoctorSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'তারিখ নির্বাচন করা আবশ্যক (Date parameter is required).',
      });
    }

    const slots = await appointmentService.getDoctorSlots(id, date);
    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Instant Phone Auto-Lookup
 * GET /api/patients/lookup?phone=01812345678
 */
exports.lookupPatient = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'ফোন নম্বর প্রদান করা আবশ্যক (Phone number is required).',
      });
    }

    const patient = await appointmentService.lookupPatientByPhone(phone);
    if (patient) {
      return res.json({
        success: true,
        found: true,
        message: 'পুরাতন রোগী সনাক্ত হয়েছে (Existing patient record found)!',
        data: patient,
      });
    }

    return res.json({
      success: true,
      found: false,
      message: 'নতুন রোগী (No prior record found. Ready for new patient entry).',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Patient Appointment Request (Meditaj Split Checkout)
 * POST /api/appointments
 */
exports.requestAppointment = async (req, res, next) => {
  try {
    const { 
      phone, 
      full_name, 
      age, 
      gender, 
      doctor_id, 
      appointment_date, 
      time_slot, 
      payment_method, 
      payment_status, 
      consultation_fee, 
      symptoms 
    } = req.body;

    if (!phone || !full_name || !doctor_id || !appointment_date) {
      return res.status(400).json({
        success: false,
        message: 'ফোন নম্বর, নাম, ডাক্তার ও তারিখ পূরণ করা আবশ্যক।',
      });
    }

    const appointment = await appointmentService.createAppointment({
      phone,
      full_name,
      age,
      gender,
      doctor_id,
      appointment_date,
      time_slot,
      payment_method,
      payment_status,
      consultation_fee,
      symptoms,
    });

    res.status(201).json({
      success: true,
      message: 'অ্যাপয়েন্টমেন্টের অনুরোধ সফলভাবে জমা হয়েছে। সহকারী ডেস্ক থেকে দ্রুত কনফার্ম করা হবে।',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Assistant Desk - List Appointments
 * GET /api/appointments?status=PENDING&search=...&date=...
 */
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, search, date } = req.query;
    const appointments = await appointmentService.getAppointments({
      status,
      search,
      date,
    });

    const allAppointments = await appointmentService.getAppointments({ status: 'ALL' });
    const stats = {
      total: allAppointments.length,
      pending: allAppointments.filter((a) => a.status === 'PENDING').length,
      confirmed: allAppointments.filter((a) => a.status === 'CONFIRMED').length,
      cancelled: allAppointments.filter((a) => a.status === 'CANCELLED').length,
    };

    res.json({
      success: true,
      count: appointments.length,
      stats,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Patient Live Tracker by Phone
 * GET /api/appointments/track?phone=01812345678
 */
exports.trackAppointments = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'মোবাইল নম্বর প্রদান করুন।',
      });
    }

    const appointments = await appointmentService.getAppointmentsByPhone(phone);
    let patient = await appointmentService.lookupPatientByPhone(phone);

    // Fallback: If separate patient record is missing, use patient object attached to the appointment
    if (!patient && appointments.length > 0 && appointments[0].patient) {
      patient = appointments[0].patient;
    }

    res.json({
      success: true,
      count: appointments.length,
      patient,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Assistant Desk: Confirm Appointment
 * PATCH /api/appointments/:id/confirm
 */
exports.confirmAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await appointmentService.confirmAppointment(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'অ্যাপয়েন্টমেন্ট কনফার্ম করতে ব্যর্থ হয়েছে।',
    });
  }
};

/**
 * 8. Assistant Desk: Cancel Appointment
 * PATCH /api/appointments/:id/cancel
 */
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const result = await appointmentService.cancelAppointment(id, reason);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'অ্যাপয়েন্টমেন্ট বাতিল করতে ব্যর্থ হয়েছে।',
    });
  }
};

/**
 * 9. Doctor Management: Add New Doctor
 * POST /api/doctors
 */
exports.addDoctor = async (req, res, next) => {
  try {
    const { name, department, designation, room_no, available_slots, experience, fee } = req.body;
    if (!name || !department) {
      return res.status(400).json({
        success: false,
        message: 'ডাক্তারের নাম এবং বিভাগ আবশ্যক।',
      });
    }

    const doctor = await appointmentService.addDoctor({
      name,
      department,
      designation,
      room_no,
      available_slots,
      experience,
      fee,
    });

    res.status(201).json({
      success: true,
      message: 'নতুন ডাক্তার সফলভাবে যুক্ত করা হয়েছে।',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Doctor Management: Remove Doctor
 * DELETE /api/doctors/:id
 */
exports.deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await appointmentService.deleteDoctor(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'ডাক্তার অপসারণ করতে ব্যর্থ হয়েছে।',
    });
  }
};

/**
 * 11. Walk-in Desk Booking
 * POST /api/appointments/walkin
 */
exports.createWalkInAppointment = async (req, res, next) => {
  try {
    const { phone, full_name, age, gender, doctor_id, appointment_date, time_slot, symptoms } = req.body;
    if (!phone || !full_name || !doctor_id) {
      return res.status(400).json({
        success: false,
        message: 'ফোন নম্বর, রোগীর নাম এবং ডাক্তার নির্বাচন আবশ্যক।',
      });
    }

    const result = await appointmentService.createWalkInAppointment({
      phone,
      full_name,
      age,
      gender,
      doctor_id,
      appointment_date,
      time_slot,
      symptoms,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'সরাসরি বুকিং সম্পন্ন করতে ব্যর্থ হয়েছে।',
    });
  }
};

/**
 * 12. Reset Demo Data
 * POST /api/demo/reset
 */
exports.resetDemo = async (req, res, next) => {
  try {
    const result = await appointmentService.resetDemo();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
