-- 1. Crear el bucket 'images' si no existe
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Eliminar políticas antiguas para evitar duplicados
drop policy if exists "Enable read access for all users" on storage.objects;
drop policy if exists "Enable insert access for all users" on storage.objects;
drop policy if exists "Enable update access for all users" on storage.objects;
drop policy if exists "Enable delete access for all users" on storage.objects;

-- 3. Crear políticas que permitan TODO (Lectura y Escritura pública)
create policy "Give users access to own folder 1oj01j_0"
on storage.objects for select
to public
using (bucket_id = 'images');

create policy "Give users access to own folder 1oj01j_1"
on storage.objects for insert
to public
with check (bucket_id = 'images');

create policy "Give users access to own folder 1oj01j_2"
on storage.objects for update
to public
using (bucket_id = 'images');

-- Configurar un bucket de respaldo 'public' por si acaso
insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do nothing;
