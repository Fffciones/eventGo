-- =====================================================================
-- 002 - AUTH TRIGGER + ROW LEVEL SECURITY
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SINCRONIZA SUPABASE AUTH → users
--    Ao criar conta no Auth, cria o registro em users automaticamente
-- ---------------------------------------------------------------------
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    (new.raw_user_meta_data->>'user_type')::user_type
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_auth_user();

-- ---------------------------------------------------------------------
-- 2. HELPERS DE CONTEXTO
-- ---------------------------------------------------------------------
create or replace function auth_user_id() returns uuid language sql stable as $$
  select auth.uid();
$$;

create or replace function auth_user_type() returns user_type language sql stable as $$
  select user_type from public.users where id = auth.uid();
$$;

create or replace function is_client() returns boolean language sql stable as $$
  select exists (select 1 from public.clients where user_id = auth.uid());
$$;

create or replace function is_professional() returns boolean language sql stable as $$
  select exists (select 1 from public.professionals where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 3. RLS — habilitar em todas as tabelas
-- ---------------------------------------------------------------------
alter table users                   enable row level security;
alter table clients                 enable row level security;
alter table professionals           enable row level security;
alter table events                  enable row level security;
alter table bookings                enable row level security;
alter table booking_professionals   enable row level security;
alter table professional_availability enable row level security;
alter table professional_locations  enable row level security;
alter table transactions            enable row level security;
alter table pix_payments            enable row level security;
alter table reviews                 enable row level security;
alter table saved_teams             enable row level security;
alter table saved_team_members      enable row level security;
alter table client_favorites        enable row level security;
alter table notifications           enable row level security;
alter table price_table             enable row level security;
alter table price_multipliers       enable row level security;
alter table star_milestones         enable row level security;
alter table credit_packages         enable row level security;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
create policy "users: ver próprio perfil"
  on users for select using (id = auth_user_id());

create policy "users: editar próprio perfil"
  on users for update using (id = auth_user_id());

-- Clientes podem ver perfil básico de profissionais ativos
create policy "users: clientes veem profissionais ativos"
  on users for select using (
    user_type = 'PROFESSIONAL'
    and exists (
      select 1 from professionals p
      where p.user_id = users.id and p.status = 'ACTIVE'
    )
  );

-- ---------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------
create policy "clients: ver próprio perfil"
  on clients for select using (user_id = auth_user_id());

create policy "clients: editar próprio perfil"
  on clients for update using (user_id = auth_user_id());

-- ---------------------------------------------------------------------
-- PROFESSIONALS
-- ---------------------------------------------------------------------
create policy "professionals: ver próprio perfil"
  on professionals for select using (user_id = auth_user_id());

create policy "professionals: editar próprio perfil"
  on professionals for update using (user_id = auth_user_id());

-- Clientes veem profissionais ativos
create policy "professionals: clientes veem ativos"
  on professionals for select using (
    status = 'ACTIVE' and is_client()
  );

-- ---------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------
create policy "events: cliente vê seus eventos"
  on events for select using (
    client_id in (select id from clients where user_id = auth_user_id())
  );

create policy "events: cliente cria evento"
  on events for insert with check (
    client_id in (select id from clients where user_id = auth_user_id())
  );

create policy "events: cliente edita seu evento"
  on events for update using (
    client_id in (select id from clients where user_id = auth_user_id())
  );

-- Profissional vê eventos em que foi contratado
create policy "events: profissional vê eventos contratados"
  on events for select using (
    exists (
      select 1 from bookings b
      join booking_professionals bp on bp.booking_id = b.id
      join professionals p on p.id = bp.professional_id
      where b.event_id = events.id and p.user_id = auth_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------
create policy "bookings: cliente vê seus bookings"
  on bookings for select using (
    event_id in (
      select e.id from events e
      join clients c on c.id = e.client_id
      where c.user_id = auth_user_id()
    )
  );

create policy "bookings: cliente cria booking"
  on bookings for insert with check (
    event_id in (
      select e.id from events e
      join clients c on c.id = e.client_id
      where c.user_id = auth_user_id()
    )
  );

create policy "bookings: profissional vê seus bookings"
  on bookings for select using (
    exists (
      select 1 from booking_professionals bp
      join professionals p on p.id = bp.professional_id
      where bp.booking_id = bookings.id and p.user_id = auth_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- BOOKING_PROFESSIONALS
-- ---------------------------------------------------------------------
create policy "bp: profissional vê seus convites"
  on booking_professionals for select using (
    professional_id in (select id from professionals where user_id = auth_user_id())
  );

create policy "bp: profissional atualiza próprio status"
  on booking_professionals for update using (
    professional_id in (select id from professionals where user_id = auth_user_id())
  );

create policy "bp: cliente vê profissionais do seu booking"
  on booking_professionals for select using (
    booking_id in (
      select b.id from bookings b
      join events e on e.id = b.event_id
      join clients c on c.id = e.client_id
      where c.user_id = auth_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- PROFESSIONAL_AVAILABILITY
-- ---------------------------------------------------------------------
create policy "availability: profissional gerencia própria"
  on professional_availability for all using (
    professional_id in (select id from professionals where user_id = auth_user_id())
  );

-- Plataforma (clientes) lê disponibilidade para busca
create policy "availability: clientes leem"
  on professional_availability for select using (is_client());

-- ---------------------------------------------------------------------
-- PROFESSIONAL_LOCATIONS
-- ---------------------------------------------------------------------
create policy "locations: profissional insere própria localização"
  on professional_locations for insert with check (
    professional_id in (select id from professionals where user_id = auth_user_id())
  );

-- Cliente rastreia profissional contratado
create policy "locations: cliente rastreia contratado"
  on professional_locations for select using (
    exists (
      select 1 from booking_professionals bp
      join bookings b on b.id = bp.booking_id
      join events e on e.id = b.event_id
      join clients c on c.id = e.client_id
      where bp.professional_id = professional_locations.professional_id
        and c.user_id = auth_user_id()
        and bp.status in ('ACCEPTED','IN_TRANSIT','CHECKED_IN')
    )
  );

-- ---------------------------------------------------------------------
-- TRANSACTIONS
-- ---------------------------------------------------------------------
create policy "transactions: usuário vê suas transações"
  on transactions for select using (
    from_user_id = auth_user_id() or to_user_id = auth_user_id()
  );

-- ---------------------------------------------------------------------
-- PIX_PAYMENTS
-- ---------------------------------------------------------------------
create policy "pix: usuário vê seus pagamentos"
  on pix_payments for select using (
    transaction_id in (
      select id from transactions
      where from_user_id = auth_user_id() or to_user_id = auth_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------
create policy "reviews: autor vê e cria"
  on reviews for select using (
    reviewer_id = auth_user_id() or reviewee_id = auth_user_id()
  );

create policy "reviews: autor cria avaliação"
  on reviews for insert with check (reviewer_id = auth_user_id());

-- Clientes podem ver avaliações de profissionais ativos
create policy "reviews: clientes veem avaliações de profissionais"
  on reviews for select using (
    is_client() and
    reviewee_id in (
      select user_id from professionals where status = 'ACTIVE'
    )
  );

-- ---------------------------------------------------------------------
-- SAVED TEAMS
-- ---------------------------------------------------------------------
create policy "saved_teams: cliente gerencia suas equipes"
  on saved_teams for all using (
    client_id in (select id from clients where user_id = auth_user_id())
  );

create policy "saved_team_members: cliente gerencia membros"
  on saved_team_members for all using (
    saved_team_id in (
      select st.id from saved_teams st
      join clients c on c.id = st.client_id
      where c.user_id = auth_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- FAVORITES
-- ---------------------------------------------------------------------
create policy "favorites: cliente gerencia favoritos"
  on client_favorites for all using (
    client_id in (select id from clients where user_id = auth_user_id())
  );

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create policy "notifications: usuário vê as suas"
  on notifications for select using (user_id = auth_user_id());

create policy "notifications: usuário marca como lida"
  on notifications for update using (user_id = auth_user_id());

-- ---------------------------------------------------------------------
-- TABELAS PÚBLICAS (leitura para todos autenticados)
-- ---------------------------------------------------------------------
create policy "price_table: leitura pública autenticada"
  on price_table for select using (auth.role() = 'authenticated');

create policy "price_multipliers: leitura pública autenticada"
  on price_multipliers for select using (auth.role() = 'authenticated');

create policy "star_milestones: leitura pública autenticada"
  on star_milestones for select using (auth.role() = 'authenticated');

create policy "credit_packages: leitura pública autenticada"
  on credit_packages for select using (auth.role() = 'authenticated');
