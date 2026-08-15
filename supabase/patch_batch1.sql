-- Batch 1: deal_id text nas tabelas dinâmicas (seed usa deal-loopert, não uuid).
-- Rode SÓ se schema.sql original (com FK uuid) já foi aplicado.
-- Instalação nova: ignore este arquivo e rode só schema.sql atualizado.

alter table inbox_files drop constraint if exists inbox_files_deal_id_fkey;
alter table inbox_files alter column deal_id type text using deal_id::text;

alter table documents drop constraint if exists documents_deal_id_fkey;
alter table documents alter column deal_id type text using deal_id::text;

alter table decisions drop constraint if exists decisions_deal_id_fkey;
alter table decisions alter column deal_id type text using deal_id::text;

alter table checklist_items drop constraint if exists checklist_items_deal_id_fkey;
alter table checklist_items alter column deal_id type text using deal_id::text;
