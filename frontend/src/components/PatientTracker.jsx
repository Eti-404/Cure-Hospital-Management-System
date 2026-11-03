import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  User, 
  Calendar, 
  AlertCircle,
  RefreshCw,
  Home,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function PatientTracker({ 
  initialPhone, 
  onSelectSlipForPrint,
  onGoHome,
  onGoToDoctors
}) {
  const { lang, t } = useLanguage();
  const [phone, setPhone] = useState(initialPhone || '');
  const [appointments, setAppointments] = useState([]);
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Track function: can run silently in the background
  const handleTrack = async (searchPhone = phone, showSpinner = true) => {
    if (!searchPhone || searchPhone.trim().length < 11) return;
    if (showSpinner) setIsLoading(true);
    setSearched(true);
    try {
      const res = await api.trackByPhone(searchPhone.trim());
      setAppointments(res.data || []);
      setPatient(res.patient || null);
      if (showSpinner) setIsLoading(false);
    } catch {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPhone && initialPhone.length >= 11) {
      setPhone(initialPhone);
      handleTrack(initialPhone, true);
    }
  }, [initialPhone]);

  // Real-Time Event Synchronization: Listens to assistant status updates (Confirm/Cancel/Walk-in)
  useEffect(() => {
    const handleSync = (e) => {
      if (phone && phone.trim().length >= 11) {
        handleTrack(phone.trim(), false);
      }
    };
    window.addEventListener('cure_appointment_synced', handleSync);
    return () => window.removeEventListener('cure_appointment_synced', handleSync);
  }, [phone]);

  // Automatic Polling: If there is any PENDING appointment, poll every 4 seconds for real-time status update
  useEffect(() => {
    if (!searched || !phone || phone.length < 11) return;
    const hasPending = appointments.some((a) => a.status === 'PENDING');
    if (!hasPending) return;

    const intervalId = setInterval(() => {
      handleTrack(phone.trim(), false);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [searched, phone, appointments]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[13px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('statusConfirmedText')}</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[13px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>{t('statusPendingText')}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[13px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{t('statusCancelledText')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="tracker-section" className="space-y-6 animate-fade-in scroll-mt-24 font-sans">
      
      {/* 0. Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium py-1">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-1.5 text-slate-600 hover:text-teal-700 font-semibold transition-colors cursor-pointer group"
        >
          <Home className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
          <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
        </button>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        {onGoToDoctors && (
          <>
            <button
              type="button"
              onClick={onGoToDoctors}
              className="text-slate-600 hover:text-teal-700 font-semibold transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'বিশেষজ্ঞ ডাক্তারগণ' : 'Specialist Doctors'}
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </>
        )}
        <span className="text-slate-900 font-bold">
          {lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট ট্র্যাকিং ও স্লিপ' : 'Appointment Tracker & Slip'}
        </span>
      </nav>

      {/* Tracker Search Header */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 p-6 sm:p-10 space-y-6">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('trackerTitle')}
          </h3>
          <p className="text-[15px] text-slate-600 mt-1 leading-relaxed">
            {t('trackerSub')}
          </p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }} 
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t('phonePlaceholder')}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 font-mono text-[16px] leading-relaxed transition-all"
              required
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
          </div>

          <button
            type="submit"
            disabled={isLoading || phone.length < 11}
            className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[16px] rounded-xl shadow-xs transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('searchingBtn')}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t('trackBtn')}</span>
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-400">
          * {t('trackerDemoHint')}
        </p>
      </div>

      {/* Results Container */}
      {searched && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Patient Overview Card (if patient found) */}
          {patient && (
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  <User className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    {patient.full_name}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {patient.gender === 'Female' ? (lang === 'bn' ? 'মহিলা' : 'Female') : (lang === 'bn' ? 'পুরুষ' : 'Male')} • {patient.age} {lang === 'bn' ? 'বছর' : 'yrs'} • <span className="font-mono">{patient.phone}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-teal-800 border border-teal-200 shadow-2xs">
                  {lang === 'bn' ? 'নিবন্ধিত রোগী' : 'Registered Patient'}
                </span>
              </div>
            </div>
          )}

          {/* Appointments List */}
          {appointments.length > 0 ? (
            <div className="space-y-4">
              
              {/* Summary Status Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 text-xs sm:text-sm font-semibold">
                <span className="text-slate-700">
                  {lang === 'bn' ? 'মোট বুকিং রেকর্ড:' : 'Total Bookings:'} <strong className="text-slate-900">{appointments.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>{appointments.filter(a => a.status === 'PENDING').length} {lang === 'bn' ? 'অপেক্ষমান' : 'Pending'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>{appointments.filter(a => a.status === 'CONFIRMED').length} {lang === 'bn' ? 'নিশ্চিতকৃত' : 'Confirmed'}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map((apt) => {
                  const isConfirmed = apt.status === 'CONFIRMED';
                  const isPaidOnline = apt.payment_status === 'PAID_ONLINE' || apt.payment_method === 'ONLINE_MFS';

                  const isCancelled = apt.status === 'CANCELLED';

                  return (
                    <div
                      key={apt.id}
                      className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                        isConfirmed 
                          ? 'border-teal-300 shadow-[0_4px_25px_-4px_rgba(13,148,136,0.15)]' 
                          : apt.status === 'PENDING'
                          ? 'border-amber-300 shadow-[0_4px_25px_-4px_rgba(245,158,11,0.1)]'
                          : 'border-slate-200/80 shadow-xs opacity-90'
                      }`}
                    >
                      <div className="space-y-4">
                        
                        {/* Top Row: Status badge, Payment Badge & Token ID */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {getStatusBadge(apt.status)}

                          <div className="flex items-center gap-2">
                            {isCancelled && (apt.payment_status === 'REFUNDED' || isPaidOnline) ? (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 shadow-2xs">
                                <RotateCcw className="w-3 h-3 text-purple-700" />
                                <span>{lang === 'bn' ? `রিফান্ড সম্পন্ন (৳${apt.refund_amount || apt.consultation_fee || 800})` : `Refunded (৳${apt.refund_amount || apt.consultation_fee || 800})`}</span>
                              </span>
                            ) : (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                isPaidOnline ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {isPaidOnline ? '✓ Online Paid' : 'Pay at Counter'}
                              </span>
                            )}

                            {apt.token_id && (
                              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-black bg-teal-950 text-teal-300 border border-teal-700 notranslate" translate="no">
                                {t('tokenLabel')}: {apt.token_id}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Doctor Info */}
                        <div>
                          <span className="text-[12px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                            {apt.doctor?.department || 'Department'}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-[18px] mt-1.5 leading-snug">
                            {apt.doctor?.name || 'Doctor Name'}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {apt.doctor?.degree} ({apt.doctor?.designation})
                          </p>
                        </div>

                        {/* Date & 30-Min Time Slot */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t('date')}: <strong className="text-slate-800">{apt.appointment_date}</strong></span>
                          </span>

                          <span className="flex items-center gap-1 font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>{apt.time_slot || '11:00 AM - 11:30 AM'}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center justify-between">
                          <span>{t('roomNo')}: <strong>{apt.doctor?.room_no || 'Room 101-A'}</strong></span>
                          <span className="font-bold text-slate-800">ফি: ৳{apt.consultation_fee || apt.doctor?.fee || 800}</span>
                        </div>

                        {/* Status Notice Details */}
                        {apt.status === 'PENDING' && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />
                            <div>
                              <span className="font-bold">{lang === 'bn' ? 'অনুমোদনের অপেক্ষায় রয়েছে' : 'Awaiting Assistant Approval'}</span>
                              <p className="text-[11px] text-amber-800/90 mt-0.5">
                                {lang === 'bn' 
                                  ? 'সহকারী ডেস্কে আপনার অনুরোধটি যাচাই করা হচ্ছে। কনফার্ম হলে স্বয়ংক্রিয়ভাবে টোকেন স্লিপ সক্রিয় হবে।'
                                  : 'Your request is being verified at Assistant Desk. Token slip will unlock automatically.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {apt.status === 'CANCELLED' && (
                          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                            (apt.payment_status === 'REFUNDED' || isPaidOnline)
                              ? 'bg-purple-50/90 border-purple-200 text-purple-950'
                              : 'bg-rose-50 border-rose-200 text-rose-900'
                          }`}>
                            {(apt.payment_status === 'REFUNDED' || isPaidOnline) ? (
                              <RotateCcw className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-bold">
                                {(apt.payment_status === 'REFUNDED' || isPaidOnline)
                                  ? (lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট বাতিল ও সম্পূর্ণ ফি রিফান্ড প্রসেস সম্পন্ন' : 'Appointment Cancelled & Fee Refunded')
                                  : (lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে' : 'Appointment Cancelled')}
                              </span>
                              <p className={`text-[11px] mt-0.5 leading-relaxed ${
                                (apt.payment_status === 'REFUNDED' || isPaidOnline) ? 'text-purple-900' : 'text-rose-800/90'
                              }`}>
                                {(apt.payment_status === 'REFUNDED' || isPaidOnline)
                                  ? (lang === 'bn' 
                                      ? `আপনার অ্যাপয়েন্টমেন্টটি বাতিল করা হয়েছে এবং প্রদেয় ৳${apt.refund_amount || apt.consultation_fee || 800} রিফান্ড প্রসেস করা হয়েছে।` 
                                      : `Your appointment was cancelled and payable ৳${apt.refund_amount || apt.consultation_fee || 800} refund has been processed.`)
                                  : (apt.cancellation_reason || (lang === 'bn' ? 'সহকারী ডেস্ক থেকে অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে।' : 'Cancelled from Assistant Desk.'))}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Symptoms */}
                        {apt.symptoms && (
                          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <strong>{lang === 'bn' ? 'লক্ষণ / নোট:' : 'Symptoms:'}</strong> {apt.symptoms}
                          </p>
                        )}

                      </div>

                      {/* Print Slip Action (If confirmed) */}
                      {isConfirmed && onSelectSlipForPrint && (
                        <div className="pt-5">
                          <button
                            type="button"
                            onClick={() => onSelectSlipForPrint(apt)}
                            className="w-full py-2.5 px-4 rounded-xl font-bold text-[14px] bg-teal-700 hover:bg-teal-800 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                          >
                            <Printer className="w-4 h-4" />
                            <span>{lang === 'bn' ? 'টোকেন স্লিপ দেখুন ও প্রিন্ট করুন' : 'View & Print Token Slip'}</span>
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-slate-800">{t('noRecordsFound')}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {lang === 'bn' ? 'এই মোবাইল নম্বরে পূর্বে কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।' : 'No appointments associated with this mobile number yet.'}
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
