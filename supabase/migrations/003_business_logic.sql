-- =====================================================================
-- 003 - BUSINESS LOGIC FUNCTIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VERIFICAR DISPONIBILIDADE DO PROFISSIONAL
--    Retorna true se o profissional está livre no período e
--    sem conflito de distância com outros eventos adjacentes
-- ---------------------------------------------------------------------
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
  -- Conflito direto de horário
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

  -- Conflito de distância: evento terminando muito perto do início do próximo
  -- (profissional não conseguiria chegar a tempo)
  select count(*) into v_distance_conflict
  from booking_professionals bp
  join bookings b on b.id = bp.booking_id
  join events e on e.id = b.event_id
  where bp.professional_id = p_professional_id
    and bp.status in ('ACCEPTED', 'IN_TRANSIT', 'CHECKED_IN')
    and (
      -- Evento anterior termina menos de 1h antes E a distância é > 10km
      (e.ends_at between (p_starts_at - interval '1 hour') and p_starts_at
        and ST_Distance(e.location, p_location) > 10000)
      or
      -- Próximo evento começa menos de 1h depois E a distância é > 10km
      (e.starts_at between p_ends_at and (p_ends_at + interval '1 hour')
        and ST_Distance(e.location, p_location) > 10000)
    );

  return v_distance_conflict = 0;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. CALCULAR PREÇO DO BOOKING
-- ---------------------------------------------------------------------
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
  -- Preço base da tabela para categoria + nível de estrelas
  select price_8h into v_base_price
  from price_table
  where category = p_category and star_level = p_star_level;

  if v_base_price is null then
    -- fallback para star_level 0 se não encontrar o nível
    select price_8h into v_base_price
    from price_table
    where category = p_category and star_level = 0;
  end if;

  if v_base_price is null then
    raise exception 'Preço não encontrado para categoria % nível %', p_category, p_star_level;
  end if;

  -- Multiplicador (NORMAL, EMERGENCY, AFTER_HOURS)
  select multiplier into v_multiplier
  from price_multipliers where type = p_multiplier_type;

  -- Duração em horas
  v_hours := extract(epoch from (p_ends_at - p_starts_at)) / 3600;

  -- Regra: até 8h = preço cheio; cada fração de 4h adicional = 50% do preço base
  if v_hours <= 8 then
    v_price := v_base_price;
  else
    v_price := v_base_price + ceil((v_hours - 8) / 4) * (v_base_price * 0.5);
  end if;

  return round(v_price * v_multiplier, 2);
end;
$$;

-- ---------------------------------------------------------------------
-- 3. BUSCAR PROFISSIONAIS DISPONÍVEIS (para o cliente)
-- ---------------------------------------------------------------------
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
    p.id,
    u.id,
    u.full_name,
    p.stars,
    p.events_count,
    p.hourly_cache,
    ST_Distance(
      pl.location,
      p_location
    ) as distance_m,
    exists(
      select 1 from client_favorites cf
      join clients c on c.id = cf.client_id
      where c.user_id = auth_user_id()
        and cf.professional_id = p.id
    ) as is_favorite
  from professionals p
  join users u on u.id = p.user_id
  -- última localização conhecida
  join lateral (
    select location from professional_locations
    where professional_id = p.id
    order by recorded_at desc
    limit 1
  ) pl on true
  where p.category = p_category
    and p.status = 'ACTIVE'
    and ST_Distance(pl.location, p_location) <= (p_radius_km * 1000)
    and check_professional_availability(p.id, p_starts_at, p_ends_at, p_location)
  order by
    is_favorite desc,   -- favoritos primeiro
    p.stars desc,       -- depois por estrelas
    distance_m asc      -- depois por proximidade
  limit p_limit;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. ATUALIZAR ESTRELAS DO PROFISSIONAL
--    Chamado após conclusão de evento
-- ---------------------------------------------------------------------
create or replace function update_professional_stars(p_professional_id uuid)
returns void language plpgsql as $$
declare
  v_events_count int;
  v_new_stars    int;
  v_new_cache    numeric;
  v_base_cache   numeric;
  v_bonus_pct    numeric;
begin
  -- Contagem de eventos concluídos
  select count(*) into v_events_count
  from booking_professionals bp
  join bookings b on b.id = bp.booking_id
  where bp.professional_id = p_professional_id
    and bp.status = 'CHECKED_OUT'
    and b.status = 'COMPLETED';

  -- Nível de estrelas pelo milestone
  select star_level, cache_bonus_pct
  into v_new_stars, v_bonus_pct
  from star_milestones
  where min_events <= v_events_count
  order by star_level desc
  limit 1;

  v_new_stars := coalesce(v_new_stars, 0);
  v_bonus_pct := coalesce(v_bonus_pct, 0);

  -- Cache base da tabela de preços (star_level 0)
  select pt.price_8h into v_base_cache
  from price_table pt
  join professionals p on p.category = pt.category
  where p.id = p_professional_id and pt.star_level = 0
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

-- ---------------------------------------------------------------------
-- 5. PROCESSAR PAGAMENTO DO BOOKING
--    Debita créditos do cliente, distribui para profissionais,
--    retém comissão da plataforma
-- ---------------------------------------------------------------------
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

  -- Verificar saldo
  if v_client.credit_balance < v_booking.total_amount then
    raise exception 'Saldo insuficiente. Necessário: %, Disponível: %',
      v_booking.total_amount, v_client.credit_balance;
  end if;

  -- Calcular comissão e valor líquido
  v_commission := round(v_booking.total_amount * v_booking.commission_pct / 100, 2);
  v_pro_total  := v_booking.total_amount - v_commission;

  -- Contar profissionais confirmados
  select count(*) into v_pro_count
  from booking_professionals
  where booking_id = p_booking_id and status = 'ACCEPTED';

  v_per_pro := round(v_pro_total / v_pro_count, 2);

  -- Debitar cliente
  update clients set credit_balance = credit_balance - v_booking.total_amount
  where id = v_client.id;

  -- Registrar transação do cliente
  insert into transactions (booking_id, from_user_id, to_user_id, type, amount, description)
  select p_booking_id, v_client.user_id, null, 'BOOKING', v_booking.total_amount,
    'Pagamento booking #' || p_booking_id;

  -- Registrar comissão da plataforma
  insert into transactions (booking_id, from_user_id, to_user_id, type, amount, description)
  select p_booking_id, v_client.user_id, null, 'COMMISSION', v_commission,
    'Comissão plataforma booking #' || p_booking_id;

  -- Creditar cada profissional
  for v_bp in
    select bp.professional_id, p.user_id as pro_user_id
    from booking_professionals bp
    join professionals p on p.id = bp.professional_id
    where bp.booking_id = p_booking_id and bp.status = 'ACCEPTED'
  loop
    -- Atualizar saldo (professionals não têm saldo direto, usamos clients se tiver conta)
    -- Registrar transação individual
    insert into transactions (booking_id, from_user_id, to_user_id, type, amount, description)
    values (p_booking_id, v_client.user_id, v_bp.pro_user_id, 'BOOKING', v_per_pro,
      'Pagamento profissional booking #' || p_booking_id);

    -- Atualizar amount individual no booking_professional
    update booking_professionals set amount = v_per_pro
    where booking_id = p_booking_id and professional_id = v_bp.professional_id;
  end loop;

  -- Atualizar status do booking
  update bookings set status = 'CONFIRMED', updated_at = now()
  where id = p_booking_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. TRATAR NO-SHOW DE PROFISSIONAL
--    Marca falta, aciona busca de emergência, notifica cliente
-- ---------------------------------------------------------------------
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

  -- Marcar no-show
  update booking_professionals
  set status = 'NO_SHOW', no_show_flag = true
  where id = p_booking_professional_id;

  -- Anotação no perfil do profissional
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

  -- Buscar substituto de emergência mais próximo
  select professional_id into v_replacement
  from find_available_professionals(
    v_booking.category,
    v_event.starts_at,
    v_event.ends_at,
    v_event.location,
    50,   -- raio expandido para emergência (50km)
    1
  );

  -- Se encontrou substituto, convidar
  if v_replacement is not null then
    insert into booking_professionals (booking_id, professional_id, amount, status)
    values (v_bp.booking_id, v_replacement, v_bp.amount, 'INVITED');

    -- Notificar profissional substituto
    insert into notifications (user_id, title, body, channel, payload)
    select p.user_id,
      '🚨 Serviço de Emergência!',
      'Há um evento precisando de você agora. Aceite e ganhe estrelas extras!',
      'PUSH',
      jsonb_build_object('booking_id', v_bp.booking_id, 'emergency', true)
    from professionals p where p.id = v_replacement;

    -- Notificar cliente
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
-- 7. TRIGGER: atualizar estrelas ao completar evento
-- ---------------------------------------------------------------------
create or replace function trigger_update_stars_on_checkout()
returns trigger language plpgsql as $$
begin
  if new.status = 'CHECKED_OUT' and old.status != 'CHECKED_OUT' then
    perform update_professional_stars(new.professional_id);
  end if;
  return new;
end;
$$;

create trigger on_professional_checkout
  after update on booking_professionals
  for each row execute procedure trigger_update_stars_on_checkout();

-- ---------------------------------------------------------------------
-- 8. TRIGGER: updated_at automático
-- ---------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_users           before update on users           for each row execute procedure touch_updated_at();
create trigger touch_professionals   before update on professionals   for each row execute procedure touch_updated_at();
create trigger touch_bookings        before update on bookings        for each row execute procedure touch_updated_at();

-- ---------------------------------------------------------------------
-- 9. FUNÇÃO: comprar créditos (gera transação + pix)
-- ---------------------------------------------------------------------
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

  -- Transação pendente
  insert into transactions (from_user_id, to_user_id, type, amount, description)
  values (v_client.user_id, null, 'CREDIT_PURCHASE', v_package.amount,
    'Compra de créditos - pacote ' || v_package.name)
  returning id into v_txn_id;

  -- Pix pendente
  insert into pix_payments (transaction_id, pix_key, amount, status)
  values (v_txn_id, p_pix_key, v_package.amount, 'PENDING')
  returning id into v_pix_id;

  return v_pix_id;
end;
$$;

-- Callback ao confirmar Pix — adiciona créditos ao cliente
create or replace function confirm_pix_payment(p_pix_id uuid)
returns void language plpgsql security definer as $$
declare
  v_pix     pix_payments%rowtype;
  v_txn     transactions%rowtype;
  v_package credit_packages%rowtype;
  v_amount  numeric;
begin
  select * into v_pix from pix_payments where id = p_pix_id;
  select * into v_txn from transactions where id = v_pix.transaction_id;

  -- Marcar pix como pago
  update pix_payments set status = 'PAID', paid_at = now() where id = p_pix_id;

  -- Adicionar créditos (com bônus se aplicável via pacote)
  update clients set credit_balance = credit_balance + v_pix.amount
  where user_id = v_txn.from_user_id;
end;
$$;
