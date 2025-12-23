-- Add status column to tickets
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid';

-- Add check constraint for valid statuses
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_status_check CHECK (status IN ('reserved', 'paid'));

-- Ensure RLS allows admin to update status
-- (Existing policies usually cover "ALL" for authenticated, but good to double check via 'secure_production_rls.sql' which we ran earlier)
-- "Admin Manage Tickets" policy covers UPDATE.
