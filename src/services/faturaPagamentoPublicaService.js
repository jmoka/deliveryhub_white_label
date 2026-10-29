import { apiPath } from '../lib/apiUrl';

async function publicFetch(path, options = {}) {
  const res = await fetch(apiPath(`/api/fatura-pagamento${path}`), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return isJson ? res.json() : null;
}

// Sem autenticação, de propósito — página que o cliente abre a partir do link
// que o admin manda (WhatsApp etc.), sem precisar logar.
export const getFaturaPublica = (token) => publicFetch(`/${token}`);

// Chave pública do PagBank é a mesma pra todo mundo (serve só pra criptografar
// o cartão no navegador) — não precisa de token nem de login.
export const getPagBankChavePublicaPublica = () => publicFetch('/pagbank-chave-publica');

// Abre ordem real no PagBank (Pix/cartão) — mesmo pagarFatura autenticado,
// resolvido pelo token em vez de restaurantId (ver PlanosPublicoController).
export const pagarFaturaPublica = (token, body) =>
  publicFetch(`/${token}/pagar`, { method: 'POST', body: JSON.stringify(body) });
