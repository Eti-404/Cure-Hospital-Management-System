/**
 * "নিরাময়" (Niramoy) - Hospital Authority / Admin Controller
 * Manages doctor rosters, leave statuses, bed occupancy matrix, and emergency referral reviews.
 */

const { inMemoryStore, generateUuid, isConfigured, supabase } = require('../services/dataService');

/**
 * Get All Doctors with Roster & Leave Status
 * GET /api/admin/doctors
 */
const getDoctorsList = async (req, res, next) => {
  try {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          *,
          user:users(full_name, mobile_number),
          rosters:doctor_rosters(*)
        `);
      if (error) throw error;
      return res.json({ success: true, doctors: data || [] });
    }

    const doctors = inMemoryStore.doctor_profiles.map((d) => {
      const rosters = inMemoryStore.doctor_rosters.filter((r) => r.doctor_id === d.id);
      return {
        ...d,
        rosters,
      };
    });

    res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Doctor Leave Status
 * PATCH /api/admin/doctors/:id/leave
 */
const toggleDoctorLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_on_leave } = req.body;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .update({ is_on_leave })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, doctor: data });
    }

    const doc = inMemoryStore.doctor_profiles.find((d) => d.id === id);
    if (!doc) return res.status(404).json({ success: false, message: 'ডাক্তার প্রোফাইল পাওয়া যায়নি।' });

    doc.is_on_leave = is_on_leave;
    res.json({ success: true, doctor: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Hospital Bed Matrix (General, Cabin, ICU, CCU, NICU)
 * GET /api/admin/beds
 */
const getBedMatrix = async (req, res, next) => {
  try {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('beds')
        .select('*')
        .order('bed_type', { ascending: true })
        .order('bed_number', { ascending: true });
      if (error) throw error;
      return res.json({ success: true, beds: data || [] });
    }

    res.json({ success: true, beds: inMemoryStore.beds });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Specific Bed Status (Available, Occupied, Maintenance)
 * PATCH /api/admin/beds/:id/status
 */
const updateBedStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'অবৈধ বেড স্ট্যাটাস।' });
    }

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('beds')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, bed: data });
    }

    const bed = inMemoryStore.beds.find((b) => b.id === id);
    if (!bed) return res.status(404).json({ success: false, message: 'বেড পাওয়া যায়নি।' });

    bed.status = status;
    bed.updated_at = new Date().toISOString();
    res.json({ success: true, bed });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Emergency Referral Requests
 * GET /api/admin/referrals
 */
const getEmergencyReferrals = async (req, res, next) => {
  try {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('bed_transfers_emergency')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, referrals: data || [] });
    }

    res.json({ success: true, referrals: inMemoryStore.bed_transfers_emergency });
  } catch (error) {
    next(error);
  }
};

/**
 * Review Emergency Referral (Approve & Allocate Bed or Reject)
 * PATCH /api/admin/referrals/:id/review
 */
const reviewEmergencyReferral = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, allocated_bed_id } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'অবৈধ পর্যালোচনা সিদ্ধান্ত।' });
    }

    if (isConfigured && supabase) {
      const { data: ref, error } = await supabase
        .from('bed_transfers_emergency')
        .update({
          status,
          allocated_bed_id: allocated_bed_id || null,
          reviewed_by: req.user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If approved with bed allocation, mark bed as OCCUPIED
      if (status === 'APPROVED' && allocated_bed_id) {
        await supabase
          .from('beds')
          .update({ status: 'OCCUPIED' })
          .eq('id', allocated_bed_id);
      }

      return res.json({ success: true, referral: ref });
    }

    const referral = inMemoryStore.bed_transfers_emergency.find((r) => r.id === id);
    if (!referral) return res.status(404).json({ success: false, message: 'রেফারেল পাওয়া যায়নি।' });

    referral.status = status;
    referral.allocated_bed_id = allocated_bed_id || null;
    referral.reviewed_by = req.user.id;

    if (status === 'APPROVED' && allocated_bed_id) {
      const targetBed = inMemoryStore.beds.find((b) => b.id === allocated_bed_id);
      if (targetBed) targetBed.status = 'OCCUPIED';
    }

    res.json({ success: true, referral });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorsList,
  toggleDoctorLeave,
  getBedMatrix,
  updateBedStatus,
  getEmergencyReferrals,
  reviewEmergencyReferral,
};
