import { apiPath } from '../lib/apiUrl';

const API = apiPath('/api/auto-atendimento');

async function handle(res) {
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
  return data;
}

export const entrarNaMesa = (mesaToken) =>
  fetch(`${API}/${mesaToken}/entrar`, { method: 'POST' }).then(handle);

export const obterComandaAuto = (mesaToken, sessionId) =>
  fetch(`${API}/${mesaToken}/comanda?sessionId=${encodeURIComponent(sessionId)}`).then(handle);

export const adicionarItensAuto = (mesaToken, sessionId, itens) =>
  fetch(`${API}/${mesaToken}/itens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, itens }),
  }).then(handle);

export const removerItemAuto = (mesaToken, sessionId, itemId) =>
  fetch(`${API}/${mesaToken}/itens/${itemId}?sessionId=${encodeURIComponent(sessionId)}`, { method: 'DELETE' }).then(handle);

export const solicitarPedidoAuto = (mesaToken, sessionId) =>
  fetch(`${API}/${mesaToken}/solicitar-pedido`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  }).then(handle);

export const definirGorjetaAuto = (mesaToken, sessionId, semGorjeta) =>
  fetch(`${API}/${mesaToken}/gorjeta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, semGorjeta }),
  }).then(handle);

export const solicitarConferenciaAuto = (mesaToken, sessionId) =>
  fetch(`${API}/${mesaToken}/solicitar-conferencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  }).then(handle);

const storageKey = (mesaToken) => `auto_atendimento_${mesaToken}`;

export const getSessaoLocal = (mesaToken) => {
  try {
    const raw = localStorage.getItem(storageKey(mesaToken));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSessaoLocal = (mesaToken, { comandaId, sessionId }) =>
  localStorage.setItem(storageKey(mesaToken), JSON.stringify({ comandaId, sessionId }));

export const limparSessaoLocal = (mesaToken) => localStorage.removeItem(storageKey(mesaToken));
