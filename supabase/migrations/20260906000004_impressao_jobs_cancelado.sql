-- Permite o agente local cancelar trabalhos pendentes sem imprimir (tela de
-- revisão de impressões pendentes ao ligar o agente, evita reimpressão em
-- massa de comandas antigas depois do caixa fechado/PC desligado).
ALTER TABLE public.impressao_jobs DROP CONSTRAINT IF EXISTS impressao_jobs_status_check;
ALTER TABLE public.impressao_jobs ADD CONSTRAINT impressao_jobs_status_check
  CHECK (status IN ('pendente', 'impresso', 'erro', 'cancelado'));
