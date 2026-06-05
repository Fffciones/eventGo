-- Fase 4: suporte a dois tipos de profissional (MEI e Diarista)

-- 1. Adicionar coluna professional_type
alter table professionals
  add column if not exists professional_type text not null default 'MEI'
  check (professional_type in ('MEI', 'DIARISTA'));

-- 2. mei_number deixa de ser obrigatório e unique (diaristas não têm CNPJ)
alter table professionals
  alter column mei_number drop not null;

alter table professionals
  drop constraint if exists professionals_mei_number_key;

-- Diaristas existentes no seed ficam com mei_number, sem problema.
-- Novos diaristas terão mei_number = null.
