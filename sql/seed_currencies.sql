-- Add rate column if it doesn't exist (it should, but just partly)
ALTER TABLE public.currencies ADD COLUMN IF NOT EXISTS rate numeric DEFAULT 1;

-- Insert default currencies
INSERT INTO public.currencies (code, name, symbol, is_active, rate)
VALUES 
('USD', 'Dólar Estadounidense', '$', true, 1),
('VES', 'Bolívar Venezolano', 'Bs.', true, 60),
('COP', 'Peso Colombiano', '$', true, 4200)
ON CONFLICT (code) DO UPDATE 
SET rate = EXCLUDED.rate, is_active = true;

-- Ensure raffle_prices exists
CREATE TABLE IF NOT EXISTS public.raffle_prices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    raffle_id uuid REFERENCES public.raffles(id) ON DELETE CASCADE,
    currency_code text REFERENCES public.currencies(code) ON DELETE CASCADE,
    price numeric NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.raffle_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read prices" ON public.raffle_prices FOR SELECT USING (true);
CREATE POLICY "Admin manage prices" ON public.raffle_prices FOR ALL USING (auth.role() = 'authenticated');
