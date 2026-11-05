import React, { useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  X, 
  Trash2, 
  Printer, 
  ArrowRight,
  Inbox,
  Check
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationDropdown({ onSelectSlipForPrint, onGoToTrack }) {
  const { lang, t } = useLanguage();
  const { 
    notifications, 
    unreadCount, 
    isBellOpen, 
    setIsBellOpen, 
    markAllAsRead, 
    clearAllNotifications, 
    removeNotification 
  } = useNotifications();

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsBellOpen(false);
      }
    }

    if (isBellOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBellOpen, setIsBellOpen]);

  const handleNotificationClick = (notif) => {
    if (notif.appointment && onSelectSlipForPrint && notif.type === 'CONFIRMED') {
      onSelectSlipForPrint(notif.appointment);
      setIsBellOpen(false);
    } else if (notif.phone && onGoToTrack) {
      onGoToTrack(notif.phone);
      setIsBellOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsBellOpen((prev) => !prev);
          if (!isBellOpen && unreadCount > 0) {
            // markAllAsRead(); // or let user mark as read
          }
        }}
        className={`relative p-1.5 sm:p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
          isBellOpen
            ? 'bg-teal-800 text-white border-teal-500 shadow-xs'
            : 'bg-black/25 hover:bg-black/40 text-teal-200 hover:text-white border-white/15'
        }`}
        title={lang === 'bn' ? 'নোটিফিকেশন ও আপডেট' : 'Notifications & Updates'}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Pop-over Card */}
      {isBellOpen && (
        <div className="fixed inset-x-3 top-18 sm:top-full sm:mt-2.5 sm:absolute sm:inset-x-auto sm:right-0 w-auto sm:w-96 max-w-md mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200/90 text-slate-800 z-50 overflow-hidden animate-fade-in font-sans">
          
          {/* Header */}
          <div className="bg-[#f0fdfa] px-4 py-3 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                {lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span className="bg-teal-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} {lang === 'bn' ? 'নতুন' : 'new'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1 cursor-pointer"
                  title={lang === 'bn' ? 'পঠিত হিসেবে চিহ্নিত করুন' : 'Mark all as read'}
                >
                  <Check className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'পঠিত' : 'Read'}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  title={lang === 'bn' ? 'সব মুছে ফেলুন' : 'Clear all'}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'মুছুন' : 'Clear'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">
                  {lang === 'bn' ? 'কোনো নতুন নোটিফিকেশন নেই' : 'No new notifications'}
                </p>
                <p className="text-xs text-slate-400">
                  {lang === 'bn' 
                    ? 'অ্যাপয়েন্টমেন্ট অনুমোদন বা বাতিলের নোটিফিকেশন এখানে প্রদর্শিত হবে।' 
                    : 'Real-time booking and confirmation updates will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isConfirmed = notif.type === 'CONFIRMED';
                const isCancelled = notif.type === 'CANCELLED';
                const isPending = notif.type === 'PENDING';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 relative group ${
                      notif.read ? 'bg-white hover:bg-slate-50' : 'bg-teal-50/50 hover:bg-teal-50'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isConfirmed && (
                        <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      )}
                      {isCancelled && (
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                          <XCircle className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      )}
                      {isPending && (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Clock className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      )}
                      {!isConfirmed && !isCancelled && !isPending && (
                        <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-1 pr-4">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold leading-snug ${
                          isConfirmed ? 'text-teal-950' : isCancelled ? 'text-rose-900' : 'text-slate-900'
                        }`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {notif.time || 'এইমাত্র'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Pills */}
                      <div className="pt-1.5 flex flex-wrap items-center gap-2">
                        {isConfirmed && notif.appointment && onSelectSlipForPrint && (
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'স্লিপ দেখুন' : 'View Slip'}</span>
                          </button>
                        )}

                        {notif.phone && onGoToTrack && (
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 transition-all cursor-pointer"
                          >
                            <span>{lang === 'bn' ? 'ট্র্যাক করুন' : 'Track'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dismiss single notification button */}
                    <button
                      type="button"
                      onClick={() => removeNotification(notif.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 transition-opacity p-1 cursor-pointer absolute top-2 right-2"
                      title={lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                {lang === 'bn' ? 'সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করুন' : 'Mark all notifications as read'}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
