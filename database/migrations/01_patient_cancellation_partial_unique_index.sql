-- ============================================================================
-- Migration: Patient Self-Cancellation & Slot Re-booking Constraint Update
-- Description: Drop rigid unique constraint and replace with Partial Unique Index
--              allowing re-booking of slots that were previously CANCELLED.
-- ============================================================================

-- Drop old rigid constraint if it exists
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS uq_doctor_slot_date;

-- Drop old partial index if re-running
DROP INDEX IF EXISTS uq_active_doctor_slot_date;

-- Create partial unique index only for active bookings (PENDING or CONFIRMED)
CREATE UNIQUE INDEX uq_active_doctor_slot_date 
ON public.appointments (doctor_id, appointment_date, time_slot) 
WHERE status IN ('PENDING', 'CONFIRMED');
