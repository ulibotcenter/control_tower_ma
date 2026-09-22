-- Bloco 9.6c: edição inline das fichas de RH da Loopert.
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo.

create table if not exists rh_person_edits (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  person_name text not null,
  field text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  constraint rh_person_edits_field_check check (field in ('role', 'years', 'importance', 'salary', 'source')),
  constraint rh_person_edits_person_field unique (deal_id, person_name, field)
);

create index if not exists rh_person_edits_deal_idx on rh_person_edits (deal_id);

alter table rh_person_edits enable row level security;

drop policy if exists eleva_all on rh_person_edits;
create policy eleva_all on rh_person_edits
  for all
  using (is_eleva())
  with check (is_eleva());
