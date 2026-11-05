-- ============================================================================
-- "নিরাময়" (Niramoy) - Hospital Management System
-- Academic Project - Problem No. 5
-- Core Database Schema (PostgreSQL for Supabase)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. DROP EXISTING TABLES (Reverse Dependency Order)
-- ============================================================================
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- ============================================================================
-- 2. CORE TABLE 1: PATIENTS
-- ============================================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 130),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CORE TABLE 2: DOCTORS
-- ============================================================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    available_slots INT DEFAULT 10 CHECK (available_slots >= 0),
    designation VARCHAR(150) DEFAULT 'Consultant',
    room_no VARCHAR(50) DEFAULT 'Room 101',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CORE TABLE 3: APPOINTMENTS
-- ============================================================================
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

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_doctors_department ON doctors(department);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Partial Unique Index: Only active appointments occupy a doctor's 30-minute time slot.
-- Cancelled appointments do NOT block re-booking of the slot.
DROP INDEX IF EXISTS uq_active_doctor_slot_date;
CREATE UNIQUE INDEX uq_active_doctor_slot_date 
ON appointments (doctor_id, appointment_date, time_slot) 
WHERE status IN ('PENDING', 'CONFIRMED');

-- ============================================================================
-- 6. SEED DATA (Academic Presentation & Viva Ready)
-- ============================================================================

-- Seed Doctors
INSERT INTO doctors (id, name, department, available_slots, designation, room_no) VALUES
('d1000000-0000-0000-0000-000000000001', 'ডা. রফিকুল ইসলাম (Dr. Rafiqul Islam)', 'General Medicine', 8, 'Senior Consultant & Professor', 'Room 101-A'),
('d1000000-0000-0000-0000-000000000002', 'ডা. নুসরাত জাহান (Dr. Nusrat Jahan)', 'Pediatrics (শিশু রোগ)', 5, 'Associate Professor', 'Room 205-B'),
('d1000000-0000-0000-0000-000000000003', 'ডা. তারিকুল হাসান (Dr. Tariqul Hasan)', 'Cardiology (হৃদরোগ)', 10, 'Chief Cardiologist', 'Room 310-C'),
('d1000000-0000-0000-0000-000000000004', 'ডা. ফাতেমা তুজ জোহরা (Dr. Fatema Zohra)', 'Gynecology & Obstetrics', 6, 'Consultant Obstetrician', 'Room 108-A'),
('d1000000-0000-0000-0000-000000000005', 'ডা. সাইদুর রহমান (Dr. Saidur Rahman)', 'Orthopedics (হাড় ও জোড়া)', 3, 'Orthopedic Surgeon', 'Room 402-D'),
('d1000000-0000-0000-0000-000000000006', 'ডা. মাহমুদ আলম (Dr. Mahmud Alam)', 'ENT & Head Neck', 0, 'Assistant Professor (ENT)', 'Room 214-B');
-- Note: Dr. Mahmud Alam has 0 slots to demonstrate the "Slot Full / Booking Disabled" feature in viva!

-- Seed Existing Patients (For Instant Auto-Lookup Demo)
INSERT INTO patients (id, full_name, phone, age, gender) VALUES
('p1000000-0000-0000-0000-000000000001', 'মো. আব্দুল করিম (Abdul Karim)', '01812345678', 45, 'Male'),
('p1000000-0000-0000-0000-000000000002', 'রহিমা খাতুন (Rahima Khatun)', '01711223344', 32, 'Female'),
('p1000000-0000-0000-0000-000000000003', 'তানভীর আহমেদ (Tanvir Ahmed)', '01988776655', 28, 'Male'),
('p1000000-0000-0000-0000-000000000004', 'শিরিন আক্তার (Shirin Akter)', '01655443322', 50, 'Female');

-- Seed Sample Appointments (Covering PENDING, CONFIRMED, CANCELLED states)
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, status, token_id, symptoms, confirmed_at) VALUES
-- Pending appointment awaiting Assistant Desk confirmation
('a1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', 'PENDING', NULL, 'মাঝারি মাত্রার জ্বর ও সর্দি (Fever and cough for 3 days)', NULL),

-- Confirmed appointment with Token ID
('a1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', CURRENT_DATE, 'CONFIRMED', 'NIR-2026-101', 'শিশুর ঠান্ডা এবং শ্বাসকষ্টের সমস্যা', NOW()),

-- Another Pending appointment
('a1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '2 day', 'PENDING', NULL, 'বুকের মাঝে চাপ ও শ্বাসকষ্ট (Chest tightness on exertion)', NULL),

-- Cancelled appointment
('a1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000005', CURRENT_DATE + INTERVAL '3 day', 'CANCELLED', NULL, 'হাঁটু ও কোমরের ব্যথা (Knee joint pain)', NULL);
