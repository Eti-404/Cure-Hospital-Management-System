import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  Briefcase, 
  Star, 
  RotateCcw, 
  ArrowRight, 
  Filter, 
  ChevronRight, 
  Home
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SPECIALTIES } from './SpecialtyGrid';

export default function DoctorListing({ 
  doctors = [], 
  selectedDept = 'ALL', 
  onSelectDept, 
  onSelectDoctorToBook,
  onGoHome
}) {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');

  // Clean & robust doctor experience formatter: strips any corrupt punctuation (、, ,, ?, etc.)
  const formatDoctorExperience = (exp) => {
    if (!exp) return lang === 'bn' ? '৮ বছরের অভিজ্ঞতা' : '8 years experience';
    // Remove any corrupt leading punctuation like 、 or , or ? or bullet
    const cleanStr = exp.toString().replace(/^[^০-৯0-9a-zA-Z]+/, '').trim();
    const numMatch = cleanStr.match(/^[০-৯0-9]+/);
    if (numMatch) {
      return lang === 'bn' ? `${numMatch[0]} বছরের অভিজ্ঞতা` : `${numMatch[0]} years experience`;
    }
    return cleanStr;
  };

  // Find active specialty info if any
  const currentSpecialty = useMemo(() => {
    if (!selectedDept || selectedDept === 'ALL') return null;
    return SPECIALTIES.find(
      (s) => s.keyword.toLowerCase() === selectedDept.toLowerCase()
    );
  }, [selectedDept]);

  const currentDeptName = currentSpecialty
    ? (lang === 'bn' ? currentSpecialty.name : currentSpecialty.enName)
    : selectedDept;

  // Filter logic
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // 1. Department Filter
      if (selectedDept && selectedDept !== 'ALL') {
        const docDept = (doc.department || '').toLowerCase();
        const target = selectedDept.toLowerCase();
        if (!docDept.includes(target)) return false;
      }

      // 2. Day Filter
      if (selectedDayFilter && selectedDayFilter !== 'ALL') {
        const days = doc.schedule_days || [];
        if (selectedDayFilter === 'Sat-Mon-Wed' && !days.includes('Sat') && !days.includes('Mon')) return false;
        if (selectedDayFilter === 'Sun-Tue-Thu' && !days.includes('Sun') && !days.includes('Tue')) return false;
      }

      // 3. Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (doc.name || '').toLowerCase().includes(q);
        const deptMatch = (doc.department || '').toLowerCase().includes(q);
        const degreeMatch = (doc.degree || '').toLowerCase().includes(q);
        if (!nameMatch && !deptMatch && !degreeMatch) return false;
      }

      return true;
    });
  }, [doctors, selectedDept, selectedDayFilter, searchQuery]);

  // Helper: Count doctors per specialty
  const getSpecialtyCount = (keyword) => {
    return doctors.filter((d) => 
      (d.department || '').toLowerCase().includes(keyword.toLowerCase())
    ).length;
  };

  const handleResetFilters = () => {
    if (onSelectDept) onSelectDept('ALL');
    setSelectedDayFilter('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedDept !== 'ALL' || selectedDayFilter !== 'ALL' || searchQuery.trim() !== '';

  return (
    <section id="doctor-listing-section" className="space-y-6 animate-fade-in scroll-mt-24 font-sans">
      
      {/* 0. TOP BREADCRUMB NAVIGATION & BACK TO HOME */}
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
        <button
          type="button"
          onClick={() => onSelectDept && onSelectDept('ALL')}
          className={`transition-colors cursor-pointer ${
            selectedDept === 'ALL'
              ? 'text-slate-900 font-extrabold cursor-default pointer-events-none'
              : 'text-slate-600 hover:text-teal-700 font-semibold'
          }`}
        >
          {lang === 'bn' ? 'বিশেষজ্ঞ ডাক্তারগণ' : 'Specialist Doctors'}
        </button>
        {selectedDept !== 'ALL' && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-teal-900 font-bold bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
              {currentDeptName}
            </span>
          </>
        )}
      </nav>

      {/* 1. TOP INSTANT SEARCH BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchDoctorPlaceholder')}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-[15px] sm:text-[16px] text-slate-800 transition-all placeholder:text-slate-400"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
            {filteredDoctors.length} {lang === 'bn' ? 'জন ডাক্তার প্রস্তুত' : 'Doctors found'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('resetFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MEDITAJ 2-COLUMN LAYOUT (LEFT SIDEBAR FILTER + RIGHT DIRECTORY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: FILTER SIDEBAR (lg:col-span-4) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-[16px]">
                  {t('browseBySpecialty')}
                </h3>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {lang === 'bn' ? 'রিসেট' : 'Reset'}
                </button>
              )}
            </div>

            {/* Specialty List Navigation */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              
              {/* All Departments Button */}
              <button
                type="button"
                onClick={() => onSelectDept('ALL')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[14px] font-bold transition-all cursor-pointer ${
                  selectedDept === 'ALL'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200/60'
                }`}
              >
                <span>{lang === 'bn' ? 'সকল বিভাগ (All Specialties)' : 'All Specialties'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  selectedDept === 'ALL' ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {doctors.length}
                </span>
              </button>

              {/* 8 Specialty Buttons */}
              {SPECIALTIES.map((spec) => {
                const count = getSpecialtyCount(spec.keyword);
                const isSelected = selectedDept.toLowerCase() === spec.keyword.toLowerCase();

                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => onSelectDept(spec.keyword)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[14px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 border border-teal-300 font-bold shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-600' : 'bg-slate-300'}`}></span>
                      <span className="truncate">{lang === 'bn' ? spec.name : spec.enName}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isSelected ? 'bg-teal-200 text-teal-950' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}

            </div>

            {/* Quick Visiting Day Filter */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {lang === 'bn' ? 'ভিজিটিং বার ফিল্টার' : 'Visiting Schedule'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter('ALL')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedDayFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'bn' ? 'সকল বার' : 'All Days'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter('Sat-Mon-Wed')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedDayFilter === 'Sat-Mon-Wed'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'bn' ? 'শনি-সোম-বুধ' : 'Sat-Mon-Wed'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter('Sun-Tue-Thu')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedDayFilter === 'Sun-Tue-Thu'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'bn' ? 'রবি-মঙ্গল-বৃহস্পতি' : 'Sun-Tue-Thu'}
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* RIGHT COLUMN: MEDITAJ DOCTOR DIRECTORY (lg:col-span-8) */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Main List Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {selectedDept === 'ALL'
                  ? t('allSpecialistsTitle')
                  : (lang === 'bn' ? `${currentDeptName} বিশেষজ্ঞ ডাক্তারগণ` : `${currentDeptName} Specialists`)}
              </h2>
              <p className="text-[14px] text-slate-500 mt-0.5">
                {selectedDept === 'ALL'
                  ? t('allSpecialistsSub')
                  : (lang === 'bn'
                      ? `${currentDeptName} বিভাগের অভিজ্ঞ বিশেষজ্ঞ ডাক্তারদের চেম্বার ও ৩০ মিনিটের স্লট সময়সূচী`
                      : `Chambers and 30-minute consultation schedules of verified ${currentDeptName} specialists`)}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shrink-0 self-start sm:self-auto">
              {filteredDoctors.length} {lang === 'bn' ? 'টি চেম্বার তালিকাভুক্ত' : 'Chambers listed'}
            </span>
          </div>

          {/* Empty State */}
          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">
                {t('noDoctorsFound')}
              </h4>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                {lang === 'bn' ? 'দয়া করে ভিন্ন কি-ওয়ার্ড দিয়ে খুঁজুন অথবা ফিল্টার রিসেট করুন।' : 'Please try a different search keyword or reset your filters.'}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all shadow-xs cursor-pointer"
              >
                {t('resetFilters')}
              </button>
            </div>
          ) : (
            /* MEDITAJ DOCTOR CARDS LIST */
            <div className="space-y-4">
              {filteredDoctors.map((doc) => {
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-teal-300 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    
                    {/* Left & Middle: Doctor Info */}
                    <div className="flex items-start gap-4 flex-1">
                      
                      {/* Doctor Avatar / Icon with Verification Pill */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-100 to-cyan-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs group-hover:scale-105 transition-transform">
                          <Stethoscope className="w-8 h-8 stroke-[2]" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center border-2 border-white text-[10px]" title="Verified Specialist">
                          ✓
                        </span>
                      </div>

                      {/* Doctor Details */}
                      <div className="space-y-1.5 flex-1">
                        
                        {/* Department Badge & Rating */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-block text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                            {doc.department}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{doc.rating || 4.9}</span>
                            <span className="text-amber-800/60 font-normal">({doc.reviews_count || 120}+)</span>
                          </span>
                        </div>

                        {/* Name & Degree */}
                        <h3 className="text-[19px] sm:text-[20px] font-black text-slate-900 tracking-tight leading-snug group-hover:text-teal-700 transition-colors">
                          {doc.name}
                        </h3>
                        <p className="text-[13px] font-semibold text-slate-700">
                          {doc.degree}
                        </p>
                        <p className="text-[13px] text-slate-500">
                          {doc.designation}
                        </p>

                        {/* Experience & Room (Cleaned without strange symbols) */}
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-[13px] text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="notranslate font-semibold text-slate-700" translate="no">
                              {formatDoctorExperience(doc.experience)}
                            </span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{t('room')}: {doc.room_no}</span>
                          </span>
                        </div>

                        {/* Schedule & 30-Min Slot Badge */}
                        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                            <span>{lang === 'bn' ? doc.schedule_days_bn : (doc.schedule_days ? doc.schedule_days.join(', ') : 'Sat, Mon, Wed')}</span>
                          </span>

                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-900 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span>{lang === 'bn' ? doc.schedule_time_bn : doc.visiting_time}</span>
                            <span className="text-[11px] font-bold text-teal-700">(৩০ মিনিট স্লট)</span>
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Right: Fee Box & "Select & Book" Action Button */}
                    <div className="md:border-l md:border-slate-100 md:pl-6 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
                      
                      <div className="text-left md:text-right">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                          {t('consultationFee')}
                        </span>
                        <div className="text-2xl font-black text-teal-700 tracking-tight">
                          ৳{doc.fee || 800}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectDoctorToBook(doc)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] shadow-sm transition-all hover:scale-[1.02] cursor-pointer shrink-0"
                      >
                        <span>{t('selectAndBook')}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>

      </div>

    </section>
  );
}
