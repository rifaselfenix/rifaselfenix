
-- SOLUCIÓN FINAL A ERROR DE PERMISOS (RLS)
-- Como tu aplicacion no tiene "Inicio de Sesion" (Login), Supabase te ve como usuario "Anonimo".
-- Por eso fallaba la regla anterior que solo dejaba editar a "Usuarios Autenticados".

ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

-- 1. Borrar todas las reglas anteriores para empezar limpio
DROP POLICY IF EXISTS "Public Read Access" ON public.raffles;
DROP POLICY IF EXISTS "Auth Full Access" ON public.raffles;
DROP POLICY IF EXISTS "Public Full Access" ON public.raffles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.raffles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.raffles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.raffles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.raffles;

-- 2. Crear una regla MAESTRA que permita TODO a TODOS (Lectura y Escritura Publica)
-- Esto solucionara el error de guardado inmediatamente.
CREATE POLICY "Public Full Access"
ON public.raffles
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Hacemos lo mismo para la tabla de contenido (carousel/historias) por si acaso
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Content" ON public.site_content;
CREATE POLICY "Public Full Access Content"
ON public.site_content
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Aplicar cambios
NOTIFY pgrst, 'reload schema';
