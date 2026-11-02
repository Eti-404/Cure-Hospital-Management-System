# "নিরাময়" (Niramoy) - স্মার্ট হসপিটাল সেবা
### Smart Hospital Management System (Tertiary Government Hospital Model)

[![Git Branch: demo](https://img.shields.io/badge/branch-demo-emerald?style=flat-square)](https://github.com/Eti-404/Niramoy_System/tree/demo)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Design: Mint Organic](https://img.shields.io/badge/Design-%23f1f7f4-brightgreen?style=flat-square)](#)

---

## 📌 Project Overview
**"নিরাময়" (Niramoy)** is a citizen-centric, full-stack hospital management system specifically tailored for tertiary government hospitals in Bangladesh (such as Central Government Medical College Hospitals). It bridges the gap between citizens and public healthcare infrastructure by digitizing Outpatient Department (OPD) ticketing, electronic prescriptions (EMR), live bed vacancy tracking, and automated government medicine dispensing.

---

## 🏗️ Tech Stack
- **Frontend:** React 18 (Vite) + Tailwind CSS + Lucide Icons
- **Backend:** Node.js + Express.js (REST API, JWT, RBAC)
- **Database:** PostgreSQL via Supabase (ACID compliance & RLS ready)
- **Design Language:** Modern, soft organic mint/sage background (`#f1f7f4`), rounded-2xl containers, bilingual UI (বাংলা primary, English support).

---

## 🛡️ Zero-Leak Security & Git Branching Strategy
- **Active Dev Branch:** `demo` (Initial code, feature commits, and testing).
- **Production Branch:** `main` (Merge from `demo` only after local testing and final review).
- **Zero-Leak Mandate:**
  - Never commit `.env` or sensitive API keys.
  - Strict `.gitignore` enforced.
  - Use `.env.example` as a template.

---

## 🗄️ Database Setup (Supabase PostgreSQL)
1. Open your project on the [Supabase Dashboard](https://supabase.com).
2. Navigate to **SQL Editor**.
3. Copy the entire contents of [`database/schema.sql`](./database/schema.sql) and click **Run**.
4. The migration script will:
   - Create all 11 relational tables with foreign keys and check constraints.
   - Configure compound performance indexes.
   - Seed initial users:
     - **Admin:** `01700000001` (Password: `Password@123`)
     - **Pharmacist:** `01700000002` (Password: `Password@123`)
     - **Doctor (Medicine):** `01711111111` (Password: `Password@123`)
     - **Doctor (Pediatrics):** `01722222222` (Password: `Password@123`)
     - **Doctor (Cardiology):** `01733333333` (Password: `Password@123`)
     - **Sample Patient:** `01812345678` (Password: `Password@123`)
   - Populate live bed inventory (General, Cabin, ICU, CCU, NICU).
   - Seed 10 Government subsidized free medicines with stock numbers.
