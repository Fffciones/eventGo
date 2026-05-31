-- =====================================================================
-- 005 - CHEGADA ANTECIPADA E CRITÉRIOS DE AVALIAÇÃO
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CAMPOS DE PONTUALIDADE EM BOOKING_PROFESSIONALS
-- ---------------------------------------------------------------------
alter table booking_professionals
  add column early_checkin     boolean default false,   -- chegou antes do evento
  add column early_minutes     int,                     -- quantos minutos antes chegou
  add column punctuality_score int                      -- 0-10 calculado automaticamente
    generated always as (
      case
        when checkin_at is null then null
        -- chegou 60+ min antes = 10 pontos
        -- chegou 30-59 min antes = 8 pontos
        -- chegou 15-29 min antes = 6 pontos
        -- chegou no horário (0-14 min antes) = 5 pontos
        -- atrasado = 0 pontos
        when early_minutes >= 60 then 10
        when early_minutes >= 30 then 8
        when early_minutes >= 15 then 6
        when early_minutes >= 0  then 5
        else 0
      end
    ) stored;

-- ---------------------------------------------------------------------
-- 2. CRITÉRIOS DE AVALIAÇÃO (base para as estrelas)
--    Cada critério tem peso na nota final
-- ---------------------------------------------------------------------
create table review_criteria (
  id          uuid primary key default uuid_generate_v4(),
  code        text unique not null,
  label       text not null,
  description text,
  weight      numeric(4,2) not null,  -- peso no cálculo da nota final
  applies_to  user_type not null      -- CLIENT ou PROFESSIONAL
);

insert into review_criteria (code, label, description, weight, applies_to) values
  -- Critérios que o CLIENTE avalia no PROFISSIONAL
  ('PUNCTUALITY',    'Pontualidade',          'Chegou no horário ou antes para conhecer o espaço e o cliente', 2.0, 'PROFESSIONAL'),
  ('PRESENTATION',   'Apresentação',          'Visual, uniforme e postura adequados ao evento',                1.5, 'PROFESSIONAL'),
  ('PROACTIVITY',    'Proatividade',          'Antecipou necessidades sem precisar ser solicitado',            1.5, 'PROFESSIONAL'),
  ('COMMUNICATION',  'Comunicação',           'Respondeu chamados e manteve o cliente informado',             1.0, 'PROFESSIONAL'),
  ('TECHNICAL',      'Qualidade técnica',     'Executou o serviço com competência e qualidade',               2.0, 'PROFESSIONAL'),
  ('TEAM_WORK',      'Trabalho em equipe',    'Colaborou bem com outros profissionais do evento',             1.0, 'PROFESSIONAL'),
  ('OVERALL_PRO',    'Impressão geral',       'Avaliação geral do profissional no evento',                    1.0, 'PROFESSIONAL'),
  -- Critérios que o PROFISSIONAL avalia no CLIENTE
  ('CLARITY',        'Clareza do briefing',   'O cliente explicou bem o que era esperado',                    2.0, 'CLIENT'),
  ('RESPECT',        'Respeito e cordialidade','Tratamento respeitoso durante todo o evento',                  2.0, 'CLIENT'),
  ('STRUCTURE',      'Estrutura oferecida',   'Local adequado, materiais e condições de trabalho',            1.5, 'CLIENT'),
  ('PAYMENT_SPEED',  'Agilidade no pagamento','Pagamento confirmado sem problemas',                           2.0, 'CLIENT'),
  ('OVERALL_CLIENT', 'Impressão geral',       'Avaliação geral do cliente',                                   2.5, 'CLIENT');

-- ---------------------------------------------------------------------
-- 3. NOTAS POR CRITÉRIO (detalhe da avaliação)
-- ---------------------------------------------------------------------
alter table reviews
  add column criteria_scores jsonb;
  -- formato: {"PUNCTUALITY": 5, "PRESENTATION": 4, "PROACTIVITY": 5, ...}

-- Nota calculada automaticamente a partir dos critérios com peso
create or replace function calculate_weighted_score(
  p_scores  jsonb,
  p_applies_to user_type
) returns numeric language plpgsql as $$
declare
  v_total_weight numeric := 0;
  v_weighted_sum numeric := 0;
  v_criterion    record;
  v_score        numeric;
begin
  for v_criterion in
    select code, weight from review_criteria where applies_to = p_applies_to
  loop
    v_score := (p_scores ->> v_criterion.code)::numeric;
    if v_score is not null then
      v_weighted_sum := v_weighted_sum + (v_score * v_criterion.weight);
      v_total_weight := v_total_weight + v_criterion.weight;
    end if;
  end loop;

  if v_total_weight = 0 then return null; end if;
  return round(v_weighted_sum / v_total_weight, 1);
end;
$$;

-- ---------------------------------------------------------------------
-- 4. ATUALIZAR professional_checkin PARA CAPTURAR CHEGADA ANTECIPADA
-- ---------------------------------------------------------------------
create or replace function professional_checkin(p_booking_professional_id uuid)
returns void language plpgsql security definer as $$
declare
  v_bp             booking_professionals%rowtype;
  v_booking        bookings%rowtype;
  v_event          events%rowtype;
  v_client_user_id uuid;
  v_minutes_before int;
  v_is_early       boolean;
  v_msg_title      text;
  v_msg_body       text;
begin
  select * into v_bp      from booking_professionals where id = p_booking_professional_id;
  select * into v_booking from bookings              where id = v_bp.booking_id;
  select * into v_event   from events                where id = v_booking.event_id;

  -- Só o próprio profissional
  if not exists (
    select 1 from professionals p
    where p.id = v_bp.professional_id and p.user_id = auth_user_id()
  ) then
    raise exception 'Acesso negado';
  end if;

  -- Calcular minutos de antecedência em relação ao início do evento
  v_minutes_before := extract(epoch from (v_event.starts_at - now())) / 60;
  v_is_early       := v_minutes_before > 0;

  update booking_professionals
  set
    status        = 'CHECKED_IN',
    gps_active    = false,
    checkin_at    = now(),
    early_checkin = v_is_early,
    early_minutes = v_minutes_before
  where id = p_booking_professional_id;

  -- Notificação ao cliente com contexto de pontualidade
  select c.user_id into v_client_user_id
  from clients c where c.id = v_event.client_id;

  if v_minutes_before >= 60 then
    v_msg_title := 'Profissional chegou cedo!';
    v_msg_body  := 'Um profissional chegou ' || v_minutes_before || ' minutos antes. Aproveite para fazer o briefing!';
  elsif v_minutes_before >= 15 then
    v_msg_title := 'Profissional chegou!';
    v_msg_body  := 'Um profissional chegou ' || v_minutes_before || ' minutos antes do evento.';
  else
    v_msg_title := 'Profissional chegou!';
    v_msg_body  := 'Um profissional acabou de fazer check-in no seu evento.';
  end if;

  insert into notifications (user_id, title, body, channel, payload)
  values (
    v_client_user_id,
    v_msg_title,
    v_msg_body,
    'PUSH',
    jsonb_build_object(
      'booking_professional_id', p_booking_professional_id,
      'event_id', v_booking.event_id,
      'early_checkin', v_is_early,
      'early_minutes', v_minutes_before
    )
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 5. ATUALIZAR update_professional_stars PARA INCLUIR PONTUALIDADE
--    A média ponderada das avaliações alimenta as estrelas
-- ---------------------------------------------------------------------
create or replace function update_professional_stars(p_professional_id uuid)
returns void language plpgsql as $$
declare
  v_events_count   int;
  v_new_stars      int;
  v_new_cache      numeric;
  v_base_cache     numeric;
  v_bonus_pct      numeric;
  v_avg_rating     numeric;
  v_early_rate     numeric;  -- % de eventos com chegada antecipada
begin
  -- Contagem de eventos concluídos
  select count(*) into v_events_count
  from booking_professionals bp
  join bookings b on b.id = bp.booking_id
  where bp.professional_id = p_professional_id
    and bp.status = 'CHECKED_OUT'
    and b.status = 'COMPLETED';

  -- Média das avaliações recebidas
  select avg(r.rating) into v_avg_rating
  from reviews r
  join users u on u.id = r.reviewee_id
  join professionals p on p.user_id = u.id
  where p.id = p_professional_id;

  -- Taxa de chegada antecipada (>= 30 min antes)
  select
    round(
      count(*) filter (where early_minutes >= 30)::numeric /
      nullif(count(*), 0) * 100
    , 1) into v_early_rate
  from booking_professionals
  where professional_id = p_professional_id
    and checkin_at is not null;

  -- Nível de estrelas: combina eventos + avaliação + pontualidade
  -- Base: milestone por número de eventos
  select star_level, cache_bonus_pct
  into v_new_stars, v_bonus_pct
  from star_milestones
  where min_events <= v_events_count
  order by star_level desc
  limit 1;

  v_new_stars := coalesce(v_new_stars, 0);
  v_bonus_pct := coalesce(v_bonus_pct, 0);

  -- Bônus adicional por alta avaliação (>= 4.5) + pontualidade (>= 70%)
  if coalesce(v_avg_rating, 0) >= 4.5 and coalesce(v_early_rate, 0) >= 70 then
    v_bonus_pct := v_bonus_pct + 10;  -- +10% no cache
  end if;

  -- Cache base
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
