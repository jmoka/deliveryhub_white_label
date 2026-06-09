-- Fase 2: slug único por restaurante para URL pública /r/:slug

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Gera slug a partir de texto (sem dependência de unaccent)
CREATE OR REPLACE FUNCTION generate_restaurant_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-preenche slug se NULL ao inserir ou atualizar nome
CREATE OR REPLACE FUNCTION set_restaurant_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_restaurant_slug(NEW.name);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restaurant_slug ON public.restaurants;
CREATE TRIGGER trg_restaurant_slug
  BEFORE INSERT OR UPDATE OF name ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION set_restaurant_slug();

-- Preenche slug em restaurantes já existentes (sem slug)
UPDATE public.restaurants SET slug = generate_restaurant_slug(name) WHERE slug IS NULL;
