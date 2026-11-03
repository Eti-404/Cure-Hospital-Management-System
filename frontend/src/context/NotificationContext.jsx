import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

const STORAGE_KEY = 'cure_notifications_v1';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'notif-welcome',
        type: 'INFO',
        title: 'রিয়েল-টাইম নোটিফিকেশন সক্রিয়',
        message: 'কিওর হসপিটাল ওপিডি কেয়ার সিস্টেমে স্বাগতম। সহকারী ডেস্কে স্ট্যাটাস পরিবর্তন হলে এখানে সরাসরি দেখতে পাবেন।',
        time: 'এইমাত্র',
        read: false,
        createdAt: Date.now(),
      },
    ];
  });

  const [isBellOpen, setIsBellOpen] = useState(false);

  // Sync with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Add a new notification
  const addNotification = ({ type = 'INFO', title, message, appointment = null, phone = null, tokenId = null }) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type, // 'CONFIRMED' | 'CANCELLED' | 'PENDING' | 'INFO'
      title,
      message,
      appointment,
      phone,
      tokenId: tokenId || (appointment && appointment.token_id),
      time: 'এইমাত্র',
      read: false,
      createdAt: Date.now(),
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 24)]);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Remove single notification
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Global listener for appointment sync events
  useEffect(() => {
    const handleSyncEvent = (event) => {
      const { action, appointment, message, phone } = event.detail || {};
      if (!appointment) return;

      const docName = appointment.doctor?.name || 'বিশেষজ্ঞ ডাক্তার';
      const dateStr = appointment.appointment_date || '';
      const slotStr = appointment.time_slot || '';
      const tokenId = appointment.token_id || '';
      const targetPhone = phone || (appointment.patient && appointment.patient.phone) || '';

      if (action === 'CONFIRMED' || action === 'WALKIN_CREATED') {
        addNotification({
          type: 'CONFIRMED',
          title: 'অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে!',
          message: `আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে! ডা. ${docName} - ${dateStr} (${slotStr})। টোকেন নং: ${tokenId || 'CURE-2026-CONFIRMED'}`,
          appointment,
          phone: targetPhone,
          tokenId,
        });
      } else if (action === 'CANCELLED') {
        const isOnlinePaid = appointment.payment_status === 'REFUNDED' || 
                             appointment.payment_status === 'PAID_ONLINE' || 
                             appointment.payment_method === 'ONLINE_MFS' ||
                             appointment.was_paid_online ||
                             Boolean(appointment.refund_processed);
        const refundAmt = appointment.refund_amount || appointment.consultation_fee || 800;

        addNotification({
          type: 'CANCELLED',
          title: isOnlinePaid ? 'অ্যাপয়েন্টমেন্ট বাতিল ও ফি রিফান্ড প্রসেস সম্পন্ন' : 'অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে',
          message: isOnlinePaid
            ? `আপনার অ্যাপয়েন্টমেন্টটি বাতিল করা হয়েছে এবং প্রদেয় ৳${refundAmt} রিফান্ড প্রসেস করা হয়েছে।`
            : `আপনার ডা. ${docName}-এর সাথে নির্ধারিত অ্যাপয়েন্টমেন্টটি (${dateStr}, ${slotStr}) বাতিল করা হয়েছে।`,
          appointment,
          phone: targetPhone,
          tokenId: null,
        });
      } else if (action === 'ONLINE_REQUESTED') {
        addNotification({
          type: 'PENDING',
          title: 'অ্যাপয়েন্টমেন্টের অনুরোধ জমা হয়েছে',
          message: `ডা. ${docName}-এর চেম্বারে ${dateStr} (${slotStr})-এর জন্য আপনার অনুরোধ অপেক্ষমান রয়েছে। সহকারী ডেস্ক থেকে দ্রুত কনফার্ম করা হবে।`,
          appointment,
          phone: targetPhone,
        });
      }
    };

    window.addEventListener('cure_appointment_synced', handleSyncEvent);
    return () => window.removeEventListener('cure_appointment_synced', handleSyncEvent);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isBellOpen,
        setIsBellOpen,
        addNotification,
        markAllAsRead,
        clearAllNotifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
