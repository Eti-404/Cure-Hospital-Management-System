/**
 * "নিরাময়" (Niramoy) - Authentication Controller
 * Handles Patient registration, multi-role login, and session validation
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { inMemoryStore, generateUuid, isConfigured, supabase } = require('../services/dataService');

/**
 * Patient Self-Registration
 * POST /api/auth/register
 */
const registerPatient = async (req, res, next) => {
  try {
    const { full_name, mobile_number, nid, password, blood_group, date_of_birth, gender, emergency_contact, address } = req.body;

    if (!full_name || !mobile_number || !nid || !password) {
      return res.status(400).json({
        success: false,
        message: 'পূর্ণ নাম, মোবাইল নম্বর, জাতীয় পরিচয়পত্র (NID) এবং পাসওয়ার্ড প্রদান বাধ্যতামূলক।',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে। (Password must be at least 6 characters)',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = generateUuid();
    const profileId = generateUuid();

    if (isConfigured && supabase) {
      // Check existing in Supabase
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .or(`mobile_number.eq.${mobile_number},nid.eq.${nid}`)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'এই মোবাইল নম্বর বা এনআইডি দিয়ে ইতোমধ্যে একটি একাউন্ট খোলা আছে।',
        });
      }

      // Insert User
      const { data: user, error: userErr } = await supabase
        .from('users')
        .insert({
          id: userId,
          full_name,
          mobile_number,
          nid,
          role: 'patient',
          password_hash,
        })
        .select()
        .single();

      if (userErr) throw userErr;

      // Insert Profile
      await supabase.from('patient_profiles').insert({
        id: profileId,
        user_id: userId,
        blood_group: blood_group || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        emergency_contact: emergency_contact || null,
        address: address || null,
      });

      const token = jwt.sign(
        { id: user.id, full_name: user.full_name, mobile_number: user.mobile_number, nid: user.nid, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        message: 'সফলভাবে রোগী নিবন্ধন সম্পন্ন হয়েছে।',
        token,
        user: { id: user.id, full_name: user.full_name, mobile_number: user.mobile_number, nid: user.nid, role: user.role },
      });
    }

    // In-memory fallback
    const exists = inMemoryStore.users.find(
      (u) => u.mobile_number === mobile_number || u.nid === nid
    );
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'এই মোবাইল নম্বর বা এনআইডি দিয়ে ইতোমধ্যে একটি একাউন্ট খোলা আছে।',
      });
    }

    const newUser = {
      id: userId,
      full_name,
      mobile_number,
      nid,
      role: 'patient',
      password_hash,
      created_at: new Date().toISOString(),
    };
    inMemoryStore.users.push(newUser);

    inMemoryStore.patient_profiles.push({
      id: profileId,
      user_id: userId,
      blood_group: blood_group || 'A+',
      date_of_birth: date_of_birth || '1995-01-01',
      gender: gender || 'Male',
      emergency_contact: emergency_contact || mobile_number,
      address: address || 'ঢাকা, বাংলাদেশ',
    });

    const token = jwt.sign(
      { id: newUser.id, full_name: newUser.full_name, mobile_number: newUser.mobile_number, nid: newUser.nid, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'সফলভাবে রোগী নিবন্ধন সম্পন্ন হয়েছে।',
      token,
      user: { id: newUser.id, full_name: newUser.full_name, mobile_number: newUser.mobile_number, nid: newUser.nid, role: newUser.role },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Universal Multi-Role Login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // mobile_number or NID

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'মোবাইল নম্বর/এনআইডি এবং পাসওয়ার্ড প্রদান করুন।',
      });
    }

    let user = null;
    let doctorProfile = null;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`mobile_number.eq.${identifier},nid.eq.${identifier}`)
        .maybeSingle();

      if (error) throw error;
      user = data;

      if (user && user.role === 'doctor') {
        const { data: docData } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        doctorProfile = docData;
      }
    } else {
      user = inMemoryStore.users.find(
        (u) => u.mobile_number === identifier || u.nid === identifier
      );
      if (user && user.role === 'doctor') {
        doctorProfile = inMemoryStore.doctor_profiles.find((d) => d.user_id === user.id);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি। তথ্য সঠিক কিনা যাচাই করুন।',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'ভুল পাসওয়ার্ড! পুনরায় চেষ্টা করুন।',
      });
    }

    const payload = {
      id: user.id,
      full_name: user.full_name,
      mobile_number: user.mobile_number,
      nid: user.nid,
      role: user.role,
      doctor_profile_id: doctorProfile ? doctorProfile.id : null,
      chamber_number: doctorProfile ? doctorProfile.chamber_number : null,
      department: doctorProfile ? doctorProfile.department : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'লগইন সফল হয়েছে। নিরাময় সিস্টেমে স্বাগতম!',
      token,
      user: payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current Authenticated Profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let userDetails = null;

    if (isConfigured && supabase) {
      const { data } = await supabase.from('users').select('id, full_name, mobile_number, nid, role, created_at').eq('id', userId).single();
      userDetails = data;
    } else {
      const u = inMemoryStore.users.find((x) => x.id === userId);
      if (u) {
        userDetails = {
          id: u.id,
          full_name: u.full_name,
          mobile_number: u.mobile_number,
          nid: u.nid,
          role: u.role,
          created_at: u.created_at,
        };
      }
    }

    if (!userDetails) {
      return res.status(404).json({ success: false, message: 'প্রোফাইল পাওয়া যায়নি।' });
    }

    res.json({ success: true, user: userDetails });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPatient,
  login,
  getMe,
};
