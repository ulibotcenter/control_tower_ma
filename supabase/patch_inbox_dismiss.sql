-- Bloco 8.5: dispensar a lista da bandeja sem apagar nem classificar.
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo: ele derruba as tabelas.

alter table inbox_files add column if not exists dismissed boolean not null default false;
