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
    throw new Error(err?.message ?? `HTTP ${res.status}`);
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

export const toggleProduto = (id, ativo) =>
  apiFetch(`/produtos/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ ativo }) });

export const getMinhasCategorias = () => apiFetch('/categorias');

export const criarCategoria = (name) =>
  apiFetch('/categorias', { method: 'POST', body: JSON.stringify({ name }) });

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
