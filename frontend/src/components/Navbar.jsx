import React, { useState, useRef, useEffect } from 'react';
import { 
  Stethoscope, 
  User, 
  ShieldCheck, 
  LogOut, 
  ChevronDown, 
  Calendar, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Lock 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ 
  activeMode, 
  setActiveMode, 
  pendingCount = 0,
  isAssistantLoggedIn = false,
  assistantUser = null,
  onOpenAssistantLogin,
  onAssistantLogout,
  patientUser = null,
  onOpenPatientLogin,
  onPatientLogout,
  currentPage = 'home',
  onGoHome,
  onGoToDoctors,
  onGoToTrack,
  onSelectSlipForPrint
}) {
  const { lang, setLang, t } = useLanguage();

  // Dropdown states
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [assistantMenuOpen, setAssistantMenuOpen] = useState(false);

  // Hover timeout refs to prevent flickering when mouse leaves slightly
  const patientTimeoutRef = useRef(null);
  const assistantTimeoutRef = useRef(null);

  const patientContainerRef = useRef(null);
  const assistantContainerRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (patientContainerRef.current && !patientContainerRef.current.contains(event.target)) {
        setPatientMenuOpen(false);
      }
      if (assistantContainerRef.current && !assistantContainerRef.current.contains(event.target)) {
        setAssistantMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Patient Hover handlers
  const handlePatientMouseEnter = () => {
    if (patientTimeoutRef.current) clearTimeout(patientTimeoutRef.current);
    setPatientMenuOpen(true);
    setAssistantMenuOpen(false);
  };

  const handlePatientMouseLeave = () => {
    patientTimeoutRef.current = setTimeout(() => {
      setPatientMenuOpen(false);
    }, 180);
  };

  // Assistant Hover handlers
  const handleAssistantMouseEnter = () => {
    if (assistantTimeoutRef.current) clearTimeout(assistantTimeoutRef.current);
    setAssistantMenuOpen(true);
    setPatientMenuOpen(false);
  };

  const handleAssistantMouseLeave = () => {
    assistantTimeoutRef.current = setTimeout(() => {
      setAssistantMenuOpen(false);
    }, 180);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f766e]/95 backdrop-blur-md text-white border-b border-teal-800/60 shadow-md no-print select-none transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          
          {/* Left: Brand Identity with Google Translate Protection (Clickable Home) */}
          <div 
            onClick={onGoHome}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
            title={lang === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-300 group-hover:bg-cyan-300 flex items-center justify-center text-slate-950 shadow-sm shrink-0 transition-all duration-200">
              <Stethoscope className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span 
                  className="text-lg sm:text-2xl font-black tracking-tight text-white notranslate group-hover:text-teal-200 transition-colors" 
                  translate="no"
                >
                  {lang === 'bn' ? 'কিওর হসপিটাল' : 'Cure Hospital'}
                </span>
                <span className="hidden md:inline-block text-[10px] sm:text-[11px] font-bold text-teal-200 bg-teal-950/70 px-2 py-0.5 rounded-md border border-teal-700/60 notranslate" translate="no">
                  {t('brandBadge')}
                </span>
              </div>
              <span className="text-[11px] text-teal-200/80 font-medium hidden sm:inline-block notranslate" translate="no">
                Cure Hospital OPD Care System
              </span>
            </div>
          </div>

          {/* Center: Patient Navigation Pills (Desktop Only) */}
          {activeMode === 'patient' && (
            <nav className="hidden lg:flex items-center gap-1 bg-black/25 backdrop-blur-md p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={onGoHome}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === 'home'
                    ? 'bg-white/20 text-white font-extrabold shadow-2xs border border-white/20'
                    : 'text-teal-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {lang === 'bn' ? 'হোম' : 'Home'}
              </button>
              <button
                type="button"
                onClick={onGoToDoctors}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === 'doctors' || currentPage === 'checkout'
                    ? 'bg-white/20 text-white font-extrabold shadow-2xs border border-white/20'
                    : 'text-teal-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {lang === 'bn' ? 'বিশেষজ্ঞ ডাক্তারগণ' : 'Specialist Doctors'}
              </button>
              <button
                type="button"
                onClick={onGoToTrack}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === 'track'
                    ? 'bg-white/20 text-white font-extrabold shadow-2xs border border-white/20'
                    : 'text-teal-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট ট্র্যাকিং' : 'Track Status'}
              </button>
            </nav>
          )}

          {/* Right Area: Language Switcher, Notification Bell & Smart Auth Hover Dropdowns */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* 1. Language Switcher [ বাংলা | EN ] (Frosted Glass Translucent Pill) */}
            <div className="bg-black/25 backdrop-blur-md p-0.5 sm:p-1 rounded-full flex items-center border border-white/15">
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-white text-teal-950 font-black shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
                title="বাংলা ভাষায় দেখুন"
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-teal-950 font-black shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {/* 2. Real-Time Notification Bell System */}
            <NotificationDropdown 
              onSelectSlipForPrint={onSelectSlipForPrint}
              onGoToTrack={onGoToTrack}
            />

            {/* 3. SMART 'PATIENT' HOVER DROPDOWN MENU */}
            <div 
              className="relative"
              ref={patientContainerRef}
              onMouseEnter={handlePatientMouseEnter}
              onMouseLeave={handlePatientMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setPatientMenuOpen((prev) => !prev);
                  setAssistantMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer border ${
                  activeMode === 'patient'
                    ? 'bg-teal-300 text-slate-950 border-teal-200 font-extrabold shadow-xs hover:bg-teal-200'
                    : 'bg-black/25 text-white border-white/15 hover:bg-black/40 hover:border-white/30'
                }`}
                title={lang === 'bn' ? 'পেশেন্ট মেনু' : 'Patient Menu'}
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
                <span className="max-w-[90px] sm:max-w-[120px] truncate">
                  {patientUser ? patientUser.name : (lang === 'bn' ? 'পেশেন্ট' : 'Patient')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${patientMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Patient Dropdown Card */}
              {patientMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.25)] border border-slate-200 p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* Subtle top arrow caret */}
                  <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45"></div>

                  {patientUser ? (
                    /* LOGGED IN PATIENT STATE */
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm shrink-0 border border-teal-200">
                          {patientUser.name ? patientUser.name.charAt(0) : 'P'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 text-[15px] truncate">
                            {patientUser.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            {patientUser.phone}
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.2 rounded-full border border-teal-200">
                            {lang === 'bn' ? 'নিবন্ধিত রোগী' : 'Registered Patient'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPatientMenuOpen(false);
                            setActiveMode('patient');
                            onGoToTrack(patientUser.phone);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50/80 transition-colors flex items-center justify-between cursor-pointer group"
                        >
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                            <span>{lang === 'bn' ? 'আমার অ্যাপয়েন্টমেন্টসমূহ' : 'My Appointments (Track)'}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPatientMenuOpen(false);
                            setActiveMode('patient');
                            onGoToDoctors();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50/80 transition-colors flex items-center justify-between cursor-pointer group"
                        >
                          <span className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                            <span>{lang === 'bn' ? 'বিশেষজ্ঞ ডাক্তার খুঁজুন' : 'Find Specialists'}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {lang === 'bn' ? 'পেশেন্ট সেশন' : 'Patient Session'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPatientMenuOpen(false);
                            onPatientLogout();
                          }}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LOGGED OUT PATIENT STATE */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {lang === 'bn' ? 'পেশেন্ট পোর্টাল' : 'Patient Portal'}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট ও লাইভ সিরিয়াল সেবা' : 'Appointment & live status'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* 1. Login Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPatientMenuOpen(false);
                            onOpenPatientLogin('login');
                          }}
                          className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-[13px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'লগইন করুন (Login)' : 'Sign In'}</span>
                        </button>

                        {/* 2. New Registration Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPatientMenuOpen(false);
                            onOpenPatientLogin('register');
                          }}
                          className="w-full py-2 px-3 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-teal-700" />
                          <span>{lang === 'bn' ? 'নতুন রেজিস্ট্রেশন (Sign Up)' : 'New Registration (Sign Up)'}</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPatientMenuOpen(false);
                            setActiveMode('patient');
                            onGoToTrack();
                          }}
                          className="text-[11px] font-bold text-teal-700 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          <span>{lang === 'bn' ? 'মোবাইল দিয়ে সরাসরি ট্র্যাক করুন' : 'Track appointment by mobile'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* 4. SMART 'ASSISTANT DESK' HOVER DROPDOWN MENU */}
            <div 
              className="relative"
              ref={assistantContainerRef}
              onMouseEnter={handleAssistantMouseEnter}
              onMouseLeave={handleAssistantMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setAssistantMenuOpen((prev) => !prev);
                  setPatientMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer border relative ${
                  activeMode === 'assistant'
                    ? 'bg-teal-300 text-slate-950 border-teal-200 font-extrabold shadow-xs hover:bg-teal-200'
                    : 'bg-black/25 text-white border-white/15 hover:bg-black/40 hover:border-white/30'
                }`}
                title={lang === 'bn' ? 'সহকারী ডেস্ক' : 'Assistant Desk'}
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
                <span className="hidden xs:inline">
                  {lang === 'bn' ? 'সহকারী ডেস্ক' : 'Assistant Desk'}
                </span>
                <span className="xs:hidden">ডেস্ক</span>

                {pendingCount > 0 && (
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs font-black leading-none rounded-full ${
                    activeMode === 'assistant' ? 'bg-slate-950 text-amber-300' : 'bg-amber-400 text-slate-950 animate-pulse'
                  }`}>
                    {pendingCount}
                  </span>
                )}

                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${assistantMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Assistant Desk Dropdown Card */}
              {assistantMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.25)] border border-slate-200 p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* Subtle top arrow caret */}
                  <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45"></div>

                  {isAssistantLoggedIn ? (
                    /* LOGGED IN ASSISTANT STATE */
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm shrink-0 border border-teal-200">
                          <ShieldCheck className="w-5 h-5 text-teal-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 text-[14px] truncate">
                            {assistantUser?.name || (lang === 'bn' ? 'স্টাফ অ্যাসিস্ট্যান্ট' : 'Staff Assistant')}
                          </h4>
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {lang === 'bn' ? 'অনুমোদিত ওপিডি কর্মী' : 'Duty Assistant Staff'}
                          </span>
                        </div>
                      </div>

                      {/* Pending Appointments Indicator */}
                      <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        pendingCount > 0 
                          ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold'
                          : 'bg-teal-50 border-teal-200 text-teal-800 font-semibold'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {pendingCount > 0 ? (
                            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          )}
                          <span>
                            {pendingCount > 0 
                              ? (lang === 'bn' ? `${pendingCount}টি নতুন যাচাই বাকি` : `${pendingCount} pending verification`)
                              : (lang === 'bn' ? 'সব অ্যাপয়েন্টমেন্ট আপ-টু-ডেট' : 'All appointments up to date')}
                          </span>
                        </div>
                        {pendingCount > 0 && (
                          <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px]">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Action: Enter Desk */}
                      <button
                        type="button"
                        onClick={() => {
                          setAssistantMenuOpen(false);
                          setActiveMode('assistant');
                        }}
                        className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-[13px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'ড্যাশবোর্ড প্রবেশ (Go to Desk)' : 'Enter Assistant Desk'}</span>
                      </button>

                      {/* Return to patient mode if currently in assistant mode */}
                      {activeMode === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssistantMenuOpen(false);
                            setActiveMode('patient');
                            onGoHome();
                          }}
                          className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          {lang === 'bn' ? 'পেশেন্ট ভিউতে ফিরে যান' : 'Switch to Patient View'}
                        </button>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {lang === 'bn' ? 'স্টাফ সেশন' : 'Staff Session'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAssistantMenuOpen(false);
                            onAssistantLogout();
                          }}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LOGGED OUT ASSISTANT STATE */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {lang === 'bn' ? 'সহকারী ডেস্ক' : 'Assistant Desk'}
                          </h4>
                          <p className="text-[11px] text-amber-700 font-medium">
                            {lang === 'bn' ? 'শুধুমাত্র অনুমোদিত কর্মীদের জন্য' : 'Authorized staff access only'}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {lang === 'bn' 
                          ? 'অ্যাপয়েন্টমেন্ট ভেরিফিকেশন, স্লিপ ইস্যু ও ডাক্তার শিডিউল নিয়ন্ত্রণ করতে লগইন আবশ্যক।' 
                          : 'Login required for appointment verification, slip generation, and doctor schedule management.'}
                      </p>

                      {/* Staff Login Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setAssistantMenuOpen(false);
                          onOpenAssistantLogin();
                        }}
                        className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-[13px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'স্টাফ লগইন (Staff Login)' : 'Staff Login'}</span>
                      </button>

                      <div className="pt-2 border-t border-slate-100 text-center">
                        <span className="text-[11px] font-mono text-slate-400 block">
                          Demo: assistant@cure.com • admin123
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
