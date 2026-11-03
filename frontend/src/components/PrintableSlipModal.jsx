import React from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PrintableSlipModal({ appointment, onClose }) {
  const { lang, t } = useLanguage();
  if (!appointment) return null;

  const { 
    patient, 
    doctor, 
    appointment_date, 
    time_slot, 
    token_id, 
    symptoms, 
    payment_method, 
    payment_status, 
    consultation_fee 
  } = appointment;

  const handlePrint = () => {
    window.print();
  };

  const isPaidOnline = payment_status === 'PAID_ONLINE' || payment_method === 'ONLINE_MFS';

  const getGenderLabel = (gender) => {
    if (!gender) return lang === 'bn' ? 'পুরুষ' : 'Male';
    const g = gender.toString().toLowerCase();
    if (g.includes('fem') || g.includes('মহিলা')) {
      return lang === 'bn' ? 'মহিলা' : 'Female';
    }
    if (g.includes('oth') || g.includes('অন্যান্য')) {
      return lang === 'bn' ? 'অন্যান্য' : 'Other';
    }
    return lang === 'bn' ? 'পুরুষ' : 'Male';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto modal-backdrop-print-reset font-sans">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] my-auto overflow-hidden animate-fade-in modal-card-print-reset">
        
        {/* Modal Top Bar (Sticky, No-Print) */}
        <div className="no-print bg-[#e6fffa] px-5 py-3.5 border-b border-teal-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
            <h3 className="font-bold text-slate-900 text-[15px]">
              {lang === 'bn' ? 'ডিজিটাল অ্যাপয়েন্টমেন্ট টোকেন স্লিপ' : 'Digital Appointment Token Slip'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body: Houses the Printable Slip Container */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          
          <div className="printable-slip-container bg-white text-slate-800 space-y-4">
            
            {/* 1. Hospital Branding Header */}
            <div className="border-b-2 border-teal-700 pb-3 text-center relative">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 mb-1.5 shadow-2xs">
                <Stethoscope className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 notranslate" translate="no">
                {lang === 'bn' ? 'কিওর হসপিটাল' : 'Cure Hospital'}
              </h2>
              <p className="text-[11px] font-bold text-teal-700 tracking-wider uppercase mt-0.5 notranslate" translate="no">
                CURE SPECIALIZED HOSPITAL & RESEARCH INSTITUTE
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {lang === 'bn' 
                  ? 'ওপিডি কনসালটেশন স্লিপ ও ৩০ মিনিট অ্যাপয়েন্টমেন্ট টোকেন | হেল্পলাইন: ১৬২৬৩' 
                  : 'OPD Consultation Slip & 30-Minute Slot Token | Helpline: 16263'}
              </p>

              {/* Minimal Clean Digital Serial & Token Box (Dark Turquoise Border, No Barcode/Wingdings) */}
              <div className="mt-3.5 inline-block bg-teal-50/70 border-2 border-teal-600 text-teal-950 px-7 py-2.5 rounded-xl text-center shadow-xs notranslate" translate="no">
                <span className="block text-[11px] sm:text-xs font-bold text-teal-800 uppercase tracking-wider notranslate" translate="no">
                  {lang === 'bn' ? 'ডিজিটাল সিরিয়াল ও টোকেন নম্বর' : 'Digital Serial & Token Number'}
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider notranslate block mt-0.5 text-slate-900" translate="no">
                  {token_id || 'CURE-2026-CONFIRMED'}
                </span>
              </div>
            </div>

            {/* 2. Patient & Doctor Details Grid (2 Columns) */}
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-[13px] bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              
              {/* Patient Info */}
              <div className="space-y-1 border-r border-slate-200 pr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'রোগীর বিবরণ' : 'Patient Info'}
                </span>
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{patient?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-mono text-xs">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{patient?.phone || 'N/A'}</span>
                </div>
                <div className="text-slate-600 text-[11px] sm:text-xs pt-0.5">
                  <span>{lang === 'bn' ? 'বয়স:' : 'Age:'} <strong className="text-slate-800">{patient?.age || 'N/A'} {lang === 'bn' ? 'বছর' : 'yrs'}</strong></span>
                  <span className="mx-1">|</span>
                  <span>{lang === 'bn' ? 'লিঙ্গ:' : 'Gender:'} <strong className="text-slate-800">{getGenderLabel(patient?.gender)}</strong></span>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="space-y-1 pl-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'ডাক্তার ও চেম্বার' : 'Doctor & Chamber'}
                </span>
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{doctor?.name || 'N/A'}</span>
                </div>
                <div className="text-slate-600 text-[11px] sm:text-xs truncate">
                  <span>{lang === 'bn' ? 'বিভাগ:' : 'Dept:'} <strong className="text-slate-800">{doctor?.department || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-teal-900 font-bold text-[11px] sm:text-xs bg-teal-100/70 px-2 py-0.5 rounded-md w-fit mt-0.5">
                  <MapPin className="w-3 h-3 text-teal-700 shrink-0" />
                  <span>{lang === 'bn' ? `কক্ষ: ${doctor?.room_no || '১০১-এ'}` : `Room: ${doctor?.room_no || '101-A'}`}</span>
                </div>
              </div>

            </div>

            {/* 3. Date, 30-Min Slot & Payment Status */}
            <div className="space-y-2.5 text-xs sm:text-[13px]">
              
              {/* Date & Time Slot Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-500">{lang === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                  <span className="font-bold text-slate-900">{appointment_date}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-500">{lang === 'bn' ? '৩০ মিনিট সময়সূচী:' : '30-Min Slot:'}</span>
                  <span className="font-extrabold text-teal-950 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    {time_slot || '11:00 AM - 11:30 AM'}
                  </span>
                </div>
              </div>

              {/* Consultation Fee & Payment Method */}
              <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">
                  {lang === 'bn' ? 'কনসালটেশন ফি ও পেমেন্ট অবস্থা:' : 'Fee & Payment Status:'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900">৳{consultation_fee || doctor?.fee || 800}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] sm:text-xs ${
                    isPaidOnline
                      ? 'bg-teal-100 text-teal-900 border border-teal-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    {isPaidOnline
                      ? (lang === 'bn' ? '✓ অনলাইন পরিশোধিত' : '✓ Paid Online')
                      : (lang === 'bn' ? 'কাউন্টারে প্রদেয়' : 'Pay at Counter')}
                  </span>
                </div>
              </div>

              {/* Symptoms if any */}
              {symptoms && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <span className="font-bold text-slate-600">{lang === 'bn' ? 'লক্ষণ / সমস্যা:' : 'Symptoms:'} </span>
                  <span className="text-slate-700">{symptoms}</span>
                </div>
              )}

            </div>

            {/* 4. Instructions & Security Verification Footer (Clean seal, no barcodes/wingdings) */}
            <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5 text-[11px] sm:text-xs text-slate-500 max-w-[260px]">
                <p className="font-bold text-slate-700">
                  {lang === 'bn' ? 'জরুরি নির্দেশনা:' : 'Important Instructions:'}
                </p>
                <p>{lang === 'bn' ? '১. নির্ধারিত ৩০ মিনিটের স্লটের ১৫ মিনিট পূর্বে চেম্বারে উপস্থিত হোন।' : '1. Please arrive 15 minutes before your slot.'}</p>
                <p>{lang === 'bn' ? '২. এই টোকেন স্লিপটি ওপিডি রিসেপশন ডেস্কে প্রদর্শন করুন।' : '2. Present this token slip at the OPD reception desk.'}</p>
              </div>

              <div className="text-center flex flex-col items-center shrink-0">
                <div className="p-1.5 border border-teal-200 rounded-xl bg-teal-50 text-teal-700 shadow-2xs mb-0.5 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[9px] font-mono font-bold text-teal-800 notranslate" translate="no">CURE VERIFIED</span>
              </div>
            </div>

            {/* 5. Minimal Copyright */}
            <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400 notranslate" translate="no">
              কিওর হসপিটাল ব্যবস্থাপনা সিস্টেম | © 2026 Cure Hospital. All Rights Reserved.
            </div>

          </div>

        </div>

        {/* Modal Bottom Actions (Sticky Footer, Always Visible, No-Print) */}
        <div className="no-print bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-200/60 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'bn' ? 'প্রিন্ট স্লিপ' : 'Print Slip'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
