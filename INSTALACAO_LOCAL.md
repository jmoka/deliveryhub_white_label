# Instalação local/individual (mono-estabelecimento)

Guia pra colocar o PediuVai rodando inteiro no PC de um único estabelecimento — sem depender da infraestrutura central (VPS/EasyPanel) — e disponibilizar o domínio na internet de forma segura via Cloudflare Tunnel.

Diferente da instalação de desenvolvimento (README.md, raiz), aqui o objetivo é uma instalação **real, vendida, cobrada por assinatura**, com banco de dados próprio e licenciamento controlado pela plataforma central.

## Dois mecanismos independentes (não confundir)

| | O que é | Onde mora | Pra que serve |
|---|---|---|---|
| **Modo individual** (`modo_individual`) | Restrição só de UI do painel admin — mostra 1 restaurante só, esconde cadastro de novas empresas | `platform_settings` (banco) ou `VITE_LOCAL_RESTAURANT_ID` (`.env` do frontend, tem prioridade) | Polir a experiência — mesmo numa instalação de banco próprio (só 1 restaurante mesmo), sem isso o painel ainda mostraria telas de "multi-empresa" |
| **Licenciamento** (`LICENCA_SERIAL`) | Faz o backend "telefonar pra casa" periodicamente e travar o acesso se a assinatura estiver vencida/revogada | `.env` do backend (`LICENCA_SERIAL`, `LICENCA_CENTRAL_URL`) | Cobrança recorrente e controle de acesso de instalações vendidas — é o que realmente diferencia "instalação licenciada" de "deployment central multi-tenant" |

Uma instalação individual de verdade normalmente liga os dois, mas tecnicamente são independentes.

## Passo a passo

### 1. Gerar o serial (feito na plataforma central, uma vez por cliente)

No admin da plataforma central: **Admin → Planos → aba "Instalações Locais"** → criar instalação (nome do cliente, contato, domínio/IP, plano opcional). O backend gera um serial único (`gerarSerial()`, `InstalacoesService.criar`) — anote esse serial, ele vai pro `.env` do passo 3.

### 2. Provisionar o Supabase da instalação

A instalação precisa do **próprio** banco — não é o mesmo Supabase da plataforma central. Duas opções (mesmas do deploy em VPS, ver `server_delivery/README.md`):

- **Supabase Cloud** (mais simples): criar projeto em supabase.com, rodar as migrations (`supabase/migrations/`) contra ele (`supabase link` + `supabase db push`), pegar `Project URL` + `service_role key`.
- **Supabase local no próprio PC** (via Docker, `supabase start` a partir de `deliveryhub_white_label/`) — mesmo fluxo do ambiente de dev, só que essa instância fica rodando de verdade, não é descartável.

Rodar o seed inicial se for uma instalação nova (`npm run seed:primeiro-boot` dentro de `server_delivery`), pra já nascer com o admin/dono/produtos de exemplo — depois o dono real customiza.

### 3. Configurar o backend (`server_delivery/.env`)

```env
SUPABASE_URL=<URL do passo 2>
SUPABASE_SERVICE_ROLE_KEY=<service_role do passo 2>
PORT=3002

# Licenciamento — é isso que marca essa instalação como individual/licenciada
LICENCA_SERIAL=<serial gerado no passo 1>
LICENCA_CENTRAL_URL=<URL pública da plataforma central, ex. https://app-desenvolvimento-server-delivery.ubjifz.easypanel.host>
LICENCA_CHECKIN_INTERVALO_MIN=5

# Demais credenciais (PagBank, Telegram, etc.) — mesmas variáveis do .env.example,
# preenchidas com os dados reais dessa instalação (não compartilha com a central)
```

`LicencaService` (`src/licenca/licenca.service.ts`) só ativa o checkin periódico se `LICENCA_SERIAL` estiver preenchido — sem ele, o backend sobe normal mas sem controle de licença (é o modo "central multi-tenant").

Build e start (produção, não `start:dev`):
```bash
npm install
npm run build
npm run start:prod
# ou, com PM2 pra reiniciar sozinho em caso de queda:
pm2 start dist/main.js --name delivery-backend
```

### 4. Configurar o frontend (raiz do `deliveryhub_white_label`, `.env`)

```env
VITE_SUPABASE_URL=<mesma URL do passo 2>
VITE_SUPABASE_ANON_KEY=<anon key do passo 2>
VITE_API_URL=<domínio público que vai expor o backend, passo 5>
VITE_LOCAL_RESTAURANT_ID=<id do restaurante, se quiser já restringir por .env — opcional, dá pra fazer isso depois pelo Admin>
```

Build de produção:
```bash
npm install
npm run build
```
O `build/` resultante precisa ser servido por algo (nginx, `serve -s build`, etc.) — não use `npm run dev` numa instalação real.

### 5. Expor pra internet com Cloudflare Tunnel (sem abrir porta no roteador)

Já existe `docker-compose.yml` na raiz do frontend pronto pra isso — sobe só um container `cloudflared` rodando um **túnel nomeado**:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: deliveryhub-cloudflared
    restart: unless-stopped
    command: tunnel run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    env_file:
      - .env.docker
```

**Por que é seguro:** o túnel é outbound-only — o `cloudflared` no PC do cliente conecta pra fora, na borda da Cloudflare. Não precisa abrir porta nenhuma no roteador/firewall, não precisa de IP público fixo, nada do PC fica exposto diretamente pra internet.

Passos:
1. No painel Cloudflare (Zero Trust → Networks → Tunnels), criar um túnel nomeado novo. Copiar o token gerado.
2. Configurar os **Public Hostnames** do túnel (isso fica no painel da Cloudflare, não no código):
   - `<dominio-do-cliente>` → `http://localhost:4028` (frontend)
   - uma rota pra API (subdomínio ou path) → `http://localhost:3002` (backend) — o valor usado em `VITE_API_URL` no passo 4 precisa bater com essa rota.
3. Criar `.env.docker` (mesma pasta do `docker-compose.yml`):
   ```env
   CLOUDFLARE_TUNNEL_TOKEN=<token do passo 1>
   ```
4. Subir o túnel:
   ```bash
   docker-compose up -d
   ```

**Não usar** esse mesmo token/túnel pra testes locais avulsos (ver `npm run dev:tunnel` em `server_delivery/scripts/dev-tunnel.ts`, que sobe um túnel efêmero separado, sem token, só pra testar webhook em dev — misturar os dois arriscaria disputar tráfego com uma instalação real).

### 6. Ativar o modo individual no painel (opcional, mas recomendado)

Com o backend/frontend já rodando: login como admin → **Admin → Configurações** → seção "Instalação individual (mono-estabelecimento)" → ligar o toggle → escolher o restaurante. Isso restringe o painel admin a mostrar só esse restaurante (sem cadastro de novas empresas, sem lista multi-empresa) — mais claro pro dono que só existe 1 loja ali.

Alternativa sem precisar logar: setar `VITE_LOCAL_RESTAURANT_ID` no `.env` do frontend (passo 4) antes do build — tem prioridade sobre o que está salvo no banco.

### 7. Verificação

- `curl http://localhost:3002/licenca/status` (ou pela URL pública) — deve responder `{ ativo: true, bloqueado: false, ... }`.
- Acessar o domínio público configurado no túnel — deve carregar o app normalmente.
- No painel admin, o banner amarelo "Modo Local — Restaurante: X" deve aparecer no topo (confirma que `modo_individual` está ativo).
- Se a licença for revogada pelo admin central, o banner vermelho de bloqueio (`LicencaBloqueadaBanner`) deve aparecer na próxima consulta (ou clicando "Verificar agora").

## Arquivos relevantes

- `src/licenca/licenca.service.ts` / `licenca.controller.ts` — checkin periódico e endpoint de status
- `src/instalacoes/` — CRUD de instalações + checkin (lado central)
- `src/contexts/LocalModeContext.jsx` — lógica do modo individual + banners no frontend
- `src/pages/admin-configuracoes/index.jsx` — toggle "Instalação individual"
- `src/pages/admin-planos/index.jsx` (aba "Instalações Locais") — gerar serial
- `docker-compose.yml` (raiz do frontend) — túnel Cloudflare nomeado
- `server_delivery/scripts/dev-tunnel.ts` — túnel efêmero separado, só pra dev/teste de webhook (não confundir com este)
