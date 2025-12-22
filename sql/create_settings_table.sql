-- Create a table for global app settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for conversion rates in checkout)
CREATE POLICY "Public Read Settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Allow public write access (since we don't have auth yet for admin)
CREATE POLICY "Public Write Settings"
ON public.app_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default conversion rate if not exists
INSERT INTO public.app_settings (key, value)
VALUES ('conversion_rate_ves', '38.00')
ON CONFLICT (key) DO NOTHING;
