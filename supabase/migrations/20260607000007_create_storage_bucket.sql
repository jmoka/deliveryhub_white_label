-- Bucket público para imagens de restaurantes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurante-imagens',
  'restaurante-imagens',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Qualquer autenticado pode fazer upload
create policy "auth_upload_restaurante_imagens"
on storage.objects for insert
to authenticated
with check (bucket_id = 'restaurante-imagens');

-- Leitura pública
create policy "public_read_restaurante_imagens"
on storage.objects for select
to public
using (bucket_id = 'restaurante-imagens');

-- Autenticado pode deletar
create policy "auth_delete_restaurante_imagens"
on storage.objects for delete
to authenticated
using (bucket_id = 'restaurante-imagens');
