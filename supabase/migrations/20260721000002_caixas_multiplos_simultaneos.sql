-- Suporta múltiplos caixas abertos simultaneamente por restaurante (Principal, Bar, Salão...)
ALTER TABLE public.caixas
  ADD COLUMN nome TEXT NOT NULL DEFAULT 'Principal',
  ADD COLUMN is_principal BOOLEAN NOT NULL DEFAULT false;

-- Caixas já existentes (fluxo antigo, 1 caixa por restaurante) viram o principal
UPDATE public.caixas SET is_principal = true;

-- Só pode haver 1 caixa principal aberto por restaurante (é o que recebe delivery/motoboy)
CREATE UNIQUE INDEX idx_caixas_um_principal_aberto ON public.caixas (restaurant_id)
  WHERE is_principal AND status = 'aberto';

-- Não pode haver 2 caixas abertos com o mesmo nome/local ao mesmo tempo
CREATE UNIQUE INDEX idx_caixas_nome_aberto ON public.caixas (restaurant_id, nome)
  WHERE status = 'aberto';

-- Mesa passa a pertencer ao caixa que estava ativo quando foi ocupada
ALTER TABLE public.mesas
  ADD COLUMN caixa_id INT REFERENCES public.caixas(id) ON DELETE SET NULL;
