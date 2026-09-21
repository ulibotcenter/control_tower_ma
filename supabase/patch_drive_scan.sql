-- Bloco 6: modifiedTime do Drive na bandeja, para atualizar sem duplicar drive_id.
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo: ele derruba as tabelas.

alter table inbox_files add column if not exists drive_modified_at timestamptz;
