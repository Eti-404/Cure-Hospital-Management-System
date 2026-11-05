import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Printer, 
  Calendar, 
  Phone, 
  Stethoscope, 
  RefreshCw,
  Check, 
  X,
  ListFilter,
  Inbox,
  UserPlus,
  Trash2,
  Plus,
  UserCheck,
  LogOut,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const SPECIALTY_OPTIONS = [
  'মেডিসিন বিভাগ (General Medicine)',
  'হৃদরোগ বিভাগ (Cardiology)',
  'শিশু বিভাগ (Pediatrics)',
  'নাক-কান-গলা (ENT)',
  'গাইনী ও প্রসূতি (Gynecology)',
  'অর্থোপেডিক (Orthopedics)',
  'চর্ম ও এলার্জি (Dermatology)',
  'চক্ষু বিভাগ (Ophthalmology)',
];

const STANDARD_SLOTS = [
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '12:00 PM - 12:30 PM',
  '12:30 PM - 01:00 PM',
  '01:00 PM - 01:30 PM',
  '01:30 PM - 02:00 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
];

export default function AssistantDesk({ 
  doctors, 
  onRefreshDoctors, 
  onSelectSlipForPrint,
  showToast,
  assistantUser,
  onAssistantLogout
}) {
  const { lang, t } = useLanguage();
  const todayStr = new Date().toISOString().split('T')[0];

  // Tab states: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WALKIN' | 'DOCTORS'
  const [activeTab, setActiveTab] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Doctor Management State
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [newDoctorData, setNewDoctorData] = useState({
    name: '',
    department: 'মেডিসিন বিভাগ (General Medicine)',
    designation: 'কনসালট্যান্ট স্পেশালিস্ট',
    degree: 'MBBS, FCPS',
    experience: '৮ বছরের অভিজ্ঞতা',
    room_no: 'Room 201',
    fee: 800,
    available_slots: 8,
  });
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

  // Walk-in Direct Booking State
  const [walkInForm, setWalkInForm] = useState({
    phone: '',
    full_name: '',
    age: '',
    gender: 'Male',
    doctor_id: doctors.length > 0 ? doctors[0].id : '',
    appointment_date: todayStr,
    time_slot: '11:00 AM - 11:30 AM',
    symptoms: 'ডেস্কে সরাসরি ওপিডি পরামর্শ (Walk-in)',
  });
  const [walkInLookingUp, setWalkInLookingUp] = useState(false);
  const [walkInLookupMessage, setWalkInLookupMessage] = useState('');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const walkInTimeoutRef = useRef(null);

  // Load appointments
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAppointments({
        status: (activeTab === 'DOCTORS' || activeTab === 'WALKIN') ? 'ALL' : activeTab,
        search: searchQuery,
      });
      setAppointments(res.data || []);
      if (res.stats) setStats(res.stats);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAppointments();
  };

  // 1-Click Confirmation Action
  const handleConfirm = async (apt) => {
    setActionInProgressId(apt.id);
    try {
      const res = await api.confirmAppointment(apt.id);
      setActionInProgressId(null);
      showToast(res.message || (lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট সফলভাবে নিশ্চিত করা হয়েছে!' : 'Appointment confirmed successfully!'), 'success');
      
      const confirmedApt = res.appointment || { ...apt, status: 'CONFIRMED' };
      // Broadcast real-time sync event across all tabs & tracker
      window.dispatchEvent(
        new CustomEvent('cure_appointment_synced', {
          detail: {
            action: 'CONFIRMED',
            appointment: confirmedApt,
            phone: apt.patient?.phone || apt.phone,
          },
        })
      );

      fetchAppointments();
      if (onRefreshDoctors) onRefreshDoctors();
    } catch (err) {
      setActionInProgressId(null);
      showToast(err.message || (lang === 'bn' ? 'কনফার্ম করতে ব্যর্থ হয়েছে।' : 'Failed to confirm appointment.'), 'error');
    }
  };

  // 1-Click Cancellation Action
  const handleCancel = async (apt) => {
    const confirmMsg = lang === 'bn'
      ? `আপনি কি নিশ্চিত যে ${apt.patient?.full_name}-এর অ্যাপয়েন্টমেন্ট বাতিল করতে চান?${apt.status === 'CONFIRMED' ? ' (ডাক্তারের স্লট ১ বৃদ্ধি পাবে)' : ''}`
      : `Are you sure you want to cancel appointment for ${apt.patient?.full_name}?${apt.status === 'CONFIRMED' ? ' (Doctor slot will increment by 1)' : ''}`;

    const confirmCancel = window.confirm(confirmMsg);
    if (!confirmCancel) return;

    setActionInProgressId(apt.id);
    try {
      const res = await api.cancelAppointment(apt.id, 'সহকারী কর্তৃক বাতিলকৃত');
      setActionInProgressId(null);
      
      const wasPaidOnline = apt.payment_status === 'PAID_ONLINE' || apt.payment_method === 'ONLINE_MFS';
      const isRefunded = res.refundProcessed || (res.appointment && res.appointment.payment_status === 'REFUNDED') || wasPaidOnline;
      const refundAmt = res.refundAmount || (res.appointment && res.appointment.refund_amount) || apt.consultation_fee || 800;

      const toastMessage = isRefunded
        ? (lang === 'bn' ? `অ্যাপয়েন্টমেন্ট বাতিল ও অনলাইন ফি ৳${refundAmt} রিফান্ড প্রসেস করা হয়েছে!` : `Appointment cancelled & ৳${refundAmt} refund processed!`)
        : (res.message || (lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে।' : 'Appointment cancelled successfully.'));

      showToast(toastMessage, isRefunded ? 'info' : 'warning');
      
      const cancelledApt = res.appointment || { 
        ...apt, 
        status: 'CANCELLED', 
        payment_status: isRefunded ? 'REFUNDED' : apt.payment_status,
        refund_amount: isRefunded ? refundAmt : 0,
        refund_processed: isRefunded
      };

      // Broadcast real-time sync event across all tabs & tracker
      window.dispatchEvent(
        new CustomEvent('cure_appointment_synced', {
          detail: {
            action: 'CANCELLED',
            appointment: cancelledApt,
            phone: apt.patient?.phone || apt.phone,
          },
        })
      );

      fetchAppointments();
      if (onRefreshDoctors) onRefreshDoctors();
    } catch (err) {
      setActionInProgressId(null);
      showToast(err.message || (lang === 'bn' ? 'বাতিল করতে ব্যর্থ হয়েছে।' : 'Failed to cancel appointment.'), 'error');
    }
  };

  // Doctor Management: Add Doctor Submit
  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctorData.name.trim()) {
      showToast(lang === 'bn' ? 'ডাক্তারের নাম প্রদান করুন।' : 'Please enter doctor name.', 'error');
      return;
    }
    setIsSubmittingDoctor(true);
    try {
      await api.addDoctor(newDoctorData);
      setIsSubmittingDoctor(false);
      setIsAddingDoctor(false);
      setNewDoctorData({
        name: '',
        department: 'মেডিসিন বিভাগ (General Medicine)',
        designation: 'কনসালট্যান্ট স্পেশালিস্ট',
        degree: 'MBBS, FCPS',
        experience: '৮ বছরের অভিজ্ঞতা',
        room_no: 'Room 201',
        fee: 800,
        available_slots: 8,
      });
      showToast(lang === 'bn' ? 'নতুন ডাক্তার সফলভাবে যুক্ত করা হয়েছে!' : 'New doctor added successfully!', 'success');
      if (onRefreshDoctors) onRefreshDoctors();
    } catch (err) {
      setIsSubmittingDoctor(false);
      showToast(err.message || (lang === 'bn' ? 'ডাক্তার যোগ করতে ব্যর্থ হয়েছে।' : 'Failed to add doctor.'), 'error');
    }
  };

  // Doctor Management: Delete Doctor
  const handleDeleteDoctor = async (docId, docName) => {
    const ok = window.confirm(
      lang === 'bn' ? `আপনি কি নিশ্চিত যে "${docName}" কে অপসারণ করতে চান?` : `Are you sure you want to remove "${docName}"?`
    );
    if (!ok) return;

    try {
      await api.deleteDoctor(docId);
      showToast(lang === 'bn' ? `${docName} সফলভাবে অপসারণ করা হয়েছে।` : `${docName} removed successfully.`, 'success');
      if (onRefreshDoctors) onRefreshDoctors();
    } catch (err) {
      showToast(err.message || (lang === 'bn' ? 'ডাক্তার অপসারণ ব্যর্থ হয়েছে।' : 'Failed to remove doctor.'), 'error');
    }
  };

  // Walk-in Phone Auto Lookup
  const handleWalkInPhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setWalkInForm((prev) => ({ ...prev, phone: val }));

    if (walkInTimeoutRef.current) clearTimeout(walkInTimeoutRef.current);

    if (val.length === 11) {
      setWalkInLookingUp(true);
      setWalkInLookupMessage(lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...');

      walkInTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.lookupPatient(val);
          setWalkInLookingUp(false);
          if (res.found && res.data) {
            setWalkInForm((prev) => ({
              ...prev,
              full_name: res.data.full_name || '',
              age: res.data.age ? res.data.age.toString() : '',
              gender: res.data.gender || 'Male',
            }));
            setWalkInLookupMessage(
              lang === 'bn'
                ? `পুরাতন রোগী: ${res.data.full_name} (${res.data.age} বছর)`
                : `Existing patient: ${res.data.full_name} (${res.data.age} yrs)`
            );
          } else {
            setWalkInLookupMessage(lang === 'bn' ? 'নতুন রোগী' : 'New patient');
          }
        } catch {
          setWalkInLookingUp(false);
        }
      }, 350);
    } else {
      setWalkInLookupMessage('');
    }
  };

  // Walk-in Submit
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInForm.phone || walkInForm.phone.length < 11) {
      showToast(lang === 'bn' ? 'সঠিক ১১ ডিজিট মোবাইল নম্বর দিন।' : 'Enter a valid 11-digit phone number.', 'error');
      return;
    }
    if (!walkInForm.full_name.trim()) {
      showToast(lang === 'bn' ? 'রোগীর নাম প্রদান করুন।' : 'Enter patient name.', 'error');
      return;
    }
    if (!walkInForm.doctor_id) {
      showToast(lang === 'bn' ? 'ডাক্তার নির্বাচন করুন।' : 'Select a doctor.', 'error');
      return;
    }

    setIsSubmittingWalkIn(true);
    try {
      const res = await api.createWalkInAppointment({
        ...walkInForm,
        age: parseInt(walkInForm.age, 10) || 30,
      });
      setIsSubmittingWalkIn(false);
      showToast(lang === 'bn' ? 'সরাসরি ওয়াক-ইন অ্যাপয়েন্টমেন্ট কনফার্ম ও টোকেন ইস্যু সম্পন্ন!' : 'Direct walk-in appointment confirmed and token issued!', 'success');
      
      const createdApt = res.appointment;
      // Broadcast real-time sync event across all tabs & tracker
      window.dispatchEvent(
        new CustomEvent('cure_appointment_synced', {
          detail: {
            action: 'WALKIN_CREATED',
            appointment: createdApt,
            phone: walkInForm.phone,
          },
        })
      );

      const savedPhone = walkInForm.phone;

      // Clear form
      setWalkInForm({
        phone: '',
        full_name: '',
        age: '',
        gender: 'Male',
        doctor_id: doctors.length > 0 ? doctors[0].id : '',
        appointment_date: todayStr,
        time_slot: '11:00 AM - 11:30 AM',
        symptoms: 'ডেস্কে সরাসরি ওপিডি পরামর্শ (Walk-in)',
      });
      setWalkInLookupMessage('');

      fetchAppointments();
      if (onRefreshDoctors) onRefreshDoctors();

      if (res.appointment && onSelectSlipForPrint) {
        onSelectSlipForPrint(res.appointment);
      }
    } catch (err) {
      setIsSubmittingWalkIn(false);
      showToast(err.message || (lang === 'bn' ? 'সরাসরি বুকিং ব্যর্থ হয়েছে।' : 'Direct booking failed.'), 'error');
    }
  };

  // Dynamic Empty State Messages
  const getEmptyStateContent = () => {
    switch (activeTab) {
      case 'PENDING':
        return {
          title: t('emptyPending'),
          subtitle: lang === 'bn' ? 'বর্তমানে অনুমোদনের জন্য কোনো রোগী অপেক্ষায় নেই।' : 'No patients currently waiting for approval.',
          icon: <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />,
        };
      case 'CONFIRMED':
        return {
          title: t('emptyConfirmed'),
          subtitle: lang === 'bn' ? 'অপেক্ষমান অনুরোধ যাচাই করে "কনফার্ম" করুন।' : 'Confirm pending requests to populate this list.',
          icon: <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-3" />,
        };
      case 'CANCELLED':
        return {
          title: t('emptyCancelled'),
          subtitle: lang === 'bn' ? 'বর্তমানে কোনো বাতিলকৃত অ্যাপয়েন্টমেন্টের রেকর্ড নেই।' : 'No cancelled appointments on record.',
          icon: <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />,
        };
      case 'ALL':
      default:
        return {
          title: t('emptyAll'),
          subtitle: lang === 'bn' ? 'রোগী পোর্টাল থেকে নতুন অনুরোধ জমা দিলে এখানে প্রদর্শিত হবে।' : 'New patient bookings will appear here.',
          icon: <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />,
        };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">

      {/* Staff Identity & Session Banner */}
      {assistantUser && (
        <div className="bg-teal-800 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-teal-700">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-teal-300 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[16px] text-white tracking-tight">
                  {assistantUser.name}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-700/80 text-teal-200 text-xs font-bold border border-teal-600">
                  {t('staffBadge')}
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-0.5">
                {assistantUser.email || 'assistant@cure.com'} • <span className="notranslate" translate="no">{t('assistantDeskBadge')}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAssistantLogout}
            className="px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      )}
      
      {/* 4 TOP STATUS STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. মোট আবেদন (Total) */}
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`bg-white rounded-2xl p-3.5 sm:p-5 border text-left transition-all duration-200 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ${
            activeTab === 'ALL'
              ? 'border-slate-800 ring-2 ring-slate-800/10 bg-slate-50/50 -translate-y-0.5'
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-[14px] text-slate-500 font-bold">{t('statTotal')}</span>
            <ListFilter className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">{stats.total}</span>
          <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium mt-1 block truncate">{t('statTotalHint')}</span>
        </button>

        {/* 2. নিশ্চিতকৃত (Confirmed) */}
        <button
          type="button"
          onClick={() => setActiveTab('CONFIRMED')}
          className={`bg-white rounded-2xl p-3.5 sm:p-5 border text-left transition-all duration-200 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ${
            activeTab === 'CONFIRMED'
              ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/30 -translate-y-0.5'
              : 'border-slate-200/80 hover:border-teal-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-[14px] text-teal-800 font-bold">{t('statConfirmed')}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-teal-600 block">{stats.confirmed}</span>
          <span className="text-[11px] sm:text-[12px] text-teal-700/80 font-medium mt-1 block truncate">{t('statConfirmedHint')}</span>
        </button>

        {/* 3. অপেক্ষমান (Pending) */}
        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          className={`bg-white rounded-2xl p-3.5 sm:p-5 border text-left transition-all duration-200 cursor-pointer relative shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ${
            activeTab === 'PENDING'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30 -translate-y-0.5'
              : 'border-slate-200/80 hover:border-amber-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-[14px] text-amber-800 font-bold">{t('statPending')}</span>
            {stats.pending > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 block">{stats.pending}</span>
          <span className="text-[11px] sm:text-[12px] text-amber-700/80 font-medium mt-1 block truncate">{t('statPendingHint')}</span>
        </button>

        {/* 4. বাতিলকৃত (Cancelled) */}
        <button
          type="button"
          onClick={() => setActiveTab('CANCELLED')}
          className={`bg-white rounded-2xl p-3.5 sm:p-5 border text-left transition-all duration-200 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ${
            activeTab === 'CANCELLED'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 -translate-y-0.5'
              : 'border-slate-200/80 hover:border-rose-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-[14px] text-rose-800 font-bold">{t('statCancelled')}</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 block">{stats.cancelled}</span>
          <span className="text-[11px] sm:text-[12px] text-rose-700/80 font-medium mt-1 block truncate">{t('statCancelledHint')}</span>
        </button>

      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap pb-1 max-w-full">
          
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[14px] font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('tabAll')}</span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
              activeTab === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[14px] font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'PENDING'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            <span>{t('tabPending')}</span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
              activeTab === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {stats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CONFIRMED')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[14px] font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'CONFIRMED'
                ? 'bg-teal-100 text-teal-900 border border-teal-300 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
            <span>{t('tabConfirmed')}</span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
              activeTab === 'CONFIRMED' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {stats.confirmed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CANCELLED')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[14px] font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'CANCELLED'
                ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            <span>{t('tabCancelled')}</span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
              activeTab === 'CANCELLED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {stats.cancelled}
            </span>
          </button>

          {/* Walk-in Booking Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('WALKIN')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[14px] font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'WALKIN'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-teal-800 border border-teal-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
            <span>{t('tabWalkIn')}</span>
          </button>

          {/* Doctor Management Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('DOCTORS')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[14px] font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'DOCTORS'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-teal-800 border border-teal-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
            <span>{t('tabDoctors')} ({doctors.length})</span>
          </button>

        </div>

        {/* Filter and Search Bar */}
        {(activeTab === 'ALL' || activeTab === 'PENDING' || activeTab === 'CONFIRMED' || activeTab === 'CANCELLED') && (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-xs sm:text-[15px] text-slate-800 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <button
              type="submit"
              className="px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-[14px] font-semibold transition-colors cursor-pointer shrink-0"
            >
              {t('searchBtn')}
            </button>

            <button
              type="button"
              onClick={fetchAppointments}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </form>
        )}

      </div>

      {/* VIEW 1: WALK-IN DESK DIRECT APPOINTMENT BOOKING */}
      {activeTab === 'WALKIN' && (
        <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-8 animate-fade-in">
          
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                <UserCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight">
                  {lang === 'bn' ? 'ডেস্কে সরাসরি ওপিডি বুকিং ও ৩০ মিনিট স্লট ইস্যু' : 'Direct OPD Walk-in Booking & 30-Min Slot Issuance'}
                </h3>
                <p className="text-[14px] text-slate-500 mt-0.5">
                  {lang === 'bn' ? 'রোগী সরাসরি হাসপাতালে উপস্থিত হলে ডেস্ক থেকে দ্রুত এন্ট্রি দিন এবং ডিজিটাল টোকেন স্লিপ প্রিন্ট করুন।' : 'Fast desk registration for walk-in patients with 30-min slot token.'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleWalkInSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Phone with Auto-Lookup */}
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-slate-700">
                  {t('phoneLabel')} <span className="text-slate-400 text-xs font-normal">{t('phoneDigits')}</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={11}
                    value={walkInForm.phone}
                    onChange={handleWalkInPhoneChange}
                    placeholder={t('phonePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none font-mono text-[16px]"
                    required
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    {walkInLookingUp ? (
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </div>
                </div>
                {walkInLookupMessage && (
                  <p className="text-xs text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-lg">
                    {walkInLookupMessage}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-slate-700">
                  {t('fullNameLabel')}
                </label>
                <input
                  type="text"
                  value={walkInForm.full_name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, full_name: e.target.value })}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[16px]"
                  required
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[15px] font-semibold text-slate-700">
                    {t('ageLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={walkInForm.age}
                    onChange={(e) => setWalkInForm({ ...walkInForm, age: e.target.value })}
                    placeholder={t('agePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[16px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[15px] font-semibold text-slate-700">
                    {t('genderLabel')}
                  </label>
                  <select
                    value={walkInForm.gender}
                    onChange={(e) => setWalkInForm({ ...walkInForm, gender: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[16px] bg-white"
                  >
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>
              </div>

              {/* Doctor Selection with Schedule */}
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-slate-700">
                  {t('doctorDropdownLabel')}
                </label>
                <select
                  value={walkInForm.doctor_id}
                  onChange={(e) => setWalkInForm({ ...walkInForm, doctor_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[16px] bg-white"
                  required
                >
                  <option value="">{t('selectDoctorPlaceholder')}</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.department} (ফি: ৳{d.fee || 800})
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Date */}
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-slate-700">
                  {t('dateLabel')}
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={walkInForm.appointment_date}
                  onChange={(e) => setWalkInForm({ ...walkInForm, appointment_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[16px] bg-white"
                  required
                />
              </div>

              {/* 30-Minute Slot Selection */}
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-slate-700">
                  {lang === 'bn' ? '৩০ মিনিটের সময়সূচী (Time Slot) *' : '30-Minute Time Slot *'}
                </label>
                <select
                  value={walkInForm.time_slot}
                  onChange={(e) => setWalkInForm({ ...walkInForm, time_slot: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[16px] bg-white font-mono"
                  required
                >
                  {STANDARD_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Problem / Notes */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[15px] font-semibold text-slate-700">
                  {t('symptomsLabel')}
                </label>
                <input
                  type="text"
                  value={walkInForm.symptoms}
                  onChange={(e) => setWalkInForm({ ...walkInForm, symptoms: e.target.value })}
                  placeholder={t('symptomsPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[16px]"
                />
              </div>

            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingWalkIn}
                className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[16px] rounded-xl shadow-xs transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingWalkIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('submittingBtn')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{lang === 'bn' ? 'সরাসরি কনফার্ম ও ডিজিটাল টোকেন স্লিপ ইস্যু করুন' : 'Confirm & Issue Digital Token Slip'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* VIEW 2: DOCTOR MANAGEMENT TAB */}
      {activeTab === 'DOCTORS' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                {lang === 'bn' ? 'ডাক্তার ব্যবস্থাপনা ও ৩০ মিনিট শিডিউল মনিটরিং' : 'Doctor Management & Schedule Monitoring'}
              </h3>
              <p className="text-[14px] text-slate-500 mt-1">
                {lang === 'bn' ? 'নতুন বিশেষজ্ঞ ডাক্তার যুক্ত করুন, ভিজিটিং দিন পরিচালনা করুন অথবা প্রোফাইল অপসারণ করুন।' : 'Add new specialists, manage visiting schedules, or remove profiles.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingDoctor(!isAddingDoctor)}
              className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingDoctor ? t('closeFormBtn') : t('addDoctorBtn')}</span>
            </button>
          </div>

          {/* Collapsible Add Doctor Form */}
          {isAddingDoctor && (
            <form onSubmit={handleAddDoctorSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-500/30 shadow-md space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <span>{lang === 'bn' ? 'নতুন বিশেষজ্ঞ ডাক্তারের তথ্য প্রদান করুন' : 'Enter New Doctor Details'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingDoctor(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'ডাক্তারের নাম *' : 'Doctor Name *'}
                  </label>
                  <input
                    type="text"
                    value={newDoctorData.name}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, name: e.target.value })}
                    placeholder="যেমন: ডা. সামিরা চৌধুরী"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'বিভাগ (Department) *' : 'Department *'}
                  </label>
                  <select
                    value={newDoctorData.department}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px] bg-white"
                  >
                    {SPECIALTY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'ডিগ্রি (Degrees)' : 'Degrees'}
                  </label>
                  <input
                    type="text"
                    value={newDoctorData.degree}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, degree: e.target.value })}
                    placeholder="MBBS, FCPS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'পদবী (Designation)' : 'Designation'}
                  </label>
                  <input
                    type="text"
                    value={newDoctorData.designation}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, designation: e.target.value })}
                    placeholder="সহযোগী অধ্যাপক / কনসালট্যান্ট"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'কনসালটেশন ফি (৳)' : 'Consultation Fee (৳)'}
                  </label>
                  <input
                    type="number"
                    value={newDoctorData.fee}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, fee: e.target.value })}
                    placeholder="800"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'কক্ষ নম্বর (Room No.)' : 'Room Number'}
                  </label>
                  <input
                    type="text"
                    value={newDoctorData.room_no}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, room_no: e.target.value })}
                    placeholder="Room 201"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[15px]"
                  />
                </div>

              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmittingDoctor ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Doctor')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingDoctor(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[14px] rounded-xl transition-colors cursor-pointer"
                >
                  {t('cancelAction')}
                </button>
              </div>
            </form>
          )}

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => {
              return (
                <div 
                  key={doc.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                        {doc.department}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={lang === 'bn' ? 'ডাক্তার অপসারণ করুন' : 'Remove Doctor'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-[18px] leading-snug">{doc.name}</h4>
                    <p className="text-[13px] font-semibold text-slate-700">{doc.degree}</p>
                    <p className="text-[13px] text-slate-500 mt-0.5">{doc.designation || 'Consultant'}</p>
                    
                    <div className="mt-3 flex items-center gap-3 text-[13px] text-slate-600">
                      <span className="font-medium text-teal-700">ফি: ৳{doc.fee || 800}</span>
                      <span className="text-slate-300">•</span>
                      <span>{t('room')}: {doc.room_no || '101'}</span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      📅 {lang === 'bn' ? doc.schedule_days_bn : doc.schedule_days?.join(', ')} | ⏰ {doc.visiting_time}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[13px]">
                    <span className="text-slate-500 font-medium">
                      {lang === 'bn' ? '৩০ মিনিটের স্লট ধারণক্ষমতা:' : 'Slot Capacity:'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 text-xs">
                      ১ রোগী / স্লট
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW 3: APPOINTMENTS LIST */}
      {(activeTab === 'ALL' || activeTab === 'PENDING' || activeTab === 'CONFIRMED' || activeTab === 'CANCELLED') && (
        <div className="rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-[15px] font-semibold text-slate-600">{lang === 'bn' ? 'তালিকা লোড হচ্ছে...' : 'Loading appointments...'}</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => {
                const isPending = apt.status === 'PENDING';
                const isConfirmed = apt.status === 'CONFIRMED';
                const isCancelled = apt.status === 'CANCELLED';
                const isActionRunning = actionInProgressId === apt.id;
                const isPaidOnline = apt.payment_status === 'PAID_ONLINE' || apt.payment_method === 'ONLINE_MFS';

                return (
                  <div
                    key={apt.id}
                    className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
                      
                      {/* Left: Patient Details */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs sm:text-[13px] font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isConfirmed
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isPending && <Clock className="w-3.5 h-3.5" />}
                            {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isCancelled && <XCircle className="w-3.5 h-3.5" />}
                            <span>
                              {isPending 
                                ? t('statusPendingText') 
                                : isConfirmed 
                                ? t('statusConfirmedText') 
                                : t('statusCancelledText')}
                            </span>
                          </span>

                          {/* Distinct Refund Badge for Online Payments Cancelled */}
                          {isCancelled && (apt.payment_status === 'REFUNDED' || isPaidOnline) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                              <RotateCcw className="w-3 h-3 text-purple-700" />
                              <span>{lang === 'bn' ? `টাকা রিফান্ড করা হয়েছে (৳${apt.refund_amount || apt.consultation_fee || 800})` : `Refunded (৳${apt.refund_amount || apt.consultation_fee || 800})`}</span>
                            </span>
                          )}

                          {apt.token_id && (
                            <span className="px-2.5 py-0.5 rounded-md text-xs sm:text-[13px] font-mono font-bold bg-slate-900 text-white">
                              {t('tokenLabel')}: {apt.token_id}
                            </span>
                          )}

                          {/* Payment badge (Only if not cancelled or counter payment) */}
                          {(!isCancelled || (apt.payment_status !== 'REFUNDED' && !isPaidOnline)) && (
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] sm:text-[12px] font-bold ${
                              isPaidOnline 
                                ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}>
                              {isPaidOnline ? t('paidOnlineBadge') : t('payCounterBadge')} (৳{apt.consultation_fee || 800})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <h4 className="text-[17px] sm:text-[18px] font-bold text-slate-900 break-words">
                            {apt.patient?.full_name || 'রোগীর নাম'}
                          </h4>
                          <span className="text-xs sm:text-[14px] text-slate-500 font-medium">
                            ({apt.patient?.age} {lang === 'bn' ? 'বছর' : 'yrs'}, {apt.patient?.gender})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-[14px] text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {apt.patient?.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{apt.appointment_date}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>{apt.time_slot || '11:00 AM - 11:30 AM'}</span>
                          </span>
                        </div>

                        {apt.symptoms && (
                          <p className="text-xs sm:text-[13px] text-slate-500 pt-1">
                            <span className="font-semibold text-slate-600">{lang === 'bn' ? 'লক্ষণ / নোট: ' : 'Symptoms/Notes: '}</span>
                            {apt.symptoms}
                          </p>
                        )}
                      </div>

                      {/* Middle: Doctor Details & Chamber Room */}
                      <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 w-full lg:w-72 space-y-1">
                        <div className="text-[11px] sm:text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                          {t('tableDoctor')}
                        </div>
                        <p className="font-bold text-slate-900 text-[14px] sm:text-[15px] truncate">
                          {apt.doctor?.name || 'ডাক্তার'}
                        </p>
                        <p className="text-xs sm:text-[13px] text-slate-600">
                          {apt.doctor?.department} | {t('room')}: {apt.doctor?.room_no}
                        </p>
                        <p className="text-xs text-teal-700 font-bold pt-1">
                          ফি: ৳{apt.consultation_fee || apt.doctor?.fee || 800}
                        </p>
                      </div>

                      {/* Right: 1-Click Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto pt-2 lg:pt-0">
                        
                        {/* 1-Click Confirm Button */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleConfirm(apt)}
                            disabled={isActionRunning}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-[14px] rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                            title={lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট কনফার্ম করুন ও টোকেন ইস্যু করুন' : 'Confirm and issue token'}
                          >
                            {isActionRunning ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            )}
                            <span>{t('confirmAction')}</span>
                          </button>
                        )}

                        {/* 1-Click Cancel Button */}
                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancel(apt)}
                            disabled={isActionRunning}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs sm:text-[14px] rounded-xl transition-colors cursor-pointer"
                            title={lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট বাতিল করুন' : 'Cancel appointment'}
                          >
                            {isActionRunning ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span>{t('cancelAction')}</span>
                          </button>
                        )}

                        {/* Print Token Slip Button */}
                        {isConfirmed && onSelectSlipForPrint && (
                          <button
                            type="button"
                            onClick={() => onSelectSlipForPrint(apt)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-[14px] rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                            title={lang === 'bn' ? 'ডিজিটাল স্লিপ প্রিন্ট করুন' : 'Print Token Slip'}
                          >
                            <Printer className="w-4 h-4" />
                            <span>{t('printSlipAction')}</span>
                          </button>
                        )}

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              {getEmptyStateContent().icon}
              <h4 className="text-xl font-bold text-slate-800 mb-1">
                {getEmptyStateContent().title}
              </h4>
              <p className="text-[14px] text-slate-500 max-w-md mx-auto">
                {getEmptyStateContent().subtitle}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
