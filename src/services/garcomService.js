import { apiPath } from '../lib/apiUrl';

const API = apiPath('/api/garcom');
const TOKEN_KEY = 'garcom_access_token';

export const getGarcomToken = () => localStorage.getItem(TOKEN_KEY);
export const setGarcomToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearGarcomToken = () => localStorage.removeItem(TOKEN_KEY);

async function garcomFetch(path, options = {}) {
  const token = getGarcomToken();
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-garcom-token': token,
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    if (res.status === 401) clearGarcomToken();
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }

  return isJson ? res.json() : {};
}

export const login = async (loginKey, password) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_key: loginKey, password }),
  });
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
  return data;
};

export const getMe = () => garcomFetch('/me');
export const getMesas = () => garcomFetch('/mesas');
export const getProdutos = () => garcomFetch('/produtos');
export const getMinhasComandas = () => garcomFetch('/comandas');
export const getItensProntos = () => garcomFetch('/itens-prontos');
export const getComanda = (id) => garcomFetch(`/comandas/${id}`);

export const abrirComanda = ({ mesa_id, cliente_nome, cliente_telefone }) =>
  garcomFetch('/comandas/abrir', {
    method: 'POST',
    body: JSON.stringify({ mesa_id: mesa_id ?? null, cliente_nome, cliente_telefone }),
  });

export const adicionarItens = (comandaId, itens) =>
  garcomFetch(`/comandas/${comandaId}/itens`, { method: 'POST', body: JSON.stringify({ itens }) });

export const editarItem = (comandaId, itemId, body) =>
  garcomFetch(`/comandas/${comandaId}/itens/${itemId}`, { method: 'PATCH', body: JSON.stringify(body) });

export const removerItem = (comandaId, itemId) =>
  garcomFetch(`/comandas/${comandaId}/itens/${itemId}`, { method: 'DELETE' });

export const registrarPagamento = (comandaId, valor, forma_pagamento, valor_recebido) =>
  garcomFetch(`/comandas/${comandaId}/pagamento`, { method: 'POST', body: JSON.stringify({ valor, forma_pagamento, valor_recebido }) });

export const enviarItens = (comandaId) =>
  garcomFetch(`/comandas/${comandaId}/enviar`, { method: 'POST' });

export const fecharComanda = (comandaId, formaPagamento) =>
  garcomFetch(`/comandas/${comandaId}/fechar`, {
    method: 'POST',
    body: JSON.stringify({ forma_pagamento: formaPagamento }),
  });
