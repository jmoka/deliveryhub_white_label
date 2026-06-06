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
