import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MfsPaymentModal({ 
  isOpen, 
  onClose, 
  amount = 800, 
  doctorName, 
  onPaymentSuccess 
}) {
  const { lang, t } = useLanguage();
  const [provider, setProvider] = useState('bkash'); // 'bkash' | 'nagad' | 'rocket'
  const [mfsNumber, setMfsNumber] = useState('01812345678');
  const [pin, setPin] = useState('12345');
  const [step, setStep] = useState('input'); // 'input' | 'processing' | 'success'
  const [trxId, setTrxId] = useState('');

  if (!isOpen) return null;

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setStep('processing');

    setTimeout(() => {
      const generatedTrx = `${provider.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setTrxId(generatedTrx);
      setStep('success');

      setTimeout(() => {
        onPaymentSuccess({
          payment_method: 'ONLINE_MFS',
          payment_status: 'PAID_ONLINE',
          provider,
          trx_id: generatedTrx,
        });
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-sm">
              ৳
            </div>
            <div>
              <h3 className="font-extrabold text-[16px] tracking-tight">
                {lang === 'bn' ? 'অনলাইন MFS পেমেন্ট গেটওয়ে' : 'Online MFS Payment Gateway'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn' ? 'নিরাপদ ডিজিটাল ফি পরিশোধ' : 'Secure Instant Digital Payment'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on step */}
        {step === 'processing' ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h4 className="text-lg font-bold text-slate-800">
              {lang === 'bn' ? 'পেমেন্ট প্রসেসিং হচ্ছে...' : 'Processing Payment...'}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {lang === 'bn' ? 'দয়া করে অপেক্ষা করুন, ব্যাংক ও এমএফএস গেটওয়ে ট্রানজেকশন যাচাই করছে।' : 'Verifying transaction with mobile financial service gateway.'}
            </p>
          </div>
        ) : step === 'success' ? (
          <div className="p-10 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h4 className="text-xl font-black text-slate-900">
              {lang === 'bn' ? 'পেমেন্ট সফল হয়েছে!' : 'Payment Successful!'}
            </h4>
            <p className="text-sm font-semibold text-teal-700">
              {lang === 'bn' ? `সর্বমোট পরিশোধিত: ৳${amount}` : `Total Paid: ৳${amount}`}
            </p>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
              TrxID: <strong>{trxId}</strong>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট চূড়ান্তভাবে নিশ্চিত করা হচ্ছে...' : 'Finalizing your confirmed appointment...'}
            </p>
          </div>
        ) : (
          <form onSubmit={handlePaySubmit} className="p-6 space-y-5">
            
            {/* Amount Summary */}
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {lang === 'bn' ? 'প্রদেয় কনসালটেশন ফি' : 'Payable Fee'}
                </span>
                <p className="text-xs text-slate-600 truncate max-w-[200px]">{doctorName}</p>
              </div>
              <div className="text-2xl font-black text-teal-700">
                ৳{amount}
              </div>
            </div>

            {/* Provider Selection (bKash, Nagad, Rocket) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {lang === 'bn' ? 'MFS ওয়ালেট নির্বাচন করুন' : 'Select MFS Provider'}
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('bkash')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    provider === 'bkash'
                      ? 'border-[#e2136e] bg-[#e2136e]/10 ring-2 ring-[#e2136e]/20 text-[#e2136e] font-black'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold'
                  }`}
                >
                  <span className="block text-sm">bKash</span>
                  <span className="text-[10px] text-slate-400 font-medium">বিকাশ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('nagad')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    provider === 'nagad'
                      ? 'border-[#f7941d] bg-[#f7941d]/10 ring-2 ring-[#f7941d]/20 text-[#f7941d] font-black'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold'
                  }`}
                >
                  <span className="block text-sm">Nagad</span>
                  <span className="text-[10px] text-slate-400 font-medium">নগদ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('rocket')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    provider === 'rocket'
                      ? 'border-[#8c3494] bg-[#8c3494]/10 ring-2 ring-[#8c3494]/20 text-[#8c3494] font-black'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold'
                  }`}
                >
                  <span className="block text-sm">Rocket</span>
                  <span className="text-[10px] text-slate-400 font-medium">রকেট</span>
                </button>
              </div>
            </div>

            {/* MFS Account Number */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-700">
                {lang === 'bn' ? `${provider.toUpperCase()} একাউন্ট নম্বর` : `${provider.toUpperCase()} Mobile Number`}
              </label>
              <input
                type="tel"
                maxLength={11}
                value={mfsNumber}
                onChange={(e) => setMfsNumber(e.target.value)}
                placeholder="01812345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 font-mono text-[15px] outline-none"
                required
              />
            </div>

            {/* PIN */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-700">
                {lang === 'bn' ? 'ডেমো পিন (PIN)' : 'Demo PIN'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="•••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 font-mono text-[15px] outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
              <p className="text-[11px] text-slate-400">
                * {lang === 'bn' ? 'ভাইভা ডেমোর জন্য যেকোনো ৫ ডিজিটের পিন গ্রহণ করা হবে।' : 'Any 5-digit PIN accepted for viva demonstration.'}
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px] shadow-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{lang === 'bn' ? `৳${amount} পরিশোধ করুন` : `Pay ৳${amount} Now`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
