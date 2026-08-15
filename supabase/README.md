# Supabase — verdade do controle

O seed TypeScript em `lib/data/seed.ts` é o que a tela usa hoje. Quando o projeto
Supabase existir:

1. Rode `schema.sql` no SQL editor.
2. Recrie os fatos do corte 14/08/2026 a partir de `lib/data/seed.ts` (não invente números).
3. Preencha `NEXT_PUBLIC_SUPABASE_*` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Auth: desligue signup público. Só `@elevaprojects.com`.

Até lá a torre opera com seed + `.data/store.json` local.
