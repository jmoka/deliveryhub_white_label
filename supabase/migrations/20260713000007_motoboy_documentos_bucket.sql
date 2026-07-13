-- Bucket privado pra documentos sensíveis do motoboy (foto, documento, comprovante de endereço).
-- Sem policies de storage.objects: só o backend (service_role, ignora RLS) grava/lê,
-- sempre expondo via signed URL de curta duração — nunca URL pública.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'motoboy-documentos',
  'motoboy-documentos',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
