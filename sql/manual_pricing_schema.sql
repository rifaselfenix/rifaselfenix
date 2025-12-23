-- 1. Ensure Currencies Table Exists and is correct
CREATE TABLE IF NOT EXISTS public.currencies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE, -- USD, VES, COP
  name text NOT NULL,        -- Dólar, Bolivar, Peso
  symbol text NOT NULL,      -- $, Bs, COL
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Policies for currencies
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read currencies" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "Admin manage currencies" ON public.currencies FOR ALL USING (true);

-- Insert default currencies if empty
INSERT INTO public.currencies (code, name, symbol)
VALUES 
  ('USD', 'Dólar', '$'),
  ('VES', 'Bolívar', 'Bs'),
  ('COP', 'Peso Colombio', '$')
ON CONFLICT (code) DO NOTHING;

-- 2. New Table: Manual Prices per Raffle
CREATE TABLE IF NOT EXISTS public.raffle_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id uuid REFERENCES public.raffles(id) ON DELETE CASCADE,
  currency_code text NOT NULL, -- FK to currencies.code ideally, but text is fine for flexibility
  price numeric NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Policies for raffle_prices
ALTER TABLE public.raffle_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read prices" ON public.raffle_prices FOR SELECT USING (true);
CREATE POLICY "Admin manage prices" ON public.raffle_prices FOR ALL USING (true);

-- 3. Migration: Create default prices for existing raffles
-- This ensures existing raffles don't break. We create a USD price for each existing raffle.
INSERT INTO public.raffle_prices (raffle_id, currency_code, price, is_primary)
SELECT id, 'USD', price, true FROM public.raffles;
