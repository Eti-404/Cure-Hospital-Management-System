/**
 * "নিরাময়" (Niramoy) - OPD Ticket & MFS Payment Controller
 * Manages 1-click auto-fill booking, 10 BDT simulated payment, token numbering,
 * printable ticket slips, and patient digital prescription vault.
 */

const { inMemoryStore, generateUuid, isConfigured, supabase } = require('../services/dataService');

/**
 * 1-Click OPD Ticket Generation with Simulated 10 BDT Payment
 * POST /api/tickets/book
 */
const bookTicket = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { doctor_id, department, payment_method = 'bKash', transaction_id } = req.body;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'হাসপাতালের বিভাগ নির্বাচন করা আবশ্যক। (Department is required)',
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const dateCode = todayDate.replace(/-/g, '');

    // Generate realistic simulated MFS transaction ID if not provided
    const prefix = payment_method === 'Nagad' ? 'NG' : payment_method === 'Rocket' ? 'RK' : 'BK';
    const finalTrxId = transaction_id || `${prefix}${dateCode}X${Math.floor(1000 + Math.random() * 9000)}`;

    let doctorInfo = null;
    let nextQueueToken = 1;

    if (isConfigured && supabase) {
      // Find doctor if specified
      if (doctor_id) {
        const { data: doc } = await supabase
          .from('doctor_profiles')
          .select('*, users(full_name)')
          .eq('id', doctor_id)
          .maybeSingle();
        doctorInfo = doc;
      }

      // Calculate next token for this department & today
      const { count } = await supabase
        .from('opd_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', todayDate)
        .eq('department', department);

      nextQueueToken = (count || 0) + 1;
      const ticketNumber = `OPD-${dateCode}-${String(nextQueueToken).padStart(3, '0')}`;
      const ticketId = generateUuid();

      const { data: ticket, error } = await supabase
        .from('opd_tickets')
        .insert({
          id: ticketId,
          ticket_number: ticketNumber,
          patient_id: patientId,
          doctor_id: doctor_id || null,
          department,
          fee_bdt: 10.0,
          payment_status: 'PAID',
          payment_method,
          transaction_id: finalTrxId,
          queue_token: nextQueueToken,
          visit_date: todayDate,
          status: 'WAITING',
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: '১০ টাকা ওপিডি টিকিট সফলভাবে তৈরি হয়েছে!',
        ticket: {
          ...ticket,
          doctor_name: doctorInfo?.users?.full_name || 'ডিউটি মেডিকেল অফিসার',
          chamber_number: doctorInfo?.chamber_number || 'কাউন্টার ওপিডি রুম',
          room_no: doctorInfo?.room_no || '১০১',
          patient_name: req.user.full_name,
        },
      });
    }

    // In-memory fallback
    if (doctor_id) {
      doctorInfo = inMemoryStore.doctor_profiles.find((d) => d.id === doctor_id);
    } else {
      doctorInfo = inMemoryStore.doctor_profiles.find((d) => d.department.includes(department)) || inMemoryStore.doctor_profiles[0];
    }

    const deptTicketsToday = inMemoryStore.opd_tickets.filter(
      (t) => t.visit_date === todayDate && t.department === department
    );
    nextQueueToken = deptTicketsToday.length + 1;
    const ticketNumber = `OPD-${dateCode}-${String(nextQueueToken).padStart(3, '0')}`;

    const newTicket = {
      id: generateUuid(),
      ticket_number: ticketNumber,
      patient_id: patientId,
      patient_name: req.user.full_name,
      doctor_id: doctorInfo ? doctorInfo.id : null,
      doctor_name: doctorInfo ? doctorInfo.full_name : 'ডিউটি মেডিকেল অফিসার',
      department,
      chamber_number: doctorInfo ? doctorInfo.chamber_number : 'চেম্বার ১০১',
      room_no: doctorInfo ? doctorInfo.room_no : '১০১-ক',
      fee_bdt: 10.0,
      payment_status: 'PAID',
      payment_method,
      transaction_id: finalTrxId,
      queue_token: nextQueueToken,
      visit_date: todayDate,
      status: 'WAITING',
      created_at: new Date().toISOString(),
    };

    inMemoryStore.opd_tickets.unshift(newTicket);

    res.status(201).json({
      success: true,
      message: '১০ টাকা ওপিডি টিকিট সফলভাবে তৈরি হয়েছে!',
      ticket: newTicket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Patient's Personal OPD Tickets History
 * GET /api/tickets/my-tickets
 */
const getMyTickets = async (req, res, next) => {
  try {
    const patientId = req.user.id;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('opd_tickets')
        .select(`
          *,
          doctor:doctor_profiles(
            chamber_number,
            room_no,
            designation,
            user:users(full_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, tickets: data || [] });
    }

    const patientTickets = inMemoryStore.opd_tickets.filter((t) => t.patient_id === patientId);
    res.json({ success: true, tickets: patientTickets });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Ticket Printable Slip Data (with QR payload)
 * GET /api/tickets/:id/slip
 */
const getTicketSlip = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('opd_tickets')
        .select(`
          *,
          patient:users!opd_tickets_patient_id_fkey(full_name, mobile_number, nid),
          doctor:doctor_profiles(
            chamber_number,
            room_no,
            designation,
            user:users(full_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: 'টিকিট পাওয়া যায়নি।' });

      return res.json({ success: true, slip: data });
    }

    const ticket = inMemoryStore.opd_tickets.find((t) => t.id === id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'টিকিট পাওয়া যায়নি।' });
    }

    const patient = inMemoryStore.users.find((u) => u.id === ticket.patient_id);
    const slip = {
      ...ticket,
      patient: {
        full_name: patient?.full_name || ticket.patient_name,
        mobile_number: patient?.mobile_number || '01812345678',
        nid: patient?.nid || '1995123456789',
      },
    };

    res.json({ success: true, slip });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Patient Digital Health Vault (Prescriptions)
 * GET /api/tickets/my-prescriptions
 */
const getMyPrescriptions = async (req, res, next) => {
  try {
    const patientId = req.user.id;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctor:doctor_profiles(
            chamber_number,
            room_no,
            designation,
            department,
            user:users(full_name)
          ),
          items:prescription_items(*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, prescriptions: data || [] });
    }

    const myPrescriptions = inMemoryStore.prescriptions
      .filter((p) => p.patient_id === patientId)
      .map((p) => {
        const items = inMemoryStore.prescription_items.filter((item) => item.prescription_id === p.id);
        return {
          ...p,
          items,
        };
      });

    res.json({ success: true, prescriptions: myPrescriptions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookTicket,
  getMyTickets,
  getTicketSlip,
  getMyPrescriptions,
};
