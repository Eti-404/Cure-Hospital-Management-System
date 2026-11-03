import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  bn: {
    // Brand (Strict Enforcement)
    hospitalName: 'কিওর হসপিটাল',
    hospitalSub: 'কিওর হসপিটাল ওপিডি কেয়ার সিস্টেম',
    brandBadge: 'স্মার্ট ওপিডি কেয়ার',
    brandTagline: 'আধুনিক চিকিৎসা সেবা',
    copyright: 'কিওর হসপিটাল ব্যবস্থাপনা সিস্টেম | © 2026 Cure Hospital. All Rights Reserved.',

    // Nav
    patientPortal: 'রোগীর ড্যাশবোর্ড',
    doctorDirectory: 'ডাক্তারদের তালিকা',
    assistantDesk: 'সহকারী ডেস্ক',
    signIn: 'সাইন ইন',
    signOut: 'লগআউট',
    welcome: 'স্বাগতম',
    staffLoginRequired: 'লগইন আবশ্যক',
    staffBadge: 'অনুমোদিত স্টাফ',

    // Hero
    heroTitlePrefix: 'সহজ ডিজিটাল অ্যাপয়েন্টমেন্ট ও ',
    heroTitleAccent: 'বিশেষজ্ঞ স্বাস্থ্যসেবা',
    heroSubtitle: 'অভিজ্ঞ বিশেষজ্ঞ ডাক্তার নির্বাচন করুন এবং খুব সহজেই ৩০ মিনিটের স্লটে অ্যাপয়েন্টমেন্ট নিশ্চিত করুন।',
    trustBadge1: '✓ বিশেষায়িত কনসালট্যান্ট',
    trustBadge2: '✓ ৩০ মিনিটের নির্দিষ্ট স্লট',
    heroCtaBook: 'ডাক্তারদের তালিকা ও বুকিং',
    heroCtaTrack: 'স্ট্যাটাস ট্র্যাক করুন',

    // Specialty Grid
    specialtySectionTitle: 'কোন বিশেষজ্ঞ ডাক্তার খুঁজছেন?',
    specialtySectionSub: 'প্রয়োজনীয় বিভাগ নির্বাচন করে ডাক্তারের চেম্বার ও ৩০ মিনিটের স্লট দেখুন',
    specialistCount: 'জন বিশেষজ্ঞ ডাক্তার',
    viewDoctors: 'ডাক্তারদের তালিকা দেখুন',

    // Meditaj-Style Doctor Listing
    allSpecialistsTitle: 'সকল বিশেষজ্ঞ ডাক্তার',
    allSpecialistsSub: 'অভিজ্ঞ বিশেষজ্ঞ ডাক্তার নির্বাচন করে ৩০ মিনিটের স্লটে অ্যাপয়েন্টমেন্ট বুকিং করুন',
    searchDoctorPlaceholder: 'ডাক্তারের নাম বা স্পেশালিটি লিখে খুঁজুন...',
    browseBySpecialty: 'বিশেষজ্ঞ বিভাগসমূহ (Browse by Specialty)',
    resetFilters: 'ফিল্টার রিসেট করুন (Reset Filters)',
    selectAndBook: 'সিলেক্ট এবং বুক করুন',
    chamberSchedule: 'চেম্বার সময়সূচী',
    consultationFee: 'কনসালটেশন ফি',
    experienceYears: 'বছরের অভিজ্ঞতা',
    room: 'কক্ষ',
    ratingLabel: 'রেটিং',
    noDoctorsFound: 'আপনার অনুসন্ধানের সাথে মিল রেখে কোনো ডাক্তার পাওয়া যায়নি।',

    // 2-Column Split-Screen Checkout
    backToDoctorList: '← ডাক্তার তালিকায় ফিরে যান',
    step1Date: 'ধাপ ১: তারিখ নির্বাচন (Choose Date)',
    step1DateSub: 'ডাক্তার যে যে বারে বসেন কেবল সেই তারিখগুলো সক্রিয় রয়েছে',
    step2Slots: 'ধাপ ২: সময়সূচী নির্বাচন (Available 30-min Slots)',
    step2SlotsSub: 'প্রতিটি স্লটে সর্বোচ্চ ১ জন রোগী পরামর্শ নিতে পারেন',
    step3Patient: 'ধাপ ৩: রোগীর তথ্য ফর্ম (Patient Information)',
    step3PatientSub: '১১ ডিজিট ফোন নম্বর দিলে পুরাতন রোগীর তথ্য স্বয়ংক্রিয়ভাবে বসে যাবে',
    selectedDateSlotsFor: 'তারিখের উপলব্ধ স্লটসমূহ',
    slotBooked: 'স্লট পূর্ণ',
    slotSelected: 'নির্বাচিত',
    slotAvailable: 'খালি আছে',
    slotFull: 'স্লট পূর্ণ',
    phoneLabel: 'রোগীর মোবাইল নম্বর *',
    phoneDigits: '(১১ ডিজিট)',
    demoOldPatient: 'পুরাতন রোগী ডেমো',
    demoNewPatient: 'নতুন রোগী ডেমো',
    phonePlaceholder: 'যেমন: 01812345678',
    fullNameLabel: 'রোগীর পূর্ণ নাম *',
    fullNamePlaceholder: 'যেমন: মো. আব্দুল করিম',
    ageLabel: 'বয়স *',
    agePlaceholder: 'যেমন: 45',
    genderLabel: 'লিঙ্গ *',
    male: 'পুরুষ (Male)',
    female: 'মহিলা (Female)',
    other: 'অন্যান্য (Other)',
    symptomsLabel: 'লক্ষণ / সমস্যার বিবরণ (ঐচ্ছিক)',
    symptomsPlaceholder: 'যেমন: ৩ দিন ধরে জ্বর ও কাশি...',

    // Right Column: Checkout Summary & Payment
    checkoutSummaryTitle: 'চেকআউট ও পেমেন্ট সামারি',
    appointmentDetails: 'অ্যাপয়েন্টমেন্ট বিবরণী',
    selectedDoctor: 'নির্বাচিত ডাক্তার',
    selectedDepartment: 'বিভাগ',
    selectedSchedule: 'নির্ধারিত সময়সূচী',
    chamberRoom: 'চেম্বার কক্ষ',
    feeBreakdown: 'ফি বিবরণী',
    consultationFeeLabel: 'ডাক্তার কনসালটেশন ফি',
    totalPayable: 'সর্বমোট প্রদেয়',
    paymentMethodTitle: 'পেমেন্ট পদ্ধতি নির্বাচন করুন',
    paymentOnline: 'অনলাইন পেমেন্ট (Online Payment Now)',
    paymentOnlineDesc: 'বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি পরিশোধ করুন',
    paymentCounter: 'হাসপাতালে এসে পরিশোধ (Pay After Visit / Counter)',
    paymentCounterDesc: 'হাসপাতালের ওপিডি কাউন্টারে নগদ বা কার্ডে পরিশোধ করুন',
    confirmBookingBtn: 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন',
    confirmingBookingBtn: 'নিশ্চিত করা হচ্ছে...',

    // Assistant Desk
    assistantDeskTitle: 'অ্যাপয়েন্টমেন্ট অনুমোদন ও স্লট ট্রায়াজ',
    assistantDeskSub: 'রোগীদের ৩০ মিনিটের স্লট আবেদন যাচাই করে কনফার্ম বা বাতিল করুন।',
    assistantDeskBadge: 'হাসপাতাল সহকারী ও ওপিডি নিয়ন্ত্রণ ডেস্ক',
    vivaDemoReset: 'ভাইভা ডেমো রিসেট',
    statTotal: 'মোট আবেদন',
    statConfirmed: 'নিশ্চিতকৃত',
    statPending: 'অপেক্ষমান',
    statCancelled: 'বাতিলকৃত',
    statTotalHint: 'সবগুলো দেখতে ক্লিক করুন',
    statConfirmedHint: 'টোকেন ইস্যু করা তালিকা',
    statPendingHint: 'অনুমোদনের অপেক্ষায়',
    statCancelledHint: 'স্লট ফেরত প্রদানকৃত',
    tabAll: 'সব আবেদন',
    tabPending: 'অপেক্ষমান',
    tabConfirmed: 'নিশ্চিতকৃত',
    tabCancelled: 'বাতিলকৃত',
    tabWalkIn: 'ডেস্কে সরাসরি বুকিং (Walk-in)',
    tabDoctors: 'ডাক্তার ব্যবস্থাপনা',
    searchPlaceholder: 'রোগীর নাম, ফোন বা স্লট দিয়ে খুঁজুন...',
    searchBtn: 'খুঁজুন',
    confirmAction: 'কনফার্ম করুন',
    cancelAction: 'বাতিল',
    printSlipAction: 'টোকেন স্লিপ',
    addDoctorBtn: 'নতুন ডাক্তার যোগ করুন',
    closeFormBtn: 'ফর্ম বন্ধ করুন',
    emptyPending: 'কোনো অপেক্ষমান অনুরোধ নেই',
    emptyConfirmed: 'কোনো নিশ্চিতকৃত অনুরোধ নেই',
    emptyCancelled: 'কোনো বাতিলকৃত অনুরোধ নেই',
    emptyAll: 'কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি',
    tablePatient: 'রোগীর বিবরণ',
    tableDoctor: 'ডাক্তার ও বিভাগ',
    tableDateSlot: 'তারিখ ও ৩০ মিনিট সময়সূচী',
    tablePayment: 'পেমেন্ট অবস্থা',
    tableStatus: 'অবস্থা',
    tableActions: 'পদক্ষেপ',
    tokenLabel: 'টোকেন',
    paidOnlineBadge: 'অনলাইন পরিশোধিত',
    payCounterBadge: 'কাউন্টারে প্রদেয়',

    // Tracker
    trackerTitle: 'রোগীর অ্যাপয়েন্টমেন্ট স্ট্যাটাস ও ডিজিটাল স্লিপ',
    trackerSub: 'আপনার ১১ ডিজিটের মোবাইল নম্বর দিয়ে অনুসন্ধান করে অ্যাপয়েন্টমেন্টের বর্তমান অবস্থা দেখুন এবং কনফার্ম হলে ডিজিটাল স্লিপ প্রিন্ট করুন।',
    trackerPhoneLabel: 'রোগীর মোবাইল নম্বর',
    trackBtn: 'অনুসন্ধান করুন',
    searchingBtn: 'অনুসন্ধান হচ্ছে...',
    noRecordsFound: 'কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি',
    trackerDemoHint: 'ডেমো রোগীর তথ্য দেখতে 01812345678 চাপুন',
    tokenIssued: 'টোকেন নম্বর:',
    serialNo: 'সিরিয়াল:',
    consultant: 'কনসালট্যান্ট:',
    date: 'তারিখ:',
    timeSlot: 'সময়সূচী:',
    roomNo: 'কক্ষ নং:',

    // Status Badges
    statusPendingText: 'অপেক্ষমান',
    statusConfirmedText: 'নিশ্চিতকৃত',
    statusCancelledText: 'বাতিলকৃত',
  },
  en: {
    // Brand (Strict Enforcement)
    hospitalName: 'Cure Hospital',
    hospitalSub: 'Cure Hospital OPD Care System',
    brandBadge: 'Smart OPD Care',
    brandTagline: 'Modern Healthcare Services',
    copyright: 'Cure Hospital Management System | © 2026 Cure Hospital. All Rights Reserved.',

    // Nav
    patientPortal: 'Patient Dashboard',
    doctorDirectory: 'Doctor Directory',
    assistantDesk: 'Assistant Desk',
    signIn: 'Sign In',
    signOut: 'Logout',
    welcome: 'Welcome',
    staffLoginRequired: 'Staff Login Required',
    staffBadge: 'Authorized Staff',

    // Hero
    heroTitlePrefix: 'Easy Digital Appointments & ',
    heroTitleAccent: 'Expert Healthcare',
    heroSubtitle: 'Choose experienced specialist doctors and easily confirm your appointment in 30-minute dedicated slots.',
    trustBadge1: '✓ Specialized Consultants',
    trustBadge2: '✓ 30-Minute Dedicated Slots',
    heroCtaBook: 'Find Doctors & Book',
    heroCtaTrack: 'Track Status',

    // Specialty Grid
    specialtySectionTitle: 'Which Specialist Doctor Are You Looking For?',
    specialtySectionSub: 'Select a department to browse specialist doctor chambers and 30-minute slots',
    specialistCount: 'Specialist Doctors',
    viewDoctors: 'View Available Doctors',

    // Meditaj-Style Doctor Listing
    allSpecialistsTitle: 'All Specialist Doctors',
    allSpecialistsSub: 'Choose an expert physician and confirm your appointment with dedicated 30-minute slots',
    searchDoctorPlaceholder: 'Search by doctor name or specialty...',
    browseBySpecialty: 'Browse by Specialty',
    resetFilters: 'Reset Filters',
    selectAndBook: 'Select & Book',
    chamberSchedule: 'Chamber Schedule',
    consultationFee: 'Consultation Fee',
    experienceYears: 'years experience',
    room: 'Room',
    ratingLabel: 'Rating',
    noDoctorsFound: 'No doctors match your search or selected filter.',

    // 2-Column Split-Screen Checkout
    backToDoctorList: '← Back to Doctor List',
    step1Date: 'Step 1: Choose Date',
    step1DateSub: 'Only active visiting days of the doctor are selectable',
    step2Slots: 'Step 2: Available Slots (30-min Slots)',
    step2SlotsSub: 'Each slot accommodates a maximum of 1 patient consultation',
    step3Patient: 'Step 3: Patient Information',
    step3PatientSub: 'Enter 11-digit phone to auto-fill existing records',
    selectedDateSlotsFor: 'Available slots for',
    slotBooked: 'Booked / Full',
    slotSelected: 'Selected',
    slotAvailable: 'Available',
    slotFull: 'Slot Full',
    phoneLabel: 'Patient Mobile Number *',
    phoneDigits: '(11 digits)',
    demoOldPatient: 'Demo Old Patient',
    demoNewPatient: 'Demo New Patient',
    phonePlaceholder: 'e.g., 01812345678',
    fullNameLabel: 'Patient Full Name *',
    fullNamePlaceholder: 'e.g., Md. Abdul Karim',
    ageLabel: 'Age *',
    agePlaceholder: 'e.g., 45',
    genderLabel: 'Gender *',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    symptomsLabel: 'Symptoms / Problem Description (Optional)',
    symptomsPlaceholder: 'e.g., fever and severe cough for 3 days...',

    // Right Column: Checkout Summary & Payment
    checkoutSummaryTitle: 'Checkout & Payment Summary',
    appointmentDetails: 'Appointment Details',
    selectedDoctor: 'Selected Doctor',
    selectedDepartment: 'Department',
    selectedSchedule: 'Scheduled Slot',
    chamberRoom: 'Chamber Room',
    feeBreakdown: 'Fee Breakdown',
    consultationFeeLabel: 'Doctor Consultation Fee',
    totalPayable: 'Total Payable',
    paymentMethodTitle: 'Select Payment Method',
    paymentOnline: 'Online Payment Now (MFS)',
    paymentOnlineDesc: 'Pay securely via bKash, Nagad, or Rocket',
    paymentCounter: 'Pay After Visit (Counter)',
    paymentCounterDesc: 'Pay in cash or card at the hospital OPD desk',
    confirmBookingBtn: 'Confirm Appointment',
    confirmingBookingBtn: 'Confirming...',

    // Assistant Desk
    assistantDeskTitle: 'Appointment Approval & Slot Triage',
    assistantDeskSub: 'Verify patient 30-minute slot requests against live chamber schedules.',
    assistantDeskBadge: 'Hospital Assistant & OPD Control Desk',
    vivaDemoReset: 'Reset Demo Data',
    statTotal: 'Total Requests',
    statConfirmed: 'Confirmed',
    statPending: 'Pending',
    statCancelled: 'Cancelled',
    statTotalHint: 'Click to view all',
    statConfirmedHint: 'Token issued list',
    statPendingHint: 'Awaiting review',
    statCancelledHint: 'Slot refunded list',
    tabAll: 'All Requests',
    tabPending: 'Pending',
    tabConfirmed: 'Confirmed',
    tabCancelled: 'Cancelled',
    tabWalkIn: 'Direct Walk-in Booking',
    tabDoctors: 'Doctor Management',
    searchPlaceholder: 'Search by patient name, phone or slot...',
    searchBtn: 'Search',
    confirmAction: 'Confirm',
    cancelAction: 'Cancel',
    printSlipAction: 'Token Slip',
    addDoctorBtn: 'Add New Doctor',
    closeFormBtn: 'Close Form',
    emptyPending: 'No pending requests',
    emptyConfirmed: 'No confirmed requests',
    emptyCancelled: 'No cancelled requests',
    emptyAll: 'No appointment records found',
    tablePatient: 'Patient Details',
    tableDoctor: 'Doctor & Department',
    tableDateSlot: 'Date & 30-Min Time Slot',
    tablePayment: 'Payment Status',
    tableStatus: 'Status',
    tableActions: 'Actions',
    tokenLabel: 'Token',
    paidOnlineBadge: 'Paid Online',
    payCounterBadge: 'Pay at Counter',

    // Tracker
    trackerTitle: 'Patient Appointment Status & Digital Slip',
    trackerSub: 'Search with your 11-digit mobile number to view live request status and print your digital token slip.',
    trackerPhoneLabel: 'Patient Mobile Number',
    trackBtn: 'Search Status',
    searchingBtn: 'Searching...',
    noRecordsFound: 'No appointments found',
    trackerDemoHint: 'Click 01812345678 to track demo patient',
    tokenIssued: 'Token ID:',
    serialNo: 'Serial:',
    consultant: 'Consultant:',
    date: 'Date:',
    timeSlot: 'Time Slot:',
    roomNo: 'Room No:',

    // Status Badges
    statusPendingText: 'Pending',
    statusConfirmedText: 'Confirmed',
    statusCancelledText: 'Cancelled',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('cure_lang') || 'bn';
  });

  useEffect(() => {
    localStorage.setItem('cure_lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations['bn']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
