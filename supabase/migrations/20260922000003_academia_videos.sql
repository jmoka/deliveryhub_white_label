-- Catálogo de vídeos da Academia PediuVai, agora gerenciável pelo admin
-- (título, descrição, URL/upload, e em quais painéis aparece) em vez de um
-- array estático no frontend. `perfis` é array porque um vídeo pode ser
-- relevante pra mais de um painel ao mesmo tempo (ex: mesmo vídeo de "como
-- funciona o pedido no salão" pra Estabelecimento e Garçom).
CREATE TABLE public.academia_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,             -- slug definido em ACADEMIA_CATEGORIAS (frontend), não é FK
  perfis TEXT[] NOT NULL DEFAULT '{}', -- 'estabelecimento' | 'motoboy' | 'garcom' | 'cliente'
  url_video TEXT NOT NULL,
  duracao_seg INT,
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academia_videos_perfis ON public.academia_videos USING GIN (perfis);

ALTER TABLE public.academia_videos ENABLE ROW LEVEL SECURITY;

-- Acesso real é sempre via backend com service_role (não há client Supabase
-- direto do browser pra essa tabela) — RLS aqui é defesa em profundidade,
-- mesma convenção de customer_addresses.
CREATE POLICY "leitura_publica_ativos" ON public.academia_videos
  FOR SELECT TO anon, authenticated USING (ativo = true);

CREATE POLICY "admin_gerencia" ON public.academia_videos
  FOR ALL TO authenticated USING (public.is_admin());

-- Migra o conteúdo que já estava hardcoded em src/config/academiaCatalogo.js
-- (ACADEMIA_VIDEOS), agora com URL completa (base + arquivo), pra não perder
-- o que já tinha sido escrito. Soma também os primeiros placeholders do
-- perfil "garcom", que não existia antes.
INSERT INTO public.academia_videos (titulo, descricao, categoria, perfis, url_video, ordem) VALUES
  -- Estabelecimento
  ('Como cadastrar seu estabelecimento', 'Passo a passo do cadastro inicial, escolha do plano e ativação do painel.', 'primeiros-passos', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/primeiros-passos/cadastro-inicial.mp4', 1),
  ('Personalizando a aparência da sua loja', 'Logo, cores e identidade visual da sua vitrine.', 'primeiros-passos', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/primeiros-passos/aparencia.mp4', 2),
  ('Cadastrando produtos e categorias', 'Criar produtos manualmente, preço, promoção e estoque.', 'produtos-cardapio', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/produtos/cadastrar-produtos.mp4', 1),
  ('Importando produtos em massa (JSON)', 'Subir vários produtos de uma vez e editar em tabela.', 'produtos-cardapio', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/produtos/importar-json.mp4', 2),
  ('Cardápio digital impresso (QR Code)', 'Gerar e organizar o cardápio impresso para as mesas.', 'produtos-cardapio', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/produtos/cardapio-digital.mp4', 3),
  ('Gerenciando pedidos recebidos', 'Aceitar, recusar e acompanhar o status de um pedido.', 'pedidos-cozinha', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/pedidos/gerenciar-pedidos.mp4', 1),
  ('Tela da cozinha (KDS) e pontos de preparo', 'Como a cozinha visualiza e envia os itens preparados.', 'pedidos-cozinha', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/pedidos/cozinha-kds.mp4', 2),
  ('Cadastrando seus próprios motoboys', 'Adicionar, editar e bloquear motoboys do seu estabelecimento.', 'delivery-motoboys', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/delivery/cadastrar-motoboy.mp4', 1),
  ('Acompanhando entregas em andamento', 'Tela de entregas e status de cada motoboy.', 'delivery-motoboys', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/delivery/entregas.mp4', 2),
  ('Mesas e comandas no salão', 'Abrir mesa, lançar itens e fechar comanda.', 'salao', ARRAY['estabelecimento', 'garcom'], 'https://teusite.top/pediuvai/videos/estabelecimento/salao/mesas-comandas.mp4', 1),
  ('Cadastrando garçons e login por mesa', 'Como funciona o portal do garçom.', 'salao', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/salao/garcons.mp4', 2),
  ('Abrindo e fechando o caixa', 'Controle de caixa, troco e vendas do dia.', 'caixa-financeiro', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/caixa/abertura-fechamento.mp4', 1),
  ('Entendendo o financeiro', 'Saldo, repasses e histórico financeiro do estabelecimento.', 'caixa-financeiro', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/caixa/financeiro.mp4', 2),
  ('Instalando o agente de impressão', 'Baixar, instalar e parear a impressora térmica.', 'impressoras', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/impressoras/agente-impressao.mp4', 1),
  ('Relatórios de vendas, produtos e equipe', 'Como interpretar os relatórios de conferência.', 'relatorios', ARRAY['estabelecimento'], 'https://teusite.top/pediuvai/videos/estabelecimento/relatorios/visao-geral.mp4', 1),

  -- Motoboy
  ('Como se cadastrar como motoboy', 'Cadastro, documentos e aprovação da plataforma.', 'cadastro-aprovacao', ARRAY['motoboy'], 'https://teusite.top/pediuvai/videos/motoboy/cadastro/cadastro.mp4', 1),
  ('Se afiliando a um estabelecimento', 'Como aceitar convite de um estabelecimento para entregar por ele.', 'cadastro-aprovacao', ARRAY['motoboy'], 'https://teusite.top/pediuvai/videos/motoboy/cadastro/afiliacao.mp4', 2),
  ('Aceitando um pedido', 'Como visualizar e aceitar corridas disponíveis.', 'aceitando-pedidos', ARRAY['motoboy'], 'https://teusite.top/pediuvai/videos/motoboy/pedidos/aceitar-pedido.mp4', 1),
  ('Coletando o pedido (leitor de código)', 'Confirmar a coleta escaneando o código de barras.', 'coleta-entrega', ARRAY['motoboy'], 'https://teusite.top/pediuvai/videos/motoboy/entrega/coleta-barcode.mp4', 1),
  ('Confirmando a entrega', 'Como finalizar a entrega no app.', 'coleta-entrega', ARRAY['motoboy'], 'https://teusite.top/pediuvai/videos/motoboy/entrega/entrega-barcode.mp4', 2),
  ('Consultando saldo e solicitando repasse', 'Como acompanhar ganhos por estabelecimento.', 'ganhos', ARRAY['motoboy'], 'https://teusite.top/pediuvai/videos/motoboy/ganhos/saldo-repasse.mp4', 1),

  -- Cliente
  ('Como fazer seu primeiro pedido', 'Escolher restaurante, montar o carrinho e finalizar.', 'como-pedir', ARRAY['cliente'], 'https://teusite.top/pediuvai/videos/cliente/pedido/fazer-pedido.mp4', 1),
  ('Usando cupons de desconto', 'Onde aplicar cupons no carrinho.', 'como-pedir', ARRAY['cliente'], 'https://teusite.top/pediuvai/videos/cliente/pedido/cupons.mp4', 2),
  ('Formas de pagamento disponíveis', 'Pix, cartão e dinheiro na entrega.', 'pagamento', ARRAY['cliente'], 'https://teusite.top/pediuvai/videos/cliente/pagamento/formas-pagamento.mp4', 1),
  ('Acompanhando o status do pedido', 'Do "em preparo" até "entregue" em tempo real.', 'acompanhar-pedido', ARRAY['cliente'], 'https://teusite.top/pediuvai/videos/cliente/acompanhamento/status-pedido.mp4', 1),
  ('Gerenciando seus endereços', 'Salvar, editar e escolher endereço de entrega.', 'perfil-enderecos', ARRAY['cliente'], 'https://teusite.top/pediuvai/videos/cliente/perfil/enderecos.mp4', 1),

  -- Garçom (perfil novo — placeholders iniciais)
  ('Login no portal do garçom', 'Como entrar com a chave do estabelecimento e escolher sua mesa.', 'comandas-mesas', ARRAY['garcom'], 'https://teusite.top/pediuvai/videos/garcom/comandas-mesas/login.mp4', 1),
  ('Abrindo comanda e lançando itens', 'Adicionar produtos à comanda de uma mesa.', 'comandas-mesas', ARRAY['garcom'], 'https://teusite.top/pediuvai/videos/garcom/comandas-mesas/lancar-itens.mp4', 2),
  ('Enviando pedidos para a cozinha', 'Envio manual dos itens já lançados na comanda.', 'envio-pedidos', ARRAY['garcom'], 'https://teusite.top/pediuvai/videos/garcom/envio-pedidos/enviar-cozinha.mp4', 1),
  ('Atendendo a fila de chamada do balcão', 'Como funciona a fila de "aguardando"/"preparando".', 'chamada-atendimento', ARRAY['garcom'], 'https://teusite.top/pediuvai/videos/garcom/chamada-atendimento/fila-chamada.mp4', 1),
  ('Fechando a comanda da mesa', 'Fechar comanda, formas de pagamento e liberar a mesa.', 'fechamento', ARRAY['garcom'], 'https://teusite.top/pediuvai/videos/garcom/fechamento/fechar-comanda.mp4', 1);
