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
    throw new Error('Resposta inválida do servidor.');
  }

  return res.json();
}

export const getInstalacoes = () => apiFetch('/instalacoes');
export const getInstalacao = (id) => apiFetch(`/instalacoes/${id}`);
export const criarInstalacao = (data) => apiFetch('/instalacoes', { method: 'POST', body: JSON.stringify(data) });
export const atualizarInstalacao = (id, data) =>
  apiFetch(`/instalacoes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const atribuirPlanoInstalacao = (id, planoId) =>
  apiFetch(`/instalacoes/${id}/plano`, { method: 'POST', body: JSON.stringify({ plano_id: planoId }) });
export const gerarFaturaManualInstalacao = (id) =>
  apiFetch(`/instalacoes/${id}/gerar-fatura`, { method: 'POST' });
