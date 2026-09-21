-- Bloco 5: pontos em aberto da reunião.
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo: ele derruba as tabelas.

create extension if not exists "pgcrypto";

create table if not exists open_points (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  title text not null,
  owner text,
  due text,
  pillar_slug text,
  status text not null default 'aberto',
  visibility meeting_visibility not null default 'advisors',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint open_points_status_check check (status in ('aberto', 'em_curso', 'travado', 'resolvido'))
);

create index if not exists open_points_deal_id_idx on open_points (deal_id);

alter table open_points enable row level security;

drop policy if exists eleva_all on open_points;
create policy eleva_all on open_points
  for all
  using (is_eleva())
  with check (is_eleva());

-- Tarefa nova pode nascer já num pilar. Coluna aditiva; o seed não muda.
alter table actions add column if not exists pillar_slug text;
