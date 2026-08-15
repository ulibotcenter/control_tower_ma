# Control Tower · Programa Go Live (AD+R)

Torre de controle do M&A buy-side da AD+R. Duas operações: **Loopert** (prioridade, ativa) e **Radio Health** (congelada). PMO: Eleva Projects. Corte oficial: **14/08/2026**.

A tela é uma só URL com três modos. Login só da Eleva (`@elevaprojects.com`). Produção: [https://tower.elevaprojects.com](https://tower.elevaprojects.com).

## Como rodar em local

```bash
cd control-tower
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Entre com um e-mail `@elevaprojects.com`. Em local (`npm run dev`), sem `ELEVA_DEV_PASSWORD`, qualquer senha entra. Em produção: `SESSION_SECRET` + `ELEVA_DEV_PASSWORD` **ou** Supabase Auth, e `ALLOW_DEV_LOGIN=false`.

O cookie de sessão só fica `Secure` em HTTPS. Em `npm start` no localhost o login funciona (não exige HTTPS).

```bash
npm run build
npm start
```

## Deploy no Vercel

1. Importe o repositório `ulibotcenter/control_tower_ma` (Framework: Next.js, Root: raiz do repo).
2. Preencha as variáveis de ambiente (abaixo) **antes** do primeiro deploy útil.
3. Rode o schema do Supabase (`supabase/schema.sql` ou `supabase/patch_batch1.sql`) **antes** de usar bandeja/decisões em produção.
4. Deploy. Confira `https://<projeto>.vercel.app/login`.
5. Só então aponte o domínio canônico.

Produção **não** usa `.data/`. Sem `SUPABASE_SERVICE_ROLE_KEY` a bandeja e as decisões novas não sobrevivem.

## Domínio `tower.elevaprojects.com`

1. Vercel → Project → Settings → Domains → adicionar `tower.elevaprojects.com`.
2. DNS da Eleva: CNAME `tower` → `cname.vercel-dns.com` (ou o target que a Vercel indicar).
3. Env `NEXT_PUBLIC_APP_URL=https://tower.elevaprojects.com`.
4. Cookie de sessão é do host (não de `.elevaprojects.com`) — o login vale só neste subdomínio.
5. Auth continua só `@elevaprojects.com`. Sem signup público.

As rotas (`/`, `/deals/loopert`, `/login`) não dependem do hostname.

## Variáveis de ambiente

Ver também `.env.example`.

| Variável | Obrigatória em prod | Função |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Sim | URL canônica (`https://tower.elevaprojects.com`) |
| `SESSION_SECRET` | Sim | Assinatura do cookie HMAC |
| `ELEVA_DEV_PASSWORD` | Se Auth HMAC | Senha única Eleva (enquanto o Auth do Supabase estiver desligado) |
| `ALLOW_DEV_LOGIN` | `false` | Qualquer senha em local. Nunca `true` na Vercel |
| `NEXT_PUBLIC_SESSION_IDLE_MINUTES` | Não (padrão 90) | Inatividade até expirar a sessão |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim, para persistir | Projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Recomendada | Cliente / futuro Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim, para persistir | Write de bandeja e decisões (servidor) |
| `SUPABASE_AUTH` | Não | `1` liga `signInWithPassword` |
| `GOOGLE_DRIVE_FOLDER_ID` | Não | Pasta raiz do data room |
| `GOOGLE_SERVICE_ACCOUNT` ou OAuth | Não | Leitura do Drive (sem isto a bandeja é manual) |
| `RESEND_API_KEY` | Não | Sem chave, alertas só logam no servidor |
| `ALERT_EMAIL` | Não | Padrão `erica@elevaprojects.com` |
| `CRON_SECRET` | Recomendada | Protege `/api/alerts/weekly` |

## Sessão

- Cookie HMAC `ct-session`, 12 horas, só `@elevaprojects.com`.
- Inatividade: **90 minutos** (ajustável). Aviso discreto 2 minutos antes. Logout limpa sessão, modo, apresentação e o relógio de ociosidade (`ct-seen`).
- O mesmo relógio vale para o caminho atual e para o futuro Supabase Auth.

## Como ativar Supabase Auth (futuro)

Hoje o login **não** usa o Auth do Supabase. Persistência (bandeja/decisões) e login são coisas distintas.

Quando for ligar:

1. No Supabase: Authentication → Providers → Email. Desligue signup público.
2. Crie só contas `@elevaprojects.com`.
3. Env na Vercel:
   ```
   SUPABASE_AUTH=1
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Mantenha `SESSION_SECRET`. Depois do `signInWithPassword` a torre ainda grava `ct-session`.
5. `ALLOW_DEV_LOGIN=false`. Pode aposentar `ELEVA_DEV_PASSWORD` quando o Auth estiver estável.
6. Quando o Auth SSR estiver pronto, o ponto de troca é `getSession()` em `lib/auth.ts` — o restante da torre não muda.

Service role **não** entra no login. É só para o store.

## O que é verdade onde

| Camada | Verdade de | Write-back |
|---|---|---|
| Google Drive | Documentos do data room | **Proibido** alterar/apagar. Só criar artefato em `Control Tower/Exports/` |
| Supabase (URL + **service role**) | Bandeja, classificação, documentos extras, decisões novas | Sim |
| Seed TypeScript | Fatos estáticos do corte 14/08 (deals, riscos, checklist base) | — |
| `.data/store.json` | Fallback **só em local** sem Supabase | Sim (dev) |

A torre **não lê o disco do Mac**. Workspace local é espelho; sync é a pasta compartilhada:

`https://drive.google.com/drive/folders/1VlZu-j9unQWpcjf9oqEkLIyIzjUiJAuS`

Origem de cada coleção: `lib/data/sources.ts`.

## Como ligar o Drive

Sem credencial a bandeja é **manual** e os links apontam para as pastas conhecidas. A torre **não finge** que está lendo o Drive.

No `.env.local`:

```
GOOGLE_DRIVE_FOLDER_ID=1VlZu-j9unQWpcjf9oqEkLIyIzjUiJAuS
GOOGLE_SERVICE_ACCOUNT=...   # JSON da service account
# ou OAuth:
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
```

A service account precisa de **Leitor** na pasta raiz. Writer, se possível, **só** em `Control Tower/Exports/`.

**A pasta não deve ficar pública.** Nunca indexar nem linkar a pasta `.obsidian`.

Quando a API estiver ligada: poll ~5 min em `/api/drive/sync` → arquivo novo cai na bandeja → humano classifica → só então entra no checklist. **Arquivo novo ≠ item concluído.**

## Ligar o Supabase (persistência no Vercel)

1. Crie um projeto no Supabase (região perto do Vercel).
2. SQL Editor → `supabase/schema.sql` (instalação nova) ou `supabase/patch_batch1.sql` se o schema antigo já rodou.
3. Project Settings → API: `URL` e `service_role` (nunca a service role no cliente).
4. Env na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
5. Deploy **depois** do schema. Sem tabelas, classificar/registrar devolve 500.
6. Na home, modo Operar: dados em «Supabase write».

Local sem essas env: seed + `.data/`.

## Os três modos (mesma URL)

| Modo | Quem está na sala | O que some |
|---|---|---|
| **Operar** (padrão) | Eleva sozinha | Nada |
| **Assessores** | AD+R + Pacta + João Amorim | Bandeja, notas internas, credenciais |
| **Alvo** | Loopert e/ou Radio Health | Preço, teses internas, SJDC, Hunter, bandeja, decisões |

Alvo pede confirmação. Atalhos: `1` Loopert, `2` Radio Health, `P` apresentação, `/` busca, `?` ajuda.

## Registro de decisão

Quem, data, recomendação da Eleva, decisão, flag contra a recomendação, consequência. Operar vê tudo; Assessores vê resumo; Alvo não vê.

## Alertas e pack

- Semanal (`/api/alerts/weekly`, cron segunda 11:00 UTC se o Cron da Vercel estiver ligado).
- Pack em `/export/pack` (markdown). A apresentação viva em `Apresentacoes/` **não** é atualizada por esta torre. PDF da visão atual: botão no header.

## Como adicionar um 3º deal

1. Linha em `lib/data/seed.ts` (`deals`) com `slug`, fase, headline e pasta Drive.
2. Workstreams, milestones, risks, actions, checklist, metrics apontam para o `dealId`.
3. A home lista por `priority`. A rota `/deals/[slug]` já serve.

## O que esta torre não faz

- Não inventa LOI, SPA, NDA ADR↔Eleva, valuation fechado, municipal vigente, nem 143 contratos assinados.
- Não hospeda o binário do data room. Link = Google Drive em nova aba.
- Não lê o workspace local do Mac.
- Não confronta Jardel na tela de Alvo.
