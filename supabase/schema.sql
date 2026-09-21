-- Control Tower · schema limpo (Batch 1)
-- window é palavra reservada no Postgres → use time_window

drop table if exists notes cascade;
drop table if exists inbox_files cascade;
drop table if exists decisions cascade;
drop table if exists metrics cascade;
drop table if exists checklist_items cascade;
drop table if exists actions cascade;
drop table if exists risks cascade;
drop table if exists documents cascade;
drop table if exists milestones cascade;
drop table if exists workstreams cascade;
drop table if exists deals cascade;

drop type if exists decision_who cascade;
drop type if exists checklist_status cascade;
drop type if exists document_status cascade;
drop type if exists document_type cascade;
drop type if exists deal_status cascade;
drop type if exists semaphore cascade;
drop type if exists meeting_visibility cascade;

create extension if not exists "pgcrypto";

create type meeting_visibility as enum ('operate', 'advisors', 'target');
create type semaphore as enum ('green', 'amber', 'red', 'gray');
create type deal_status as enum ('active', 'standby', 'closed', 'dropped');
create type document_type as enum ('nda', 'ata', 'transcricao', 'contrato', 'financeiro', 'outro');
create type document_status as enum ('rascunho', 'assinado', 'vigente', 'vencido', 'a_classificar');
create type checklist_status as enum ('aberto', 'em_andamento', 'concluido', 'inexistente', 'bloqueado');
create type decision_who as enum ('board', 'eleva', 'pacta');

create table deals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  legal_name text not null,
  cnpj text,
  city text,
  priority int not null default 100,
  status deal_status not null default 'active',
  phase text not null,
  phase_label text not null,
  headline text not null,
  headline_target text not null,
  health semaphore not null default 'gray',
  health_reason text,
  next_milestone text,
  drive_folder_id text,
  created_at timestamptz default now()
);

create table workstreams (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  slug text not null,
  name text not null,
  owner text,
  health semaphore not null default 'gray',
  summary text,
  summary_target text,
  visibility meeting_visibility not null default 'advisors',
  sensitivities text[] not null default '{}',
  unique (deal_id, slug)
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  slug text not null,
  name text not null,
  time_window text,
  status text not null,
  summary text
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete set null,
  title text not null,
  drive_url text not null,
  drive_id text,
  folder_id text,
  type document_type not null default 'outro',
  workstream_slug text,
  status document_status not null default 'a_classificar',
  classified boolean not null default false,
  note text,
  visibility meeting_visibility not null default 'advisors',
  sensitivities text[] not null default '{}'
);

create table risks (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  workstream_slug text,
  title text not null,
  detail text,
  severity semaphore not null default 'amber',
  visibility meeting_visibility not null default 'advisors',
  sensitivities text[] not null default '{}'
);

create table actions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  workstream_slug text,
  title text not null,
  owner text,
  due text,
  status text not null default 'open',
  visibility meeting_visibility not null default 'advisors',
  sensitivities text[] not null default '{}'
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  workstream_slug text not null,
  title text not null,
  status checklist_status not null default 'aberto',
  document_id uuid references documents(id) on delete set null,
  drive_url text,
  note text,
  visibility meeting_visibility not null default 'advisors',
  sensitivities text[] not null default '{}'
);

create table metrics (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  label text not null,
  value text not null,
  context text,
  visibility meeting_visibility not null default 'advisors',
  sensitivities text[] not null default '{}'
);

create table decisions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete set null,
  who decision_who not null,
  who_label text,
  date date not null,
  eleva_recommendation text not null,
  decision_taken text not null,
  against_recommendation boolean not null default false,
  consequence text,
  created_at timestamptz default now()
);

create table inbox_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source text not null default 'manual',
  drive_url text,
  drive_id text,
  drive_modified_at timestamptz,
  received_at timestamptz not null default now(),
  classified boolean not null default false,
  deal_id uuid references deals(id) on delete set null,
  type document_type,
  workstream_slug text,
  status document_status
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  body text not null,
  visibility meeting_visibility not null default 'operate',
  sensitivities text[] not null default '{}'
);

alter table deals enable row level security;
alter table workstreams enable row level security;
alter table milestones enable row level security;
alter table documents enable row level security;
alter table risks enable row level security;
alter table actions enable row level security;
alter table checklist_items enable row level security;
alter table metrics enable row level security;
alter table decisions enable row level security;
alter table inbox_files enable row level security;
alter table notes enable row level security;

create or replace function is_eleva()
returns boolean language sql stable as $$
  select coalesce(auth.jwt()->>'email', '') like '%@elevaprojects.com';
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'deals','workstreams','milestones','documents','risks','actions',
    'checklist_items','metrics','decisions','inbox_files','notes'
  ]
  loop
    execute format('create policy eleva_all on %I for all using (is_eleva()) with check (is_eleva());', t);
  end loop;
end $$;