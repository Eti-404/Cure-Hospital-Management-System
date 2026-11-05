import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SpecialtyGrid from './components/SpecialtyGrid';
import DoctorListing from './components/DoctorListing';
import SplitScreenCheckout from './components/SplitScreenCheckout';
import PatientTracker from './components/PatientTracker';
import AssistantDesk from './components/AssistantDesk';
import PrintableSlipModal from './components/PrintableSlipModal';
import Toast from './components/Toast';
import { AssistantLoginModal, PatientLoginModal } from './components/AuthModals';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './services/api';
import { 
  Search, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react';

function MainApp() {
  const { lang, t } = useLanguage();

  // Top-level mode: 'patient' or 'assistant'
  const [activeMode, setActiveMode] = useState('patient');
  
  // Patient page routing: 'home' | 'doctors' | 'checkout' | 'track'
  const [currentPage, setCurrentPage] = useState('home');

  // Tracked phone for live tracker
  const [trackedPhone, setTrackedPhone] = useState('');

  // Selected department filter for Doctor Listing
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Currently selected doctor for 2-column Split-Screen Checkout
  const [selectedDoctorForCheckout, setSelectedDoctorForCheckout] = useState(null);

  // Authentication States
  const [isAssistantLoggedIn, setIsAssistantLoggedIn] = useState(() => {
    return sessionStorage.getItem('cure_assistant_auth') === 'true';
  });
  const [assistantUser, setAssistantUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cure_assistant_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showAssistantLoginModal, setShowAssistantLoginModal] = useState(false);

  const [patientUser, setPatientUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cure_patient_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showPatientLoginModal, setShowPatientLoginModal] = useState(false);
  const [patientLoginMode, setPatientLoginMode] = useState('login');

  // Global state
  const [doctors, setDoctors] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  // Modal & Toast states
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load doctors & pending count
  const fetchDoctorsAndStats = async () => {
    try {
      const docRes = await api.getDoctors();
      setDoctors(docRes.data || []);

      const aptRes = await api.getAppointments({ status: 'PENDING' });
      if (aptRes.stats) {
        setPendingCount(aptRes.stats.pending || 0);
      } else {
        setPendingCount(aptRes.count || 0);
      }
    } catch {
      // Fallback gracefully on load error
    }
  };

  useEffect(() => {
    fetchDoctorsAndStats();
  }, [activeMode]);

  // Real-time synchronization listener for appointment status changes
  useEffect(() => {
    const handleSync = () => {
      fetchDoctorsAndStats();
    };
    window.addEventListener('cure_appointment_synced', handleSync);
    return () => window.removeEventListener('cure_appointment_synced', handleSync);
  }, []);

  // Navigation Handlers
  const handleGoHome = () => {
    setActiveMode('patient');
    setCurrentPage('home');
    setSelectedDoctorForCheckout(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToDoctors = (deptKeyword = 'ALL') => {
    setActiveMode('patient');
    setSelectedDept(deptKeyword);
    setSelectedDoctorForCheckout(null);
    setCurrentPage('doctors');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToTrack = (phone = '') => {
    setActiveMode('patient');
    if (phone) setTrackedPhone(phone);
    setCurrentPage('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When user clicks ANY of the 8 category cards on the Homepage -> Navigates to dedicated Doctor Listing Page with that specialty filtered
  const handleSelectSpecialty = (deptKeyword) => {
    setSelectedDept(deptKeyword);
    setSelectedDoctorForCheckout(null);
    setCurrentPage('doctors');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When user clicks "Select & Book" on a doctor card -> Navigates to 2-column Split-Screen Checkout
  const handleSelectDoctorToBook = (doc) => {
    setSelectedDoctorForCheckout(doc);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When booking is successfully submitted from Checkout
  const handleBookingSuccess = (newAppointment, bookedPhone) => {
    showToast(
      lang === 'bn'
        ? 'অ্যাপয়েন্টমেন্টের অনুরোধ সফলভাবে জমা হয়েছে! সহকারী ডেস্ক থেকে যাচাই করা হবে।'
        : 'Appointment request submitted successfully! Awaiting verification at Assistant Desk.',
      'success'
    );
    setTrackedPhone(bookedPhone);
    setSelectedDoctorForCheckout(null);
    fetchDoctorsAndStats();

    // Open printable slip modal for immediate preview
    setSelectedSlipForPrint(newAppointment);

    // Transition to live tracking page
    setCurrentPage('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Assistant Auth Handlers
  const handleAssistantLoginSuccess = (user) => {
    setIsAssistantLoggedIn(true);
    setAssistantUser(user);
    sessionStorage.setItem('cure_assistant_auth', 'true');
    sessionStorage.setItem('cure_assistant_user', JSON.stringify(user));
    setActiveMode('assistant');
    showToast(
      lang === 'bn' 
        ? `স্বাগতম ${user.name}! সহকারী ডেস্কে সফলভাবে লগইন হয়েছে।` 
        : `Welcome ${user.name}! Signed into Assistant Desk.`,
      'success'
    );
  };

  const handleAssistantLogout = () => {
    setIsAssistantLoggedIn(false);
    setAssistantUser(null);
    sessionStorage.removeItem('cure_assistant_auth');
    sessionStorage.removeItem('cure_assistant_user');
    setActiveMode('patient');
    setCurrentPage('home');
    showToast(
      lang === 'bn' ? 'সহকারী ডেস্ক থেকে লগআউট সম্পন্ন হয়েছে।' : 'Signed out from Assistant Desk.',
      'info'
    );
  };

  // Patient Auth Handlers
  const handlePatientLoginSuccess = (patient) => {
    setPatientUser(patient);
    sessionStorage.setItem('cure_patient_user', JSON.stringify(patient));
    showToast(
      lang === 'bn' 
        ? `স্বাগতম ${patient.name}! আপনার প্রোফাইল সংযুক্ত করা হয়েছে।` 
        : `Welcome ${patient.name}! Your profile is connected.`,
      'success'
    );
  };

  const handlePatientLogout = () => {
    setPatientUser(null);
    sessionStorage.removeItem('cure_patient_user');
    showToast(
      lang === 'bn' ? 'রোগী প্রোফাইল থেকে সাইন আউট করা হয়েছে।' : 'Signed out from patient profile.',
      'info'
    );
  };

  // Viva Demo Reset
  const handleResetDemo = async () => {
    const confirmPrompt = lang === 'bn'
      ? 'আপনি কি সমস্ত ডেমো ডেটা এবং স্লট সংখ্যা প্রাথমিক অবস্থায় ফিরিয়ে নিতে চান?'
      : 'Do you want to reset all demo appointments and doctor slots to their initial state?';

    if (!window.confirm(confirmPrompt)) return;

    setIsResetting(true);
    try {
      await api.resetDemo();
      await fetchDoctorsAndStats();
      setIsResetting(false);
      showToast(
        lang === 'bn' 
          ? 'সকল ডেমো ডেটা ও স্লট সফলভাবে রিসেট করা হয়েছে!' 
          : 'All demo appointments & doctor slots successfully reset!', 
        'success'
      );
    } catch {
      setIsResetting(false);
      showToast(
        lang === 'bn' ? 'রিসেট করতে ব্যর্থ হয়েছে।' : 'Failed to reset demo data.', 
        'error'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fdfa] text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden w-full max-w-full">
      
      {/* 1. TOP NAVBAR WITH STRICT BRANDING, LANGUAGE TOGGLE & AUTH */}
      <Navbar
        activeMode={activeMode}
        setActiveMode={(mode) => {
          setActiveMode(mode);
          if (mode === 'patient') {
            setSelectedDoctorForCheckout(null);
          }
        }}
        pendingCount={pendingCount}
        isAssistantLoggedIn={isAssistantLoggedIn}
        assistantUser={assistantUser}
        onOpenAssistantLogin={() => setShowAssistantLoginModal(true)}
        onAssistantLogout={handleAssistantLogout}
        patientUser={patientUser}
        onOpenPatientLogin={(mode = 'login') => {
          setPatientLoginMode(mode);
          setShowPatientLoginModal(true);
        }}
        onPatientLogout={handlePatientLogout}
        currentPage={currentPage}
        onGoHome={handleGoHome}
        onGoToDoctors={() => handleGoToDoctors('ALL')}
        onGoToTrack={(phone) => handleGoToTrack(phone)}
        onSelectSlipForPrint={(apt) => setSelectedSlipForPrint(apt)}
      />

      {/* 2. FULL-WIDTH HERO SECTION (HOMEPAGE ONLY) */}
      {activeMode === 'patient' && currentPage === 'home' && (
        <section className="w-full bg-gradient-to-b from-[#e6fffa] via-[#f0fdfa] to-white border-b border-teal-100/70 no-print overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
              
              {/* Left Column: Headline, Trust Badges, and Direct CTAs */}
              <div className="lg:col-span-7 space-y-5 sm:space-y-6 pb-8 sm:pb-14">
                
                {/* 2 Minimal Feature Trust Badges */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white text-teal-900 font-bold text-xs sm:text-[13px] border border-teal-200/80 shadow-2xs">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{t('trustBadge1')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white text-teal-800 font-bold text-xs sm:text-[13px] border border-teal-200/80 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{t('trustBadge2')}</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.25] break-words">
                  {t('heroTitlePrefix')}
                  <span className="text-teal-700">{t('heroTitleAccent')}</span>
                </h1>

                <p className="text-[15px] sm:text-[17px] text-slate-600 max-w-xl leading-relaxed">
                  {t('heroSubtitle')}
                </p>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleGoToDoctors('ALL')}
                    className="flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px] sm:text-[16px] shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <span>{t('heroCtaBook')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoToTrack()}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-xl font-bold text-[15px] sm:text-[16px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Search className="w-4 h-4 text-teal-600" />
                    <span>{t('heroCtaTrack')}</span>
                  </button>
                </div>

              </div>

              {/* Right Column: Hero Cutout Image with Blended Hospital Logo Backdrop Effect */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end items-end self-end pt-2 lg:pt-0">
                <div className="relative w-full max-w-md lg:max-w-lg flex items-end justify-center">
                  
                  {/* Backdrop Layer 1: Ambient Glowing Radial Aura */}
                  <div className="absolute -inset-4 sm:-inset-8 bg-gradient-to-tr from-teal-400/20 via-cyan-300/15 to-teal-200/25 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                  {/* Backdrop Layer 2: Hospital Cross Emblem Watermark (Soft Blend 15-20% Opacity) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-15 sm:opacity-20 pointer-events-none -z-10 scale-110 sm:scale-125">
                    <svg className="w-60 h-60 sm:w-80 sm:h-80 text-teal-800" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
                    </svg>
                  </div>

                  {/* Front: Transparent Cut-out Photo Seamlessly Resting on Section Baseline */}
                  <img
                    src="/assets/hero-banner.png"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/hero-banner.svg';
                    }}
                    alt="Doctor, Nurse and Patient"
                    className="relative z-10 w-auto max-h-[260px] sm:max-h-[360px] lg:max-h-[480px] object-contain select-none drop-shadow-md block"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* FULL-WIDTH HEADER (ASSISTANT DESK VIEW) */}
      {activeMode === 'assistant' && (
        <section className="w-full bg-[#f0f7f3] border-b border-slate-100 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-teal-800 text-[13px] font-semibold border border-teal-200 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span className="notranslate" translate="no">{t('assistantDeskBadge')}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {t('assistantDeskTitle')}
              </h1>
              <p className="text-[14px] sm:text-[16px] text-slate-600 max-w-2xl leading-relaxed">
                {t('assistantDeskSub')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetDemo}
              disabled={isResetting}
              className="w-full xs:w-auto px-5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-[14px] font-semibold border border-slate-200 shadow-xs transition-colors shrink-0 self-start md:self-auto cursor-pointer text-center"
            >
              {isResetting ? (
                <span>রিসেট হচ্ছে...</span>
              ) : (
                <span>{t('vivaDemoReset')}</span>
              )}
            </button>
          </div>
        </section>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
        
        {/* PATIENT PORTAL ROUTING */}
        {activeMode === 'patient' && (
          <div className="space-y-12">
            
            {/* VIEW 1: HOMEPAGE (Specialty Categories Grid ONLY - NO DOCTOR LIST ON HOMEPAGE) */}
            {currentPage === 'home' && (
              <SpecialtyGrid
                selectedDept={selectedDept}
                onSelectSpecialty={handleSelectSpecialty}
                doctors={doctors}
              />
            )}

            {/* VIEW 2: DEDICATED DOCTOR LISTING PAGE (Meditaj 2-Column Directory & Filters) */}
            {currentPage === 'doctors' && (
              <DoctorListing
                doctors={doctors}
                selectedDept={selectedDept}
                onSelectDept={setSelectedDept}
                onSelectDoctorToBook={handleSelectDoctorToBook}
                onGoHome={handleGoHome}
              />
            )}

            {/* VIEW 3: 2-COLUMN SPLIT-SCREEN CHECKOUT */}
            {currentPage === 'checkout' && selectedDoctorForCheckout && (
              <SplitScreenCheckout
                doctor={selectedDoctorForCheckout}
                patientUser={patientUser}
                onBack={() => handleGoToDoctors(selectedDept)}
                onGoHome={handleGoHome}
                onGoToDoctors={() => handleGoToDoctors(selectedDept)}
                onBookingSuccess={handleBookingSuccess}
              />
            )}

            {/* VIEW 4: PATIENT LIVE STATUS TRACKER */}
            {currentPage === 'track' && (
              <PatientTracker
                initialPhone={trackedPhone}
                onSelectSlipForPrint={(apt) => setSelectedSlipForPrint(apt)}
                onGoHome={handleGoHome}
                onGoToDoctors={() => handleGoToDoctors('ALL')}
                showToast={showToast}
              />
            )}

          </div>
        )}

        {/* ASSISTANT DESK FLOW (Protected by Auth) */}
        {activeMode === 'assistant' && (
          <AssistantDesk
            doctors={doctors}
            onRefreshDoctors={fetchDoctorsAndStats}
            onSelectSlipForPrint={(apt) => setSelectedSlipForPrint(apt)}
            showToast={showToast}
            assistantUser={assistantUser}
            onAssistantLogout={handleAssistantLogout}
          />
        )}

      </main>

      {/* Auth Modals */}
      <AssistantLoginModal
        isOpen={showAssistantLoginModal}
        onClose={() => setShowAssistantLoginModal(false)}
        onLoginSuccess={handleAssistantLoginSuccess}
      />

      <PatientLoginModal
        isOpen={showPatientLoginModal}
        initialMode={patientLoginMode}
        onClose={() => setShowPatientLoginModal(false)}
        onLoginSuccess={handlePatientLoginSuccess}
      />

      {/* Printable Slip Modal */}
      {selectedSlipForPrint && (
        <PrintableSlipModal
          appointment={selectedSlipForPrint}
          onClose={() => setSelectedSlipForPrint(null)}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Professional Minimal Copyright Footer with Google Translate Protection */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 sm:mt-16 no-print text-center select-none px-4">
        <p className="text-xs sm:text-[14px] text-slate-500 font-medium notranslate" translate="no">
          কিওর হসপিটাল ব্যবস্থাপনা সিস্টেম | © 2026 Cure Hospital. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </LanguageProvider>
  );
}
