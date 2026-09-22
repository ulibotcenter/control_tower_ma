-- Bloco 8: fila de propostas da IA.
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo: ele derruba as tabelas.
-- Este arquivo fica no repositório. A app não aplica o SQL sozinha.

create extension if not exists "pgcrypto";

create table if not exists ai_proposals (
  id uuid primary key default gen_random_uuid(),
  deal_slug text not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  constraint ai_proposals_kind_check check (kind in ('opl', 'tarefa', 'nota', 'classificacao', 'atencao')),
  constraint ai_proposals_status_check check (status in ('pendente', 'aceita', 'descartada', 'editada'))
);

create index if not exists ai_proposals_deal_slug_idx on ai_proposals (deal_slug);
create index if not exists ai_proposals_status_idx on ai_proposals (status);

alter table ai_proposals enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_proposals'
      and policyname = 'eleva_all'
  ) then
    create policy eleva_all on ai_proposals
      for all
      using (is_eleva())
      with check (is_eleva());
  end if;
end $$;
