/**
 * "নিরাময়" (Niramoy) - Citizen Public Directory Controller
 * Provides real-time public telemetry (no authentication required)
 * - Doctor duty rosters & running chamber token tracker
 * - Live Bed / ICU / CCU / NICU vacancy matrix
 * - Searchable Government Free Medicine Catalog
 * - Emergency Referral Request Submission
 */

const { inMemoryStore, generateUuid, isConfigured, supabase } = require('../services/dataService');

/**
 * Get Public Live Bed Vacancy Statistics
 * GET /api/public/beds-live
 */
const getLiveBedStats = async (req, res, next) => {
  try {
    let bedList = [];

    if (isConfigured && supabase) {
      const { data, error } = await supabase.from('beds').select('*');
      if (error) throw error;
      bedList = data || [];
    } else {
      bedList = inMemoryStore.beds;
    }

    const summary = {
      total_beds: bedList.length,
      available_total: bedList.filter((b) => b.status === 'AVAILABLE').length,
      occupied_total: bedList.filter((b) => b.status === 'OCCUPIED').length,
      by_type: {
        ICU: {
          total: bedList.filter((b) => b.bed_type === 'ICU').length,
          available: bedList.filter((b) => b.bed_type === 'ICU' && b.status === 'AVAILABLE').length,
        },
        CCU: {
          total: bedList.filter((b) => b.bed_type === 'CCU').length,
          available: bedList.filter((b) => b.bed_type === 'CCU' && b.status === 'AVAILABLE').length,
        },
        NICU: {
          total: bedList.filter((b) => b.bed_type === 'NICU').length,
          available: bedList.filter((b) => b.bed_type === 'NICU' && b.status === 'AVAILABLE').length,
        },
        GENERAL: {
          total: bedList.filter((b) => b.bed_type === 'GENERAL').length,
          available: bedList.filter((b) => b.bed_type === 'GENERAL' && b.status === 'AVAILABLE').length,
        },
        CABIN: {
          total: bedList.filter((b) => b.bed_type === 'CABIN').length,
          available: bedList.filter((b) => b.bed_type === 'CABIN' && b.status === 'AVAILABLE').length,
        },
      },
      bed_matrix: bedList,
    };

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Public Doctor Roster & Live Chamber Running Tokens
 * GET /api/public/doctor-roster
 */
const getPublicDoctorRoster = async (req, res, next) => {
  try {
    const todayDate = new Date().toISOString().split('T')[0];

    if (isConfigured && supabase) {
      const { data: doctors, error: docErr } = await supabase
        .from('doctor_profiles')
        .select(`
          id,
          designation,
          department,
          chamber_number,
          room_no,
          is_on_leave,
          user:users(full_name),
          rosters:doctor_rosters(*)
        `);
      if (docErr) throw docErr;

      const { data: ticketsToday } = await supabase
        .from('opd_tickets')
        .select('doctor_id, queue_token, status')
        .eq('visit_date', todayDate);

      const rosterData = (doctors || []).map((doc) => {
        const docTickets = (ticketsToday || []).filter((t) => t.doctor_id === doc.id);
        const inConsultation = docTickets.find((t) => t.status === 'IN_CONSULTATION');
        const completedTickets = docTickets.filter((t) => t.status === 'COMPLETED');
        const runningToken = inConsultation
          ? inConsultation.queue_token
          : completedTickets.length > 0
          ? Math.max(...completedTickets.map((t) => t.queue_token))
          : 0;

        return {
          id: doc.id,
          doctor_name: doc.user?.full_name || 'ডাক্তার',
          designation: doc.designation,
          department: doc.department,
          chamber_number: doc.chamber_number,
          room_no: doc.room_no,
          is_on_leave: doc.is_on_leave,
          total_tokens_issued: docTickets.length,
          running_token: runningToken,
          status: doc.is_on_leave ? 'ছুটিতে আছেন (On Leave)' : 'চেম্বারে উপস্থিত (In Chamber)',
        };
      });

      return res.json({ success: true, roster: rosterData });
    }

    // In-memory fallback
    const rosterData = inMemoryStore.doctor_profiles.map((doc) => {
      const docTickets = inMemoryStore.opd_tickets.filter(
        (t) => t.doctor_id === doc.id && t.visit_date === todayDate
      );
      const inConsultation = docTickets.find((t) => t.status === 'IN_CONSULTATION');
      const completedTickets = docTickets.filter((t) => t.status === 'COMPLETED');
      const runningToken = inConsultation
        ? inConsultation.queue_token
        : completedTickets.length > 0
        ? Math.max(...completedTickets.map((t) => t.queue_token))
        : 1;

      return {
        id: doc.id,
        doctor_name: doc.full_name,
        designation: doc.designation,
        department: doc.department,
        chamber_number: doc.chamber_number,
        room_no: doc.room_no,
        is_on_leave: doc.is_on_leave,
        total_tokens_issued: Math.max(docTickets.length, 1),
        running_token: runningToken,
        status: doc.is_on_leave ? 'ছুটিতে আছেন (On Leave)' : 'চেম্বারে উপস্থিত (In Chamber)',
      };
    });

    res.json({ success: true, roster: rosterData });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Government Free Medicine Public Directory (View-Only)
 * GET /api/public/free-medicines
 */
const getFreeMedicinesDirectory = async (req, res, next) => {
  try {
    const { search, category } = req.query;

    if (isConfigured && supabase) {
      let query = supabase
        .from('medicines')
        .select('*')
        .eq('is_govt_free', true)
        .order('generic_name', { ascending: true });

      if (category && category !== 'ALL') {
        query = query.eq('category', category);
      }
      if (search) {
        query = query.or(`generic_name.ilike.%${search}%,brand_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, medicines: data || [] });
    }

    let results = inMemoryStore.medicines.filter((m) => m.is_govt_free);
    if (category && category !== 'ALL') {
      results = results.filter((m) => m.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (m) => m.generic_name.toLowerCase().includes(q) || m.brand_name.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, medicines: results });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Public Emergency Referral Request
 * POST /api/public/emergency-referral
 */
const submitEmergencyReferral = async (req, res, next) => {
  try {
    const { patient_name, patient_nid, contact_number, requested_bed_type, clinical_reason, priority = 'URGENT' } = req.body;

    if (!patient_name || !contact_number || !requested_bed_type || !clinical_reason) {
      return res.status(400).json({
        success: false,
        message: 'রোগীর নাম, যোগাযোগের নম্বর, প্রয়োজনীয় বেডের ধরন এবং অসুস্থতার কারণ উল্লেখ করা বাধ্যতামূলক।',
      });
    }

    const referralId = generateUuid();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('bed_transfers_emergency')
        .insert({
          id: referralId,
          patient_name,
          patient_nid: patient_nid || null,
          contact_number,
          requested_bed_type,
          clinical_reason,
          priority,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({
        success: true,
        message: 'জরুরি ভর্তি/রেফারেল আবেদন সফলভাবে জমা হয়েছে। নিয়ন্ত্রণ কক্ষ থেকে যাচাই করা হচ্ছে।',
        referral: data,
      });
    }

    const newReferral = {
      id: referralId,
      patient_name,
      patient_nid: patient_nid || '',
      contact_number,
      requested_bed_type,
      clinical_reason,
      priority,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    inMemoryStore.bed_transfers_emergency.unshift(newReferral);

    res.status(201).json({
      success: true,
      message: 'জরুরি ভর্তি/রেফারেল আবেদন সফলভাবে জমা হয়েছে। নিয়ন্ত্রণ কক্ষ থেকে যাচাই করা হচ্ছে।',
      referral: newReferral,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLiveBedStats,
  getPublicDoctorRoster,
  getFreeMedicinesDirectory,
  submitEmergencyReferral,
};
