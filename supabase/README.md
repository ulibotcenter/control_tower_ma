# Supabase — verdade do controle (writes dinâmicos)

Neste batch o Postgres guarda **bandeja, classificação, documentos/checklist da bandeja e decisões novas**.

Deals, riscos, workstreams e o checklist-base do corte 14/08 continuam no seed TypeScript (`lib/data/seed.ts`).

## Instalação nova

1. SQL Editor → `schema.sql`.
2. Env no Vercel / `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (obrigatória para a torre ler/escrever)
3. A home deve dizer **Supabase: lendo/escrevendo**.

A app usa a service role no servidor (bypassa RLS). Não exponha essa chave no browser.

## Schema antigo já aplicado

Rode `patch_batch1.sql` (deal_id passa a `text` para aceitar `deal-loopert`).

## Sem Supabase

A torre usa seed + `.data/store.json`. Serve para `npm run dev`.
