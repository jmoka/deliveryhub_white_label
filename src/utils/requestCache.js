// Cache em memória (módulo, não precisa de Context/Provider) pra GET repetido
// da mesma tela/rota num intervalo curto — ex. várias páginas do painel que
// buscam "minha empresa" cada uma por conta própria, disparando a mesma
// requisição de novo a cada troca de rota. Também dedupe chamadas concorrentes
// (duas telas montando ao mesmo tempo e pedindo a mesma chave não viram duas
// requisições de rede, só uma compartilhada).
const store = new Map(); // key -> { data, expiresAt }
const inflight = new Map(); // key -> Promise

export function cachedFetch(key, fetcher, ttlMs) {
  const cached = store.get(key);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data);

  const emVoo = inflight.get(key);
  if (emVoo) return emVoo;

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

// Chamar depois de qualquer escrita que invalide o valor cacheado (ex. salvar
// favoritos) — senão quem ler essa chave de novo dentro do TTL vê dado velho.
export function invalidateCache(key) {
  store.delete(key);
  inflight.delete(key);
}
