ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS comprovante_pix_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('comprovantes-pix', 'comprovantes-pix', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
