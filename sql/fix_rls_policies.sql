
-- 1. Habilitar RLS en la tabla raffles (si no estaba habilitado)
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Public Read Access" ON public.raffles;
DROP POLICY IF EXISTS "Admin Full Access" ON public.raffles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.raffles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.raffles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.raffles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.raffles;

-- 3. Crear política de LECTURA pública (cualquiera puede ver las rifas)
CREATE POLICY "Public Read Access"
ON public.raffles
FOR SELECT
USING (true);

-- 4. Crear política de ESCRITURA TOTAL para cualquier usuario autenticado (temporalmente permisivo)
-- Esto permitirá INSERT, UPDATE, DELETE a cualquier usuario logueado en tu app
CREATE POLICY "Auth Full Access"
ON public.raffles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Recargar esquema para aplicar cambios inmediatamente
NOTIFY pgrst, 'reload schema';
