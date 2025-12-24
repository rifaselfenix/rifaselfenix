-- SOLUCIÓN URGENTE: PERMISOS DE TICKETS
-- Habilita lectura y escritura pública en la tabla de tickets para evitar errores de guardado.

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Borrar politicas viejas si existen
DROP POLICY IF EXISTS "Public Full Access Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anon Insert" ON public.tickets;
DROP POLICY IF EXISTS "Auth Full Access" ON public.tickets;

-- Permitir TODO a TODOS (público)
CREATE POLICY "Public Full Access Tickets"
ON public.tickets
FOR ALL
USING (true)
WITH CHECK (true);

-- Notificar recarga
NOTIFY pgrst, 'reload schema';
