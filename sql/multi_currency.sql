-- Create currencies table
create table if not exists public.currencies (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  symbol text not null,
  rate numeric not null default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.currencies enable row level security;

-- Policies
create policy "Allow public read access" on public.currencies
  for select using (true);

create policy "Allow admin full access" on public.currencies
  for all using (
    auth.role() = 'authenticated'
  );

-- Insert default currencies
insert into public.currencies (code, name, symbol, rate, is_active)
values 
  ('USD', 'Dólar', '$', 1, true),
  ('VES', 'Bolívar', 'Bs', 55.00, true),
  ('COP', 'Peso Colombiano', 'COL', 4200.00, true)
on conflict (code) do nothing;
