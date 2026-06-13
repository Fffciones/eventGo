-- =====================================================================
-- SCRIPT DE RECUPERAÇÃO EVENTPRO
-- Execute no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/vrkhzkfxmsicutirsgun/sql
-- =====================================================================

-- =====================================================================
-- PARTE 1: RECRIAR FUNÇÕES DE NEGÓCIO (003)
-- =====================================================================

create or replace function check_professional_availability(
  p_professional_id uuid,
  p_starts_at       timestamptz,
  p_ends_at         timestamptz,
  p_location        geography
) returns boolean language plpgsql as $$
declare
  v_conflict_count int;
  v_distance_conflict int;
begin
  select count(*) into v_conflict_count
  from booking_professionals bp
  join bookings b on b.id = bp.booking_id
  join events e on e.id = b.event_id
  where bp.professional_id = p_professional_id
    and bp.status in ('ACCEPTED', 'IN_TRANSIT', 'CHECKED_IN')
    and (e.starts_at, e.ends_at) overlaps (p_starts_at, p_ends_at);

  if v_conflict_count > 0 then
    return false;
  end if;

  select count(*) into v_distance_conflict
  from booking_professionals bp
  join bookings b on b.id = bp.booking_id
  join events e on e.id = b.event_id
  where bp.professional_id = p_professional_id
    and bp.status in ('ACCEPTED', 'IN_TRANSIT', 'CHECKED_IN')
    and (
      (e.ends_at between (p_starts_at - interval '1 hour') and p_starts_at
        and ST_Distance(e.location, p_location) > 10000)
      or
      (e.starts_at between p_ends_at and (p_ends_at + interval '1 hour')
        and ST_Distance(e.location, p_location) > 10000)
    );

  return v_distance_conflict = 0;
end;
$$;

create or replace function calculate_booking_price(
  p_category        professional_category,
  p_star_level      int,
  p_starts_at       timestamptz,
  p_ends_at         timestamptz,
  p_multiplier_type price_multiplier_type default 'NORMAL'
) returns numeric language plpgsql as $$
declare
  v_base_price   numeric;
  v_multiplier   numeric;
  v_hours        numeric;
  v_price        numeric;
begin
  select price_8h into v_base_price
  from price_table
  where category = p_category and star_level = p_star_level;

  if v_base_price is null then
    select price_8h into v_base_price
    from price_table
    where category = p_category and star_level = 0;
  end if;

  if v_base_price is null then
    raise exception 'Preço não encontrado para categoria % nível %', p_category, p_star_level;
  end if;

  select multiplier into v_multiplier
  from price_multipliers where type = p_multiplier_type;

  v_hours := extract(epoch from (p_ends_at - p_starts_at)) / 3600;

  if v_hours <= 8 then
    v_price := v_base_price;
  else
    v_price := v_base_price + ceil((v_hours - 8) / 4) * (v_base_price * 0.5);
  end if;

  return round(v_price * v_multiplier, 2);
end;
$$;

-- Corrige o bug de "column reference professional_id is ambiguous"
-- usando aliases explícitos para todos os campos retornados
create or replace function find_available_professionals(
  p_category    professional_category,
  p_starts_at   timestamptz,
  p_ends_at     timestamptz,
  p_location    geography,
  p_radius_km   int default 5,
  p_limit       int default 20
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
    p.id             as professional_id,
    u.id             as user_id,
    u.full_name      as full_name,
    p.stars          as stars,
    p.events_count   as events_count,
    p.hourly_cache   as hourly_cache,
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
    select ploc.location from professional_locations ploc
    where ploc.professional_id = p.id
    order by ploc.recorded_at desc
    limit 1
  ) pl on true
  where p.category = p_category
    and p.status = 'ACTIVE'
    and ST_Distance(pl.location, p_location) <= (p_radius_km * 1000)
    and check_professional_availability(p.id, p_starts_at, p_ends_at, p_location)
  order by
    is_favorite desc,
    p.stars desc,
    distance_m asc
  limit p_limit;
end;
$$;

create or replace function update_professional_stars(p_professional_id uuid)
returns void language plpgsql as $$
declare
  v_events_count   int;
  v_new_stars      int;
  v_new_cache      numeric;
  v_base_cache     numeric;
  v_bonus_pct      numeric;
  v_avg_rating     numeric;
  v_early_rate     numeric;
begin
  select count(*) into v_events_count
  from booking_professionals bp
  join bookings b on b.id = bp.booking_id
  where bp.professional_id = p_professional_id
    and bp.status = 'CHECKED_OUT'
    and b.status = 'COMPLETED';

  select avg(r.rating) into v_avg_rating
  from reviews r
  join users u on u.id = r.reviewee_id
  join professionals prof on prof.user_id = u.id
  where prof.id = p_professional_id;

  select
    round(
      count(*) filter (where early_minutes >= 30)::numeric /
      nullif(count(*), 0) * 100
    , 1) into v_early_rate
  from booking_professionals
  where professional_id = p_professional_id
    and checkin_at is not null;

  select star_level, cache_bonus_pct
  into v_new_stars, v_bonus_pct
  from star_milestones
  where min_events <= v_events_count
  order by star_level desc
  limit 1;

  v_new_stars := coalesce(v_new_stars, 0);
  v_bonus_pct := coalesce(v_bonus_pct, 0);

  if coalesce(v_avg_rating, 0) >= 4.5 and coalesce(v_early_rate, 0) >= 70 then
    v_bonus_pct := v_bonus_pct + 10;
  end if;

  select pt.price_8h into v_base_cache
  from price_table pt
  join professionals prof on prof.category = pt.category
  where prof.id = p_professional_id and pt.star_level = 0
  limit 1;

  v_new_cache := round(v_base_cache * (1 + v_bonus_pct / 100), 2);

  update professionals
  set
    stars        = v_new_stars,
    events_count = v_events_count,
    hourly_cache = v_new_cache,
    updated_at   = now()
  where id = p_professional_id;
end;
$$;

create or replace function process_booking_payment(p_booking_id uuid)
returns void language plpgsql security definer as $$
declare
  v_booking       bookings%rowtype;
  v_client        clients%rowtype;
  v_event         events%rowtype;
  v_commission    numeric;
  v_pro_total     numeric;
  v_per_pro       numeric;
  v_pro_count     int;
  v_bp            record;
begin
  select * into v_booking from bookings where id = p_booking_id;
  select * into v_event   from events   where id = v_booking.event_id;
  select * into v_client  from clients  where id = v_event.client_id;

  if v_client.credit_balance < v_booking.total_amount then
    raise exception 'Saldo insuficiente. Necessário: %, Disponível: %',
      v_booking.total_amount, v_client.credit_balance;
  end if;

  v_commission := round(v_booking.total_amount * v_booking.commission_pct / 100, 2);
  v_pro_total  := v_booking.total_amount - v_commission;

  select count(*) into v_pro_count
  from booking_professionals
  where booking_id = p_booking_id and status = 'ACCEPTED';

  v_per_pro := round(v_pro_total / v_pro_count, 2);

  update clients set credit_balance = credit_balance - v_booking.total_amount
  where id = v_client.id;

  insert into transactions (booking_id, from_user_id, to_user_id, type, amount, description)
  select p_booking_id, v_client.user_id, null, 'BOOKING', v_booking.total_amount,
    'Pagamento booking #' || p_booking_id;

  insert into transactions (booking_id, from_user_id, to_user_id, type, amount, description)
  select p_booking_id, v_client.user_id, null, 'COMMISSION', v_commission,
    'Comissão plataforma booking #' || p_booking_id;

  for v_bp in
    select bp.professional_id, p.user_id as pro_user_id
    from booking_professionals bp
    join professionals p on p.id = bp.professional_id
    where bp.booking_id = p_booking_id and bp.status = 'ACCEPTED'
  loop
    insert into transactions (booking_id, from_user_id, to_user_id, type, amount, description)
    values (p_booking_id, v_client.user_id, v_bp.pro_user_id, 'BOOKING', v_per_pro,
      'Pagamento profissional booking #' || p_booking_id);

    update booking_professionals set amount = v_per_pro
    where booking_id = p_booking_id and professional_id = v_bp.professional_id;
  end loop;

  update bookings set status = 'CONFIRMED', updated_at = now()
  where id = p_booking_id;
end;
$$;

create or replace function handle_no_show(p_booking_professional_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_bp            booking_professionals%rowtype;
  v_booking       bookings%rowtype;
  v_event         events%rowtype;
  v_replacement   uuid;
  v_client_user   uuid;
begin
  select * into v_bp      from booking_professionals where id = p_booking_professional_id;
  select * into v_booking from bookings              where id = v_bp.booking_id;
  select * into v_event   from events                where id = v_booking.event_id;

  update booking_professionals
  set status = 'NO_SHOW', no_show_flag = true
  where id = p_booking_professional_id;

  update professionals
  set updated_at = now()
  where id = v_bp.professional_id;

  insert into notifications (user_id, title, body, channel, payload)
  select p.user_id,
    'Falta registrada',
    'Você não compareceu ao evento e recebeu uma anotação em seu perfil.',
    'PUSH',
    jsonb_build_object('booking_id', v_bp.booking_id, 'event_id', v_booking.event_id)
  from professionals p where p.id = v_bp.professional_id;

  select prof_id into v_replacement
  from find_available_professionals(
    v_booking.category,
    v_event.starts_at,
    v_event.ends_at,
    v_event.location,
    50,
    1
  ) as t(professional_id uuid, user_id uuid, full_name text, stars int, events_count int, hourly_cache numeric, distance_m float, is_favorite boolean)
  cross join lateral (select t.professional_id as prof_id) x;

  if v_replacement is not null then
    insert into booking_professionals (booking_id, professional_id, amount, status)
    values (v_bp.booking_id, v_replacement, v_bp.amount, 'INVITED');

    insert into notifications (user_id, title, body, channel, payload)
    select p.user_id,
      'Serviço de Emergência!',
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

create or replace function trigger_update_stars_on_checkout()
returns trigger language plpgsql as $$
begin
  if new.status = 'CHECKED_OUT' and old.status != 'CHECKED_OUT' then
    perform update_professional_stars(new.professional_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_professional_checkout on booking_professionals;
create trigger on_professional_checkout
  after update on booking_professionals
  for each row execute procedure trigger_update_stars_on_checkout();

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_users on users;
drop trigger if exists touch_professionals on professionals;
drop trigger if exists touch_bookings on bookings;
create trigger touch_users           before update on users           for each row execute procedure touch_updated_at();
create trigger touch_professionals   before update on professionals   for each row execute procedure touch_updated_at();
create trigger touch_bookings        before update on bookings        for each row execute procedure touch_updated_at();

create or replace function purchase_credits(
  p_client_id    uuid,
  p_package_id   uuid,
  p_pix_key      text
) returns uuid language plpgsql security definer as $$
declare
  v_package   credit_packages%rowtype;
  v_client    clients%rowtype;
  v_amount    numeric;
  v_txn_id    uuid;
  v_pix_id    uuid;
begin
  select * into v_package from credit_packages where id = p_package_id and is_active = true;
  if not found then
    raise exception 'Pacote de créditos não encontrado ou inativo';
  end if;

  select * into v_client from clients where id = p_client_id;
  if v_client.user_id != auth_user_id() then
    raise exception 'Acesso negado';
  end if;

  v_amount := round(v_package.amount * (1 + v_package.bonus_pct / 100), 2);

  insert into transactions (from_user_id, to_user_id, type, amount, description)
  values (v_client.user_id, null, 'CREDIT_PURCHASE', v_package.amount,
    'Compra de créditos - pacote ' || v_package.name)
  returning id into v_txn_id;

  insert into pix_payments (transaction_id, pix_key, amount, status)
  values (v_txn_id, p_pix_key, v_package.amount, 'PENDING')
  returning id into v_pix_id;

  return v_pix_id;
end;
$$;

create or replace function confirm_pix_payment(p_pix_id uuid)
returns void language plpgsql security definer as $$
declare
  v_pix     pix_payments%rowtype;
  v_txn     transactions%rowtype;
begin
  select * into v_pix from pix_payments where id = p_pix_id;
  select * into v_txn from transactions where id = v_pix.transaction_id;

  update pix_payments set status = 'PAID', paid_at = now() where id = p_pix_id;

  update clients set credit_balance = credit_balance + v_pix.amount
  where user_id = v_txn.from_user_id;
end;
$$;

-- =====================================================================
-- PARTE 2: FUNÇÕES DE AUTH (007 + 008)
-- =====================================================================

create or replace function create_client_profile(
  p_document   text,
  p_is_company boolean default false
) returns void language plpgsql security definer as $$
begin
  insert into clients (user_id, document, is_company, credit_balance, credit_limit)
  values (auth.uid(), p_document, p_is_company, 0, 0)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function create_professional_profile(
  p_mei_number text,
  p_category   professional_category
) returns void language plpgsql security definer as $$
begin
  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache)
  values (auth.uid(), p_mei_number, p_category, 'PENDING', 0, 0, 0)
  on conflict (user_id) do nothing;

  insert into transactions (from_user_id, to_user_id, type, amount, description)
  values (null, auth.uid(), 'SIGNUP_BONUS', 5.00, 'Bônus de cadastro - aguardando envio de documentação');
end;
$$;

create or replace function handle_user_login()
returns trigger language plpgsql security definer as $$
declare
  v_user_type text;
  v_document  text;
  v_mei       text;
  v_category  text;
begin
  v_user_type := new.raw_user_meta_data->>'user_type';
  v_document  := new.raw_user_meta_data->>'document';
  v_mei       := new.raw_user_meta_data->>'mei_number';
  v_category  := new.raw_user_meta_data->>'category';

  if v_user_type = 'CLIENT' and v_document is not null then
    insert into public.clients (user_id, document, is_company, credit_balance, credit_limit)
    values (
      new.id,
      v_document,
      length(regexp_replace(v_document, '\D', '', 'g')) > 11,
      0, 0
    )
    on conflict (user_id) do nothing;

  elsif v_user_type = 'PROFESSIONAL' and v_mei is not null then
    insert into public.professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache)
    values (
      new.id,
      v_mei,
      v_category::professional_category,
      'PENDING', 0, 0, 0
    )
    on conflict (user_id) do nothing;

    insert into public.transactions (from_user_id, to_user_id, type, amount, description)
    values (null, new.id, 'SIGNUP_BONUS', 5.00, 'Bônus de cadastro — aguardando documentação')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_user_login on auth.users;
create trigger on_user_login
  after update on auth.users
  for each row
  when (
    old.email_confirmed_at is null
    and new.email_confirmed_at is not null
  )
  execute procedure handle_user_login();

-- =====================================================================
-- PARTE 3: SEED — TABELA DE PREÇOS (006)
-- =====================================================================

insert into price_table (category, star_level, price_8h) values
  ('GARCOM',             0, 280.00),
  ('GARCOM',             1, 308.00),
  ('GARCOM',             2, 336.00),
  ('GARCOM',             3, 378.00),
  ('GARCOM',             4, 420.00),
  ('GARCOM',             5, 490.00),
  ('DJ',                 0, 800.00),
  ('DJ',                 1, 880.00),
  ('DJ',                 2, 960.00),
  ('DJ',                 3, 1080.00),
  ('DJ',                 4, 1200.00),
  ('DJ',                 5, 1400.00),
  ('SEGURANCA',          0, 320.00),
  ('SEGURANCA',          1, 352.00),
  ('SEGURANCA',          2, 384.00),
  ('SEGURANCA',          3, 432.00),
  ('SEGURANCA',          4, 480.00),
  ('SEGURANCA',          5, 560.00),
  ('FAXINEIRO',          0, 200.00),
  ('FAXINEIRO',          1, 220.00),
  ('FAXINEIRO',          2, 240.00),
  ('FAXINEIRO',          3, 270.00),
  ('FAXINEIRO',          4, 300.00),
  ('FAXINEIRO',          5, 350.00),
  ('FOTOGRAFO',          0, 1200.00),
  ('FOTOGRAFO',          1, 1320.00),
  ('FOTOGRAFO',          2, 1440.00),
  ('FOTOGRAFO',          3, 1620.00),
  ('FOTOGRAFO',          4, 1800.00),
  ('FOTOGRAFO',          5, 2100.00),
  ('MESTRE_CERIMONIAS',  0, 600.00),
  ('MESTRE_CERIMONIAS',  1, 660.00),
  ('MESTRE_CERIMONIAS',  2, 720.00),
  ('MESTRE_CERIMONIAS',  3, 810.00),
  ('MESTRE_CERIMONIAS',  4, 900.00),
  ('MESTRE_CERIMONIAS',  5, 1050.00),
  ('PRODUTOR',           0, 1500.00),
  ('PRODUTOR',           1, 1650.00),
  ('PRODUTOR',           2, 1800.00),
  ('PRODUTOR',           3, 2025.00),
  ('PRODUTOR',           4, 2250.00),
  ('PRODUTOR',           5, 2625.00),
  ('CONTROLADOR_ACESSO', 0, 240.00),
  ('CONTROLADOR_ACESSO', 1, 264.00),
  ('CONTROLADOR_ACESSO', 2, 288.00),
  ('CONTROLADOR_ACESSO', 3, 324.00),
  ('CONTROLADOR_ACESSO', 4, 360.00),
  ('CONTROLADOR_ACESSO', 5, 420.00)
on conflict (category, star_level) do nothing;

-- =====================================================================
-- PARTE 4: RESEED — 40 PROFISSIONAIS (009)
-- =====================================================================

-- Limpar seed anterior (não afeta usuários reais pois emails terminam em @pro.teste)
delete from professional_availability where professional_id in (
  select p.id from professionals p
  join public.users u on u.id = p.user_id
  where u.email like '%@pro.teste'
);
delete from professional_locations where professional_id in (
  select p.id from professionals p
  join public.users u on u.id = p.user_id
  where u.email like '%@pro.teste'
);
delete from professionals where user_id in (
  select id from public.users where email like '%@pro.teste'
);
delete from public.users where email like '%@pro.teste';

-- GARÇONS
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'ricardo.mendes@pro.teste',   '(11) 91001-0001', 'Ricardo Mendes',    'PROFESSIONAL', true),
    (ids[2], 'fernanda.costa@pro.teste',   '(11) 91001-0002', 'Fernanda Costa',    'PROFESSIONAL', true),
    (ids[3], 'marcos.aurelio@pro.teste',   '(11) 91001-0003', 'Marcos Aurélio',    'PROFESSIONAL', false),
    (ids[4], 'ana.julia@pro.teste',        '(11) 91001-0004', 'Ana Júlia Ferreira','PROFESSIONAL', true),
    (ids[5], 'pedro.henrique@pro.teste',   '(11) 91001-0005', 'Pedro Henrique',    'PROFESSIONAL', false);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '11.111.111/0001-01', 'GARCOM', 'ACTIVE', 4, 142, 420.00, 'Garçom especialista em eventos de luxo. Barman certificado, bilíngue PT/EN.', 'Vila Madalena, São Paulo', ST_GeogFromText('POINT(-46.6904 -23.5505)'), 15, true),
    (ids[2], '11.111.111/0001-02', 'GARCOM', 'ACTIVE', 3,  67, 378.00, 'Buffet gourmet e finger food. Experiência em casamentos e eventos corporativos.', 'Pinheiros, São Paulo', ST_GeogFromText('POINT(-46.6826 -23.5641)'), 10, true),
    (ids[3], '11.111.111/0001-03', 'GARCOM', 'ACTIVE', 5, 215, 490.00, 'Sommelier júnior, 10 anos de experiência. Especialista em casamentos de alto padrão.', 'Moema, São Paulo', ST_GeogFromText('POINT(-46.6642 -23.6014)'), 20, false),
    (ids[4], '11.111.111/0001-04', 'GARCOM', 'ACTIVE', 2,  28, 336.00, 'Garçonete com foco em eventos corporativos e coquetéis executivos.', 'Tatuapé, São Paulo', ST_GeogFromText('POINT(-46.5741 -23.5441)'), 10, true),
    (ids[5], '11.111.111/0001-05', 'GARCOM', 'ACTIVE', 1,  11, 308.00, 'Recém formado em hotelaria, dedicado e pontual.', 'Santo André, SP', ST_GeogFromText('POINT(-46.5329 -23.6639)'), 15, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('ricardo.mendes@pro.teste',   'POINT(-46.6850 -23.5490)'),
    ('fernanda.costa@pro.teste',   'POINT(-46.6780 -23.5600)'),
    ('marcos.aurelio@pro.teste',   'POINT(-46.6600 -23.5980)'),
    ('ana.julia@pro.teste',        'POINT(-46.5700 -23.5400)'),
    ('pedro.henrique@pro.teste',   'POINT(-46.5400 -23.6600)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- DJs
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'dj.carlos@pro.teste',     '(11) 92001-0001', 'DJ Carlos Silva',    'PROFESSIONAL', true),
    (ids[2], 'dj.patricia@pro.teste',   '(11) 92001-0002', 'DJ Patrícia Rocha',  'PROFESSIONAL', true),
    (ids[3], 'dj.thiago@pro.teste',     '(11) 92001-0003', 'DJ Thiago Mix',      'PROFESSIONAL', true),
    (ids[4], 'dj.amanda@pro.teste',     '(11) 92001-0004', 'Amanda DJ',          'PROFESSIONAL', false),
    (ids[5], 'dj.rodrigo@pro.teste',    '(11) 92001-0005', 'Rodrigo Beats',      'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '22.222.222/0001-01', 'DJ', 'ACTIVE', 5, 210, 1400.00, 'DJ com 10 anos de experiência. Pioneer Nexus 2.', 'Consolação, São Paulo', ST_GeogFromText('POINT(-46.6563 -23.5505)'), 25, true),
    (ids[2], '22.222.222/0001-02', 'DJ', 'ACTIVE', 4,  98, 1200.00, 'DJ e produtora musical. Festas temáticas e formaturas.', 'Perdizes, São Paulo', ST_GeogFromText('POINT(-46.6700 -23.5380)'), 20, true),
    (ids[3], '22.222.222/0001-03', 'DJ', 'ACTIVE', 3,  55, 1080.00, 'Equipamento próprio completo. Open format.', 'Santana, São Paulo', ST_GeogFromText('POINT(-46.6280 -23.4980)'), 20, false),
    (ids[4], '22.222.222/0001-04', 'DJ', 'ACTIVE', 2,  22,  960.00, 'Especialista em eventos infantis.', 'Osasco, SP', ST_GeogFromText('POINT(-46.7919 -23.5329)'), 15, true),
    (ids[5], '22.222.222/0001-05', 'DJ', 'ACTIVE', 1,  10,  880.00, 'Iniciando na carreira, preços acessíveis.', 'Guarulhos, SP', ST_GeogFromText('POINT(-46.5333 -23.4549)'), 20, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('dj.carlos@pro.teste',     'POINT(-46.6520 -23.5480)'),
    ('dj.patricia@pro.teste',   'POINT(-46.6650 -23.5350)'),
    ('dj.thiago@pro.teste',     'POINT(-46.6250 -23.4950)'),
    ('dj.amanda@pro.teste',     'POINT(-46.7880 -23.5300)'),
    ('dj.rodrigo@pro.teste',    'POINT(-46.5300 -23.4520)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- SEGURANÇAS
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'joao.seguranca@pro.teste',    '(11) 93001-0001', 'João Carlos Lima',     'PROFESSIONAL', false),
    (ids[2], 'wellington.silva@pro.teste',  '(11) 93001-0002', 'Wellington Silva',     'PROFESSIONAL', true),
    (ids[3], 'claudia.seg@pro.teste',       '(11) 93001-0003', 'Claudia Segurança',    'PROFESSIONAL', true),
    (ids[4], 'roberto.guarda@pro.teste',    '(11) 93001-0004', 'Roberto Guarda',       'PROFESSIONAL', false),
    (ids[5], 'fabio.vigilante@pro.teste',   '(11) 93001-0005', 'Fábio Vigilante',      'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '33.333.333/0001-01', 'SEGURANCA', 'ACTIVE', 2,  34, 384.00, 'Vigilante patrimonial certificado. Primeiros socorros.', 'Ipiranga, São Paulo', ST_GeogFromText('POINT(-46.6078 -23.5900)'), 15, false),
    (ids[2], '33.333.333/0001-02', 'SEGURANCA', 'ACTIVE', 4,  89, 480.00, 'Ex-militar. Eventos de grande porte.', 'Santo Amaro, São Paulo', ST_GeogFromText('POINT(-46.7100 -23.6500)'), 20, true),
    (ids[3], '33.333.333/0001-03', 'SEGURANCA', 'ACTIVE', 3,  51, 432.00, 'Segurança feminina para eventos sociais.', 'Itaim Bibi, São Paulo', ST_GeogFromText('POINT(-46.6836 -23.5858)'), 15, true),
    (ids[4], '33.333.333/0001-04', 'SEGURANCA', 'ACTIVE', 1,   8, 352.00, 'Vigilante credenciado, eventos noturnos.', 'ABC Paulista, SP', ST_GeogFromText('POINT(-46.5200 -23.7000)'), 20, true),
    (ids[5], '33.333.333/0001-05', 'SEGURANCA', 'ACTIVE', 5, 203, 560.00, 'Chefe de segurança com equipe própria. Eventos VIP.', 'Jardins, São Paulo', ST_GeogFromText('POINT(-46.6664 -23.5730)'), 25, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('joao.seguranca@pro.teste',    'POINT(-46.6050 -23.5870)'),
    ('wellington.silva@pro.teste',  'POINT(-46.7050 -23.6450)'),
    ('claudia.seg@pro.teste',       'POINT(-46.6800 -23.5820)'),
    ('roberto.guarda@pro.teste',    'POINT(-46.5180 -23.6980)'),
    ('fabio.vigilante@pro.teste',   'POINT(-46.6630 -23.5700)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- FAXINEIROS
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'bruno.limpeza@pro.teste',    '(11) 94001-0001', 'Bruno Oliveira',       'PROFESSIONAL', false),
    (ids[2], 'maria.faxina@pro.teste',     '(11) 94001-0002', 'Maria das Graças',     'PROFESSIONAL', true),
    (ids[3], 'jose.limpador@pro.teste',    '(11) 94001-0003', 'José Limpador',        'PROFESSIONAL', false),
    (ids[4], 'lucia.clean@pro.teste',      '(11) 94001-0004', 'Lúcia Clean',          'PROFESSIONAL', true),
    (ids[5], 'edson.pos@pro.teste',        '(11) 94001-0005', 'Edson Pós-Evento',     'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '44.444.444/0001-01', 'FAXINEIRO', 'ACTIVE', 1,  12, 220.00, 'Limpeza pós-evento rápida. Equipe própria.', 'Campos Elíseos, São Paulo', ST_GeogFromText('POINT(-46.6441 -23.5329)'), 10, false),
    (ids[2], '44.444.444/0001-02', 'FAXINEIRO', 'ACTIVE', 3,  58, 270.00, 'Especialista em salões de festas.', 'Brás, São Paulo', ST_GeogFromText('POINT(-46.6213 -23.5400)'), 15, true),
    (ids[3], '44.444.444/0001-03', 'FAXINEIRO', 'ACTIVE', 2,  31, 240.00, 'Limpeza durante e após eventos.', 'Belém, São Paulo', ST_GeogFromText('POINT(-46.5902 -23.5367)'), 12, true),
    (ids[4], '44.444.444/0001-04', 'FAXINEIRO', 'ACTIVE', 4,  95, 300.00, 'Supervisora com equipe treinada.', 'Jabaquara, São Paulo', ST_GeogFromText('POINT(-46.6451 -23.6541)'), 20, true),
    (ids[5], '44.444.444/0001-05', 'FAXINEIRO', 'ACTIVE', 5, 178, 350.00, 'Referência em eventos corporativos.', 'Morumbi, São Paulo', ST_GeogFromText('POINT(-46.7200 -23.6100)'), 15, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('bruno.limpeza@pro.teste',    'POINT(-46.6420 -23.5310)'),
    ('maria.faxina@pro.teste',     'POINT(-46.6190 -23.5380)'),
    ('jose.limpador@pro.teste',    'POINT(-46.5880 -23.5350)'),
    ('lucia.clean@pro.teste',      'POINT(-46.6430 -23.6520)'),
    ('edson.pos@pro.teste',        'POINT(-46.7180 -23.6080)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- FOTÓGRAFOS
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'carla.foto@pro.teste',       '(11) 95001-0001', 'Carla Souza',          'PROFESSIONAL', true),
    (ids[2], 'vitor.lens@pro.teste',       '(11) 95001-0002', 'Vítor Lens',           'PROFESSIONAL', true),
    (ids[3], 'isabela.foto@pro.teste',     '(11) 95001-0003', 'Isabela Fotografia',   'PROFESSIONAL', true),
    (ids[4], 'rafael.clicks@pro.teste',    '(11) 95001-0004', 'Rafael Clicks',        'PROFESSIONAL', false),
    (ids[5], 'camila.imagem@pro.teste',    '(11) 95001-0005', 'Camila Imagem',        'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '55.555.555/0001-01', 'FOTOGRAFO', 'ACTIVE', 5, 198, 2100.00, 'Fotografia de moda e eventos. Entrega em 48h.', 'Vila Olímpia, São Paulo', ST_GeogFromText('POINT(-46.6902 -23.5960)'), 25, true),
    (ids[2], '55.555.555/0001-02', 'FOTOGRAFO', 'ACTIVE', 4, 112, 1800.00, 'Especialista em casamentos. Drone certificado.', 'Higienópolis, São Paulo', ST_GeogFromText('POINT(-46.6570 -23.5380)'), 30, true),
    (ids[3], '55.555.555/0001-03', 'FOTOGRAFO', 'ACTIVE', 3,  67, 1620.00, 'Fotografia documental e corporativa.', 'Lapa, São Paulo', ST_GeogFromText('POINT(-46.7040 -23.5243)'), 20, false),
    (ids[4], '55.555.555/0001-04', 'FOTOGRAFO', 'ACTIVE', 2,  29, 1440.00, 'Eventos sociais e aniversários. Álbum incluso.', 'Penha, São Paulo', ST_GeogFromText('POINT(-46.5382 -23.5200)'), 15, true),
    (ids[5], '55.555.555/0001-05', 'FOTOGRAFO', 'ACTIVE', 1,   9, 1320.00, 'Fotógrafa iniciante com portfólio crescente.', 'Mauá, SP', ST_GeogFromText('POINT(-46.4614 -23.6678)'), 20, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('carla.foto@pro.teste',       'POINT(-46.6880 -23.5940)'),
    ('vitor.lens@pro.teste',       'POINT(-46.6550 -23.5360)'),
    ('isabela.foto@pro.teste',     'POINT(-46.7020 -23.5220)'),
    ('rafael.clicks@pro.teste',    'POINT(-46.5360 -23.5180)'),
    ('camila.imagem@pro.teste',    'POINT(-46.4590 -23.6650)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- MESTRES DE CERIMÔNIAS
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'patricia.mc@pro.teste',       '(11) 96001-0001', 'Patrícia Rocha',       'PROFESSIONAL', true),
    (ids[2], 'sergio.cerimonias@pro.teste',  '(11) 96001-0002', 'Sérgio Cerimonias',    'PROFESSIONAL', true),
    (ids[3], 'aline.mc@pro.teste',           '(11) 96001-0003', 'Aline Mestra',         'PROFESSIONAL', false),
    (ids[4], 'gustavo.voz@pro.teste',        '(11) 96001-0004', 'Gustavo Voz',          'PROFESSIONAL', true),
    (ids[5], 'renata.mc@pro.teste',          '(11) 96001-0005', 'Renata MC',            'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '66.666.666/0001-01', 'MESTRE_CERIMONIAS', 'ACTIVE', 4,  89,  900.00, 'MC bilíngue PT/EN. Casamentos e formaturas.', 'Jardim Paulista, São Paulo', ST_GeogFromText('POINT(-46.6637 -23.5692)'), 25, true),
    (ids[2], '66.666.666/0001-02', 'MESTRE_CERIMONIAS', 'ACTIVE', 5, 201, 1050.00, 'MC com 15 anos. Eventos corporativos e sociais.', 'Paraíso, São Paulo', ST_GeogFromText('POINT(-46.6396 -23.5836)'), 30, true),
    (ids[3], '66.666.666/0001-03', 'MESTRE_CERIMONIAS', 'ACTIVE', 3,  45,  810.00, 'Especialista em formaturas e eventos acadêmicos.', 'Água Funda, São Paulo', ST_GeogFromText('POINT(-46.6220 -23.6400)'), 20, false),
    (ids[4], '66.666.666/0001-04', 'MESTRE_CERIMONIAS', 'ACTIVE', 2,  18,  720.00, 'MC de eventos infantis e festas temáticas.', 'Pirituba, São Paulo', ST_GeogFromText('POINT(-46.7300 -23.4900)'), 20, true),
    (ids[5], '66.666.666/0001-05', 'MESTRE_CERIMONIAS', 'ACTIVE', 1,   7,  660.00, 'Iniciando na carreira. Ótima dicção.', 'Diadema, SP', ST_GeogFromText('POINT(-46.6228 -23.6860)'), 15, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('patricia.mc@pro.teste',       'POINT(-46.6620 -23.5670)'),
    ('sergio.cerimonias@pro.teste',  'POINT(-46.6380 -23.5820)'),
    ('aline.mc@pro.teste',           'POINT(-46.6200 -23.6380)'),
    ('gustavo.voz@pro.teste',        'POINT(-46.7280 -23.4880)'),
    ('renata.mc@pro.teste',          'POINT(-46.6210 -23.6840)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- PRODUTORES
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'lucia.prod@pro.teste',       '(11) 97001-0001', 'Lúcia Albuquerque',    'PROFESSIONAL', true),
    (ids[2], 'henrique.events@pro.teste',  '(11) 97001-0002', 'Henrique Events',      'PROFESSIONAL', true),
    (ids[3], 'monica.producer@pro.teste',  '(11) 97001-0003', 'Mônica Produtora',     'PROFESSIONAL', true),
    (ids[4], 'diego.prod@pro.teste',       '(11) 97001-0004', 'Diego Producer',       'PROFESSIONAL', false),
    (ids[5], 'tatiane.eventos@pro.teste',  '(11) 97001-0005', 'Tatiane Eventos',      'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '77.777.777/0001-01', 'PRODUTOR', 'ACTIVE', 5, 320, 2625.00, 'Produtora executiva com 15 anos. Até 5.000 pessoas.', 'Bela Vista, São Paulo', ST_GeogFromText('POINT(-46.6480 -23.5620)'), 30, true),
    (ids[2], '77.777.777/0001-02', 'PRODUTOR', 'ACTIVE', 4, 134, 2250.00, 'Produtor corporativo. Gestão completa.', 'Brooklin, São Paulo', ST_GeogFromText('POINT(-46.6978 -23.6169)'), 25, false),
    (ids[3], '77.777.777/0001-03', 'PRODUTOR', 'ACTIVE', 3,  72, 2025.00, 'Festas sociais e casamentos. Decoração inclusa.', 'Vila Mariana, São Paulo', ST_GeogFromText('POINT(-46.6357 -23.5895)'), 20, true),
    (ids[4], '77.777.777/0001-04', 'PRODUTOR', 'ACTIVE', 2,  25, 1800.00, 'Especializado em eventos culturais.', 'Liberdade, São Paulo', ST_GeogFromText('POINT(-46.6340 -23.5605)'), 20, true),
    (ids[5], '77.777.777/0001-05', 'PRODUTOR', 'ACTIVE', 1,   6, 1650.00, 'Assistente buscando primeiras experiências.', 'Guarulhos, SP', ST_GeogFromText('POINT(-46.5333 -23.4549)'), 25, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('lucia.prod@pro.teste',       'POINT(-46.6460 -23.5600)'),
    ('henrique.events@pro.teste',  'POINT(-46.6960 -23.6150)'),
    ('monica.producer@pro.teste',  'POINT(-46.6340 -23.5875)'),
    ('diego.prod@pro.teste',       'POINT(-46.6320 -23.5585)'),
    ('tatiane.eventos@pro.teste',  'POINT(-46.5310 -23.4530)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- CONTROLADORES DE ACESSO
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'diego.acesso@pro.teste',     '(11) 98001-0001', 'Diego Ferreira',       'PROFESSIONAL', false),
    (ids[2], 'simone.portaria@pro.teste',  '(11) 98001-0002', 'Simone Portaria',      'PROFESSIONAL', true),
    (ids[3], 'leandro.cred@pro.teste',     '(11) 98001-0003', 'Leandro Credencial',   'PROFESSIONAL', true),
    (ids[4], 'vanessa.acesso@pro.teste',   '(11) 98001-0004', 'Vanessa Acesso',       'PROFESSIONAL', true),
    (ids[5], 'alex.controle@pro.teste',    '(11) 98001-0005', 'Alex Controle',        'PROFESSIONAL', false);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '88.888.888/0001-01', 'CONTROLADOR_ACESSO', 'ACTIVE', 2,  28, 288.00, 'Controle de acesso com QR. Shows e feiras.', 'Penha, São Paulo', ST_GeogFromText('POINT(-46.5382 -23.5200)'), 15, false),
    (ids[2], '88.888.888/0001-02', 'CONTROLADOR_ACESSO', 'ACTIVE', 4,  91, 360.00, 'Supervisora de portaria com equipe.', 'Butantã, São Paulo', ST_GeogFromText('POINT(-46.7213 -23.5704)'), 20, true),
    (ids[3], '88.888.888/0001-03', 'CONTROLADOR_ACESSO', 'ACTIVE', 3,  54, 324.00, 'Credenciamento digital. QR Code.', 'Tucuruvi, São Paulo', ST_GeogFromText('POINT(-46.6070 -23.4750)'), 20, true),
    (ids[4], '88.888.888/0001-04', 'CONTROLADOR_ACESSO', 'ACTIVE', 1,   9, 264.00, 'Proativa e organizada.', 'São Caetano do Sul, SP', ST_GeogFromText('POINT(-46.5500 -23.6200)'), 15, true),
    (ids[5], '88.888.888/0001-05', 'CONTROLADOR_ACESSO', 'ACTIVE', 5, 187, 420.00, 'Especialista em grandes eventos. Até 10.000 pessoas.', 'Centro, São Paulo', ST_GeogFromText('POINT(-46.6333 -23.5505)'), 30, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('diego.acesso@pro.teste',     'POINT(-46.5360 -23.5180)'),
    ('simone.portaria@pro.teste',  'POINT(-46.7190 -23.5680)'),
    ('leandro.cred@pro.teste',     'POINT(-46.6050 -23.4730)'),
    ('vanessa.acesso@pro.teste',   'POINT(-46.5480 -23.6180)'),
    ('alex.controle@pro.teste',    'POINT(-46.6310 -23.5485)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- DISPONIBILIDADE — próximos 30 dias (sex/sab/dom)
insert into professional_availability (professional_id, starts_at, ends_at, is_available)
select
  p.id,
  date_trunc('day', gs) + interval '8 hours',
  date_trunc('day', gs) + interval '23 hours',
  true
from professionals p
join public.users u on u.id = p.user_id
cross join generate_series(
  now()::date,
  (now() + interval '30 days')::date,
  interval '1 day'
) as gs
where u.email like '%@pro.teste'
  and extract(dow from gs) in (5, 6, 0);

-- =====================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================
select
  category::text as categoria,
  count(*) as total,
  round(avg(stars), 1) as media_estrelas
from professionals p
join public.users u on u.id = p.user_id
where u.email like '%@pro.teste'
group by category order by category;
