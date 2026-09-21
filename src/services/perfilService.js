import { supabase } from '../lib/supabase';
import { apiPath } from '../lib/apiUrl';

async function apiFetch(options = {}, subpath = '') {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login.');

  const res = await fetch(`${apiPath('/api/perfil')}${subpath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return isJson ? res.json() : {};
}

export const getPerfil = () => apiFetch();
export const updatePerfil = (data) =>
  apiFetch({ method: 'PATCH', body: JSON.stringify(data) });

// Pino ajustado manualmente no mapa (checkout, quando a geocodificação automática
// erra o endereço) — sobrescreve lat/lng e trava contra re-geocodificação futura.
export const atualizarLocalizacaoPerfil = (lat, lng) =>
  apiFetch({ method: 'PATCH', body: JSON.stringify({ lat, lng }) }, '/localizacao');

// Detecta conta de cliente cujo email também tem cadastro de motoboy (identidades
// separadas que coincidem no email) — usado pra barrar telas de cliente pra ela.
export const ehMotoboy = () => apiFetch({}, '/e-motoboy');

// Múltiplos endereços salvos (StepEndereco do checkout) — customers.address_json
// continua sendo o "endereço ativo"; selecionar/criar aqui copia pra lá.
export const listarEnderecos = () => apiFetch({}, '/enderecos');
export const criarEndereco = (data) =>
  apiFetch({ method: 'POST', body: JSON.stringify(data) }, '/enderecos');
export const editarEndereco = (id, data) =>
  apiFetch({ method: 'PATCH', body: JSON.stringify(data) }, `/enderecos/${id}`);
export const excluirEndereco = (id) =>
  apiFetch({ method: 'DELETE' }, `/enderecos/${id}`);
// Cenário 2 de desatualização (pino divergente do texto) — checado sob demanda,
// ao abrir um endereço salvo pra confirmar, nunca ao listar (custo de geocoding).
export const verificarEndereco = (id) =>
  apiFetch({ method: 'POST' }, `/enderecos/${id}/verificar`);
export const selecionarEndereco = (id, coords) =>
  apiFetch({ method: 'PATCH', body: JSON.stringify(coords ?? {}) }, `/enderecos/${id}/selecionar`);

// Notificações via Telegram (pedido confirmado/entregue) — vínculo por deep-link, opt-in.
export const gerarLinkTelegram = () => apiFetch({ method: 'POST' }, '/telegram/link');
export const getStatusTelegram = () => apiFetch({}, '/telegram/status');

export async function uploadFoto(file) {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login.');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${apiPath('/api/perfil')}/foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
