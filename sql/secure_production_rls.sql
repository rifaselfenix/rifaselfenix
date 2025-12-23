-- Secure Production RLS Policies
-- This script replaces previous permissive policies with strict ones for production.

-- 1. Raffles (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public Full Access" ON public.raffles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.raffles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.raffles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.raffles;

CREATE POLICY "Public Read Raffles" ON public.raffles FOR SELECT USING (true);
CREATE POLICY "Admin Write Raffles" ON public.raffles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Site Content (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public Full Access" ON public.site_content;

CREATE POLICY "Public Read Content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin Write Content" ON public.site_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. App Settings (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public Write Settings" ON public.app_settings;

CREATE POLICY "Public Read Settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admin Write Settings" ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Payment Methods (Public Read, Admin Write)
CREATE POLICY "Public Read PaymentMethods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Admin Write PaymentMethods" ON public.payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Tickets (Public Read/Write - Required for Checkout)
-- Note: Ideally this should be more restricted or handled via Edge Function, 
-- but for the current architecture without auth for buyers, we need Public Insert.
CREATE POLICY "Public Read Tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Public Insert Tickets" ON public.tickets FOR INSERT WITH CHECK (true);
-- Prevent public updates/deletes on tickets (only Admins should do that if needed)
CREATE POLICY "Admin Manage Tickets" ON public.tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Delete Tickets" ON public.tickets FOR DELETE TO authenticated USING (true);
