# "নিরাময়" (Niramoy) - Hospital Management System
### Academic Project - Problem No. 5: Patient Appointment & Slot-Based Confirmation

[![Git Branch: demo](https://img.shields.io/badge/branch-demo-emerald?style=flat-square)](https://github.com/Eti-404/Niramoy_System/tree/demo)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Design: Mint Organic](https://img.shields.io/badge/Design-%23f1f7f4-brightgreen?style=flat-square)](#)
[![Preview: Live](https://img.shields.io/badge/Preview-http%3A%2F%2Flocalhost%3A5173-059669?style=flat-square)](http://localhost:5173)

---

## 📌 Project Overview & Problem No. 5 Objective
**"নিরাময়" (Niramoy)** is a modern, responsive, lightweight Hospital Management System built for academic defense, viva presentation, and real-world hospital Outpatient Department (OPD) triage.

The system addresses **Problem No. 5** with a visual, seamless, and mathematically consistent slot management workflow:
1. **Patient Appointment Request:** Patients can browse doctors across medical departments and submit appointment requests.
2. **Existing Patient Auto-Retrieval:** Instant phone number lookup auto-populates old patient demographic details (Name, Age, Gender) with smooth animation.
3. **New Patient Entry:** New patients or assistants can easily enter patient details and submit the request.
4. **Slot-Based Confirmation:** In the Assistant Desk, the hospital assistant verifies doctor slot availability. Upon **1-click Confirmation**, the doctor's free slots count decrements by 1, and a digital token is issued. If slots reach 0, booking/confirmation is automatically blocked.
5. **Cancellation Logic:** The assistant can cancel an appointment anytime. If the appointment was previously confirmed, the doctor's available slot immediately increments by 1 (freed up), and the patient's tracker updates in real-time.

---

## 🗄️ 3 Core Database Tables (Supabase PostgreSQL)
Defined in [`database/problem5_schema.sql`](./database/problem5_schema.sql):

```sql
-- 1. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 130),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctors Table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    available_slots INT DEFAULT 10 CHECK (available_slots >= 0),
    designation VARCHAR(150) DEFAULT 'Consultant',
    room_no VARCHAR(50) DEFAULT 'Room 101',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    token_id VARCHAR(50),
    symptoms TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✨ Standout UI/UX & Innovative Features

- **Visual Doctor Slot Badges:** Dynamic color-coded slot indicator on every doctor card:
  - 🟢 **Green:** Available (e.g., `8 Slots Available`)
  - 🟡 **Amber:** Limited (e.g., `3 Slots Left`)
  - 🔴 **Red:** Full (e.g., `0 Slots - Booking Disabled`)
- **Instant Phone Auto-Lookup:** Auto-fills Name, Age, Gender with visual badge (`Existing Patient Found`) as soon as 11 digits are entered.
- **Topbar Mode Switcher:** Single-click toggle between **"রোগী পোর্টাল (Patient Portal)"** and **"সহকারী ডেস্ক (Assistant Desk)"** for smooth thesis demonstrations.
- **Patient Live Status Tracker:** Patients track their request status by phone number (`PENDING`, `CONFIRMED`, `CANCELLED`).
- **Printable Digital Token Slip:** Modern token slip displaying Doctor Name, Room Number, Date, Patient Details, Token ID, and hospital branding with `@media print` layout.
- **Assistant Triage Desk:** Clean tabs for *Pending Requests*, *Confirmed*, *Cancelled*, and *Doctor Live Slots* with instant 1-click Confirm and Cancel actions.
- **1-Click Demo Reset Button:** Reset demo data back to default state anytime during defense presentations.

---

## 🏗️ Tech Stack
- **Frontend:** React 18 (Vite) + Tailwind CSS + Lucide React Icons
- **Backend:** Node.js + Express.js REST API
- **Database:** Supabase PostgreSQL (with resilient offline-ready in-memory fallback)
- **Design Theme:** Soft organic Mint/Sage background (`#f1f7f4`), rounded-3xl cards, smooth borders (`#dbe7df`)

---

## 🚀 Running the Project Locally

### 1. Start Express Backend API (Port 5000)
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://127.0.0.1:5000`*

### 2. Start React (Vite) Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🎯 Quick Demo Numbers for Viva Board

| Mobile Number | Patient Name | Role / State in System |
|---|---|---|
| `01812345678` | মো. আব্দুল করিম (Abdul Karim) | Existing patient; has Pending request |
| `01711223344` | রহিমা খাতুন (Rahima Khatun) | Existing patient; has Confirmed Token (`NIR-2026-101`) |
| `01655443322` | শিরিন আক্তার (Shirin Akter) | Existing patient; has Cancelled request |
| Any new 11-digit number | New Patient Entry | Demonstrates new registration flow |
| Dr. Mahmud Alam (ENT) | 0 Slots available | Demonstrates slot full & disabled booking |
