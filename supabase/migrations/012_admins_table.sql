-- =====================================================================
-- 012 - FASE 6: Tabela de Admins + RLS para operações administrativas
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABELA DE ADMINS
-- ---------------------------------------------------------------------
create table if not exists admins (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null default 'operator'
               check (role in ('operator', 'financial', 'super')),
  active     boolean default true,
  created_at timestamptz default now(),
  unique(user_id)
);

-- ---------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------
alter table admins enable row level security;

-- Admins ativos podem ler a própria linha
create policy "admins_select_own" on admins
  for select using (user_id = auth.uid() and active = true);

-- Apenas super admins podem gerenciar outros admins (via service_role no futuro)
-- Por ora bloqueamos escrita pelo anon key
create policy "admins_insert_super" on admins
  for insert with check (false);

create policy "admins_update_super" on admins
  for update using (false);

-- ---------------------------------------------------------------------
-- 3. POLÍTICAS ADMIN NAS TABELAS EXISTENTES
--    Admins ativos podem ler/escrever tudo
-- ---------------------------------------------------------------------

-- Helper: verifica se o usuário atual é admin ativo
create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists(
    select 1 from admins where user_id = auth.uid() and active = true
  );
$$;

-- functions: admins podem inserir/atualizar/deletar
create policy "functions_admin_write" on functions
  for all using (is_admin()) with check (is_admin());

-- professionals: admins podem ler/atualizar (aprovar, bloquear)
create policy "professionals_admin_all" on professionals
  for all using (is_admin()) with check (is_admin());

-- users: admins podem ler todos
create policy "users_admin_select" on public.users
  for select using (is_admin());

-- clients: admins podem ler todos
create policy "clients_admin_select" on clients
  for select using (is_admin());

-- events: admins podem ler todos
create policy "events_admin_select" on events
  for select using (is_admin());

-- bookings: admins podem ler todos
create policy "bookings_admin_select" on bookings
  for select using (is_admin());

-- booking_professionals: admins podem ler todos
create policy "bp_admin_select" on booking_professionals
  for select using (is_admin());

-- transactions: admins podem ler todos
create policy "transactions_admin_select" on transactions
  for select using (is_admin());

-- ---------------------------------------------------------------------
-- 4. SEED: admin padrão (substituir pelo user_id real após criar a conta)
-- ---------------------------------------------------------------------
-- Execute após criar a conta de admin no Supabase Auth:
--   insert into admins (user_id, role)
--   select id from public.users where email = 'admin@eventpro.com.br'
--   on conflict do nothing;
