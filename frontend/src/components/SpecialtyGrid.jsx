import React from 'react';
import { 
  Stethoscope, 
  HeartPulse, 
  Baby, 
  Ear, 
  UserCheck, 
  Activity, 
  Sparkles, 
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SPECIALTIES = [
  {
    id: 'medicine',
    name: 'মেডিসিন বিভাগ',
    enName: 'General Medicine',
    icon: Stethoscope,
    keyword: 'Medicine',
  },
  {
    id: 'cardiology',
    name: 'হৃদরোগ বিভাগ',
    enName: 'Cardiology',
    icon: HeartPulse,
    keyword: 'Cardiology',
  },
  {
    id: 'pediatrics',
    name: 'শিশু বিভাগ',
    enName: 'Pediatrics',
    icon: Baby,
    keyword: 'Pediatrics',
  },
  {
    id: 'ent',
    name: 'নাক-কান-গলা',
    enName: 'ENT',
    icon: Ear,
    keyword: 'ENT',
  },
  {
    id: 'gynecology',
    name: 'গাইনী ও প্রসূতি',
    enName: 'Gynecology',
    icon: UserCheck,
    keyword: 'Gynecology',
  },
  {
    id: 'orthopedics',
    name: 'অর্থোপেডিক',
    enName: 'Orthopedics',
    icon: Activity,
    keyword: 'Orthopedics',
  },
  {
    id: 'dermatology',
    name: 'চর্ম ও এলার্জি',
    enName: 'Dermatology',
    icon: Sparkles,
    keyword: 'Dermatology',
  },
  {
    id: 'ophthalmology',
    name: 'চক্ষু বিভাগ',
    enName: 'Ophthalmology',
    icon: Eye,
    keyword: 'Ophthalmology',
  },
];

export default function SpecialtyGrid({ selectedDept, onSelectSpecialty, doctors = [] }) {
  const { lang, t } = useLanguage();

  // Helper to count available doctors for a specialty
  const getDoctorCount = (keyword) => {
    return doctors.filter((doc) => 
      (doc.department || '').toLowerCase().includes(keyword.toLowerCase())
    ).length;
  };

  return (
    <section id="specialty-grid-section" className="py-8 sm:py-10 space-y-8 scroll-mt-20">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('specialtySectionTitle')}
        </h2>
        <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
          {t('specialtySectionSub')}
        </p>
      </div>

      {/* 8 Specialty Cards Grid (4 cols on desktop, 2 on mobile) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {SPECIALTIES.map((spec) => {
          const Icon = spec.icon;
          const count = getDoctorCount(spec.keyword);
          const isSelected = selectedDept === spec.keyword;

          return (
            <div
              key={spec.id}
              onClick={() => onSelectSpecialty(spec.keyword)}
              className={`rounded-2xl p-3.5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative select-none ${
                isSelected
                  ? 'bg-teal-50/90 border-2 border-teal-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] -translate-y-1'
                  : 'bg-white hover:bg-slate-50/70 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-1 hover:border-teal-400'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 text-teal-600">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 fill-teal-100" />
                </div>
              )}

              <div>
                {/* Icon Container */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2.5 sm:mb-4 transition-colors ${
                  isSelected 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'bg-teal-50 text-teal-700 group-hover:bg-teal-100'
                }`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>

                {/* Title */}
                <h3 className="text-[14px] sm:text-[17px] font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors break-words">
                  {lang === 'bn' ? spec.name : spec.enName}
                </h3>
                <p className="text-[11px] sm:text-[13px] text-slate-500 font-medium mt-0.5 truncate">
                  {lang === 'bn' ? spec.enName : spec.name}
                </p>
              </div>

              {/* Specialist Count Tag */}
              <div className="mt-3 sm:mt-4 pt-1 sm:pt-2 flex items-center">
                <span className={`text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/70 group-hover:bg-teal-50 group-hover:text-teal-800 group-hover:border-teal-200'
                }`}>
                  {count > 0 
                    ? (lang === 'bn' ? `${count} ${t('specialistCount')}` : `${count} ${t('specialistCount')}`)
                    : t('specialistCount')
                  }
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
