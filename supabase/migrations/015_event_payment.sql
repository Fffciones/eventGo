-- =====================================================================
-- 015 - ETAPA 2: Aprovação de pagamento do evento (doc rev 10jun26, seção 2.3.2)
-- =====================================================================
-- - Campos de pagamento no evento (total estimado, método, status da cobrança)
-- - Admin passa a poder EDITAR o limite de crédito do contratante
-- - Corrige RLS: admin não tinha SELECT em `vagas` (criada na Etapa 1),
--   então EventosAdmin/Dashboard não enxergavam as vagas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CAMPOS DE PAGAMENTO NO EVENTO
-- ---------------------------------------------------------------------
alter table events add column if not exists estimated_total numeric(12,2) default 0;

alter table events add column if not exists payment_method text
  check (payment_method in ('CREDIT','CARD'));

alter table events add column if not exists charge_status text not null default 'PENDING'
  check (charge_status in ('PENDING','AUTHORIZED','CHARGED','FAILED'));

comment on column events.estimated_total is 'Valor total estimado do pedido (soma dos preços das vagas)';
comment on column events.payment_method  is 'CREDIT = coberto pelo limite de crédito | CARD = cartão (cobrança ao final)';
comment on column events.charge_status   is 'Status da cobrança ao contratante. Integração com gateway na Etapa 7.';

-- ---------------------------------------------------------------------
-- 2. ADMIN EDITA LIMITE DE CRÉDITO (doc 2.3.2 — "editar contratante")
-- ---------------------------------------------------------------------
drop policy if exists "clients_admin_update" on clients;
create policy "clients_admin_update" on clients
  for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 3. ADMIN ENXERGA VAGAS (corrige RLS da Etapa 1)
-- ---------------------------------------------------------------------
drop policy if exists "vagas_admin_select" on vagas;
create policy "vagas_admin_select" on vagas
  for select using (is_admin());
