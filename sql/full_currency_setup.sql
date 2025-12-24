-- 1. Create Currencies Table
CREATE TABLE IF NOT EXISTS public.currencies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL, -- USD, VES, COP
    name text NOT NULL,
    symbol text NOT NULL,
    rate numeric DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 2. Create Raffle Prices Table (for manual override)
CREATE TABLE IF NOT EXISTS public.raffle_prices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    raffle_id uuid REFERENCES public.raffles(id) ON DELETE CASCADE,
    currency_code text REFERENCES public.currencies(code) ON DELETE CASCADE,
    price numeric NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable Security (RLS)
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_prices ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allow public read, admin write)
CREATE POLICY "Public read currencies" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "Admin manage currencies" ON public.currencies FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read prices" ON public.raffle_prices FOR SELECT USING (true);
CREATE POLICY "Admin manage prices" ON public.raffle_prices FOR ALL USING (auth.role() = 'authenticated');

-- 5. Insert Default Data
INSERT INTO public.currencies (code, name, symbol, rate, is_active)
VALUES 
('USD', 'Dólar Estadounidense', '$', 1, true),
('VES', 'Bolívar Venezolano', 'Bs.', 60, true),
('COP', 'Peso Colombiano', '$', 4200, true)
ON CONFLICT (code) DO UPDATE 
SET rate = EXCLUDED.rate;
