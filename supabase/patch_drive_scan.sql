-- Bloco 6: modifiedTime do Drive na bandeja, para atualizar sem duplicar drive_id.
-- Aplicar no SQL Editor em cima do schema já existente.
-- Não rode schema.sql de novo: ele derruba as tabelas.

alter table inbox_files add column if not exists drive_modified_at timestamptz;

-- Pasta-pai do arquivo, para a árvore de Documentos. Sem isto a varredura só guarda o arquivo solto.
alter table inbox_files add column if not exists folder_id text;
