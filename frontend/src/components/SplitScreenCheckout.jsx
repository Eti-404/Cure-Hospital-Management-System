import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  UserCheck, 
  UserPlus, 
  Search, 
  ChevronRight, 
  ShieldCheck, 
  Star, 
  Home
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import MfsPaymentModal from './MfsPaymentModal';

// Helper to convert day name to 3-char abbreviation
const DAY_MAP = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

const DAY_NAMES_BN = {
  'Sat': 'শনিবার',
  'Sun': 'রবিবার',
  'Mon': 'সোমবার',
  'Tue': 'মঙ্গলবার',
  'Wed': 'বুধবার',
  'Thu': 'বৃহস্পতিবার',
  'Fri': 'শুক্রবার',
};

export default function SplitScreenCheckout({ 
  doctor, 
  patientUser, 
  onBack, 
  onBookingSuccess,
  onGoHome,
  onGoToDoctors
}) {
  const { lang, t } = useLanguage();

  // Helper: Generate next 14 valid session dates for this doctor
  const validUpcomingDates = useMemo(() => {
    if (!doctor) return [];
    const allowedDays = doctor.schedule_days || ['Sat', 'Mon', 'Wed'];
    const isEveryday = allowedDays.includes('Everyday');

    const dates = [];
    const cursor = new Date();

    for (let i = 0; i < 30 && dates.length < 12; i++) {
      const d = new Date();
      d.setDate(cursor.getDate() + i);

      const dayCode = DAY_MAP[d.getDay()];
      if (isEveryday || allowedDays.includes(dayCode)) {
        const isoDate = d.toISOString().split('T')[0];
        const dayLabelBn = DAY_NAMES_BN[dayCode] || dayCode;
        const formattedDisplay = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
          day: 'numeric',
          month: 'short',
        });

        dates.push({
          isoDate,
          dayCode,
          dayLabelBn,
          formattedDisplay,
        });
      }
    }

    return dates;
  }, [doctor, lang]);

  // Step 1: Selected Date (defaults to first valid upcoming date)
  const [selectedDate, setSelectedDate] = useState(() => {
    return validUpcomingDates.length > 0 ? validUpcomingDates[0].isoDate : new Date().toISOString().split('T')[0];
  });

  // Step 2: 30-Minute Slots
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Step 3: Patient Info Form
  const [phone, setPhone] = useState(patientUser ? patientUser.phone : '');
  const [fullName, setFullName] = useState(patientUser ? patientUser.name : '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [symptoms, setSymptoms] = useState('');

  // Lookup state
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [patientStatus, setPatientStatus] = useState(patientUser ? 'existing' : null);
  const [lookupMessage, setLookupMessage] = useState('');
  const [autoFillTriggered, setAutoFillTriggered] = useState(false);
  const lookupTimeoutRef = useRef(null);

  // Right Column: Payment options
  const [paymentOption, setPaymentOption] = useState('counter'); // 'counter' | 'online'
  const [isMfsModalOpen, setIsMfsModalOpen] = useState(false);
  const [onlinePaymentData, setOnlinePaymentData] = useState(null); // stores { trx_id, provider }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-fill from patientUser session
  useEffect(() => {
    if (patientUser) {
      if (patientUser.phone) setPhone(patientUser.phone);
      if (patientUser.name) setFullName(patientUser.name);
      setPatientStatus('existing');
    }
  }, [patientUser]);

  // Load 30-minute slots when doctor or date changes
  useEffect(() => {
    if (!doctor || !selectedDate) return;

    let isMounted = true;
    setIsLoadingSlots(true);

    api.getDoctorSlots(doctor.id, selectedDate)
      .then((res) => {
        if (!isMounted) return;
        setIsLoadingSlots(false);
        const slotList = res.data || [];
        setSlots(slotList);

        // Auto-select first available slot
        const firstAvailable = slotList.find((s) => !s.is_booked);
        if (firstAvailable) {
          setSelectedSlot(firstAvailable.time_slot);
        } else {
          setSelectedSlot('');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor, selectedDate]);

  // Phone lookup handler
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPhone(val);

    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);

    if (val.length < 11) {
      setPatientStatus(null);
      setLookupMessage('');
      setAutoFillTriggered(false);
      return;
    }

    if (val.length === 11) {
      setIsLookingUp(true);
      setLookupMessage(lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...');

      lookupTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.lookupPatient(val);
          setIsLookingUp(false);

          if (res.found && res.data) {
            setPatientStatus('existing');
            setFullName(res.data.full_name || '');
            if (res.data.age) setAge(res.data.age.toString());
            if (res.data.gender) setGender(res.data.gender);
            setLookupMessage(
              lang === 'bn'
                ? `পুরাতন রোগী সনাক্ত: ${res.data.full_name} (${res.data.gender === 'Female' ? 'মহিলা' : 'পুরুষ'}, বয়স: ${res.data.age})`
                : `Existing patient loaded: ${res.data.full_name} (${res.data.gender}, Age: ${res.data.age})`
            );
            setAutoFillTriggered(true);
            setTimeout(() => setAutoFillTriggered(false), 2500);
          } else {
            setPatientStatus('new');
            setLookupMessage(
              lang === 'bn'
                ? 'নতুন রোগী: দয়া করে আপনার পূর্ণ নাম, বয়স ও লিঙ্গ প্রদান করুন।'
                : 'New patient: Please enter full name, age and gender.'
            );
            setAutoFillTriggered(false);
          }
        } catch (err) {
          setIsLookingUp(false);
          setPatientStatus('new');
        }
      }, 350);
    }
  };

  // Demo Quick-Fill Pill 1: "পুরাতন রোগী ডেমো" (01812345678)
  const handleQuickFillExisting = async () => {
    const demoNum = '01812345678';
    setPhone(demoNum);
    setIsLookingUp(true);
    setLookupMessage(lang === 'bn' ? 'তথ্য লোড হচ্ছে...' : 'Loading...');

    try {
      const res = await api.lookupPatient(demoNum);
      setIsLookingUp(false);
      if (res.found && res.data) {
        setPatientStatus('existing');
        setFullName(res.data.full_name || 'মো. আব্দুল করিম');
        setAge(res.data.age ? res.data.age.toString() : '48');
        setGender(res.data.gender || 'Male');
        setLookupMessage(
          lang === 'bn'
            ? `পুরাতন রোগী সনাক্ত: ${res.data.full_name} (অটো-ফিল সম্পন্ন)`
            : `Existing patient loaded: ${res.data.full_name} (Auto-filled)`
        );
        setAutoFillTriggered(true);
        setTimeout(() => setAutoFillTriggered(false), 2000);
      }
    } catch {
      setIsLookingUp(false);
      setFullName('মো. আব্দুল করিম');
      setAge('48');
      setGender('Male');
      setPatientStatus('existing');
    }
  };

  // Demo Quick-Fill Pill 2: "নতুন রোগী ডেমো"
  const handleQuickFillNew = () => {
    const freshSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const freshPhone = `013${freshSuffix}`;
    setPhone(freshPhone);
    setFullName('');
    setAge('');
    setGender('Male');
    setSymptoms('');
    setPatientStatus('new');
    setLookupMessage(
      lang === 'bn'
        ? 'নতুন রোগী: পূর্ণ নাম ও বয়স পূরণ করুন।'
        : 'New patient: Enter your full name and age.'
    );
    setAutoFillTriggered(false);
  };

  // Execute actual appointment submission
  const executeFinalBooking = async (paymentDetails = null) => {
    setSubmitError('');

    if (!phone || phone.length < 11) {
      setSubmitError(lang === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' : 'Enter a valid 11-digit phone number.');
      return;
    }
    if (!fullName.trim()) {
      setSubmitError(lang === 'bn' ? 'রোগীর পূর্ণ নাম প্রদান করুন।' : 'Enter patient full name.');
      return;
    }
    if (!selectedSlot) {
      setSubmitError(lang === 'bn' ? 'দয়া করে একটি ৩০ মিনিটের সময়সূচী (স্লট) নির্বাচন করুন।' : 'Please choose a 30-minute time slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        phone: phone.trim(),
        full_name: fullName.trim(),
        age: parseInt(age, 10) || 30,
        gender,
        doctor_id: doctor.id,
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        payment_method: paymentDetails ? 'ONLINE_MFS' : 'PAY_AT_COUNTER',
        payment_status: paymentDetails ? 'PAID_ONLINE' : 'PENDING_COUNTER',
        consultation_fee: doctor.fee || 800,
        symptoms: symptoms || (lang === 'bn' ? 'নিয়মিত ওপিডি স্বাস্থ্য পরীক্ষা' : 'Regular OPD checkup'),
      };

      const res = await api.createAppointment(payload);
      setIsSubmitting(false);

      if (res.success && res.data) {
        // Broadcast real-time sync event
        window.dispatchEvent(
          new CustomEvent('cure_appointment_synced', {
            detail: {
              action: 'ONLINE_REQUESTED',
              appointment: res.data,
              phone: phone.trim(),
            },
          })
        );
        onBookingSuccess(res.data, phone.trim());
      } else {
        setSubmitError(res.message || (lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট বুক করতে ব্যর্থ হয়েছে।' : 'Failed to book appointment.'));
      }
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message || (lang === 'bn' ? 'সার্ভার যোগাযোগে সমস্যা হয়েছে।' : 'Server communication error.'));
    }
  };

  // Triggered when user clicks main "Confirm Appointment" button
  const handlePrimaryConfirmClick = (e) => {
    e.preventDefault();
    if (paymentOption === 'online' && !onlinePaymentData) {
      // Open MFS simulated gateway modal
      setIsMfsModalOpen(true);
    } else {
      executeFinalBooking(onlinePaymentData);
    }
  };

  // Callback when MFS payment modal finishes
  const handleMfsSuccess = (paymentResult) => {
    setIsMfsModalOpen(false);
    setOnlinePaymentData(paymentResult);
    executeFinalBooking(paymentResult);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Top Bar: Breadcrumb & Back to Doctor List Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/70">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <button
            type="button"
            onClick={onGoHome || onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-teal-700 font-semibold transition-colors cursor-pointer group"
          >
            <Home className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <button
            type="button"
            onClick={onGoToDoctors || onBack}
            className="text-slate-600 hover:text-teal-700 font-semibold transition-colors cursor-pointer"
          >
            {lang === 'bn' ? 'বিশেষজ্ঞ ডাক্তারগণ' : 'Specialist Doctors'}
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-900 font-bold">
            {lang === 'bn' ? 'বুকিং ও চেকআউট' : 'Booking & Checkout'}
          </span>
        </nav>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToDoctorList')}</span>
        </button>
      </div>

      {/* 2-COLUMN SPLIT-SCREEN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: SCHEDULE & PATIENT INFO (lg:col-span-7)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Doctor Bio Summary Card */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl shrink-0 border border-teal-200 shadow-2xs">
              <Stethoscope className="w-8 h-8 stroke-[2]" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                  {doctor.department}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{doctor.rating || 4.9}</span>
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                {doctor.name}
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                {doctor.degree} • {doctor.designation}
              </p>
              <div className="pt-1 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('room')}: {doctor.room_no}</span>
                </span>
                <span>•</span>
                <span>{lang === 'bn' ? `ভিজিটিং: ${doctor.schedule_days_bn}` : `Days: ${doctor.schedule_days?.join(', ')}`}</span>
              </div>
            </div>
          </div>

          {/* 2. STEP 1: CHOOSE DATE (Valid Visiting Days Only) */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-[16px] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>{t('step1Date')}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('step1DateSub')} ({lang === 'bn' ? doctor.schedule_days_bn : doctor.schedule_days?.join(', ')})
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-teal-50 text-teal-800 rounded-md">
                {selectedDate}
              </span>
            </div>

            {/* Clickable Valid Upcoming Dates Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {validUpcomingDates.map((item) => {
                const isSelected = selectedDate === item.isoDate;
                return (
                  <button
                    key={item.isoDate}
                    type="button"
                    onClick={() => setSelectedDate(item.isoDate)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold block opacity-90">
                      {item.dayLabelBn}
                    </span>
                    <span className="text-sm font-extrabold block mt-0.5">
                      {item.formattedDisplay}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. STEP 2: AVAILABLE 30-MIN SLOTS */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-[16px] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>{t('step2Slots')}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('step2SlotsSub')}
                </p>
              </div>

              {selectedSlot && (
                <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-900 rounded-lg border border-teal-200">
                  {selectedSlot}
                </span>
              )}
            </div>

            {isLoadingSlots ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500">{lang === 'bn' ? 'স্লট লোড হচ্ছে...' : 'Loading slots...'}</p>
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                {lang === 'bn' ? 'এই তারিখে কোনো স্লট পাওয়া যায়নি।' : 'No slots available for this date.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {slots.map((s) => {
                  const isSelected = selectedSlot === s.time_slot;
                  const isBooked = s.is_booked;

                  return (
                    <button
                      key={s.time_slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(s.time_slot)}
                      className={`p-3 rounded-xl border text-center transition-all relative ${
                        isBooked
                          ? 'bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed opacity-80 select-none'
                          : isSelected
                          ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-md ring-2 ring-teal-500/30 scale-[1.02] cursor-pointer'
                          : 'bg-white hover:bg-teal-50/60 border-teal-200/90 hover:border-teal-500 text-slate-800 font-bold cursor-pointer'
                      }`}
                    >
                      <span className={`text-[12px] font-mono block ${isBooked ? 'line-through text-slate-400' : isSelected ? 'text-white font-bold' : 'text-slate-800'}`}>
                        {s.time_slot}
                      </span>
                      {isBooked ? (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80 no-underline">
                          {lang === 'bn' ? 'স্লট পূর্ণ' : 'Slot Full'}
                        </span>
                      ) : isSelected ? (
                        <span className="text-[11px] block mt-1 font-bold text-teal-100">
                          {lang === 'bn' ? '✓ নির্বাচিত' : '✓ Selected'}
                        </span>
                      ) : (
                        <span className="text-[11px] block mt-1 font-semibold text-teal-700">
                          {lang === 'bn' ? 'খালি আছে' : 'Available'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. STEP 3: PATIENT INFORMATION FORM */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-[16px] flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>{t('step3Patient')}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('step3PatientSub')}
                </p>
              </div>

              {/* DEMO QUICK-FILL PILLS */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleQuickFillExisting}
                  className="text-xs font-bold px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="01812345678"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('demoOldPatient')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickFillNew}
                  className="text-xs font-bold px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('demoNewPatient')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Phone Input with instant lookup */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-semibold text-slate-700">
                  {t('phoneLabel')} <span className="text-slate-400 font-normal">{t('phoneDigits')}</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={11}
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder={t('phonePlaceholder')}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none font-mono text-[15px]"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    {isLookingUp ? (
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : patientStatus === 'existing' ? (
                      <UserCheck className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {lookupMessage && (
                  <p className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 ${
                    patientStatus === 'existing' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{lookupMessage}</span>
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-semibold text-slate-700">
                  {t('fullNameLabel')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className={`w-full px-4 py-3 rounded-xl border text-[15px] outline-none transition-all ${
                    autoFillTriggered
                      ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/20'
                      : 'border-slate-200 focus:border-teal-500'
                  }`}
                  required
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {t('ageLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t('agePlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {t('genderLabel')}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px] bg-white"
                  >
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>
              </div>

              {/* Problem / Symptoms */}
              <div className="space-y-1.5">
                <label className="block text-[14px] font-semibold text-slate-700">
                  {t('symptomsLabel')}
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t('symptomsPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px]"
                ></textarea>
              </div>

            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: CHECKOUT SUMMARY & PAYMENT (lg:col-span-5)  */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 space-y-6">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-teal-700">
                {t('checkoutSummaryTitle')}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {t('appointmentDetails')}
              </h3>
            </div>

            {/* Selected Booking Specs */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('selectedDoctor')}:</span>
                <span className="font-bold text-slate-900 text-right">{doctor.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('selectedDepartment')}:</span>
                <span className="font-semibold text-teal-800 text-right">{doctor.department}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium">{t('selectedSchedule')}:</span>
                <span className="font-bold text-slate-900 text-right">
                  {selectedDate} • {selectedSlot || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('chamberRoom')}:</span>
                <span className="font-semibold text-slate-800">{doctor.room_no}</span>
              </div>
            </div>

            {/* Fee Breakdown (Strict Consultation Fee & Total Only, No Extra Charges) */}
            <div className="space-y-3 border-t border-b border-slate-100 py-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">{t('consultationFeeLabel')}</span>
                <span className="font-bold text-slate-900 text-[15px]">৳{doctor.fee || 800}</span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-base">
                <span className="font-extrabold text-slate-900">{t('totalPayable')}</span>
                <span className="text-2xl font-black text-teal-700">৳{doctor.fee || 800}</span>
              </div>
            </div>

            {/* Payment Options (Option 1: Online MFS vs Option 2: Pay at Counter) */}
            <div className="space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('paymentMethodTitle')}
              </span>

              {/* Option 1: Online MFS (bKash/Nagad/Rocket) */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentOption === 'online'
                    ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentOption === 'online'}
                  onChange={() => setPaymentOption('online')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {t('paymentOnline')}
                    </span>
                    <span className="text-[10px] font-bold bg-[#e2136e] text-white px-1.5 py-0.5 rounded">bKash</span>
                    <span className="text-[10px] font-bold bg-[#f7941d] text-white px-1.5 py-0.5 rounded">Nagad</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t('paymentOnlineDesc')}
                  </p>
                  {onlinePaymentData && (
                    <span className="inline-block text-[11px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded mt-1">
                      ✓ Trx: {onlinePaymentData.trx_id}
                    </span>
                  )}
                </div>
              </label>

              {/* Option 2: Pay After Visit / Counter */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentOption === 'counter'
                    ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentOption === 'counter'}
                  onChange={() => setPaymentOption('counter')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm">
                    {t('paymentCounter')}
                  </span>
                  <p className="text-xs text-slate-500">
                    {t('paymentCounterDesc')}
                  </p>
                </div>
              </label>

            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Confirm & Submit Action Button */}
            <button
              type="button"
              disabled={isSubmitting || !selectedSlot}
              onClick={handlePrimaryConfirmClick}
              className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[16px] shadow-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('confirmingBookingBtn')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  <span>
                    {paymentOption === 'online' && !onlinePaymentData
                      ? (lang === 'bn' ? `অনলাইন পেমেন্ট করুন ও নিশ্চিত করুন (৳${doctor.fee || 800})` : `Pay ৳${doctor.fee || 800} & Confirm`)
                      : t('confirmBookingBtn')}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="notranslate" translate="no">Cure Hospital Verified OPD Reservation</span>
            </div>

          </div>
        </div>

      </div>

      {/* Simulated MFS Payment Modal */}
      <MfsPaymentModal
        isOpen={isMfsModalOpen}
        onClose={() => setIsMfsModalOpen(false)}
        amount={doctor.fee || 800}
        doctorName={doctor.name}
        onPaymentSuccess={handleMfsSuccess}
      />

    </div>
  );
}
