-- =====================================================================
-- 013 - ETAPA 1A: Campos de equipe do evento (doc rev 10jun26, seção 1.4.1)
-- =====================================================================
-- Adiciona ao evento:
--   - Horário de chegada da equipe
--   - Responsável 1 (nome, função, WhatsApp)
--   - Responsável 2 (nome, função, WhatsApp)
-- Aditivo e retrocompatível: todos os campos são opcionais.
-- =====================================================================

alter table events add column if not exists team_arrival_at      timestamptz;

alter table events add column if not exists responsible_1_name     text;
alter table events add column if not exists responsible_1_role     text;
alter table events add column if not exists responsible_1_whatsapp text;

alter table events add column if not exists responsible_2_name     text;
alter table events add column if not exists responsible_2_role     text;
alter table events add column if not exists responsible_2_whatsapp text;

comment on column events.team_arrival_at      is 'Horário em que a equipe deve chegar ao local (geralmente antes de starts_at)';
comment on column events.responsible_1_name     is 'Nome do responsável 1 no local';
comment on column events.responsible_1_role     is 'Função/cargo do responsável 1 (ex: Coordenador)';
comment on column events.responsible_1_whatsapp is 'WhatsApp do responsável 1';
comment on column events.responsible_2_name     is 'Nome do responsável 2 no local';
comment on column events.responsible_2_role     is 'Função/cargo do responsável 2';
comment on column events.responsible_2_whatsapp is 'WhatsApp do responsável 2';
