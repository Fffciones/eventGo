-- =====================================================================
-- 011 - FASE 5A: Tabela de Funções + professional_functions
-- =====================================================================
-- Estratégia: compatibilidade total com código existente.
-- professionals.category e bookings.category permanecem intactos (legado).
-- Novas queries usam function_id. Funções SQL atualizadas aceitam ambos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABELA DE FUNÇÕES (gerenciada pelo admin)
-- ---------------------------------------------------------------------
create table if not exists functions (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text unique not null,           -- ex: 'garcom', 'seguranca'
  active          boolean default true,
  price_mei       numeric(10,2) not null,         -- preço ao contratante (profissional MEI)
  price_diarista  numeric(10,2) not null,         -- preço ao contratante (profissional Diarista)
  base_pay_mei    numeric(10,2) not null,         -- remuneração líquida ao profissional MEI
  base_pay_diarista numeric(10,2) not null,       -- remuneração líquida ao profissional Diarista
  display_order   int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2. SEED DAS FUNÇÕES (espelha o enum professional_category existente)
-- ---------------------------------------------------------------------
insert into functions (name, slug, active, price_mei, price_diarista, base_pay_mei, base_pay_diarista, display_order) values
  ('Garçom / Barman',      'garcom',             true, 280.00, 250.00, 200.00, 178.00, 1),
  ('DJ',                   'dj',                 true, 800.00, 750.00, 580.00, 540.00, 2),
  ('Segurança',            'seguranca',          true, 320.00, 290.00, 230.00, 207.00, 3),
  ('Limpeza',              'faxineiro',          true, 200.00, 180.00, 143.00, 128.00, 4),
  ('Fotógrafo',            'fotografo',          true, 1200.00, 1100.00, 870.00, 796.00, 5),
  ('Mestre de Cerimônias', 'mestre_cerimonias',  true, 600.00, 550.00, 435.00, 398.00, 6),
  ('Produtor de Eventos',  'produtor',           true, 1500.00, 1400.00, 1087.00, 1015.00, 7),
  ('Controle de Acesso',   'controlador_acesso', true, 240.00, 220.00, 173.00, 158.00, 8);

-- ---------------------------------------------------------------------
-- 3. TABELA N:N — profissional pode ter múltiplas funções
-- ---------------------------------------------------------------------
create table if not exists professional_functions (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  function_id     uuid not null references functions(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(professional_id, function_id)
);

-- ---------------------------------------------------------------------
-- 4. MIGRAR DADOS EXISTENTES
--    Popula professional_functions a partir de professionals.category (legado)
-- ---------------------------------------------------------------------
insert into professional_functions (professional_id, function_id)
select
  p.id,
  f.id
from professionals p
join functions f on f.slug = lower(p.category::text)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 5. REESCREVER find_available_professionals
--    Nova versão aceita function_id (novo) OU p_category (legado)
-- ---------------------------------------------------------------------
create or replace function find_available_professionals(
  p_starts_at   timestamptz,
  p_ends_at     timestamptz,
  p_location    geography,
  p_function_id uuid      default null,
  p_category    professional_category default null,
  p_radius_km   int       default 5,
  p_limit       int       default 20
) returns table (
  professional_id uuid,
  user_id         uuid,
  full_name       text,
  stars           int,
  events_count    int,
  hourly_cache    numeric,
  distance_m      float,
  is_favorite     boolean
) language plpgsql as $$
begin
  return query
  select
    p.id,
    u.id,
    u.full_name,
    p.stars,
    p.events_count,
    p.hourly_cache,
    ST_Distance(pl.location, p_location) as distance_m,
    exists(
      select 1 from client_favorites cf
      join clients c on c.id = cf.client_id
      where c.user_id = auth_user_id()
        and cf.professional_id = p.id
    ) as is_favorite
  from professionals p
  join users u on u.id = p.user_id
  join lateral (
    select location from professional_locations
    where professional_id = p.id
    order by recorded_at desc
    limit 1
  ) pl on true
  where p.status = 'ACTIVE'
    -- filtro por function_id (novo) ou category (legado)
    and (
      (p_function_id is not null and exists (
        select 1 from professional_functions pf
        where pf.professional_id = p.id and pf.function_id = p_function_id
      ))
      or
      (p_function_id is null and p_category is not null and p.category = p_category)
    )
    and ST_Distance(pl.location, p_location) <= (p_radius_km * 1000)
    and check_professional_availability(p.id, p_starts_at, p_ends_at, p_location)
  order by
    is_favorite desc,
    p.stars desc,
    distance_m asc
  limit p_limit;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. REESCREVER handle_no_show
--    Usa function_id quando disponível no booking, fallback para category
-- ---------------------------------------------------------------------
create or replace function handle_no_show(p_booking_professional_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_bp            booking_professionals%rowtype;
  v_booking       bookings%rowtype;
  v_event         events%rowtype;
  v_replacement   uuid;
  v_client_user   uuid;
  v_function_id   uuid;
begin
  select * into v_bp      from booking_professionals where id = p_booking_professional_id;
  select * into v_booking from bookings              where id = v_bp.booking_id;
  select * into v_event   from events                where id = v_booking.event_id;

  -- Marcar no-show
  update booking_professionals
  set status = 'NO_SHOW', no_show_flag = true
  where id = p_booking_professional_id;

  update professionals set updated_at = now()
  where id = v_bp.professional_id;

  insert into notifications (user_id, title, body, channel, payload)
  select p.user_id,
    'Falta registrada',
    'Você não compareceu ao evento e recebeu uma anotação em seu perfil.',
    'PUSH',
    jsonb_build_object('booking_id', v_bp.booking_id, 'event_id', v_booking.event_id)
  from professionals p where p.id = v_bp.professional_id;

  -- Resolver function_id: tenta pelo slug da category do booking
  select f.id into v_function_id
  from functions f
  where f.slug = lower(v_booking.category::text)
  limit 1;

  -- Buscar substituto usando nova assinatura
  select professional_id into v_replacement
  from find_available_professionals(
    v_event.starts_at,
    v_event.ends_at,
    v_event.location,
    v_function_id,
    case when v_function_id is null then v_booking.category else null end,
    50,
    1
  );

  if v_replacement is not null then
    insert into booking_professionals (booking_id, professional_id, amount, status)
    values (v_bp.booking_id, v_replacement, v_bp.amount, 'INVITED');

    insert into notifications (user_id, title, body, channel, payload)
    select p.user_id,
      '🚨 Serviço de Emergência!',
      'Há um evento precisando de você agora. Aceite e ganhe estrelas extras!',
      'PUSH',
      jsonb_build_object('booking_id', v_bp.booking_id, 'emergency', true)
    from professionals p where p.id = v_replacement;

    select c.user_id into v_client_user
    from events e join clients c on c.id = e.client_id where e.id = v_booking.event_id;

    insert into notifications (user_id, title, body, channel, payload)
    values (v_client_user,
      'Profissional substituto a caminho',
      'Encontramos um substituto para o profissional que não compareceu.',
      'PUSH',
      jsonb_build_object('booking_id', v_bp.booking_id));
  end if;

  return v_replacement;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. REESCREVER update_professional_stars
--    Usa functions via professional_functions em vez de price_table por category
-- ---------------------------------------------------------------------
create or replace function update_professional_stars(p_professional_id uuid)
returns void language plpgsql as $$
declare
  v_events_count int;
  v_new_stars    int;
  v_new_cache    numeric;
  v_base_cache   numeric;
  v_bonus_pct    numeric;
  v_pro          professionals%rowtype;
begin
  select * into v_pro from professionals where id = p_professional_id;

  select count(*) into v_events_count
  from booking_professionals bp
  join bookings b on b.id = bp.booking_id
  where bp.professional_id = p_professional_id
    and bp.status = 'CHECKED_OUT'
    and b.status = 'COMPLETED';

  select star_level, cache_bonus_pct
  into v_new_stars, v_bonus_pct
  from star_milestones
  where min_events <= v_events_count
  order by star_level desc
  limit 1;

  v_new_stars := coalesce(v_new_stars, 0);
  v_bonus_pct := coalesce(v_bonus_pct, 0);

  -- Cache base: usa primeira função do profissional (nova tabela) ou legado
  select
    case when v_pro.professional_type = 'MEI' then f.base_pay_mei
         else f.base_pay_diarista end
  into v_base_cache
  from professional_functions pf
  join functions f on f.id = pf.function_id
  where pf.professional_id = p_professional_id
  order by f.display_order
  limit 1;

  -- Fallback para price_table legado se não encontrou na nova tabela
  if v_base_cache is null then
    select pt.price_8h into v_base_cache
    from price_table pt
    where pt.category = v_pro.category and pt.star_level = 0;
  end if;

  v_new_cache := round(coalesce(v_base_cache, 0) * (1 + v_bonus_pct / 100), 2);

  update professionals
  set
    stars        = v_new_stars,
    events_count = v_events_count,
    hourly_cache = v_new_cache,
    updated_at   = now()
  where id = p_professional_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. RLS para as novas tabelas
-- ---------------------------------------------------------------------
alter table functions             enable row level security;
alter table professional_functions enable row level security;

-- functions: leitura pública (todos precisam ver as funções disponíveis)
create policy "functions_select_all" on functions
  for select using (true);

-- functions: escrita apenas para admins (a implementar na Fase 6)
-- Por ora, operações de escrita via service_role apenas

-- professional_functions: profissional vê/edita as próprias; todos podem ler
create policy "prof_functions_select_all" on professional_functions
  for select using (true);

create policy "prof_functions_insert_own" on professional_functions
  for insert with check (
    professional_id in (
      select id from professionals where user_id = auth.uid()
    )
  );

create policy "prof_functions_delete_own" on professional_functions
  for delete using (
    professional_id in (
      select id from professionals where user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 9. TRIGGER updated_at para functions
-- ---------------------------------------------------------------------
create trigger touch_functions
  before update on functions
  for each row execute procedure touch_updated_at();
