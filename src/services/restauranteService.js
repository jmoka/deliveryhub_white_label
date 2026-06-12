import { supabase } from '../lib/supabase';

const API = '/api/restaurante';

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
  fetch('/api/categorias/globais').then((r) => r.json());

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

export const buscarPedidoDetalhe = (id) => apiFetch(`/pedidos/${id}/detalhe`);
export const getPedidosCozinha = () => apiFetch('/cozinha');
export const getRelatorio = (de, ate) => apiFetch(`/relatorio?de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`);
export const setupStorage = () => apiFetch('/storage/setup', { method: 'POST' });

export const uploadImagem = async (file, folder = 'geral') => {
  const sessionResult = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = sessionResult?.data?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/restaurante/storage/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json; // { url: string }
};

// Motoboys
export const listarMotoboys = () => apiFetch('/motoboys');
export const criarMotoboy = (data) =>
  apiFetch('/motoboys', { method: 'POST', body: JSON.stringify(data) });
export const toggleMotoboy = (id, ativo) =>
  apiFetch(`/motoboys/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ ativo }) });
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
  fetch('/api/tags').then((r) => r.json());

export const getCarrosseis = (restaurantId) =>
  fetch(`/api/tags/carrosseis/${restaurantId}`).then((r) => r.json());

// Endpoint público — sem auth
export const getCardapioPorSlug = async (slug) => {
  const res = await fetch(`/api/r/${slug}`);
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
};
