import React, { useState } from 'react';
import { ShieldCheck, User, X, Lock, Mail, Phone, Check, AlertCircle, Key } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

/**
 * Assistant Staff Login Modal
 * Protects the Assistant Desk from unauthorized public access
 */
export function AssistantLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { lang, t } = useLanguage();
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickFillDemo = () => {
    setEmailOrId('assistant@cure.com');
    setPassword('admin123');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrId.trim() || !password.trim()) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।' : 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Demo authentication logic (accepts assistant@cure.com or staff id with password admin123)
      if (
        (emailOrId.toLowerCase().includes('assistant') || emailOrId.toLowerCase().includes('staff') || emailOrId === 'admin') &&
        (password === 'admin123' || password === '123456')
      ) {
        const staffUser = {
          name: lang === 'bn' ? 'মো. আরিফুর রহমান (স্টাফ আইডি: ১০১)' : 'Md. Arifur Rahman (Staff ID: 101)',
          email: emailOrId,
          role: 'assistant',
        };
        onLoginSuccess(staffUser);
        onClose();
      } else {
        setError(
          lang === 'bn' 
            ? 'ভুল ইমেইল বা পাসওয়ার্ড। ডেমো অ্যাক্সেসের জন্য নিচের ডেমো বাটনে চাপুন।' 
            : 'Invalid credentials. Click the demo helper button below for quick access.'
        );
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in font-sans">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-cyan-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-teal-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-teal-300 stroke-[2.2]" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            {lang === 'bn' ? 'সহকারী ডেস্ক সাইন-ইন' : 'Assistant Desk Sign In'}
          </h3>
          <p className="text-teal-100 text-[13px] mt-1">
            {lang === 'bn' 
              ? 'শুধুমাত্র অনুমোদিত হাসপাতাল স্টাফদের জন্য সংরক্ষিত' 
              : 'Authorized hospital staff access only'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          
          {/* Demo Quick-Fill Pill */}
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
            <div className="text-xs text-teal-900">
              <span className="font-bold">{lang === 'bn' ? 'ভাইভা ডেমো অ্যাক্সেস:' : 'Viva Demo Credentials:'}</span>
              <p className="font-mono text-teal-700 mt-0.5">assistant@cure.com • admin123</p>
            </div>
            <button
              type="button"
              onClick={handleQuickFillDemo}
              className="text-xs font-bold px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ডেমো পূরণ' : 'Quick Fill'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-[14px] font-semibold text-slate-700">
                {lang === 'bn' ? 'স্টাফ ইমেইল বা আইডি' : 'Staff Email or ID'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  placeholder="assistant@cure.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-[15px]"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[14px] font-semibold text-slate-700">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-[15px]"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px] rounded-xl shadow-xs transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{lang === 'bn' ? 'লগইন করুন ও ডেস্কে প্রবেশ করুন' : 'Sign In & Enter Desk'}</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

/**
 * Patient Login / Registration Modal
 * Lets patients sign in with mobile number and auto-populates their booking details
 */
export function PatientLoginModal({ isOpen, onClose, onLoginSuccess, initialMode = 'login' }) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialMode); // 'login' | 'register'
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    setActiveTab(initialMode || 'login');
    setError('');
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handlePhoneChange = async (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPhone(val);

    if (val.length === 11) {
      setIsLookingUp(true);
      try {
        const result = await api.lookupPatient(val);
        setIsLookingUp(false);
        if (result.found && result.data) {
          setFullName(result.data.full_name || '');
          if (result.data.age) setAge(result.data.age.toString());
          if (result.data.gender) setGender(result.data.gender);
        }
      } catch (err) {
        setIsLookingUp(false);
      }
    }
  };

  const handleDemoFill = () => {
    setPhone('01812345678');
    setFullName('মো. আব্দুল করিম');
    setAge('৪৫');
    setGender('Male');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (phone.length < 11) {
      setError(lang === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' : 'Please enter an 11-digit mobile number.');
      return;
    }
    if (!fullName.trim()) {
      setError(lang === 'bn' ? 'আপনার নাম প্রদান করুন।' : 'Please enter your name.');
      return;
    }

    const patient = {
      phone: phone.trim(),
      name: fullName.trim(),
      age: parseInt(age, 10) || 35,
      gender: gender || 'Male'
    };
    onLoginSuccess(patient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in font-sans">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-teal-400 stroke-[2.2]" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            {activeTab === 'register' 
              ? (lang === 'bn' ? 'নতুন রোগী রেজিস্ট্রেশন' : 'New Patient Registration')
              : (lang === 'bn' ? 'রোগী সাইন-ইন / লগইন' : 'Patient Sign In')}
          </h3>
          <p className="text-slate-300 text-[13px] mt-1">
            {lang === 'bn' 
              ? 'মোবাইল নম্বর দিয়ে সাইন ইন করে সরাসরি অ্যাপয়েন্টমেন্ট নিন ও ট্র্যাক করুন' 
              : 'Sign in with your phone to seamlessly book and track appointments'}
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? 'লগইন করুন (Sign In)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? 'নতুন রেজিস্ট্রেশন (Sign Up)' : 'Sign Up'}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          
          {/* Demo helper */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              {lang === 'bn' ? 'ডেমো রোগী নম্বর:' : 'Demo Patient:'} <strong>01812345678</strong>
            </span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs font-bold px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'অটো-ফিল' : 'Auto Fill'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-[14px] font-semibold text-slate-700">
                {lang === 'bn' ? 'মোবাইল নম্বর * (১১ ডিজিট)' : 'Mobile Number * (11 digits)'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="01812345678"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none font-mono text-[15px]"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                {isLookingUp && (
                  <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin absolute right-3.5 top-3.5"></div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[14px] font-semibold text-slate-700">
                {lang === 'bn' ? 'রোগীর পূর্ণ নাম *' : 'Full Name *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === 'bn' ? 'মো. আব্দুল করিম' : 'Md. Abdul Karim'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-[15px]"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {activeTab === 'register' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'বয়স' : 'Age'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="35"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[14px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-[14px] bg-white"
                  >
                    <option value="Male">{lang === 'bn' ? 'পুরুষ' : 'Male'}</option>
                    <option value="Female">{lang === 'bn' ? 'মহিলা' : 'Female'}</option>
                    <option value="Other">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px] rounded-xl shadow-xs transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {activeTab === 'register' 
                  ? (lang === 'bn' ? 'রেজিস্ট্রেশন সম্পন্ন করুন' : 'Complete Registration')
                  : (lang === 'bn' ? 'সাইন ইন সম্পন্ন করুন' : 'Complete Sign In')}
              </span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
