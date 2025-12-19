-- 1. Updates to Raffles table
alter table public.raffles 
add column if not exists allow_multi_ticket boolean default false;

-- 2. New Payment Methods table
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid references public.raffles(id) on delete cascade,
  bank_name text not null,      -- e.g. "Bancolombia", "Nequi"
  account_number text,          -- e.g. "3001234567"
  account_type text,            -- e.g. "Ahorros", "Corriente", "Celular"
  account_owner text,           -- e.g. "Juan Perez"
  instruction text,             -- e.g. "Enviar comprobante al WhatsApp..."
  created_at timestamptz default now()
);

-- Policies for payment_methods
alter table public.payment_methods enable row level security;
create policy "public_view_payment_methods" on public.payment_methods for select using (true);
create policy "admin_manage_payment_methods" on public.payment_methods for all using (true);

-- 3. Updates to Tickets table to support receipts
alter table public.tickets 
add column if not exists payment_receipt_url text;

-- 4. Storage Bucket for Receipts
-- (Note: Bucket creation usually needs to be done via dashboard or specific API, 
-- but we can try inserting into storage.buckets if permissions allow, 
-- otherwise we assume 'images' bucket exists or we use a new 'receipts' folder in it)
-- We will use the existing 'public' bucket or 'images' if available, adding a 'receipts' folder path.
