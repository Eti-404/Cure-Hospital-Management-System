/**
 * "নিরাময়" (Niramoy) - Doctor EMR Consultation Controller
 * Manages doctor OPD queue, clinical EMR consultations, and prescription issuance.
 */

const { inMemoryStore, generateUuid, isConfigured, supabase } = require('../services/dataService');

/**
 * Get Doctor's Assigned Queue or Department OPD Queue
 * GET /api/doctor/queue
 */
const getDoctorQueue = async (req, res, next) => {
  try {
    const doctorProfileId = req.user.doctor_profile_id;
    const todayDate = new Date().toISOString().split('T')[0];

    if (isConfigured && supabase) {
      let query = supabase
        .from('opd_tickets')
        .select(`
          *,
          patient:users!opd_tickets_patient_id_fkey(full_name, mobile_number, nid)
        `)
        .eq('visit_date', todayDate)
        .order('queue_token', { ascending: true });

      if (doctorProfileId) {
        query = query.or(`doctor_id.eq.${doctorProfileId},doctor_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return res.json({ success: true, queue: data || [] });
    }

    // In-memory fallback
    const queue = inMemoryStore.opd_tickets
      .filter((t) => t.visit_date === todayDate)
      .map((t) => {
        const patient = inMemoryStore.users.find((u) => u.id === t.patient_id);
        return {
          ...t,
          patient: {
            full_name: patient?.full_name || t.patient_name,
            mobile_number: patient?.mobile_number || '01812345678',
            nid: patient?.nid || '1995123456789',
          },
        };
      })
      .sort((a, b) => a.queue_token - b.queue_token);

    res.json({ success: true, queue });
  } catch (error) {
    next(error);
  }
};

/**
 * Update OPD Ticket Status (e.g. WAITING -> IN_CONSULTATION)
 * PATCH /api/doctor/queue/:ticketId/status
 */
const updateTicketStatus = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'অবৈধ স্ট্যাটাস। (Invalid status)' });
    }

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('opd_tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, ticket: data });
    }

    const ticket = inMemoryStore.opd_tickets.find((t) => t.id === ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'টিকিট পাওয়া যায়নি।' });

    ticket.status = status;
    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate EMR Digital Prescription & Direct Sync to Patient
 * POST /api/doctor/prescribe
 */
const generatePrescription = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const doctorProfileId = req.user.doctor_profile_id;
    const {
      ticket_id,
      patient_id,
      chief_complaints,
      clinical_diagnosis,
      advice,
      follow_up_date,
      medicines = [],
    } = req.body;

    if (!ticket_id || !patient_id) {
      return res.status(400).json({
        success: false,
        message: 'টিকিট আইডি এবং রোগী আইডি প্রদান করা বাধ্যতামূলক।',
      });
    }

    const prescriptionId = generateUuid();

    if (isConfigured && supabase) {
      // 1. Insert Prescription
      const { data: prescription, error: pErr } = await supabase
        .from('prescriptions')
        .insert({
          id: prescriptionId,
          ticket_id,
          patient_id,
          doctor_id: doctorProfileId,
          chief_complaints,
          clinical_diagnosis,
          advice,
          follow_up_date: follow_up_date || null,
        })
        .select()
        .single();

      if (pErr) throw pErr;

      // 2. Insert Prescription Items (NOTE: medicine_id is NULLABLE)
      if (medicines.length > 0) {
        const itemsToInsert = medicines.map((m) => ({
          id: generateUuid(),
          prescription_id: prescriptionId,
          medicine_id: m.medicine_id || null, // NULLABLE: handles medicines not in hospital inventory
          medicine_name: m.medicine_name,
          dosage: m.dosage || '1+0+1',
          duration: m.duration || '7 দিন',
          instructions: m.instructions || 'খাবারের পর',
          is_dispensed: false,
        }));

        const { error: itemsErr } = await supabase.from('prescription_items').insert(itemsToInsert);
        if (itemsErr) throw itemsErr;
      }

      // 3. Mark ticket as COMPLETED
      await supabase
        .from('opd_tickets')
        .update({ status: 'COMPLETED' })
        .eq('id', ticket_id);

      return res.status(201).json({
        success: true,
        message: 'ডিজিটাল প্রেসক্রিপশন সফলভাবে সংরক্ষিত ও রোগীর ড্যাশবোর্ডে সিঙ্ক হয়েছে!',
        prescription_id: prescriptionId,
      });
    }

    // In-memory fallback
    const doctorProfile =
      inMemoryStore.doctor_profiles.find((d) => d.id === doctorProfileId || d.user_id === doctorUserId) ||
      inMemoryStore.doctor_profiles[0];

    const newPrescription = {
      id: prescriptionId,
      ticket_id,
      patient_id,
      doctor_id: doctorProfile ? doctorProfile.id : 'b0000000-0000-0000-0000-000000000001',
      doctor_name: doctorProfile ? doctorProfile.full_name : req.user.full_name,
      doctor_designation: doctorProfile ? doctorProfile.designation : 'সহযোগী অধ্যাপক (মেডিসিন)',
      department: doctorProfile ? doctorProfile.department : 'মেডিসিন বিভাগ',
      chamber_number: doctorProfile ? doctorProfile.chamber_number : 'চেম্বার ১০১',
      chief_complaints,
      clinical_diagnosis,
      advice,
      follow_up_date: follow_up_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    inMemoryStore.prescriptions.unshift(newPrescription);

    // Prescription Items
    medicines.forEach((m) => {
      inMemoryStore.prescription_items.push({
        id: generateUuid(),
        prescription_id: prescriptionId,
        medicine_id: m.medicine_id || null, // NULLABLE
        medicine_name: m.medicine_name,
        dosage: m.dosage || '1+0+1',
        duration: m.duration || '৭ দিন',
        instructions: m.instructions || 'খাবারের পর (After meal)',
        is_dispensed: false,
        dispensed_at: null,
      });
    });

    // Update ticket status
    const ticket = inMemoryStore.opd_tickets.find((t) => t.id === ticket_id);
    if (ticket) ticket.status = 'COMPLETED';

    res.status(201).json({
      success: true,
      message: 'ডিজিটাল প্রেসক্রিপশন সফলভাবে সংরক্ষিত ও রোগীর ড্যাশবোর্ডে সিঙ্ক হয়েছে!',
      prescription: newPrescription,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorQueue,
  updateTicketStatus,
  generatePrescription,
};
