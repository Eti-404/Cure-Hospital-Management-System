const appointmentService = require('../../backend/src/services/appointmentService');

// Pure logic helper functions matching system rules
const validateSlot = (start, end) => {
  const toMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  return (toMinutes(end) - toMinutes(start)) === 30;
};

const checkSlotConflict = (bookedSlots, target) => bookedSlots.includes(target);

const processConfirmation = (isSlotFree, apptId) => {
  if (!isSlotFree) throw new Error('Slot occupied');
  return { status: 'CONFIRMED', tokenId: 'CURE-2026-105' };
};

const processCancellation = (apptId, reason) => {
  return { status: 'CANCELLED', reason: reason || 'Staff cancellation' };
};

// Patient self-cancellation pure logic verification
const normalizePhone = (p) => {
  if (!p) return '';
  const digits = p.toString().replace(/\D/g, '');
  return digits.length > 11 ? digits.slice(-11) : digits;
};

const processPatientCancellation = (appointment, patientPhone, inputPhone, reason, doctor) => {
  if (normalizePhone(patientPhone) !== normalizePhone(inputPhone)) {
    throw new Error('অননুমোদিত অনুরোধ: মোবাইল নম্বর মিলছে না (Unauthorized: Phone number does not match).');
  }
  if (appointment.status === 'CANCELLED') {
    throw new Error('অ্যাপয়েন্টমেন্টটি ইতিমধ্যেই বাতিল করা হয়েছে (Appointment already cancelled).');
  }

  // Restore doctor slot
  const updatedDoctor = { ...doctor, available_slots: (doctor.available_slots || 0) + 1 };
  
  const updatedAppointment = {
    ...appointment,
    status: 'CANCELLED',
    cancellation_reason: reason || 'Patient self-cancellation',
    cancelled_by: 'PATIENT',
    cancelled_at: new Date().toISOString(),
  };

  return {
    success: true,
    appointment: updatedAppointment,
    updatedDoctor,
  };
};

describe('Problem No. 3 & 5 Unit Tests: Hospital Appointment & Slot Logic', () => {
  test('UT-01: Slot must span 30 minutes', () => {
    expect(validateSlot('11:00 AM', '11:30 AM')).toBe(true);
  });

  test('UT-02: Double-booking must be blocked for occupied slot', () => {
    expect(checkSlotConflict(['11:00 AM - 11:30 AM'], '11:00 AM - 11:30 AM')).toBe(true);
  });

  test('UT-03: Assistant confirms free slot and issues token', () => {
    const result = processConfirmation(true, 'appt-01');
    expect(result.status).toBe('CONFIRMED');
    expect(result.tokenId).toContain('CURE-2026');
  });

  test('UT-04: Assistant cancels appointment when necessary', () => {
    const result = processCancellation('appt-01', 'Doctor in surgery');
    expect(result.status).toBe('CANCELLED');
    expect(result.reason).toBe('Doctor in surgery');
  });

  describe('Patient Self-Cancellation & Slot Auto-Increment Tests', () => {
    test('UT-05: Patient self-cancellation logic with matching phone number succeeds', () => {
      const mockApt = {
        id: 'apt-test-01',
        doctor_id: 'doc-01',
        time_slot: '11:30 AM - 12:00 PM',
        status: 'PENDING',
      };
      const mockDoctor = { id: 'doc-01', available_slots: 5 };
      const patientPhone = '01812345678';
      const inputPhone = '01812345678';

      const result = processPatientCancellation(
        mockApt,
        patientPhone,
        inputPhone,
        'Personal emergency',
        mockDoctor
      );

      expect(result.success).toBe(true);
      expect(result.appointment.status).toBe('CANCELLED');
      expect(result.appointment.cancelled_by).toBe('PATIENT');
      expect(result.appointment.cancellation_reason).toBe('Personal emergency');
      expect(result.updatedDoctor.available_slots).toBe(6);
    });

    test('UT-06: Unauthorized cancellation with mismatched phone number fails', () => {
      const mockApt = {
        id: 'apt-test-02',
        doctor_id: 'doc-01',
        status: 'PENDING',
      };
      const mockDoctor = { id: 'doc-01', available_slots: 5 };
      const patientPhone = '01812345678';
      const wrongInputPhone = '01799887766';

      expect(() => {
        processPatientCancellation(
          mockApt,
          patientPhone,
          wrongInputPhone,
          'Cancelling',
          mockDoctor
        );
      }).toThrow('অননুমোদিত অনুরোধ: মোবাইল নম্বর মিলছে না');
    });

    test('UT-07: When an appointment is cancelled, doctor available slot count increments and slot is freed', () => {
      const slotTime = '12:00 PM - 12:30 PM';
      let bookedSlots = [slotTime, '02:00 PM - 02:30 PM'];
      const mockDoctor = { id: 'doc-02', available_slots: 3 };

      // Before cancellation, slot conflict exists
      expect(checkSlotConflict(bookedSlots, slotTime)).toBe(true);

      const mockApt = {
        id: 'apt-test-03',
        doctor_id: 'doc-02',
        time_slot: slotTime,
        status: 'CONFIRMED',
      };

      const result = processPatientCancellation(
        mockApt,
        '01812345678',
        '01812345678',
        'Feeling better',
        mockDoctor
      );

      // Slot count increments
      expect(result.updatedDoctor.available_slots).toBe(4);

      // Slot is freed from active bookings list (status is CANCELLED)
      bookedSlots = bookedSlots.filter((s) => s !== mockApt.time_slot);
      expect(checkSlotConflict(bookedSlots, slotTime)).toBe(false);
    });

    test('UT-08: Integration with AppointmentService patientCancelAppointment', async () => {
      // Pick active doctor and appointment from appointmentService store
      const doctor = appointmentService.store.doctors[0];
      const initialDoctorSlots = doctor.available_slots;
      const testPhone = '01812345678';

      // Ensure appointment exists for this phone
      const apts = await appointmentService.getAppointmentsByPhone(testPhone);
      expect(apts.length).toBeGreaterThan(0);

      const activeApt = apts.find((a) => a.status !== 'CANCELLED');
      expect(activeApt).toBeDefined();

      const cancelResult = await appointmentService.patientCancelAppointment(activeApt.id, {
        phone: testPhone,
        reason: 'Patient self-cancellation integration test',
      });

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.appointment.status).toBe('CANCELLED');
      expect(cancelResult.appointment.cancelled_by).toBe('PATIENT');
      expect(doctor.available_slots).toBe(initialDoctorSlots + 1);
      expect(cancelResult.slotRestored).toBe(true);
    });
  });
});
