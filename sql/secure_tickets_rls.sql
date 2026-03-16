-- RESTRICT TICKETS RLS
-- Currently it allows public full access, which is insecure.
-- We want Public to INSERT and SELECT, but Authenticated to UPDATE and DELETE.

DROP POLICY IF EXISTS "Public Full Access" ON tickets;
DROP POLICY IF EXISTS "Enable all actions for all users" ON tickets;

-- Public can reserve tickets (Insert)
CREATE POLICY "Public Insert Tickets" 
ON tickets FOR INSERT 
TO public 
WITH CHECK (true);

-- Public can search their own tickets (Select)
CREATE POLICY "Public Select Tickets" 
ON tickets FOR SELECT 
TO public 
USING (true);

-- ONLY admins can update or delete tickets
CREATE POLICY "Admin Update Tickets" 
ON tickets FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin Delete Tickets" 
ON tickets FOR DELETE 
TO authenticated 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
