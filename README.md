# Control Tower · Programa Go Live (AD+R)

Torre de controle do M&A buy-side da AD+R. Duas operações: **Loopert** (prioridade, ativa) e **Radio Health** (congelada). PMO: Eleva Projects. Corte oficial: **14/08/2026**.

A tela é uma só URL com três modos. Login só da Eleva. Pensada para screen share com Camila e Matheus (conhecem rádio, não M&A).

## Como rodar

```bash
cd control-tower
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Entre com um e-mail `@elevaprojects.com`. Em local (`npm run dev`), sem `ELEVA_DEV_PASSWORD`, qualquer senha entra. Em produção: `SESSION_SECRET` + `ELEVA_DEV_PASSWORD` (ou Supabase Auth) e `ALLOW_DEV_LOGIN=false`.

O cookie de sessão só fica `Secure` em HTTPS. Em `npm start` no localhost o login funciona (não exige HTTPS).

## O que é verdade onde

| Camada | Verdade de | Write-back |
|---|---|---|
| Google Drive | Documentos do data room | **Proibido** alterar/apagar. Só criar artefato em `Control Tower/Exports/` |
| Supabase (quando ligado) | Status, semáforo, donos, prazos, riscos, decisões, classificação | Sim |
| Seed TypeScript | Fatos do corte 14/08, para a tela não nascer vazia | — |

A torre **não lê o disco do Mac**. Workspace local é espelho; sync é a pasta compartilhada:

`https://drive.google.com/drive/folders/1VlZu-j9unQWpcjf9oqEkLIyIzjUiJAuS`

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

**A pasta não deve ficar pública.** O link “anyone with the link” foi só para validação. Em produção: Restrito.

Nunca indexar nem linkar a pasta `.obsidian`.

Quando a API estiver ligada: poll ~5 min em `/api/drive/sync` → arquivo novo cai na bandeja → humano classifica (deal, tipo, workstream, status) → só então entra no checklist. **Arquivo novo ≠ item concluído.**

Arquivos ainda em Downloads (balancete 05/2026, e-mails Suélen, 5ª ACS, projeção) **não** estão no Drive. Quando forem soltos nas pastas, registre na bandeja. Não os seedamos como classificados.

## Como adicionar um 3º deal

O modelo é deal-centric. Não redesenhe a home.

1. Inclua uma linha em `lib/data/seed.ts` (`deals`) com `slug`, fase, headline e pasta Drive.
2. Workstreams, milestones, risks, actions, checklist, metrics apontam para o `dealId`.
3. A home lista por `priority`. A rota `/deals/[slug]` já serve.
4. No Supabase: `insert into deals (...)` e o restante nas tabelas filhas.

## Os três modos (mesma URL)

Interruptor persistente no header. Ligar **Alvo** pede confirmação.

| Modo | Quem está na sala | O que some |
|---|---|---|
| **Operar** (padrão) | Eleva sozinha | Nada |
| **Reunião · Assessores** | AD+R + Pacta + João Amorim | Bandeja crua, notas de proteção Eleva (“cliente não seguiu”), credenciais |
| **Reunião · Alvo** | Loopert e/ou Radio Health | SJDC e tese contra Jardel; trajetória de preço / valuation Pacta; NDAs internos da Eleva; Hunter FM; “empresa não vale o passado”; exposição ADR ~30%; notas de proteção; bandeja |

Mostra no modo Alvo: fase, documentos pedidos, pendências formais do alvo, timeline pública.

## Registro de decisão

Objeto de primeira classe: quem, data, recomendação da Eleva, decisão, flag **contra a recomendação**, consequência. Visível no modo Operar; resumo no modo Assessores; invisível no modo Alvo.

## Alertas

Destinatário padrão: `erica@elevaprojects.com`.

- Semanal (`/api/alerts/weekly`, cron segunda 11:00 UTC se Vercel Cron estiver ligado): N vermelhos, N ações atrasadas, 1 decisão pendente.
- Opcional: e-mail quando a bandeja recebe arquivo.

Sem `RESEND_API_KEY` o payload é **logado** no servidor. Não inventamos que o e-mail saiu.

## Pack da semana

Botão **Publicar pack** em `/export/pack`. Gera markdown (resumo + log de decisão). Sem API do Google, baixa local. Com API, o destino é `Control Tower/Exports/` **dentro** da raiz do Drive — nunca em cima da apresentação viva.

A apresentação em `Apresentacoes/` **não** é atualizada automaticamente.

## Variáveis de ambiente

Ver `.env.example`.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_DRIVE_FOLDER_ID=1VlZu-j9unQWpcjf9oqEkLIyIzjUiJAuS
GOOGLE_SERVICE_ACCOUNT=
RESEND_API_KEY=
ALERT_EMAIL=erica@elevaprojects.com
SESSION_SECRET=
ELEVA_DEV_PASSWORD=
ALLOW_DEV_LOGIN=true
CRON_SECRET=
```

## Deploy

Vercel + (quando existir) Supabase. Restrinja o Auth a `@elevaprojects.com`. Sem signup público.

## O que esta torre não faz

- Não inventa LOI, SPA, NDA ADR↔Eleva, valuation fechado, municipal vigente, nem 143 contratos assinados.
- Não hospeda o binário do data room. Link = Google Drive em nova aba.
- Não lê `/Users/ulibot/Documents/M&A_Project/M&A - AD+R & Loopert`.
- Não confronta Jardel na tela de Alvo.
