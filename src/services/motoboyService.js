const API = '/api/motoboy';
const TOKEN_KEY = 'motoboy_access_token';

export const getMotoboyToken = () => localStorage.getItem(TOKEN_KEY);
export const setMotoboyToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearMotoboyToken = () => localStorage.removeItem(TOKEN_KEY);

async function motoboyFetch(path, options = {}) {
  const token = getMotoboyToken();
  if (!token) throw new Error('Token de motoboy não encontrado. Use o link recebido do restaurante.');

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-motoboy-token': token,
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }

  return isJson ? res.json() : {};
}

export const getMe = () => motoboyFetch('/me');
export const getMeusPedidos = () => motoboyFetch('/pedidos');
export const atualizarLocalizacao = (pedidoId, lat, lng) =>
  motoboyFetch(`/pedidos/${pedidoId}/localizacao`, {
    method: 'PATCH',
    body: JSON.stringify({ lat, lng }),
  });
export const confirmarEntrega = (pedidoId) =>
  motoboyFetch(`/pedidos/${pedidoId}/entregar`, { method: 'POST' });

export const registrarOcorrencia = (pedidoId, tipo, motivo) =>
  motoboyFetch(`/pedidos/${pedidoId}/ocorrencia`, {
    method: 'POST',
    body: JSON.stringify({ tipo, motivo }),
  });
