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

  if (!isJson) throw new Error('Resposta inválida do servidor.');
  return res.json();
}

// Status/gerenciamento do 2FA (admin e dono de restaurante) — a verificação
// do código DURANTE o login é authService.verifyTwoFactor (AuthContext), não
// aqui, já que nesse ponto o usuário ainda não tem sessão.
export const getStatus2FA = () => apiFetch('/auth-principal/2fa');

export const iniciarEnrollTotp = () => apiFetch('/auth-principal/2fa/enroll/totp', { method: 'POST' });

export const confirmarEnrollTotp = (secret, code) =>
  apiFetch('/auth-principal/2fa/enroll/totp/confirm', { method: 'POST', body: JSON.stringify({ secret, code }) });

export const ativarEmail2FA = () => apiFetch('/auth-principal/2fa/enroll/email', { method: 'POST' });

export const desativar2FA = (password) =>
  apiFetch('/auth-principal/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) });
