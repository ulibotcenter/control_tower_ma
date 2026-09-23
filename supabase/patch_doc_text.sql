-- Bloco 8.10a: memória doc_text do data room.
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo: ele derruba as tabelas.
-- A app não aplica este arquivo sozinha.

create table if not exists doc_text (
  drive_id text primary key,
  name text,
  mime text,
  folder_id text,
  deal_slug text,
  body text,
  chars int,
  ingested_at timestamptz,
  drive_modified_at timestamptz,
  skipped_reason text
);

alter table doc_text enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'doc_text'
      and policyname = 'eleva_all'
  ) then
    create policy eleva_all on doc_text
      for all
      using (is_eleva())
      with check (is_eleva());
  end if;
end $$;

-- Mesmo acesso das tabelas public: a service role grava; RLS is_eleva() segura anon e authenticated.
grant all on table public.doc_text to service_role;
grant all on table public.doc_text to authenticated;
grant all on table public.doc_text to anon;
