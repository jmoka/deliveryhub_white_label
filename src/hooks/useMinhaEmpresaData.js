import { useEffect, useState } from 'react';
import { getMinhaEmpresa } from '../services/restauranteService';

// Módulos, slug e logo do painel vinham de 3 hooks que cada um chamava
// getMinhaEmpresa() por conta própria — cada chamada resolvia num instante
// diferente e o menu lateral "piscava" (itens iam surgindo aos poucos, fora de
// ordem). Aqui é uma chamada só, deduplicada e cacheada por alguns segundos
// (mesmo TTL do cache Redis no backend): quem assinar recebe tudo junto, e
// navegar entre páginas de /restaurante/* dentro da janela do cache já renderiza
// completo de primeira, sem flash.
const TTL_MS = 15000;
let cache = null;
let inflight = null;
const subscribers = new Set();

const notify = () => subscribers.forEach((fn) => fn(cache?.data ?? null));

const fetchMinhaEmpresa = () => {
  if (cache && cache.expiresAt > Date.now()) return Promise.resolve(cache.data);
  if (inflight) return inflight;
  inflight = getMinhaEmpresa()
    .then((d) => {
      cache = { data: d, expiresAt: Date.now() + TTL_MS };
      notify();
      return d;
    })
    .finally(() => { inflight = null; });
  return inflight;
};

export function useMinhaEmpresaData() {
  const [data, setData] = useState(() => (cache && cache.expiresAt > Date.now() ? cache.data : null));

  useEffect(() => {
    let ativo = true;
    subscribers.add(setData);
    fetchMinhaEmpresa().then((d) => { if (ativo) setData(d); }).catch(() => {});
    return () => { ativo = false; subscribers.delete(setData); };
  }, []);

  return data;
}
