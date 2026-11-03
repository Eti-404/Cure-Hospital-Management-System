import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
  };

  const borders = {
    success: 'border-teal-300 bg-white/95 text-teal-950 ring-4 ring-teal-500/10',
    error: 'border-rose-300 bg-white/95 text-rose-950 ring-4 ring-rose-500/10',
    warning: 'border-amber-300 bg-white/95 text-amber-950 ring-4 ring-amber-500/10',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-fade-in no-print">
      <div className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 ${borders[type] || borders.success} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          {icons[type] || icons.success}
          <p className="text-xs sm:text-sm font-semibold leading-snug">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
