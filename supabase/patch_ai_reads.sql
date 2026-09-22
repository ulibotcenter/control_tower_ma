-- Bloco 8.7: delta do Pedir leitura (last_read_at).
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo: ele derruba as tabelas.
-- A app não aplica este arquivo sozinha.

alter table inbox_files add column if not exists last_read_at timestamptz;

create table if not exists ai_file_reads (
  drive_id text primary key,
  last_read_at timestamptz not null,
  drive_modified_at timestamptz
);

alter table ai_file_reads enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_file_reads'
      and policyname = 'eleva_all'
  ) then
    create policy eleva_all on ai_file_reads
      for all
      using (is_eleva())
      with check (is_eleva());
  end if;
end $$;
