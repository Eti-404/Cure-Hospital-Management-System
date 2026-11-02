-- ============================================================================
-- "নিরাময়" (Niramoy) - Smart Hospital Management System
-- Database Schema & Seed Data (PostgreSQL for Supabase)
-- Target: Single Tertiary Government Hospital (e.g., Central Medical College Hospital)
-- ============================================================================

-- Enable UUID extension for robust distributed identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. DROP EXISTING TABLES (Safe Re-run Sequence in Reverse Dependency Order)
-- ============================================================================
DROP TABLE IF EXISTS medicine_stock_logs CASCADE;
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS opd_tickets CASCADE;
DROP TABLE IF EXISTS doctor_rosters CASCADE;
DROP TABLE IF EXISTS bed_transfers_emergency CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS doctor_profiles CASCADE;
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 2. CORE TABLE DEFINITIONS
-- ============================================================================

-- Table 1: USERS (Core Authentication & Role Management)
-- Supports Patient, Doctor, Hospital Admin, Pharmacy/Dispensary
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(20) UNIQUE NOT NULL,
    nid VARCHAR(30) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin', 'pharmacy')),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: PATIENT_PROFILES (Demographics & Medical Profile)
CREATE TABLE patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    blood_group VARCHAR(10),
    date_of_birth DATE,
    gender VARCHAR(20),
    emergency_contact VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: DOCTOR_PROFILES (Designation, Department & Chamber Allocations)
CREATE TABLE doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    designation VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    bmdc_reg_number VARCHAR(50) UNIQUE NOT NULL,
    chamber_number VARCHAR(50) NOT NULL,
    room_no VARCHAR(50) NOT NULL,
    consultation_fee NUMERIC(10, 2) DEFAULT 0.00,
    is_on_leave BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: DOCTOR_ROSTERS (Duty Shifts & Token Quotas)
CREATE TABLE doctor_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    duty_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('morning', 'evening', 'night')),
    max_tokens INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: OPD_TICKETS (Digital Tickets with 10 BDT Simulated MFS Payment & Token)
CREATE TABLE opd_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE SET NULL,
    department VARCHAR(100) NOT NULL,
    fee_bdt NUMERIC(10, 2) DEFAULT 10.00,
    payment_status VARCHAR(20) DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'WAIVED')),
    payment_method VARCHAR(30) DEFAULT 'bKash' CHECK (payment_method IN ('bKash', 'Nagad', 'Rocket', 'Cash', 'Simulated_MFS')),
    transaction_id VARCHAR(100),
    queue_token INT NOT NULL,
    visit_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: PRESCRIPTIONS (Doctor EMR Consultation Records)
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID UNIQUE REFERENCES opd_tickets(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    chief_complaints TEXT,
    clinical_diagnosis TEXT,
    advice TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: MEDICINES (Government Free Medicine Inventory & Public Directory)
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    strength VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Tablet', 'Syrup', 'Injection', 'Capsule', 'Suspension', 'Eye Drops', 'Ointment', 'Sachet')),
    unit VARCHAR(50) NOT NULL,
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    min_alert_threshold INT DEFAULT 50,
    is_govt_free BOOLEAN DEFAULT TRUE,
    counter_collection_policy TEXT DEFAULT 'ডাক্তারের প্রেসক্রিপশন প্রদর্শন সাপেক্ষে সরকারি কাউন্টার থেকে সম্পূর্ণ বিনামূল্যে বিতরণযোগ্য।',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 8: PRESCRIPTION_ITEMS (Prescribed Medicines & Dispensing State)
-- NOTE: medicine_id is intentionally NULLABLE to allow doctors to prescribe non-inventory/external medicines
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL, -- NULLABLE: Allows doctors to prescribe medicines outside hospital inventory
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL, -- e.g., '1+0+1', '1+1+1', '0+0+1'
    duration VARCHAR(50) NOT NULL, -- e.g., '7 days', '14 days'
    instructions TEXT, -- e.g., 'খাবারের পর (After meal)', 'খাবারের আগে (Before meal)'
    is_dispensed BOOLEAN DEFAULT FALSE,
    dispensed_at TIMESTAMPTZ
);

-- Table 9: BEDS (Bed/ICU/CCU/NICU Matrix Controller)
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_name VARCHAR(100) NOT NULL,
    bed_number VARCHAR(50) UNIQUE NOT NULL,
    bed_type VARCHAR(30) NOT NULL CHECK (bed_type IN ('GENERAL', 'CABIN', 'ICU', 'CCU', 'NICU')),
    status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),
    current_patient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 10: BED_TRANSFERS_EMERGENCY (Emergency Referral Review Queue)
CREATE TABLE bed_transfers_emergency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(150) NOT NULL,
    patient_nid VARCHAR(30),
    contact_number VARCHAR(20) NOT NULL,
    requested_bed_type VARCHAR(30) NOT NULL CHECK (requested_bed_type IN ('GENERAL', 'CABIN', 'ICU', 'CCU', 'NICU')),
    allocated_bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    clinical_reason TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 11: MEDICINE_STOCK_LOGS (Dispensary Stock-In and Dispensing Audit Trail)
CREATE TABLE medicine_stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('STOCK_IN', 'DISPENSED', 'ADJUSTED')),
    quantity INT NOT NULL,
    reference_prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_nid ON users(nid);
CREATE INDEX idx_opd_tickets_queue ON opd_tickets(visit_date, doctor_id, queue_token);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_beds_type_status ON beds(bed_type, status);
CREATE INDEX idx_medicines_generic ON medicines(generic_name);
CREATE INDEX idx_medicines_category ON medicines(category);

-- ============================================================================
-- 4. REALISTIC SEED DATA (Bangla & English Context)
-- Default test password for all seeded users: 'Password@123'
-- Bcrypt Hash: $2a$10$wT0lQnvyE6B1e8z.QZJmve5V62T43E2R.G3p7p19m9q9wK7oH8Zq.
-- ============================================================================

-- 4.1 USERS & PROFILES SEEDING
-- A) Hospital Admin
INSERT INTO users (id, full_name, mobile_number, nid, role, password_hash)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ডা. মো. শফিকুল ইসলাম (Super Admin)',
    '01700000001',
    '1980000000001',
    'admin',
    '$2a$10$wT0lQnvyE6B1e8z.QZJmve5V62T43E2R.G3p7p19m9q9wK7oH8Zq.'
);

-- B) Dispensary / Pharmacy Officer
INSERT INTO users (id, full_name, mobile_number, nid, role, password_hash)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'ফার্মাসিস্ট কামরুল হাসান (Dispensary Officer)',
    '01700000002',
    '1985000000002',
    'pharmacy',
    '$2a$10$wT0lQnvyE6B1e8z.QZJmve5V62T43E2R.G3p7p19m9q9wK7oH8Zq.'
);

-- C) 3 Doctors (Medicine, Pediatrics, Cardiology)
INSERT INTO users (id, full_name, mobile_number, nid, role, password_hash)
VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'ডা. রফিকুল ইসলাম (Dr. Rafiqul Islam)',
    '01711111111',
    '1982111111111',
    'doctor',
    '$2a$10$wT0lQnvyE6B1e8z.QZJmve5V62T43E2R.G3p7p19m9q9wK7oH8Zq.'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'ডা. নুসরাত জাহান (Dr. Nusrat Jahan)',
    '01722222222',
    '1986222222222',
    'doctor',
    '$2a$10$wT0lQnvyE6B1e8z.QZJmve5V62T43E2R.G3p7p19m9q9wK7oH8Zq.'
),
(
    'd0000000-0000-0000-0000-000000000003',
    'ডা. তারিকুল হাসান (Dr. Tariqul Hasan)',
    '01733333333',
    '1979333333333',
    'doctor',
    '$2a$10$wT0lQnvyE6B1e8z.QZJmve5V62T43E2R.G3p7p19m9q9wK7oH8Zq.'
);

-- Doctor Profiles
INSERT INTO doctor_profiles (id, user_id, designation, department, bmdc_reg_number, chamber_number, room_no, is_on_leave)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'সহযোগী অধ্যাপক (মেডিসিন)',
    'মেডিসিন বিভাগ (General Medicine)',
    'BMDC-A-45892',
    'চেম্বার ১০১ (Chamber 101)',
    '১০১-ক',
    FALSE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'সহকারী অধ্যাপক (শিশু বিশেষজ্ঞ)',
    'শিশু বিভাগ (Pediatrics)',
    'BMDC-A-52140',
    'চেম্বার ২০৫ (Chamber 205)',
    '২০৫-খ',
    FALSE
),
(
    'b0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000003',
    'কনসালটেন্ট (হৃদরোগ বিশেষজ্ঞ)',
    'কার্ডিওলজি বিভাগ (Cardiology)',
    'BMDC-A-38914',
    'চেম্বার ৩১০ (Chamber 310)',
    '৩১০-গ',
    FALSE
);

-- Active Rosters for Today
INSERT INTO doctor_rosters (doctor_id, duty_date, shift, max_tokens, is_active)
VALUES
('b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'morning', 60, TRUE),
('b0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'morning', 50, TRUE),
('b0000000-0000-0000-0000-000000000003', CURRENT_DATE, 'morning', 40, TRUE);

-- D) Sample Patient
INSERT INTO users (id, full_name, mobile_number, nid, role, password_hash)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'মো. আব্দুল করিম (Abdul Karim)',
    '01812345678',
    '1995123456789',
    'patient',
    '$2a$10$wT0lQnvyE6B1e8z.QZJmve5V62T43E2R.G3p7p19m9q9wK7oH8Zq.'
);

INSERT INTO patient_profiles (user_id, blood_group, date_of_birth, gender, emergency_contact, address)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'B+',
    '1995-05-15',
    'Male',
    '01811112233',
    'মিরপুর-১০, ঢাকা'
);

-- 4.2 BEDS SEEDING (General, Cabin, ICU, CCU, NICU)
INSERT INTO beds (ward_name, bed_number, bed_type, status)
VALUES
-- General Male Ward
('পুরুষ সাধারণ ওয়ার্ড (Male General)', 'GM-01', 'GENERAL', 'AVAILABLE'),
('পুরুষ সাধারণ ওয়ার্ড (Male General)', 'GM-02', 'GENERAL', 'OCCUPIED'),
('পুরুষ সাধারণ ওয়ার্ড (Male General)', 'GM-03', 'GENERAL', 'AVAILABLE'),
('পুরুষ সাধারণ ওয়ার্ড (Male General)', 'GM-04', 'GENERAL', 'AVAILABLE'),
-- General Female Ward
('মহিলা সাধারণ ওয়ার্ড (Female General)', 'GF-01', 'GENERAL', 'AVAILABLE'),
('মহিলা সাধারণ ওয়ার্ড (Female General)', 'GF-02', 'GENERAL', 'OCCUPIED'),
('মহিলা সাধারণ ওয়ার্ড (Female General)', 'GF-03', 'GENERAL', 'AVAILABLE'),
-- Cabins
('ভিআইপি কেবিন ব্লক (Cabin)', 'CAB-101', 'CABIN', 'AVAILABLE'),
('ভিআইপি কেবিন ব্লক (Cabin)', 'CAB-102', 'CABIN', 'OCCUPIED'),
-- ICU (Intensive Care Unit)
('নিবিড় পরিচর্যা কেন্দ্র (ICU)', 'ICU-01', 'ICU', 'OCCUPIED'),
('নিবিড় পরিচর্যা কেন্দ্র (ICU)', 'ICU-02', 'ICU', 'AVAILABLE'),
('নিবিড় পরিচর্যা কেন্দ্র (ICU)', 'ICU-03', 'ICU', 'AVAILABLE'),
-- CCU (Coronary Care Unit)
('করোনারি কেয়ার ইউনিট (CCU)', 'CCU-01', 'CCU', 'AVAILABLE'),
('করোনারি কেয়ার ইউনিট (CCU)', 'CCU-02', 'CCU', 'OCCUPIED'),
-- NICU (Neonatal ICU)
('নবজাতক নিবিড় সেবা (NICU)', 'NICU-01', 'NICU', 'AVAILABLE'),
('নবজাতক নিবিড় সেবা (NICU)', 'NICU-02', 'NICU', 'AVAILABLE');

-- 4.3 10 GOVERNMENT FREE MEDICINES SEEDING
INSERT INTO medicines (id, brand_name, generic_name, strength, category, unit, stock_quantity, min_alert_threshold, is_govt_free, counter_collection_policy)
VALUES
(
    'm0000000-0000-0000-0000-000000000001',
    'প্যারাসিটামল (Napa / Ace eqv)',
    'Paracetamol',
    '500 mg',
    'Tablet',
    'স্ট্রিপ (১০ পাতা)',
    1500,
    100,
    TRUE,
    'জ্বর ও ব্যথার উপসর্গে চিকিৎসকের প্রেসক্রিপশন অনুসারে বিনামূল্যে সরবরাহযোগ্য।'
),
(
    'm0000000-0000-0000-0000-000000000002',
    'ওমিপ্রাজল (Seclo eqv)',
    'Omeprazole',
    '20 mg',
    'Capsule',
    'স্ট্রিপ (১০ ক্যাপসুল)',
    2000,
    150,
    TRUE,
    'গ্যাস্ট্রিক ও আলসারের চিকিৎসার জন্য প্রেসক্রিপশন ভিত্তিক কাউন্টার বিতরণ।'
),
(
    'm0000000-0000-0000-0000-000000000003',
    'অ্যামোক্সিসিলিন (Moxacil eqv)',
    'Amoxicillin',
    '500 mg',
    'Capsule',
    'স্ট্রিপ (১০ ক্যাপসুল)',
    800,
    80,
    TRUE,
    'ব্যাকটেরিয়াল ইনফেকশনের চিকিৎসায় সম্পূর্ণ কোর্স গ্রহণ আবশ্যক।'
),
(
    'm0000000-0000-0000-0000-000000000004',
    'মেটফর্মিন (Comet eqv)',
    'Metformin Hydrochloride',
    '500 mg',
    'Tablet',
    'স্ট্রিপ (১০ পাতা)',
    1200,
    100,
    TRUE,
    'ডায়াবেটিস রোগীদের জন্য নিয়মিত প্রেসক্রিপশন কার্ড দেখিয়ে সংগ্রহযোগ্য।'
),
(
    'm0000000-0000-0000-0000-000000000005',
    'অ্যামলোডিপিন (Amdocal eqv)',
    'Amlodipine',
    '5 mg',
    'Tablet',
    'স্ট্রিপ (১০ পাতা)',
    950,
    80,
    TRUE,
    'উচ্চ রক্তচাপ নিয়ন্ত্রণে কার্ডিওলজি/মেডিসিন ডাক্তারের সিলযুক্ত স্লিপে প্রযোজ্য।'
),
(
    'm0000000-0000-0000-0000-000000000006',
    'সালবিউটামল (Sultolin eqv)',
    'Salbutamol',
    '2 mg',
    'Tablet',
    'স্ট্রিপ (১০ পাতা)',
    600,
    50,
    TRUE,
    'অ্যাজমা ও শ্বাসকষ্টের রোগীদের জন্য বিনামূল্যে বিতরণযোগ্য।'
),
(
    'm0000000-0000-0000-0000-000000000007',
    'খাবার স্যালাইন (ORS Sachet)',
    'Oral Rehydration Salts',
    '9.8 g',
    'Sachet',
    'প্যাকেট',
    3500,
    300,
    TRUE,
    'ডায়রিয়া ও ডিহাইড্রেশনের তাৎক্ষণিক সুরক্ষায় ওপিডি কাউন্টার থেকে সরাসরি সংগ্রহ।'
),
(
    'm0000000-0000-0000-0000-000000000008',
    'সিপ্রোফ্লক্সাসিন (Ciprocin eqv)',
    'Ciprofloxacin',
    '500 mg',
    'Tablet',
    'স্ট্রিপ (১০ পাতা)',
    750,
    60,
    TRUE,
    'ইউটিআই ও ইনফেকশনে সরকারি স্বাস্থ্য নীতিমালায় রেজিস্টার্ড প্রেসক্রিপশনে দেয়।'
),
(
    'm0000000-0000-0000-0000-000000000009',
    'অ্যান্টাসিড প্লাস সাসপেনশন',
    'Aluminium Hydroxide + Magnesium Hydroxide',
    '200 ml',
    'Suspension',
    'বোতল',
    380,
    40,
    TRUE,
    'তীব্র এসিডিটি ও বুকজ্বালায় ডাক্তারের নির্দেশ অনুযায়ী ওপিডি ফার্মেসি কাউন্টার থেকে সংগ্রহীয়।'
),
(
    'm0000000-0000-0000-0000-000000000010',
    'অ্যাজিথ্রোমাইসিন (Zimax eqv)',
    'Azithromycin',
    '500 mg',
    'Tablet',
    'স্ট্রিপ (৬ পাতা)',
    500,
    50,
    TRUE,
    'শ্বাসতন্ত্রের তীব্র সংক্রমণের চিকিৎসায় রেজিস্টার্ড চিকিৎসকের প্রেসক্রিপশন প্রদর্শন সাপেক্ষে।'
);

-- Initial Stock Log Entries (Central Depot Receipt)
INSERT INTO medicine_stock_logs (medicine_id, change_type, quantity, notes, created_by)
SELECT id, 'STOCK_IN', stock_quantity, 'প্রাথমিক সরকারি সেন্ট্রাল ডিপো চালান প্রাপ্তি (Initial Central Depot Stock-In)', 'a0000000-0000-0000-0000-000000000002'
FROM medicines;

-- 4.4 INITIAL OPD DEMO TICKET & PRESCRIPTION
-- Generates 1 initial consultation demonstrating the complete pipeline
INSERT INTO opd_tickets (
    id,
    ticket_number,
    patient_id,
    doctor_id,
    department,
    fee_bdt,
    payment_status,
    payment_method,
    transaction_id,
    queue_token,
    visit_date,
    status
)
VALUES (
    't0000000-0000-0000-0000-000000000001',
    'OPD-20261102-001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'মেডিসিন বিভাগ (General Medicine)',
    10.00,
    'PAID',
    'bKash',
    'BK261102X9018',
    1,
    CURRENT_DATE,
    'COMPLETED'
);

INSERT INTO prescriptions (
    id,
    ticket_id,
    patient_id,
    doctor_id,
    chief_complaints,
    clinical_diagnosis,
    advice,
    follow_up_date
)
VALUES (
    'p0000000-0000-0000-0000-000000000001',
    't0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '৩ দিন যাবৎ মাঝারি মাত্রার জ্বর ও শুকনো কাশি (Moderate fever and dry cough for 3 days).',
    'Acute Upper Respiratory Tract Infection (URTI) / ভাইরাল ইনফেকশন',
    'পর্যাপ্ত কুসুম গরম পানি ও পুষ্টিকর তরল খাবার গ্রহণ করুন। ধুলাবালি এড়িয়ে চলুন। ৭ দিন পর পুনরায় দেখাবেন।',
    CURRENT_DATE + INTERVAL '7 days'
);

INSERT INTO prescription_items (
    prescription_id,
    medicine_id,
    medicine_name,
    dosage,
    duration,
    instructions,
    is_dispensed,
    dispensed_at
)
VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
    'Paracetamol 500 mg',
    '1+1+1',
    '৫ দিন (5 days)',
    'ভরা পেটে খাবেন (After meals)',
    TRUE,
    NOW()
),
(
    'p0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000002',
    'Omeprazole 20 mg',
    '1+0+1',
    '৭ দিন (7 days)',
    'খাবারের ৩০ মিনিট পূর্বে খাবেন (30 mins before meals)',
    FALSE,
    NULL
);
