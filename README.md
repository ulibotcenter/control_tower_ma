# Control Tower · Programa Go Live (AD+R)

Torre de controle do M&A buy-side da AD+R. Duas operações: **Loopert** (prioridade, ativa) e **Radio Health** (em análise). PMO: Eleva Projects. Corte oficial: **14/08/2026**.

A tela é uma só URL com três modos. Login individual via Supabase Auth (sem signup público). Produção: [https://tower.elevaprojects.com](https://tower.elevaprojects.com).

## Como rodar em local

```bash
cd control-tower
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

**Dois caminhos de login** (não se misturam na mesma requisição):

1. **Supabase Auth** — `SUPABASE_AUTH=1` + URL + ANON_KEY. Cada pessoa entra com a própria conta criada no painel do Supabase. Sem cadastro nesta torre.
2. **HMAC legado** — sem `SUPABASE_AUTH`. Senha única `ELEVA_DEV_PASSWORD` e só `@elevaprojects.com`. Em `npm run dev` local, sem essa senha, qualquer senha entra (`ALLOW_DEV_LOGIN`).

Em ambos os casos, o sucesso grava o cookie `ct-session`. O restante da torre não muda.

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
5. Sem signup público. Com Supabase Auth, só entra quem tem conta criada no painel.

As rotas (`/`, `/deals/loopert`, `/login`) não dependem do hostname.

## Variáveis de ambiente

Ver também `.env.example`.

| Variável | Obrigatória em prod | Função |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Sim | URL canônica (`https://tower.elevaprojects.com`) |
| `SESSION_SECRET` | Sim | Assinatura do cookie HMAC. **Sem fallback**: ausente ou vazia, a torre não autentica |
| `ELEVA_DEV_PASSWORD` | Só no fallback HMAC | Senha única Eleva. Pode aposentar com Auth ligado |
| `ALLOW_DEV_LOGIN` | `false` | Qualquer senha em local. Nunca `true` na Vercel |
| `NEXT_PUBLIC_SESSION_IDLE_MINUTES` | Não (padrão 90) | Inatividade até expirar a sessão |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim, para Auth e persistir | Projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim, para Auth | Só no login (`signInWithPassword`). Nunca service role |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim, para persistir | Write de bandeja e decisões. **Não** entra no login |
| `SUPABASE_AUTH` | `1` em produção | Liga o login individual |
| `GOOGLE_DRIVE_FOLDER_ID` | Não | Pasta raiz do data room |
| `GOOGLE_SERVICE_ACCOUNT` ou OAuth | Não | Leitura do Drive (sem isto a bandeja é manual) |
| `RESEND_API_KEY` | Não | Sem chave, alertas só logam no servidor |
| `ALERT_EMAIL` | Não | Padrão `erica@elevaprojects.com` |
| `CRON_SECRET` | Recomendada | Protege `/api/alerts/weekly` |

## Sessão

- `SESSION_SECRET` é **obrigatória e não tem fallback**. Sem ela `/login` mostra a tela de configuração, o login recusa e as APIs devolvem 503. Nunca houve chave padrão em produção — agora também não há em lugar nenhum.
- Depois do login, cookie HMAC `ct-session` (12 horas), `httpOnly`. O Auth do Supabase **não** fica persistido no browser.
- O cookie carrega **quem entrou e o estado da reunião** (modo + alvo travado). O middleware confere a assinatura em toda requisição; cookie forjado ou adulterado é apagado e cai no login.
- Inatividade: **90 minutos** (ajustável). Aviso 2 minutos antes. Logout limpa sessão, modo, apresentação e `ct-seen`.
- Quem não tem conta no Auth (com `SUPABASE_AUTH` ligado) não entra.

## Modo de reunião

O modo **não** é mais um cookie `ct-mode` que o browser lê e edita. Ele vive dentro do `ct-session` assinado, então:

- trocar de modo exige sessão válida e passa por `POST /api/mode`;
- apagar o cookie **desloga** em vez de voltar para Operar (falha para o lado seguro);
- entrar em **Alvo** exige dizer qual operação está na sala. A reunião trava nela: a outra some do cabeçalho, da home e das URLs `/deals/…`, inclusive digitadas à mão;
- sair do **Alvo** exige digitar `SAIR DO ALVO` por extenso — verificado no servidor, não só na tela;
- no modo Alvo os atalhos `1`, `2` e `P` ficam desligados. Trocar de operação ou de modo só pelo seletor.

## Como ligar o login individual (Supabase Auth)

Persistência (bandeja/decisões) e login são coisas distintas. O **service role não entra no login**.

1. Supabase → **Authentication → Providers → Email**: ligue o provider.
2. **Authentication → Providers → Email → Enable sign ups**: **desligado**. Sem cadastro público.
3. **Authentication → Users → Add user**: crie as contas à mão (e-mail + senha).  
   Previstas: `uli@elevaprojects.com`, `erica@elevaprojects.com`, e Camila / Matheus se tiverem conta.
4. Env na Vercel (Production):
   ```
   SUPABASE_AUTH=1
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SESSION_SECRET=...
   ```
   Sem `ANON_KEY` o caminho Auth não liga (a torre cai no HMAC legado).
5. `ALLOW_DEV_LOGIN=false`.
6. `ELEVA_DEV_PASSWORD` pode ficar um tempo como fallback (se `SUPABASE_AUTH` estiver desligado). Com Auth estável, retire da Vercel.
7. Confirme o login em `https://<projeto>.vercel.app/login` com uma conta criada no passo 3.

Sem signup nesta torre. Quem não existir no Auth recebe «E-mail ou senha incorretos.»

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
