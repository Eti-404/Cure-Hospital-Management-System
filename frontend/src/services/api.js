/**
 * ============================================================================
 * Cure Hospital (কিওর হসপিটাল) - Frontend API Service Client
 * Connects to Vite proxy `/api`
 * ============================================================================
 */

const API_BASE = '/api';

export const api = {
  // 1. Get all doctors
  async getDoctors() {
    const res = await fetch(`${API_BASE}/doctors`);
    if (!res.ok) throw new Error('ডাক্তারদের তালিকা লোড করতে সমস্যা হয়েছে।');
    return res.json();
  },

  // 2. Get 30-minute slots for a doctor on a specific date
  async getDoctorSlots(doctorId, date) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error('স্লট তালিকা পেতে সমস্যা হয়েছে।');
    return res.json();
  },

  // 3. Instant phone lookup for existing patients
  async lookupPatient(phone) {
    if (!phone) return null;
    const res = await fetch(`${API_BASE}/patients/lookup?phone=${encodeURIComponent(phone.trim())}`);
    if (!res.ok) throw new Error('রোগী অনুসন্ধান ব্যর্থ হয়েছে।');
    return res.json();
  },

  // 4. Patient submits appointment request
  async submitAppointment(payload) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'অ্যাপয়েন্টমেন্ট অনুরোধ সম্পন্ন হয়নি।');
    return data;
  },

  // Alias for submitAppointment
  async createAppointment(payload) {
    return this.submitAppointment(payload);
  },

  // 5. Assistant Desk: Get appointments with optional status & search filters
  async getAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.date) params.append('date', filters.date);

    const res = await fetch(`${API_BASE}/appointments?${params.toString()}`);
    if (!res.ok) throw new Error('অ্যাপয়েন্টমেন্ট তালিকা পেতে সমস্যা হয়েছে।');
    return res.json();
  },

  // 6. Patient Status Tracker: Get all appointments by phone
  async trackByPhone(phone) {
    if (!phone) return { data: [], patient: null };
    const res = await fetch(`${API_BASE}/appointments/track?phone=${encodeURIComponent(phone.trim())}`);
    if (!res.ok) throw new Error('স্ট্যাটাস ট্র্যাক করতে সমস্যা হয়েছে।');
    return res.json();
  },

  // 7. Assistant Desk: Confirm appointment
  async confirmAppointment(id) {
    const res = await fetch(`${API_BASE}/appointments/${id}/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'কনফার্ম করতে ব্যর্থ হয়েছে।');
    return data;
  },

  // 8. Assistant Desk: Cancel appointment
  async cancelAppointment(id, reason = 'Assistant Cancellation') {
    const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'বাতিল করতে ব্যর্থ হয়েছে।');
    return data;
  },

  // 9. Reset Demo Data for Presentation / Viva demonstration
  async resetDemo() {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  // 10. Assistant Desk: Add New Doctor
  async addDoctor(payload) {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ডাক্তার যুক্ত করতে ব্যর্থ হয়েছে।');
    return data;
  },

  // 11. Assistant Desk: Remove Doctor
  async deleteDoctor(id) {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ডাক্তার অপসারণ ব্যর্থ হয়েছে।');
    return data;
  },

  // 12. Assistant Desk: Walk-in appointment
  async createWalkInAppointment(payload) {
    const res = await fetch(`${API_BASE}/appointments/walkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'সরাসরি বুকিং ব্যর্থ হয়েছে।');
    return data;
  },
};
