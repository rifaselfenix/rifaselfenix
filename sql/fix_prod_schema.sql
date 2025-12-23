-- Consolidated schema fix for Production
-- Run this entire script in the SQL Editor of your Supabase Dashboard

-- 1. TICKET UPDATES
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid';

-- Relax check constraint if it exists to allow 'reserved'
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('reserved', 'paid'));

-- 2. RAFFLE UPDATES
ALTER TABLE public.raffles ADD COLUMN IF NOT EXISTS total_tickets INTEGER DEFAULT 10000;
ALTER TABLE public.raffles ADD COLUMN IF NOT EXISTS allow_multi_ticket BOOLEAN DEFAULT false;

-- 3. PAYMENT METHODS TABLE
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid references public.raffles(id) on delete cascade,
  bank_name text not null,
  account_number text,
  account_type text,
  account_owner text,
  image_url text, -- For QR code or logo
  instruction text,
  created_at timestamptz default now()
);

-- Policies for payment_methods (idempotent)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "admin_manage_payment_methods" ON public.payment_methods;

CREATE POLICY "public_view_payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "admin_manage_payment_methods" ON public.payment_methods FOR ALL USING (true);
