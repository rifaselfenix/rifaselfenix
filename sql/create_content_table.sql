-- Tabla para el contenido del sitio (Carrusel y Ganadores)
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section text not null, -- 'carousel' o 'winner'
  type text not null,    -- 'image' o 'video'
  url text not null,
  title text,            -- Para el carrusel
  subtitle text,         -- Para el carrusel
  winner_name text,      -- Para ganadores
  prize_text text,       -- Para ganadores
  created_at timestamptz default now()
);

-- Permisos
alter table public.site_content enable row level security;
create policy "public_view_content" on public.site_content for select using (true);
create policy "admin_manage_content" on public.site_content for all using (true);
