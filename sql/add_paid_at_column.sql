-- ADD PAID_AT TIMESTAMP TO TICKETS
-- This column will track exactly when a ticket was verified/paid.

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Migration: Set paid_at to created_at for already paid tickets (optional but helpful)
-- UPDATE tickets SET paid_at = created_at WHERE status = 'paid' AND paid_at IS NULL;
