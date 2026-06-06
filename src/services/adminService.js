import { supabase } from '../lib/supabase';

const API = '/api';

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
    if (isJson) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? `HTTP ${res.status}`);
    }
    throw new Error(`HTTP ${res.status} — backend indisponível`);
  }

  if (!isJson) {
    throw new Error('Resposta inválida do servidor. Verifique se o backend está rodando na porta 3002.');
  }

  return res.json();
}

// Plataforma
export const getMetricas = () => apiFetch('/plataforma/metricas');
export const getComissoes = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return apiFetch(`/plataforma/comissoes${qs ? `?${qs}` : ''}`);
};
export const getComissoesPorEmpresa = (id) => apiFetch(`/plataforma/comissoes/empresa/${id}`);

// Empresas
export const getEmpresas = () => apiFetch('/empresas');
export const getEmpresa = (id) => apiFetch(`/empresas/${id}`);
export const criarEmpresa = (data) => apiFetch('/empresas', { method: 'POST', body: JSON.stringify(data) });
export const atualizarEmpresa = (id, data) => apiFetch(`/empresas/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const removerEmpresa = (id) => apiFetch(`/empresas/${id}`, { method: 'DELETE' });

// Config pagamentos por empresa
export const getEmpresaConfig = (id) => apiFetch(`/empresas/${id}/config`);
export const updateEmpresaConfig = (id, data) =>
  apiFetch(`/empresas/${id}/config`, { method: 'PATCH', body: JSON.stringify(data) });

// Pedidos
export const getPedidos = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return apiFetch(`/pedidos${qs ? `?${qs}` : ''}`);
};
export const atualizarStatusPedido = (id, status) =>
  apiFetch(`/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Produtos
export const getProdutos = (empresaId, apenasAtivos = false) =>
  apiFetch(`/empresas/${empresaId}/produtos${apenasAtivos ? '?apenas_ativos=true' : ''}`);
export const toggleProduto = (id, ativo) =>
  apiFetch(`/produtos/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ ativo }) });

// Categorias
export const getCategorias = (empresaId) => apiFetch(`/empresas/${empresaId}/categorias`);
