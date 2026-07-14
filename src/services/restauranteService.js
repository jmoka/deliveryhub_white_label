import { supabase } from '../lib/supabase';
import { apiPath } from '../lib/apiUrl';

const API = apiPath('/api/restaurante');

async function apiFetch(path, options = {}) {
  const sessionResult = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = sessionResult?.data?.session?.access_token;

  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    const error = new Error(err?.message ?? `HTTP ${res.status}`);
    error.data = err;
    throw error;
  }

  if (!isJson) throw new Error('Resposta inválida. Verifique se o backend está rodando.');

  return res.json();
}

export const registrarRestaurante = (data) =>
  apiFetch('/registrar', { method: 'POST', body: JSON.stringify(data) });

export const getMinhaEmpresa = () => apiFetch('/minha-empresa');

export const getMeusPedidos = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return apiFetch(`/pedidos${qs ? `?${qs}` : ''}`);
};

export const atualizarStatusPedido = (id, status) =>
  apiFetch(`/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const entregarPedidoProprio = (id) =>
  apiFetch(`/pedidos/${id}/entregar-proprio`, { method: 'PATCH' });

export const listarEntregas = () => apiFetch('/entregas');

export const getMeusProdutos = () => apiFetch('/produtos');

export const criarProduto = (data) =>
  apiFetch('/produtos', { method: 'POST', body: JSON.stringify(data) });

export const editarProduto = (id, data) =>
  apiFetch(`/produtos/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deletarProduto = (id) =>
  apiFetch(`/produtos/${id}`, { method: 'DELETE' });

export const toggleProduto = (id, ativo) =>
  apiFetch(`/produtos/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ ativo }) });

// Categorias globais da plataforma (sem auth — endpoint público)
export const getCategoriasGlobais = () =>
  fetch(apiPath('/api/categorias/globais')).then((r) => r.json());

// Tipos de estabelecimento (restaurante, farmácia, mat. construção...) — sem auth
export const getTiposEstabelecimento = () =>
  fetch(apiPath('/api/establishment-types')).then((r) => r.json());

export const getMinhasCategorias = () => apiFetch('/categorias');

export const criarCategoria = (name) =>
  apiFetch('/categorias', { method: 'POST', body: JSON.stringify({ name }) });

export const deletarCategoria = (id) =>
  apiFetch(`/categorias/${id}`, { method: 'DELETE' });

export const getClientes = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return apiFetch(`/clientes${qs ? `?${qs}` : ''}`);
};

export const criarCliente = (data) =>
  apiFetch('/clientes', { method: 'POST', body: JSON.stringify(data) });

export const atualizarCliente = (id, data) =>
  apiFetch(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const updateEmpresa = (data) =>
  apiFetch('/minha-empresa', { method: 'PATCH', body: JSON.stringify(data) });

export const getAparencia = () => apiFetch('/aparencia');
export const updateAparencia = (data) =>
  apiFetch('/aparencia', { method: 'PATCH', body: JSON.stringify(data) });

export const getConfig = () => apiFetch('/config');

export const updateConfig = (data) =>
  apiFetch('/config', { method: 'PATCH', body: JSON.stringify(data) });

export const toggleStatusRestaurante = (aberto) =>
  apiFetch('/status', { method: 'PATCH', body: JSON.stringify({ aberto }) });

export const getCaixa = () => apiFetch('/caixa');

export const abrirCaixa = ({ nome_operador, valor_inicial }) =>
  apiFetch('/caixa/abrir', { method: 'POST', body: JSON.stringify({ nome_operador, valor_inicial: valor_inicial ?? 0 }) });

export const fecharCaixa = (destinacao = {}) =>
  apiFetch('/caixa/fechar', { method: 'POST', body: JSON.stringify(destinacao) });

export const fecharETransferir = ({ nome_operador, valor_inicial }) =>
  apiFetch('/caixa/fechar-e-transferir', { method: 'POST', body: JSON.stringify({ nome_operador, valor_inicial: valor_inicial ?? 0 }) });

export const adicionarSaida = (data) =>
  apiFetch('/caixa/saida', { method: 'POST', body: JSON.stringify(data) });

export const adicionarEntrada = (data) =>
  apiFetch('/caixa/entrada', { method: 'POST', body: JSON.stringify(data) });

export const getCaixaHistorico = () => apiFetch('/caixa/historico');
export const getCaixaDetalhe = (id) => apiFetch(`/caixa/${id}`);
export const aprovarConferencia = (caixaId) =>
  apiFetch(`/caixa/${caixaId}/conferencia`, { method: 'POST' });

export const setTrocoPara = (pedidoId, troco_para) =>
  apiFetch(`/pedidos/${pedidoId}/troco`, { method: 'PATCH', body: JSON.stringify({ troco_para }) });

export const setFreteGratis = (pedidoId) =>
  apiFetch(`/pedidos/${pedidoId}/frete-gratis`, { method: 'PATCH' });

export const cancelarPedidoAdmin = (pedidoId, motivo) =>
  apiFetch(`/pedidos/${pedidoId}/cancelar`, { method: 'PATCH', body: JSON.stringify({ motivo }) });

export const buscarPedidoDetalhe = (id) => apiFetch(`/pedidos/${id}/detalhe`);
export const getPedidosCozinha = () => apiFetch('/cozinha');
export const renovarTokenCozinha = () => apiFetch('/renovar-token-cozinha', { method: 'PATCH' });
export const getRelatorio = (de, ate) => apiFetch(`/relatorio?de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`);
export const getRelatorioFretes = (periodo = 'hoje') => apiFetch(`/relatorio/fretes?periodo=${encodeURIComponent(periodo)}`);
export const setupStorage = () => apiFetch('/storage/setup', { method: 'POST' });

export const uploadImagem = async (file, folder = 'geral') => {
  const sessionResult = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = sessionResult?.data?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${apiPath('/api/restaurante')}/storage/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json; // { url: string }
};

// Motoboys — afiliação (motoboy solicita, restaurante aceita/recusa)
export const listarMotoboys = () => apiFetch('/motoboys');
export const listarSolicitacoesMotoboy = (status = 'pendente') =>
  apiFetch(`/motoboys/solicitacoes${status !== 'pendente' ? `?status=${status}` : ''}`);
export const contarSolicitacoesMotoboyPendentes = () => apiFetch('/motoboys/solicitacoes/count');
export const aceitarSolicitacaoMotoboy = (id) =>
  apiFetch(`/motoboys/solicitacoes/${id}/aceitar`, { method: 'PATCH' });
export const recusarSolicitacaoMotoboy = (id, motivo) =>
  apiFetch(`/motoboys/solicitacoes/${id}/recusar`, { method: 'PATCH', body: JSON.stringify({ motivo }) });
export const removerAfiliacaoMotoboy = (motoboyId) =>
  apiFetch(`/motoboys/${motoboyId}/remover`, { method: 'PATCH' });
export const atribuirMotoboy = (pedidoId, motoboyId) =>
  apiFetch(`/motoboys/${pedidoId}/atribuir`, { method: 'PATCH', body: JSON.stringify({ motoboy_id: motoboyId }) });

// Combos
export const getMeusCombos = () => apiFetch('/combos');
export const getComboDetalhe = (id) => apiFetch(`/combos/${id}`);
export const criarCombo = (data) =>
  apiFetch('/combos', { method: 'POST', body: JSON.stringify(data) });
export const editarCombo = (id, data) =>
  apiFetch(`/combos/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletarCombo = (id) =>
  apiFetch(`/combos/${id}`, { method: 'DELETE' });

// Tags públicas — sem auth
export const getTagsPublicas = () =>
  fetch(apiPath('/api/tags')).then((r) => r.json());

export const getCarrosseis = (restaurantId) =>
  fetch(`${apiPath('/api/tags')}/carrosseis/${restaurantId}`).then((r) => r.json());

// Endpoint público — sem auth
export const getCardapioPorSlug = async (slug) => {
  const res = await fetch(`${apiPath('/api/r')}/${slug}`);
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
};

// Módulo Salão — garçons (CRUD pelo dono)
export const listarGarcons = () => apiFetch('/garcons');
export const getGarconsOnline = () => apiFetch('/garcons/online');
export const criarGarcom = (data) =>
  apiFetch('/garcons', { method: 'POST', body: JSON.stringify(data) });
export const atualizarGarcom = (id, data) =>
  apiFetch(`/garcons/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const removerGarcom = (id) =>
  apiFetch(`/garcons/${id}`, { method: 'DELETE' });

// Módulo Salão — impressoras por setor
export const listarImpressoras = () => apiFetch('/impressoras');
export const criarImpressora = (data) =>
  apiFetch('/impressoras', { method: 'POST', body: JSON.stringify(data) });
export const atualizarImpressora = (id, data) =>
  apiFetch(`/impressoras/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const removerImpressora = (id) =>
  apiFetch(`/impressoras/${id}`, { method: 'DELETE' });

// Módulo Salão — PDV do caixa (mesas/comandas do salão)
export const getSalaoMesas = () => apiFetch('/salao/mesas');
export const getSalaoComandas = () => apiFetch('/salao/comandas');
export const getSalaoComandaDetalhe = (id) => apiFetch(`/salao/comandas/${id}`);
export const aplicarDescontoComanda = (id, valor) =>
  apiFetch(`/salao/comandas/${id}/desconto`, { method: 'PATCH', body: JSON.stringify({ valor }) });
export const aplicarAcrescimoComanda = (id, valor) =>
  apiFetch(`/salao/comandas/${id}/acrescimo`, { method: 'PATCH', body: JSON.stringify({ valor }) });
export const cancelarComandaSalao = (id) =>
  apiFetch(`/salao/comandas/${id}/cancelar`, { method: 'POST' });
export const pagarComandaSalao = (id, forma_pagamento, gorjeta_valor) =>
  apiFetch(`/salao/comandas/${id}/pagar`, { method: 'POST', body: JSON.stringify({ forma_pagamento, gorjeta_valor }) });

// Módulo Salão — mesas (CRUD simples pelo dono, cadastro inicial das mesas físicas)
export const listarMesas = () => apiFetch('/mesas-cadastro');
export const criarMesa = (data) =>
  apiFetch('/mesas-cadastro', { method: 'POST', body: JSON.stringify(data) });
export const removerMesa = (id) =>
  apiFetch(`/mesas-cadastro/${id}`, { method: 'DELETE' });
