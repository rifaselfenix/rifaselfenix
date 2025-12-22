
-- Asegurar que la columna allow_multi_ticket exista en la tabla raffles
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS allow_multi_ticket BOOLEAN DEFAULT false;

-- Asegurar que la columna image_url exista y sea texto
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Forzar refresco del caché de esquema
NOTIFY pgrst, 'reload schema';
