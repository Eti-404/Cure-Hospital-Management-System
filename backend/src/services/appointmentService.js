/**
 * ============================================================================
 * Cure Hospital (কিওর হসপিটাল) - Management System
 * Core Appointment, Doctor & 30-Minute Slot Service Layer
 * ============================================================================
 */

const { supabase, isConfigured } = require('../config/supabase');
const crypto = require('crypto');

// Generate valid v4 UUID
const generateId = () => crypto.randomUUID();

// Helper to generate 30-minute slots based on visiting time
function generate30MinSlots(visitingTime) {
  if (visitingTime && visitingTime.includes('05:00 PM')) {
    return [
      '05:00 PM - 05:30 PM',
      '05:30 PM - 06:00 PM',
      '06:00 PM - 06:30 PM',
      '06:30 PM - 07:00 PM',
      '07:00 PM - 07:30 PM',
      '07:30 PM - 08:00 PM',
      '08:00 PM - 08:30 PM',
      '08:30 PM - 09:00 PM',
    ];
  }

  if (visitingTime && visitingTime.includes('09:00 AM')) {
    return [
      '09:00 AM - 09:30 AM',
      '09:30 AM - 10:00 AM',
      '10:00 AM - 10:30 AM',
      '10:30 AM - 11:00 AM',
      '11:00 AM - 11:30 AM',
      '11:30 AM - 12:00 PM',
      '12:00 PM - 12:30 PM',
      '12:30 PM - 01:00 PM',
    ];
  }

  // Default: 11:00 AM - 03:00 PM
  return [
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '12:30 PM - 01:00 PM',
    '01:00 PM - 01:30 PM',
    '01:30 PM - 02:00 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
  ];
}

// Initial seed doctors (8 Departments x 5 Doctors = 40 Doctors)
// Full Meditaj-Style Profile with 30-minute slots, visiting days, consultation fees & ratings
const INITIAL_DOCTORS = [
  // 1. মেডিসিন বিভাগ (General Medicine)
  {
    id: 'd1000000-0000-0000-0000-000000000101',
    name: 'ডা. রফিকুল ইসলাম',
    department: 'মেডিসিন বিভাগ (General Medicine)',
    designation: 'সিনিয়র কনসালট্যান্ট ও অধ্যাপক',
    degree: 'MBBS, FCPS (Medicine), MACP (USA)',
    experience: '১৫ বছরের অভিজ্ঞতা',
    room_no: 'Room 101-A',
    fee: 800,
    rating: 4.9,
    reviews_count: 128,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000102',
    name: 'ডা. শাহানাজ বেগম',
    department: 'মেডিসিন বিভাগ (General Medicine)',
    designation: 'সহযোগী অধ্যাপক',
    degree: 'MBBS, MD (Internal Medicine)',
    experience: '১২ বছরের অভিজ্ঞতা',
    room_no: 'Room 102-B',
    fee: 800,
    rating: 4.8,
    reviews_count: 94,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000103',
    name: 'ডা. আহমেদ তানভীর',
    department: 'মেডিসিন বিভাগ (General Medicine)',
    designation: 'সহকারী অধ্যাপক',
    degree: 'MBBS, FCPS, MRCP (UK)',
    experience: '১০ বছরের অভিজ্ঞতা',
    room_no: 'Room 103-A',
    fee: 1000,
    rating: 5.0,
    reviews_count: 142,
    schedule_days: ['Sat', 'Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'শনি, রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000104',
    name: 'ডা. কাজী মোস্তাক',
    department: 'মেডিসিন বিভাগ (General Medicine)',
    designation: 'কনসালট্যান্ট',
    degree: 'MBBS, MD (Medicine), CCD',
    experience: '৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 104-C',
    fee: 700,
    rating: 4.7,
    reviews_count: 76,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000105',
    name: 'ডা. ফারহানা হক',
    department: 'মেডিসিন বিভাগ (General Medicine)',
    designation: 'জুনিয়র কনসালট্যান্ট',
    degree: 'MBBS, BCS, FCPS (Medicine Part-2)',
    experience: '৫ বছরের অভিজ্ঞতা',
    room_no: 'Room 105-B',
    fee: 600,
    rating: 4.8,
    reviews_count: 52,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },

  // 2. হৃদরোগ বিভাগ (Cardiology)
  {
    id: 'd1000000-0000-0000-0000-000000000201',
    name: 'ডা. তারিকুল হাসান',
    department: 'হৃদরোগ বিভাগ (Cardiology)',
    designation: 'চিফ কার্ডিওলজিস্ট ও অধ্যাপক',
    degree: 'MBBS, FCPS, MD (Cardiology)',
    experience: '১৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 201-A',
    fee: 1200,
    rating: 4.9,
    reviews_count: 215,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000202',
    name: 'ডা. মেহরাব হোসেন',
    department: 'হৃদরোগ বিভাগ (Cardiology)',
    designation: 'সহযোগী কনসালট্যান্ট',
    degree: 'MBBS, D-Card (DU)',
    experience: '৯ বছরের অভিজ্ঞতা',
    room_no: 'Room 202-B',
    fee: 900,
    rating: 4.8,
    reviews_count: 110,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000203',
    name: 'ডা. সাবরিনা রহমান',
    department: 'হৃদরোগ বিভাগ (Cardiology)',
    designation: 'সহকারী অধ্যাপক (কার্ডিওলজি)',
    degree: 'MBBS, MD, FACC (USA)',
    experience: '১১ বছরের অভিজ্ঞতা',
    room_no: 'Room 203-A',
    fee: 1000,
    rating: 5.0,
    reviews_count: 165,
    schedule_days: ['Sat', 'Sun', 'Wed'],
    schedule_days_bn: 'শনি, রবি, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000204',
    name: 'ডা. নাসির উদ্দিন',
    department: 'হৃদরোগ বিভাগ (Cardiology)',
    designation: 'ইন্টারভেনশনাল কার্ডিওলজিস্ট',
    degree: 'MBBS, FCPS (Cardiology)',
    experience: '১৪ বছরের অভিজ্ঞতা',
    room_no: 'Room 204-C',
    fee: 1100,
    rating: 4.8,
    reviews_count: 88,
    schedule_days: ['Mon', 'Wed', 'Fri'],
    schedule_days_bn: 'সোম, বুধ, শুক্র',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000205',
    name: 'ডা. রোকেয়া সুলতানা',
    department: 'হৃদরোগ বিভাগ (Cardiology)',
    designation: 'ক্লিনিক্যাল কার্ডিওলজিস্ট',
    degree: 'MBBS, D-Card, CCD (BIRDEM)',
    experience: '৭ বছরের অভিজ্ঞতা',
    room_no: 'Room 205-B',
    fee: 800,
    rating: 4.7,
    reviews_count: 64,
    schedule_days: ['Sat', 'Tue', 'Thu'],
    schedule_days_bn: 'শনি, মঙ্গল, বৃহস্পতি',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },

  // 3. শিশু বিভাগ (Pediatrics)
  {
    id: 'd1000000-0000-0000-0000-000000000301',
    name: 'ডা. নুসরাত জাহান',
    department: 'শিশু বিভাগ (Pediatrics)',
    designation: 'সহযোগী অধ্যাপক ও শিশু বিশেষজ্ঞ',
    degree: 'MBBS, FCPS (Pediatrics)',
    experience: '১০ বছরের অভিজ্ঞতা',
    room_no: 'Room 301-A',
    fee: 800,
    rating: 4.9,
    reviews_count: 175,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000302',
    name: 'ডা. তানভীর হোসেন',
    department: 'শিশু বিভাগ (Pediatrics)',
    designation: 'নবজাতক ও শিশু বিশেষজ্ঞ',
    degree: 'MBBS, MD (Pediatrics)',
    experience: '১৩ বছরের অভিজ্ঞতা',
    room_no: 'Room 302-B',
    fee: 900,
    rating: 4.9,
    reviews_count: 130,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000303',
    name: 'ডা. শারমিন সুলতানা',
    department: 'শিশু বিভাগ (Pediatrics)',
    designation: 'সহকারী অধ্যাপক',
    degree: 'MBBS, DCH (DU), FCPS',
    experience: '৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 303-C',
    fee: 800,
    rating: 4.8,
    reviews_count: 92,
    schedule_days: ['Sat', 'Sun', 'Wed'],
    schedule_days_bn: 'শনি, রবি, বুধ',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000304',
    name: 'ডা. কামরুল ইসলাম',
    department: 'শিশু বিভাগ (Pediatrics)',
    designation: 'শিশু কিশোর রোগ বিশেষজ্ঞ',
    degree: 'MBBS, MD (Child Health)',
    experience: '১১ বছরের অভিজ্ঞতা',
    room_no: 'Room 304-A',
    fee: 850,
    rating: 4.7,
    reviews_count: 85,
    schedule_days: ['Mon', 'Tue', 'Thu'],
    schedule_days_bn: 'সোম, মঙ্গল, বৃহস্পতি',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000305',
    name: 'ডা. সামিয়া চৌধুরী',
    department: 'শিশু বিভাগ (Pediatrics)',
    designation: 'ক্লিনিক্যাল পেডিয়াট্রিশিয়ান',
    degree: 'MBBS, DCH',
    experience: '৬ বছরের অভিজ্ঞতা',
    room_no: 'Room 305-B',
    fee: 700,
    rating: 4.8,
    reviews_count: 58,
    schedule_days: ['Sun', 'Tue', 'Fri'],
    schedule_days_bn: 'রবি, মঙ্গল, শুক্র',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },

  // 4. নাক-কান-গলা (ENT)
  {
    id: 'd1000000-0000-0000-0000-000000000401',
    name: 'ডা. মোস্তাফিজুর রহমান',
    department: 'নাক-কান-গলা (ENT)',
    designation: 'ইএনটি হেড-নেক সার্জন ও অধ্যাপক',
    degree: 'MBBS, MS (ENT)',
    experience: '১৬ বছরের অভিজ্ঞতা',
    room_no: 'Room 401-A',
    fee: 900,
    rating: 4.9,
    reviews_count: 145,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000402',
    name: 'ডা. রিফাত আহমেদ',
    department: 'নাক-কান-গলা (ENT)',
    designation: 'সহযোগী কনসালট্যান্ট',
    degree: 'MBBS, DLO, FCPS (ENT)',
    experience: '১০ বছরের অভিজ্ঞতা',
    room_no: 'Room 402-B',
    fee: 800,
    rating: 4.8,
    reviews_count: 98,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000403',
    name: 'ডা. ফারজানা বিনতে রউফ',
    department: 'নাক-কান-গলা (ENT)',
    designation: 'সহকারী অধ্যাপক',
    degree: 'MBBS, FCPS (Otolaryngology)',
    experience: '৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 403-C',
    fee: 800,
    rating: 4.9,
    reviews_count: 82,
    schedule_days: ['Sat', 'Tue', 'Thu'],
    schedule_days_bn: 'শনি, মঙ্গল, বৃহস্পতি',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000404',
    name: 'ডা. মাহফুজুর হক',
    department: 'নাক-কান-গলা (ENT)',
    designation: 'মাইক্রো-ইয়ার সার্জন',
    degree: 'MBBS, MS (ENT)',
    experience: '১২ বছরের অভিজ্ঞতা',
    room_no: 'Room 404-A',
    fee: 950,
    rating: 4.7,
    reviews_count: 112,
    schedule_days: ['Mon', 'Wed', 'Fri'],
    schedule_days_bn: 'সোম, বুধ, শুক্র',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000405',
    name: 'ডা. সাজিদ করিম',
    department: 'নাক-কান-গলা (ENT)',
    designation: 'ইএনটি স্পেশালিস্ট',
    degree: 'MBBS, DLO',
    experience: '৬ বছরের অভিজ্ঞতা',
    room_no: 'Room 405-B',
    fee: 700,
    rating: 4.8,
    reviews_count: 45,
    schedule_days: ['Sun', 'Wed', 'Thu'],
    schedule_days_bn: 'রবি, বুধ, বৃহস্পতি',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },

  // 5. গাইনী ও প্রসূতি (Gynecology)
  {
    id: 'd1000000-0000-0000-0000-000000000501',
    name: 'ডা. সালমা সুলতানা',
    department: 'গাইনী ও প্রসূতি (Gynecology)',
    designation: 'সিনিয়র কনসালট্যান্ট ও সার্জন',
    degree: 'MBBS, FCPS (Obs & Gynae), MS',
    experience: '১৭ বছরের অভিজ্ঞতা',
    room_no: 'Room 501-A',
    fee: 1000,
    rating: 5.0,
    reviews_count: 240,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000502',
    name: 'ডা. আয়েশা সিদ্দিকা',
    department: 'গাইনী ও প্রসূতি (Gynecology)',
    designation: 'সহযোগী অধ্যাপক (গাইনী)',
    degree: 'MBBS, DGO, MCPS, FCPS',
    experience: '১৩ বছরের অভিজ্ঞতা',
    room_no: 'Room 502-B',
    fee: 900,
    rating: 4.9,
    reviews_count: 180,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000503',
    name: 'ডা. রোকেয়া আনোয়ার',
    department: 'গাইনী ও প্রসূতি (Gynecology)',
    designation: 'সহকারী কনসালট্যান্ট ও প্রসূতি বিশেষজ্ঞ',
    degree: 'MBBS, MS (Gynae)',
    experience: '১০ বছরের অভিজ্ঞতা',
    room_no: 'Room 503-C',
    fee: 850,
    rating: 4.8,
    reviews_count: 115,
    schedule_days: ['Sat', 'Sun', 'Wed'],
    schedule_days_bn: 'শনি, রবি, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000504',
    name: 'ডা. নাসরিন আক্তার',
    department: 'গাইনী ও প্রসূতি (Gynecology)',
    designation: 'হাই-রিস্ক প্রেগন্যান্সি স্পেশালিস্ট',
    degree: 'MBBS, FCPS (Gynae)',
    experience: '৯ বছরের অভিজ্ঞতা',
    room_no: 'Room 504-A',
    fee: 900,
    rating: 4.9,
    reviews_count: 104,
    schedule_days: ['Mon', 'Wed', 'Fri'],
    schedule_days_bn: 'সোম, বুধ, শুক্র',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000505',
    name: 'ডা. শারমিন জাহান',
    department: 'গাইনী ও প্রসূতি (Gynecology)',
    designation: 'ল্যাপারোস্কোপিক সার্জন',
    degree: 'MBBS, MS (Obs & Gynae)',
    experience: '৭ বছরের অভিজ্ঞতা',
    room_no: 'Room 505-B',
    fee: 800,
    rating: 4.7,
    reviews_count: 70,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },

  // 6. অর্থোপেডিক (Orthopedics)
  {
    id: 'd1000000-0000-0000-0000-000000000601',
    name: 'ডা. সাইদুর রহমান',
    department: 'অর্থোপেডিক (Orthopedics)',
    designation: 'অর্থোপেডিক ও ট্রমা সার্জন',
    degree: 'MBBS, MS (Ortho Surgery)',
    experience: '১৫ বছরের অভিজ্ঞতা',
    room_no: 'Room 601-A',
    fee: 1000,
    rating: 4.9,
    reviews_count: 190,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000602',
    name: 'ডা. তানজিল চৌধুরী',
    department: 'অর্থোপেডিক (Orthopedics)',
    designation: 'স্পাইন ও জয়েন্ট রিপ্লেসমেন্ট সার্জন',
    degree: 'MBBS, D-Ortho, Fellow (Arthroplasty)',
    experience: '১১ বছরের অভিজ্ঞতা',
    room_no: 'Room 602-B',
    fee: 1100,
    rating: 4.9,
    reviews_count: 140,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000603',
    name: 'ডা. মশিউর রহমান',
    department: 'অর্থোপেডিক (Orthopedics)',
    designation: 'সহকারী অধ্যাপক (অর্থোপেডিক)',
    degree: 'MBBS, MS (Ortho)',
    experience: '১৩ বছরের অভিজ্ঞতা',
    room_no: 'Room 603-C',
    fee: 900,
    rating: 4.8,
    reviews_count: 110,
    schedule_days: ['Sat', 'Sun', 'Tue'],
    schedule_days_bn: 'শনি, রবি, মঙ্গল',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000604',
    name: 'ডা. হাবিবুর বাশার',
    department: 'অর্থোপেডিক (Orthopedics)',
    designation: 'ট্রমা ও স্পোর্টস ইনজুরি স্পেশালিস্ট',
    degree: 'MBBS, FCPS (Ortho)',
    experience: '৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 604-A',
    fee: 850,
    rating: 4.8,
    reviews_count: 75,
    schedule_days: ['Mon', 'Wed', 'Fri'],
    schedule_days_bn: 'সোম, বুধ, শুক্র',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000605',
    name: 'ডা. আরিফুল ইসলাম',
    department: 'অর্থোপেডিক (Orthopedics)',
    designation: 'অর্থোপেডিক স্পেশালিস্ট',
    degree: 'MBBS, D-Ortho (NITOR)',
    experience: '৬ বছরের অভিজ্ঞতা',
    room_no: 'Room 605-B',
    fee: 750,
    rating: 4.7,
    reviews_count: 55,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },

  // 7. চর্ম ও এলার্জি (Dermatology)
  {
    id: 'd1000000-0000-0000-0000-000000000701',
    name: 'ডা. আফরোজা পারভীন',
    department: 'চর্ম ও এলার্জি (Dermatology)',
    designation: 'সিনিয়র কনসালট্যান্ট ডার্মাটোলজিস্ট',
    degree: 'MBBS, DDV, FCPS (Skin & VD)',
    experience: '১০ বছরের অভিজ্ঞতা',
    room_no: 'Room 701-A',
    fee: 800,
    rating: 4.9,
    reviews_count: 160,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000702',
    name: 'ডা. মোস্তাফিজুর রহমান',
    department: 'চর্ম ও এলার্জি (Dermatology)',
    designation: 'সহযোগী অধ্যাপক',
    degree: 'MBBS, MD (Dermatology)',
    experience: '১৪ বছরের অভিজ্ঞতা',
    room_no: 'Room 702-B',
    fee: 900,
    rating: 4.8,
    reviews_count: 125,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000703',
    name: 'ডা. রুমানা ইয়াসমিন',
    department: 'চর্ম ও এলার্জি (Dermatology)',
    designation: 'লেজার ও কসমেটিক ডার্মাটোলজিস্ট',
    degree: 'MBBS, DDV, Fellow (Cosmetology)',
    experience: '৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 703-C',
    fee: 850,
    rating: 4.9,
    reviews_count: 90,
    schedule_days: ['Sat', 'Tue', 'Thu'],
    schedule_days_bn: 'শনি, মঙ্গল, বৃহস্পতি',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000704',
    name: 'ডা. কামরুজ্জামান',
    department: 'চর্ম ও এলার্জি (Dermatology)',
    designation: 'স্কিন ও এলার্জি বিশেষজ্ঞ',
    degree: 'MBBS, DVD (BSMMU)',
    experience: '১১ বছরের অভিজ্ঞতা',
    room_no: 'Room 704-A',
    fee: 800,
    rating: 4.7,
    reviews_count: 78,
    schedule_days: ['Mon', 'Wed', 'Fri'],
    schedule_days_bn: 'সোম, বুধ, শুক্র',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000705',
    name: 'ডা. নাদিয়া হোসেন',
    department: 'চর্ম ও এলার্জি (Dermatology)',
    designation: 'ক্লিনিক্যাল ডার্মাটোলজিস্ট',
    degree: 'MBBS, DDV',
    experience: '৫ বছরের অভিজ্ঞতা',
    room_no: 'Room 705-B',
    fee: 700,
    rating: 4.8,
    reviews_count: 48,
    schedule_days: ['Sun', 'Tue', 'Wed'],
    schedule_days_bn: 'রবি, মঙ্গল, বুধ',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },

  // 8. চক্ষু বিভাগ (Ophthalmology)
  {
    id: 'd1000000-0000-0000-0000-000000000801',
    name: 'ডা. এম এ খালেক',
    department: 'চক্ষু বিভাগ (Ophthalmology)',
    designation: 'সিনিয়র চক্ষু বিশেষজ্ঞ ও ফ্যাকো সার্জন',
    degree: 'MBBS, FCPS (Eye), FICO (UK)',
    experience: '১৬ বছরের অভিজ্ঞতা',
    room_no: 'Room 801-A',
    fee: 900,
    rating: 4.9,
    reviews_count: 172,
    schedule_days: ['Sat', 'Mon', 'Wed'],
    schedule_days_bn: 'শনি, সোম, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000802',
    name: 'ডা. ফারহানা চৌধুরী',
    department: 'চক্ষু বিভাগ (Ophthalmology)',
    designation: 'রেটিনা ও গ্লুকোমা স্পেশালিস্ট',
    degree: 'MBBS, MS (Ophthalmology)',
    experience: '১২ বছরের অভিজ্ঞতা',
    room_no: 'Room 802-B',
    fee: 950,
    rating: 4.9,
    reviews_count: 134,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000803',
    name: 'ডা. আনোয়ার হোসেন',
    department: 'চক্ষু বিভাগ (Ophthalmology)',
    designation: 'সহকারী অধ্যাপক (চক্ষু)',
    degree: 'MBBS, DO (DU), FCPS (Ophth)',
    experience: '১০ বছরের অভিজ্ঞতা',
    room_no: 'Room 803-C',
    fee: 850,
    rating: 4.8,
    reviews_count: 102,
    schedule_days: ['Sat', 'Sun', 'Wed'],
    schedule_days_bn: 'শনি, রবি, বুধ',
    visiting_time: '11:00 AM - 03:00 PM',
    schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000804',
    name: 'ডা. তানিয়া রহমান',
    department: 'চক্ষু বিভাগ (Ophthalmology)',
    designation: 'পেডিয়াট্রিক অফথালমোলজিস্ট',
    degree: 'MBBS, FCPS (Eye)',
    experience: '৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 804-A',
    fee: 800,
    rating: 4.8,
    reviews_count: 88,
    schedule_days: ['Mon', 'Wed', 'Fri'],
    schedule_days_bn: 'সোম, বুধ, শুক্র',
    visiting_time: '05:00 PM - 09:00 PM',
    schedule_time_bn: 'বিকেল ০৫:০০ - রাত ০৯:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd1000000-0000-0000-0000-000000000805',
    name: 'ডা. সাইফুল আজম',
    department: 'চক্ষু বিভাগ (Ophthalmology)',
    designation: 'রিফ্র্যাক্টিভ ও লেসিক সার্জন',
    degree: 'MBBS, DO (Eye)',
    experience: '৭ বছরের অভিজ্ঞতা',
    room_no: 'Room 805-B',
    fee: 750,
    rating: 4.7,
    reviews_count: 65,
    schedule_days: ['Sun', 'Tue', 'Thu'],
    schedule_days_bn: 'রবি, মঙ্গল, বৃহস্পতি',
    visiting_time: '09:00 AM - 01:00 PM',
    schedule_time_bn: 'সকাল ০৯:০০ - দুপুর ০১:০০',
    available_slots: 8,
    created_at: new Date().toISOString(),
  },
];

// Initial seed patients
const INITIAL_PATIENTS = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    full_name: 'মো. আব্দুল করিম (Abdul Karim)',
    phone: '01812345678',
    age: 45,
    gender: 'Male',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000002',
    full_name: 'রহিমা খাতুন (Rahima Khatun)',
    phone: '01711223344',
    age: 32,
    gender: 'Female',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000003',
    full_name: 'তানভীর আহমেদ (Tanvir Ahmed)',
    phone: '01988776655',
    age: 28,
    gender: 'Male',
    created_at: new Date().toISOString(),
  },
  {
    id: 'p1000000-0000-0000-0000-000000000004',
    full_name: 'শিরিন আক্তার (Shirin Akter)',
    phone: '01655443322',
    age: 50,
    gender: 'Female',
    created_at: new Date().toISOString(),
  },
];

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

// Initial seed appointments with 30-min time slots & payment states
const INITIAL_APPOINTMENTS = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    patient_id: 'p1000000-0000-0000-0000-000000000001',
    doctor_id: 'd1000000-0000-0000-0000-000000000101',
    appointment_date: getTomorrowDate(),
    time_slot: '11:00 AM - 11:30 AM',
    payment_method: 'ONLINE_MFS',
    payment_status: 'PAID_ONLINE',
    consultation_fee: 800,
    status: 'PENDING',
    token_id: null,
    symptoms: 'মাঝারি মাত্রার জ্বর ও সর্দি (Fever and cough for 3 days)',
    confirmed_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    patient_id: 'p1000000-0000-0000-0000-000000000002',
    doctor_id: 'd1000000-0000-0000-0000-000000000301',
    appointment_date: getTodayDate(),
    time_slot: '11:30 AM - 12:00 PM',
    payment_method: 'PAY_AT_COUNTER',
    payment_status: 'PENDING_COUNTER',
    consultation_fee: 800,
    status: 'CONFIRMED',
    token_id: 'CURE-2026-101',
    symptoms: 'শিশুর ঠান্ডা এবং শ্বাসকষ্টের সমস্যা',
    confirmed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    patient_id: 'p1000000-0000-0000-0000-000000000003',
    doctor_id: 'd1000000-0000-0000-0000-000000000201',
    appointment_date: getTomorrowDate(),
    time_slot: '12:00 PM - 12:30 PM',
    payment_method: 'ONLINE_MFS',
    payment_status: 'PAID_ONLINE',
    consultation_fee: 1200,
    status: 'PENDING',
    token_id: null,
    symptoms: 'বুকের মাঝে চাপ ও শ্বাসকষ্ট (Chest tightness on exertion)',
    confirmed_at: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    patient_id: 'p1000000-0000-0000-0000-000000000004',
    doctor_id: 'd1000000-0000-0000-0000-000000000601',
    appointment_date: getTodayDate(),
    time_slot: '01:00 PM - 01:30 PM',
    payment_method: 'PAY_AT_COUNTER',
    payment_status: 'PENDING_COUNTER',
    consultation_fee: 1000,
    status: 'CANCELLED',
    token_id: null,
    symptoms: 'হাঁটু ও কোমরের ব্যথা (Knee joint pain)',
    confirmed_at: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

// In-Memory store for fast, reliable, offline-ready operation
let store = {
  doctors: JSON.parse(JSON.stringify(INITIAL_DOCTORS)),
  patients: JSON.parse(JSON.stringify(INITIAL_PATIENTS)),
  appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
};

let tokenCounter = 105;

class AppointmentService {
  /**
   * Reset data to initial demo state
   */
  async resetDemo() {
    store = {
      doctors: JSON.parse(JSON.stringify(INITIAL_DOCTORS)),
      patients: JSON.parse(JSON.stringify(INITIAL_PATIENTS)),
      appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
    };
    tokenCounter = 105;
    return { success: true, message: 'সকল ডেমো ডেটা এবং স্লট প্রাথমিক অবস্থায় রিসেট করা হয়েছে।' };
  }

  /**
   * 1. Get all Doctors
   */
  async getDoctors() {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .order('name');
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase getDoctors fallback:', err.message);
      }
    }
    return store.doctors;
  }

  /**
   * 2a. Get Doctor Booked Slots for a Specific Date
   * Capacity: ONLY active appointments where status IN ('PENDING', 'CONFIRMED')
   * Excludes 'CANCELLED' appointments so freed slots are immediately available.
   */
  async getDoctorBookedSlots(doctorId, date) {
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('time_slot, status')
          .eq('doctor_id', doctorId)
          .eq('appointment_date', date)
          .in('status', ['PENDING', 'CONFIRMED']);
        if (data && data.length > 0) {
          return data.map((a) => a.time_slot);
        }
      } catch (err) {
        console.warn('Supabase getDoctorBookedSlots fallback:', err.message);
      }
    }

    return store.appointments
      .filter((a) => a.doctor_id === doctorId && a.appointment_date === date && (a.status === 'PENDING' || a.status === 'CONFIRMED'))
      .map((a) => a.time_slot);
  }

  /**
   * 2b. Get Doctor 30-Minute Slots for a Specific Date
   * Capacity: 1 patient per 30-minute slot
   */
  async getDoctorSlots(doctorId, date) {
    const doctors = await this.getDoctors();
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) {
      throw new Error('ডাক্তার পাওয়া যায়নি (Doctor not found).');
    }

    const baseSlots = generate30MinSlots(doctor.visiting_time);

    // Active appointments for this doctor on this date (PENDING or CONFIRMED only)
    const bookedSlotList = await this.getDoctorBookedSlots(doctorId, date);
    const bookedSlotTimes = new Set(bookedSlotList);

    return baseSlots.map((slotTime, idx) => {
      // Deterministic dummy booked slots (index 1 and index 4) to demonstrate realistic booked/unavailable slot state
      const isDummyBooked = (idx === 1 || idx === 4);
      const isBooked = isDummyBooked || bookedSlotTimes.has(slotTime);
      return {
        time_slot: slotTime,
        is_booked: isBooked,
        capacity: 1,
        available: !isBooked,
      };
    });
  }

  /**
   * 3. Instant Phone Auto-Lookup
   */
  async lookupPatientByPhone(phone) {
    if (!phone) return null;
    const raw = phone.toString().trim();
    const digits = raw.replace(/\D/g, '');
    const cleanPhone = digits.length > 11 ? digits.slice(-11) : digits;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .or(`phone.eq.${raw},phone.eq.${cleanPhone}`)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase lookupPatientByPhone fallback:', err.message);
      }
    }

    let found = store.patients.find((p) => {
      const pDigits = (p.phone || '').replace(/\D/g, '');
      const pClean = pDigits.length > 11 ? pDigits.slice(-11) : pDigits;
      return pClean === cleanPhone || p.phone === raw || (cleanPhone.length >= 10 && pDigits.endsWith(cleanPhone.slice(-10)));
    });

    if (!found) {
      // Look through appointments to see if a patient was booked
      const aptWithPatient = store.appointments.find((a) => {
        const pDigits = ((a.patient && a.patient.phone) || a.phone || '').replace(/\D/g, '');
        const pClean = pDigits.length > 11 ? pDigits.slice(-11) : pDigits;
        return pClean === cleanPhone || (cleanPhone.length >= 10 && pDigits.endsWith(cleanPhone.slice(-10)));
      });
      if (aptWithPatient) {
        found = aptWithPatient.patient || {
          full_name: aptWithPatient.full_name || 'রোগী',
          phone: cleanPhone,
          age: aptWithPatient.age || 30,
          gender: aptWithPatient.gender || 'Male',
        };
      }
    }

    return found || null;
  }

  /**
   * 4. Patient Appointment Request
   * Auto-creates or updates patient, saves 30-min slot, fee, payment status
   */
  async createAppointment({ 
    phone, 
    full_name, 
    age, 
    gender, 
    doctor_id, 
    appointment_date, 
    time_slot, 
    payment_method = 'PAY_AT_COUNTER', 
    payment_status = 'PENDING_COUNTER',
    consultation_fee = 800,
    symptoms 
  }) {
    if (!phone || !full_name || !doctor_id || !appointment_date) {
      throw new Error('ফোন নম্বর, রোগীর নাম, ডাক্তার এবং তারিখ আবশ্যক (Required fields missing).');
    }

    const cleanPhone = phone.trim();
    let patient = await this.lookupPatientByPhone(cleanPhone);

    // If new patient, register into patients table
    if (!patient) {
      const newPatient = {
        id: generateId(),
        full_name: full_name.trim(),
        phone: cleanPhone,
        age: parseInt(age, 10) || 30,
        gender: gender || 'Male',
        created_at: new Date().toISOString(),
      };

      if (isConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('patients')
            .insert([newPatient])
            .select()
            .single();
          if (!error && data) {
            patient = data;
          } else {
            store.patients.push(newPatient);
            patient = newPatient;
          }
        } catch (err) {
          store.patients.push(newPatient);
          patient = newPatient;
        }
      } else {
        store.patients.push(newPatient);
        patient = newPatient;
      }
    } else {
      // Existing patient: update age/gender/name if provided
      if (full_name || age || gender) {
        patient.full_name = full_name ? full_name.trim() : patient.full_name;
        patient.age = age ? parseInt(age, 10) : patient.age;
        patient.gender = gender || patient.gender;

        if (isConfigured && supabase) {
          try {
            await supabase
              .from('patients')
              .update({ full_name: patient.full_name, age: patient.age, gender: patient.gender })
              .eq('id', patient.id);
          } catch (e) {}
        }
      }
    }

    // Verify doctor exists
    const doctors = await this.getDoctors();
    const doctor = doctors.find((d) => d.id === doctor_id);
    if (!doctor) {
      throw new Error('নির্বাচিত ডাক্তার পাওয়া যায়নি (Selected doctor not found).');
    }

    // Default time slot if not selected
    const selectedSlot = time_slot || '11:00 AM - 11:30 AM';

    // Verify slot capacity (max 1 patient)
    const baseSlots = generate30MinSlots(doctor.visiting_time);
    const slotIdx = baseSlots.indexOf(selectedSlot);
    if (slotIdx === 1 || slotIdx === 4) {
      throw new Error(`দুঃখিত, ${selectedSlot} স্লটটি ইতিমধ্যেই বুক হয়ে গেছে। অন্য সময় নির্বাচন করুন।`);
    }

    const existingBooking = store.appointments.find(
      (a) => a.doctor_id === doctor.id && 
             a.appointment_date === appointment_date && 
             a.time_slot === selectedSlot && 
             a.status !== 'CANCELLED'
    );
    if (existingBooking) {
      throw new Error(`দুঃখিত, ${selectedSlot} স্লটটি ইতিমধ্যেই বুক হয়ে গেছে। অন্য সময় নির্বাচন করুন।`);
    }

    // Create Appointment with PENDING status
    const newAppointment = {
      id: generateId(),
      patient_id: patient.id,
      doctor_id: doctor.id,
      appointment_date: appointment_date,
      time_slot: selectedSlot,
      payment_method: payment_method || 'PAY_AT_COUNTER',
      payment_status: payment_status || 'PENDING_COUNTER',
      consultation_fee: consultation_fee || doctor.fee || 800,
      status: 'PENDING',
      token_id: null,
      symptoms: symptoms || 'নিয়মিত ওপিডি স্বাস্থ্য পরীক্ষা ও বিশেষজ্ঞ পরামর্শ',
      confirmed_at: null,
      created_at: new Date().toISOString(),
    };

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .insert([newAppointment])
          .select()
          .single();
        if (!error && data) {
          return {
            ...data,
            patient,
            doctor,
          };
        }
      } catch (err) {
        console.warn('Supabase createAppointment fallback:', err.message);
      }
    }

    store.appointments.unshift(newAppointment);

    return {
      ...newAppointment,
      patient,
      doctor,
    };
  }

  /**
   * 5. Get Appointments for Assistant Desk
   */
  async getAppointments({ status, search, date } = {}) {
    let appointments = [];

    if (isConfigured && supabase) {
      try {
        let query = supabase
          .from('appointments')
          .select(`
            *,
            patient:patients(*),
            doctor:doctors(*)
          `)
          .order('created_at', { ascending: false });

        if (status && status !== 'ALL') {
          query = query.eq('status', status.toUpperCase());
        }
        if (date) {
          query = query.eq('appointment_date', date);
        }

        const { data, error } = await query;
        if (!error && data) {
          appointments = data;
        }
      } catch (err) {
        console.warn('Supabase getAppointments fallback:', err.message);
      }
    }

    // Always map store.appointments with patient & doctor info
    const storeMapped = store.appointments.map((apt) => {
      const patient = store.patients.find((p) => p.id === apt.patient_id) || apt.patient || null;
      const doctor = store.doctors.find((d) => d.id === apt.doctor_id) || apt.doctor || null;
      return {
        ...apt,
        patient,
        doctor,
      };
    });

    if (appointments.length === 0) {
      appointments = storeMapped;
    } else {
      // Merge unique appointments from store
      const existingIds = new Set(appointments.map((a) => a.id));
      for (const sa of storeMapped) {
        if (!existingIds.has(sa.id)) {
          appointments.unshift(sa);
        }
      }
    }

    if (status && status !== 'ALL') {
      appointments = appointments.filter(
        (a) => a.status.toUpperCase() === status.toUpperCase()
      );
    }

    if (date) {
      appointments = appointments.filter((a) => a.appointment_date === date);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      appointments = appointments.filter((a) => {
        const pName = (a.patient?.full_name || '').toLowerCase();
        const pPhone = (a.patient?.phone || '').toLowerCase();
        const dName = (a.doctor?.name || '').toLowerCase();
        const token = (a.token_id || '').toLowerCase();
        return (
          pName.includes(q) ||
          pPhone.includes(q) ||
          dName.includes(q) ||
          token.includes(q)
        );
      });
    }

    return appointments;
  }

  /**
   * 6. Patient Status Tracker
   * Guaranteed retrieval: Matches clean 11-digit phone number across patient and appointment records
   */
  async getAppointmentsByPhone(phone) {
    if (!phone) return [];
    const raw = phone.toString().trim();
    const digits = raw.replace(/\D/g, '');
    const cleanPhone = digits.length > 11 ? digits.slice(-11) : digits;

    const patient = await this.lookupPatientByPhone(cleanPhone);
    const all = await this.getAppointments({ status: 'ALL' });

    return all.filter((a) => {
      const pPhone = ((a.patient && a.patient.phone) || a.phone || '').replace(/\D/g, '');
      const aptClean = pPhone.length > 11 ? pPhone.slice(-11) : pPhone;

      if (cleanPhone && aptClean && aptClean === cleanPhone) return true;
      if (patient && patient.id && a.patient_id === patient.id) return true;
      if (cleanPhone.length >= 10 && aptClean.endsWith(cleanPhone.slice(-10))) return true;
      return false;
    });
  }

  /**
   * 7. Slot-Based Confirmation Logic
   * Decrements slot count, generates Token ID formatted 'CURE-2026-XXX'
   */
  async confirmAppointment(appointmentId) {
    const apt = store.appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      throw new Error('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি (Appointment not found).');
    }

    if (apt.status === 'CONFIRMED') {
      return {
        alreadyConfirmed: true,
        appointment: apt,
        message: 'এই অ্যাপয়েন্টমেন্টটি ইতিমধ্যে নিশ্চিত করা হয়েছে।',
      };
    }

    const doctor = store.doctors.find((d) => d.id === apt.doctor_id);
    if (!doctor) {
      throw new Error('ডাক্তার পাওয়া যায়নি (Doctor not found).');
    }

    if (doctor.available_slots <= 0) {
      throw new Error(`দুঃখিত, ${doctor.name}-এর কোনো খালি স্লট নেই!`);
    }

    // Decrement available slot
    doctor.available_slots -= 1;

    // Generate Token ID formatted CURE-2026-XXX
    tokenCounter += 1;
    const tokenId = `CURE-2026-${tokenCounter}`;

    // Update appointment
    apt.status = 'CONFIRMED';
    apt.token_id = tokenId;
    apt.confirmed_at = new Date().toISOString();

    const patient = store.patients.find((p) => p.id === apt.patient_id);

    return {
      success: true,
      message: `অ্যাপয়েন্টমেন্ট সফলভাবে নিশ্চিত করা হয়েছে! টোকেন নং: ${tokenId}`,
      appointment: { ...apt, patient, doctor },
      updatedDoctor: doctor,
    };
  }

  /**
   * 8. Assistant Desk Cancellation Logic with Automatic Online Refund Handling
   * Restores slot by +1 and marks online payment as REFUNDED
   */
  async cancelAppointment(appointmentId, reason = 'সহকারী কর্তৃক বাতিলকৃত') {
    const apt = store.appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      throw new Error('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি (Appointment not found).');
    }

    if (apt.status === 'CANCELLED') {
      const err = new Error('অ্যাপয়েন্টমেন্টটি ইতিমধ্যেই বাতিল করা হয়েছে (Appointment already cancelled).');
      err.statusCode = 400;
      throw err;
    }

    const wasConfirmed = apt.status === 'CONFIRMED';
    const doctor = store.doctors.find((d) => d.id === apt.doctor_id);

    // CRITICAL: Always increment doctor's available slot when appointment is cancelled
    if (doctor) {
      doctor.available_slots = (doctor.available_slots || 0) + 1;
    }

    const cancelledAt = new Date().toISOString();
    apt.status = 'CANCELLED';
    apt.cancellation_reason = reason;
    apt.cancelled_by = 'ASSISTANT';
    apt.cancelled_at = cancelledAt;

    // Automatic Online Payment Refund Processing
    const wasPaidOnline = apt.payment_status === 'PAID_ONLINE' || apt.payment_method === 'ONLINE_MFS';
    let refundProcessed = false;
    let refundAmount = 0;

    if (wasPaidOnline) {
      apt.payment_status = 'REFUNDED';
      apt.refund_processed_at = cancelledAt;
      apt.refund_amount = apt.consultation_fee || doctor?.fee || 800;
      refundProcessed = true;
      refundAmount = apt.refund_amount;
    }

    const patient = store.patients.find((p) => p.id === apt.patient_id) || apt.patient;

    // Supabase update if configured
    if (isConfigured && supabase) {
      try {
        await supabase
          .from('appointments')
          .update({
            status: 'CANCELLED',
            cancellation_reason: reason,
            cancelled_by: 'ASSISTANT',
            cancelled_at: cancelledAt,
            payment_status: apt.payment_status,
            refund_amount: apt.refund_amount || null,
            refund_processed_at: apt.refund_processed_at || null,
          })
          .eq('id', appointmentId);

        if (doctor && doctor.id) {
          await supabase
            .from('doctors')
            .update({ available_slots: doctor.available_slots })
            .eq('id', doctor.id);
        }
      } catch (err) {
        console.warn('Supabase cancelAppointment sync fallback:', err.message);
      }
    }

    const successMessage = refundProcessed
      ? `অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে এবং প্রদেয় ৳${refundAmount} রিফান্ড প্রসেস করা হয়েছে।`
      : 'অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে এবং ডাক্তারের স্লট ১ বৃদ্ধি পেয়েছে।';

    return {
      success: true,
      message: successMessage,
      appointment: { ...apt, patient, doctor },
      updatedDoctor: doctor,
      slotRestored: true,
      refundProcessed,
      refundAmount,
    };
  }

  /**
   * 8b. Patient Self-Cancellation with Phone Verification & Slot Auto-Increment
   * Allows patients to cancel their own appointments directly from Track Status portal
   * Automatically frees the 30-minute time slot and increments available_slots by 1.
   */
  async patientCancelAppointment(appointmentId, { phone, reason } = {}) {
    let apt = store.appointments.find((a) => a.id === appointmentId);
    let patient = null;

    if (isConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('*, patient:patients(*), doctor:doctors(*)')
          .eq('id', appointmentId)
          .single();
        if (data) {
          apt = data;
          patient = data.patient;
        }
      } catch (err) {
        console.warn('Supabase patientCancelAppointment lookup fallback:', err.message);
      }
    }

    if (!apt) {
      const err = new Error('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি (Appointment not found).');
      err.statusCode = 404;
      throw err;
    }

    if (!patient) {
      patient = store.patients.find((p) => p.id === apt.patient_id) || apt.patient;
    }

    // Phone verification
    const normalizePhone = (p) => {
      if (!p) return '';
      const digits = p.toString().replace(/\D/g, '');
      return digits.length > 11 ? digits.slice(-11) : digits;
    };

    const inputPhone = normalizePhone(phone);
    const aptPhone = normalizePhone(patient?.phone || apt.phone || apt.patient_phone);

    if (!inputPhone || !aptPhone || inputPhone !== aptPhone) {
      const err = new Error('অননুমোদিত অনুরোধ: মোবাইল নম্বর মিলছে না (Unauthorized: Phone number does not match).');
      err.statusCode = 403;
      throw err;
    }

    if (apt.status === 'CANCELLED') {
      const err = new Error('অ্যাপয়েন্টমেন্টটি ইতিমধ্যেই বাতিল করা হয়েছে (Appointment already cancelled).');
      err.statusCode = 400;
      throw err;
    }

    const doctor = store.doctors.find((d) => d.id === apt.doctor_id) || apt.doctor;

    // CRITICAL: Increment doctor's available_slots += 1
    if (doctor) {
      doctor.available_slots = (doctor.available_slots || 0) + 1;
    }

    // Update appointment state
    const cancellationReason = reason && reason.trim() ? reason.trim() : 'Patient self-cancellation';
    const cancelledAt = new Date().toISOString();

    apt.status = 'CANCELLED';
    apt.cancellation_reason = cancellationReason;
    apt.cancelled_by = 'PATIENT';
    apt.cancelled_at = cancelledAt;

    // Automatic Online Payment Refund Processing
    const wasPaidOnline = apt.payment_status === 'PAID_ONLINE' || apt.payment_method === 'ONLINE_MFS';
    let refundProcessed = false;
    let refundAmount = 0;

    if (wasPaidOnline) {
      apt.payment_status = 'REFUNDED';
      apt.refund_processed_at = cancelledAt;
      apt.refund_amount = apt.consultation_fee || doctor?.fee || 800;
      refundProcessed = true;
      refundAmount = apt.refund_amount;
    }

    // Supabase update if configured
    if (isConfigured && supabase) {
      try {
        await supabase
          .from('appointments')
          .update({
            status: 'CANCELLED',
            cancellation_reason: cancellationReason,
            cancelled_by: 'PATIENT',
            cancelled_at: cancelledAt,
            payment_status: apt.payment_status,
            refund_amount: apt.refund_amount || null,
            refund_processed_at: apt.refund_processed_at || null,
          })
          .eq('id', appointmentId);

        if (doctor && doctor.id) {
          await supabase
            .from('doctors')
            .update({ available_slots: doctor.available_slots })
            .eq('id', doctor.id);
        }
      } catch (err) {
        console.warn('Supabase patientCancelAppointment sync fallback:', err.message);
      }
    }

    const successMessage = refundProcessed
      ? `অ্যাপয়েন্টমেন্ট সফলভাবে বাতিল করা হয়েছে এবং ৳${refundAmount} রিফান্ড প্রসেস করা হয়েছে। ডাক্তারের একটি স্লট উন্মুক্ত করা হয়েছে।`
      : 'অ্যাপয়েন্টমেন্ট সফলভাবে বাতিল করা হয়েছে এবং সংশ্লিষ্ট ডাক্তারের স্লট পুনরায় উন্মুক্ত করা হয়েছে।';

    return {
      success: true,
      message: successMessage,
      appointment: { ...apt, patient, doctor },
      updatedDoctor: doctor,
      slotRestored: true,
      refundProcessed,
      refundAmount,
    };
  }

  /**
   * 9. Walk-in Instant Booking
   */
  async createWalkInAppointment({ phone, full_name, age, gender, doctor_id, appointment_date, time_slot, symptoms }) {
    tokenCounter += 1;
    const tokenId = `CURE-2026-${tokenCounter}`;

    const apt = await this.createAppointment({
      phone,
      full_name,
      age,
      gender,
      doctor_id,
      appointment_date,
      time_slot: time_slot || '11:00 AM - 11:30 AM',
      payment_method: 'PAY_AT_COUNTER',
      payment_status: 'PAID_ONLINE', // Desk receipts are marked paid upon registration
      consultation_fee: 800,
      symptoms: symptoms || 'ডেস্কে সরাসরি ওপিডি পরামর্শ (Walk-in)',
    });

    // Auto-confirm
    const inStoreApt = store.appointments.find((a) => a.id === apt.id);
    if (inStoreApt) {
      inStoreApt.status = 'CONFIRMED';
      inStoreApt.token_id = tokenId;
      inStoreApt.confirmed_at = new Date().toISOString();
      apt.status = 'CONFIRMED';
      apt.token_id = tokenId;
      apt.confirmed_at = inStoreApt.confirmed_at;
    }

    return {
      success: true,
      message: `ওয়াক-ইন অ্যাপয়েন্টমেন্ট সফলভাবে তৈরি ও কনফার্ম করা হয়েছে! টোকেন: ${tokenId}`,
      appointment: apt,
    };
  }

  /**
   * 10. Add New Doctor
   */
  async addDoctor(doctorData) {
    const newDoc = {
      id: generateId(),
      name: doctorData.name,
      department: doctorData.department,
      designation: doctorData.designation || 'কনসালট্যান্ট স্পেশালিস্ট',
      degree: doctorData.degree || 'MBBS, FCPS',
      experience: doctorData.experience || '৮ বছরের অভিজ্ঞতা',
      room_no: doctorData.room_no || 'Room 201',
      fee: parseInt(doctorData.fee, 10) || 800,
      rating: 4.8,
      reviews_count: 50,
      schedule_days: ['Sat', 'Mon', 'Wed'],
      schedule_days_bn: 'শনি, সোম, বুধ',
      visiting_time: '11:00 AM - 03:00 PM',
      schedule_time_bn: 'সকাল ১১:০০ - দুপুর ০৩:০০',
      available_slots: parseInt(doctorData.available_slots, 10) || 8,
      created_at: new Date().toISOString(),
    };

    store.doctors.unshift(newDoc);
    return newDoc;
  }

  /**
   * 11. Remove Doctor
   */
  async deleteDoctor(doctorId) {
    store.doctors = store.doctors.filter((d) => d.id !== doctorId);
    return { success: true };
  }
}

module.exports = new AppointmentService();
module.exports.generate30MinSlots = generate30MinSlots;
module.exports.store = store;
