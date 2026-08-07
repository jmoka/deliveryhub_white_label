import { supabase } from '../lib/supabase';
import { apiPath } from '../lib/apiUrl';

const API = apiPath('/api');

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

// Admin — CRUD de planos
export const getPlanos = () => apiFetch('/planos');
export const getPlano = (id) => apiFetch(`/planos/${id}`);
export const criarPlano = (data) => apiFetch('/planos', { method: 'POST', body: JSON.stringify(data) });
export const atualizarPlano = (id, data) => apiFetch(`/planos/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const removerPlano = (id) => apiFetch(`/planos/${id}`, { method: 'DELETE' });

// Admin — assinaturas por loja
export const getAssinaturas = () => apiFetch('/planos/assinaturas');
export const getAssinatura = (restaurantId) => apiFetch(`/planos/assinaturas/${restaurantId}`);
export const atribuirAssinatura = (restaurantId, data) =>
  apiFetch(`/planos/assinaturas/${restaurantId}`, { method: 'PUT', body: JSON.stringify(data) });
export const cancelarAssinatura = (restaurantId) =>
  apiFetch(`/planos/assinaturas/${restaurantId}/cancelar`, { method: 'PATCH' });
export const gerarFaturaManual = (restaurantId) =>
  apiFetch(`/planos/assinaturas/${restaurantId}/gerar-fatura`, { method: 'POST' });

// Admin — faturas globais
export const getFaturas = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return apiFetch(`/planos/faturas${qs ? `?${qs}` : ''}`);
};
export const marcarFaturaPaga = (id) => apiFetch(`/planos/faturas/${id}/marcar-paga`, { method: 'PATCH' });
