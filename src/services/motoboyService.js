import { apiPath } from '../lib/apiUrl';
import { getMotoboyToken, setMotoboyToken, clearMotoboyToken } from './motoboyAuthService';

const API = apiPath('/api/motoboy');

export { getMotoboyToken, setMotoboyToken, clearMotoboyToken };

async function motoboyFetch(path, options = {}) {
  const token = getMotoboyToken();
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

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
export const confirmarEntrega = (pedidoId, entregaPagamento) =>
  motoboyFetch(`/pedidos/${pedidoId}/entregar`, {
    method: 'POST',
    body: JSON.stringify({ entrega_pagamento: entregaPagamento ?? null }),
  });

export const registrarOcorrencia = (pedidoId, tipo, motivo) =>
  motoboyFetch(`/pedidos/${pedidoId}/ocorrencia`, {
    method: 'POST',
    body: JSON.stringify({ tipo, motivo }),
  });

export const getPedidosDisponiveis = (restaurantId) =>
  motoboyFetch(`/pedidos/disponiveis?restaurant_id=${restaurantId}`);

export const pegarPedido = (pedidoId) =>
  motoboyFetch(`/pedidos/${pedidoId}/pegar`, { method: 'POST' });

export const confirmarColeta = (pedidoId, barcode) =>
  motoboyFetch(`/pedidos/${pedidoId}/confirmar-coleta`, {
    method: 'POST',
    body: JSON.stringify({ barcode }),
  });

export const reivindicarPedido = (pedidoId) =>
  motoboyFetch(`/pedidos/${pedidoId}/reivindicar`, { method: 'POST' });

export const uploadComprovantePix = (pedidoId, base64) =>
  motoboyFetch(`/pedidos/${pedidoId}/comprovante`, {
    method: 'POST',
    body: JSON.stringify({ base64 }),
  });

// Estabelecimentos — buscar/solicitar afiliação
export const getEstabelecimentosDisponiveis = (busca) =>
  motoboyFetch(`/estabelecimentos${busca ? `?busca=${encodeURIComponent(busca)}` : ''}`);

export const solicitarAfiliacao = (restaurantId) =>
  motoboyFetch(`/estabelecimentos/${restaurantId}/solicitar`, { method: 'POST' });

export const getMinhasAfiliacoes = () => motoboyFetch('/estabelecimentos/minhas');

// Ganhos / comissões
export const getGanhosResumo = () => motoboyFetch('/ganhos');
export const getGanhosHistorico = (restaurantId) =>
  motoboyFetch(`/ganhos/historico${restaurantId ? `?restaurant_id=${restaurantId}` : ''}`);
