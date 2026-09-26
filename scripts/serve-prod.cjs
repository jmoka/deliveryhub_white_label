#!/usr/bin/env node
// Servidor estático de produção do frontend — substitui o pacote "serve"
// (antigo "start") só pra poder injetar og:title/og:image por domínio White
// Label (loja com modulo_favicon_personalizado + logo_url) antes de responder.
// Crawlers de preview social (WhatsApp, Facebook, Telegram etc.) nunca
// executam o JS da SPA, então sempre viam a imagem genérica da PediuVai
// mesmo em domínio próprio de loja — o favicon personalizado (aplicarFaviconLoja,
// src/utils/faviconLoja.js) só troca o ícone da aba no navegador, não esses
// meta tags. Fora essa injeção, serve os arquivos de build/ e faz fallback
// pra index.html (SPA) igual o "serve -s" fazia.
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 4028;
const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX_PATH = path.join(BUILD_DIR, 'index.html');
// Backend NestJS roda no mesmo host — chamada servidor-a-servidor, sem passar
// pelo túnel/DNS público. Rota pública já existe e já é cacheada (Redis, 15s)
// em catalogo.controller.ts.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3002';
const META_CACHE_TTL_MS = 60_000;
const META_FETCH_TIMEOUT_MS = 1500;

const INDEX_TEMPLATE = fs.readFileSync(INDEX_PATH, 'utf-8');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
};

// host -> { meta: {nome, logoUrl} | null, expiresAt } — null cacheado também,
// pra não bater no backend a cada pageview de domínio comum/sem o módulo.
const metaCache = new Map();

async function buscarMetaLoja(host) {
  const cacheado = metaCache.get(host);
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado.meta;

  let meta = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), META_FETCH_TIMEOUT_MS);
    const res = await fetch(`${INTERNAL_API_URL}/r/by-domain/${encodeURIComponent(host)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const restaurante = data?.restaurante;
      if (restaurante?.modulo_favicon_personalizado && restaurante?.logo_url) {
        meta = { nome: restaurante.name, logoUrl: restaurante.logo_url, descricao: restaurante.aparencia?.descricao || null };
      }
    }
  } catch {
    // Domínio não é loja White Label, backend fora do ar, timeout etc. —
    // nunca deixa a página travar por causa disso, só serve o HTML padrão.
  }

  metaCache.set(host, { meta, expiresAt: Date.now() + META_CACHE_TTL_MS });
  return meta;
}

function escapeHtmlAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function montarHtmlComMetaDaLoja(host, meta) {
  const nome = escapeHtmlAttr(meta.nome || host);
  const logo = escapeHtmlAttr(meta.logoUrl);
  const url = escapeHtmlAttr(`https://${host}/`);

  let html = INDEX_TEMPLATE
    .replace(/<title>.*?<\/title>/, `<title>${nome}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${nome}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${logo}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${nome}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${logo}$2`);

  if (meta.descricao) {
    const descricao = escapeHtmlAttr(meta.descricao);
    html = html
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${descricao}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${descricao}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${descricao}$2`);
  }

  return html;
}

function tipoConteudo(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const ext = path.extname(pathname);

    // Arquivo estático real (tem extensão) — serve direto do build/, sem
    // passar pela lógica de meta tags (só a navegação SPA precisa disso).
    if (ext) {
      const filePath = path.join(BUILD_DIR, pathname);
      if (!filePath.startsWith(BUILD_DIR)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(filePath, (err, conteudo) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': tipoConteudo(filePath),
          'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        });
        res.end(conteudo);
      });
      return;
    }

    // Navegação SPA — fallback pro index.html, com meta tags trocadas se o
    // Host bater com uma loja White Label com favicon personalizado ativo.
    const host = (req.headers.host || '').split(':')[0];
    const meta = await buscarMetaLoja(host);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(meta ? montarHtmlComMetaDaLoja(host, meta) : INDEX_TEMPLATE);
  } catch {
    res.writeHead(500);
    res.end('Internal server error');
  }
});

server.listen(PORT, () => {
  console.log(`Frontend servindo build/ na porta ${PORT} (meta tags dinâmicas por domínio ativas).`);
});
