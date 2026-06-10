-- =====================================================================
-- 014 - ETAPA 1B: Modelo de VAGA individual (doc rev 10jun26, seções 1.4.2 e 2.3.3)
-- =====================================================================
-- A "vaga" passa a ser a entidade central: cada posição aberta dentro de
-- um evento é UMA linha. Absorve o que antes era bookings (agrupado por
-- função+quantidade) + booking_professionals (ciclo de vida por profissional).
--
-- Eixos de status na vaga:
--   status        → ciclo de vida da posição (doc 1.4.2)
--   worker_status → micro-estado operacional do profissional alocado
--
-- Ambiente de testes: não há migração de dados. As tabelas legadas
-- (bookings, booking_professionals) permanecem para compat de funções
-- antigas (pagamento/preço — serão reescritas na Etapa 4), mas o código
-- novo opera somente sobre `vagas`.
--
-- Para zerar o ambiente operacional antes de recriar, rode manualmente:
--   truncate table booking_professionals, bookings, events, vagas cascade;
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUM de status da vaga (ciclo de vida — doc 1.4.2)
-- ---------------------------------------------------------------------
do $$ begin
  create type vaga_status as enum (
    'OPEN',         -- Em aberto (ainda não preenchida)
    'FILLED',       -- Preenchida (profissional alocado)
    'IN_PROGRESS',  -- Em andamento (evento acontecendo)
    'CLOSING',      -- Em finalização (pagamento/fechamento)
    'FINISHED',     -- Finalizada (paga e arquivada)
    'CANCELLED'     -- Cancelada (pelo contratante, antes de preencher)
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. TABELA VAGAS
-- ---------------------------------------------------------------------
create table if not exists vagas (
  id                   uuid primary key default uuid_generate_v4(),
  event_id             uuid not null references events(id) on delete cascade,
  function_id          uuid references functions(id),
  category             professional_category,            -- legado/denormalizado (filtros de compat)

  -- ciclo de vida da posição (doc 1.4.2)
  status               vaga_status not null default 'OPEN',

  -- fase de oferta (matchmaking — doc 2.3.3; detalhado na Etapa 3)
  -- DIRECTED = oferta direcionada (fila) | OPEN_POOL = oferta aberta (mural)
  -- Default OPEN_POOL para o ambiente de testes ser usável antes da Etapa 3.
  offer_phase          text not null default 'OPEN_POOL'
                         check (offer_phase in ('DIRECTED','OPEN_POOL')),

  -- profissional alocado / convidado (null enquanto totalmente em aberto)
  professional_id      uuid references professionals(id),
  worker_status        booking_professional_status,      -- micro-estado do profissional

  -- valores (snapshot da função; refinados na Etapa 2/4)
  price                numeric(10,2),                     -- preço ao contratante
  base_pay             numeric(10,2),                     -- remuneração ao profissional
  multiplier_type      price_multiplier_type default 'NORMAL',

  -- ciclo de vida operacional (absorvido de booking_professionals)
  invited_at           timestamptz,
  responded_at         timestamptz,
  gps_active           boolean default false,
  transit_requested_at timestamptz,
  alert_60_sent        boolean default false,
  checkin_at           timestamptz,
  checkout_at          timestamptz,
  no_show_flag         boolean default false,
  early_checkin        boolean default false,
  early_minutes        int,
  punctuality_score    int generated always as (
    case
      when checkin_at is null then null
      when early_minutes >= 60 then 10
      when early_minutes >= 30 then 8
      when early_minutes >= 15 then 6
      when early_minutes >= 0  then 5
      else 0
    end
  ) stored,

  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create index if not exists idx_vagas_event       on vagas(event_id);
create index if not exists idx_vagas_function     on vagas(function_id);
create index if not exists idx_vagas_professional on vagas(professional_id);
create index if not exists idx_vagas_status       on vagas(status);
create index if not exists idx_vagas_open_pool    on vagas(status, offer_phase) where professional_id is null;

drop trigger if exists touch_vagas on vagas;
create trigger touch_vagas
  before update on vagas
  for each row execute procedure touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------
alter table vagas enable row level security;

-- Contratante vê as vagas dos seus eventos
drop policy if exists "vagas: contratante vê suas vagas" on vagas;
create policy "vagas: contratante vê suas vagas"
  on vagas for select using (
    exists (
      select 1 from events e
      join clients c on c.id = e.client_id
      where e.id = vagas.event_id and c.user_id = auth_user_id()
    )
  );

-- Contratante cria/edita vagas dos seus eventos
drop policy if exists "vagas: contratante cria vaga" on vagas;
create policy "vagas: contratante cria vaga"
  on vagas for insert with check (
    exists (
      select 1 from events e
      join clients c on c.id = e.client_id
      where e.id = vagas.event_id and c.user_id = auth_user_id()
    )
  );

drop policy if exists "vagas: contratante edita suas vagas" on vagas;
create policy "vagas: contratante edita suas vagas"
  on vagas for update using (
    exists (
      select 1 from events e
      join clients c on c.id = e.client_id
      where e.id = vagas.event_id and c.user_id = auth_user_id()
    )
  );

-- Profissional vê vagas em aberto (mural) + as que estão associadas a ele
drop policy if exists "vagas: profissional vê abertas e próprias" on vagas;
create policy "vagas: profissional vê abertas e próprias"
  on vagas for select using (
    (status = 'OPEN' and professional_id is null)
    or exists (
      select 1 from professionals p
      where p.id = vagas.professional_id and p.user_id = auth_user_id()
    )
  );

-- Profissional aceita/atualiza a própria vaga (aceite, deslocamento, check-in...)
drop policy if exists "vagas: profissional atualiza própria vaga" on vagas;
create policy "vagas: profissional atualiza própria vaga"
  on vagas for update using (
    -- pegar uma vaga aberta (oferta aberta) OU operar a já associada a ele
    (status = 'OPEN' and professional_id is null)
    or exists (
      select 1 from professionals p
      where p.id = vagas.professional_id and p.user_id = auth_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- 4. RASTREIO DE LOCALIZAÇÃO — cliente vê GPS só durante deslocamento
-- ---------------------------------------------------------------------
drop policy if exists "locations: cliente rastreia contratado" on professional_locations;

create policy "locations: cliente rastreia contratado"
  on professional_locations for select using (
    exists (
      select 1 from vagas v
      join events e  on e.id = v.event_id
      join clients c on c.id = e.client_id
      where v.professional_id = professional_locations.professional_id
        and c.user_id = auth_user_id()
        and v.worker_status = 'IN_TRANSIT'
        and v.gps_active = true
    )
  );

-- ---------------------------------------------------------------------
-- 5. DISPONIBILIDADE — checa conflito de horário sobre vagas
-- ---------------------------------------------------------------------
create or replace function check_professional_availability(
  p_professional_id uuid,
  p_starts_at       timestamptz,
  p_ends_at         timestamptz,
  p_location        geography
) returns boolean language plpgsql as $$
declare
  v_conflict_count    int;
  v_distance_conflict int;
begin
  select count(*) into v_conflict_count
  from vagas v
  join events e on e.id = v.event_id
  where v.professional_id = p_professional_id
    and v.worker_status in ('ACCEPTED','IN_TRANSIT','CHECKED_IN')
    and (e.starts_at, e.ends_at) overlaps (p_starts_at, p_ends_at);

  if v_conflict_count > 0 then
    return false;
  end if;

  select count(*) into v_distance_conflict
  from vagas v
  join events e on e.id = v.event_id
  where v.professional_id = p_professional_id
    and v.worker_status in ('ACCEPTED','IN_TRANSIT','CHECKED_IN')
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

-- ---------------------------------------------------------------------
-- 6. ACEITAR VAGA (oferta aberta) — primeiro a clicar fica com a vaga
--    Operação atômica: garante que ninguém mais pegou a vaga antes.
-- ---------------------------------------------------------------------
create or replace function accept_vaga(p_vaga_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_pro_id uuid;
  v_updated int;
begin
  -- profissional autenticado
  select p.id into v_pro_id
  from professionals p where p.user_id = auth_user_id();

  if v_pro_id is null then
    raise exception 'Profissional não encontrado';
  end if;

  -- pega a vaga apenas se ainda estiver realmente aberta
  update vagas
  set professional_id = v_pro_id,
      worker_status   = 'ACCEPTED',
      status          = 'FILLED',
      responded_at    = now()
  where id = p_vaga_id
    and status = 'OPEN'
    and professional_id is null;

  get diagnostics v_updated = row_count;
  return v_updated > 0;   -- false = vaga já foi preenchida por outro
end;
$$;

-- ---------------------------------------------------------------------
-- 7. RESPONDER CONVITE DIRECIONADO (aceitar/recusar)
-- ---------------------------------------------------------------------
create or replace function respond_to_vaga_invite(p_vaga_id uuid, p_accept boolean)
returns void language plpgsql security definer as $$
declare
  v_pro_id uuid;
  v_vaga   vagas%rowtype;
begin
  select p.id into v_pro_id from professionals p where p.user_id = auth_user_id();
  select * into v_vaga from vagas where id = p_vaga_id;

  if v_vaga.professional_id is distinct from v_pro_id then
    raise exception 'Convite não pertence a este profissional';
  end if;

  if p_accept then
    update vagas
    set worker_status = 'ACCEPTED', status = 'FILLED', responded_at = now()
    where id = p_vaga_id;
  else
    -- recusou: libera a vaga de volta para a fila/mural
    update vagas
    set professional_id = null, worker_status = null,
        status = 'OPEN', responded_at = now()
    where id = p_vaga_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. PROFISSIONAL ATIVA "EM DESLOCAMENTO"
-- ---------------------------------------------------------------------
-- DROP necessário: o parâmetro foi renomeado (p_booking_professional_id → p_vaga_id)
drop function if exists activate_transit(uuid);
create or replace function activate_transit(p_vaga_id uuid)
returns void language plpgsql security definer as $$
declare
  v_vaga           vagas%rowtype;
  v_event          events%rowtype;
  v_client_user_id uuid;
begin
  select * into v_vaga from vagas where id = p_vaga_id;

  if not exists (
    select 1 from professionals p
    where p.id = v_vaga.professional_id and p.user_id = auth_user_id()
  ) then
    raise exception 'Acesso negado';
  end if;

  update vagas
  set worker_status = 'IN_TRANSIT', status = 'IN_PROGRESS', gps_active = true
  where id = p_vaga_id;

  select * into v_event from events where id = v_vaga.event_id;
  select c.user_id into v_client_user_id from clients c where c.id = v_event.client_id;

  insert into notifications (user_id, title, body, channel, payload)
  values (
    v_client_user_id,
    'Profissional em deslocamento',
    'Um profissional do seu evento acabou de iniciar o deslocamento.',
    'PUSH',
    jsonb_build_object('vaga_id', p_vaga_id, 'event_id', v_vaga.event_id)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 9. CLIENTE SOLICITA ATIVAÇÃO DO GPS
-- ---------------------------------------------------------------------
drop function if exists request_transit_activation(uuid);
create or replace function request_transit_activation(p_vaga_id uuid)
returns void language plpgsql security definer as $$
declare
  v_vaga        vagas%rowtype;
  v_event       events%rowtype;
  v_pro_user_id uuid;
begin
  select * into v_vaga  from vagas  where id = p_vaga_id;
  select * into v_event from events where id = v_vaga.event_id;

  if not exists (
    select 1 from clients c
    where c.id = v_event.client_id and c.user_id = auth_user_id()
  ) then
    raise exception 'Acesso negado';
  end if;

  update vagas set transit_requested_at = now() where id = p_vaga_id;

  select p.user_id into v_pro_user_id
  from professionals p where p.id = v_vaga.professional_id;

  insert into notifications (user_id, title, body, channel, payload)
  values (
    v_pro_user_id,
    'O cliente está aguardando você',
    'Por favor, confirme que está em deslocamento para o evento.',
    'PUSH',
    jsonb_build_object('vaga_id', p_vaga_id, 'action', 'activate_transit')
  );

  if exists (select 1 from users where id = v_pro_user_id and whatsapp_opt_in = true) then
    insert into notifications (user_id, title, body, channel, payload)
    values (
      v_pro_user_id,
      'EventPro: Confirme seu deslocamento',
      'O cliente do seu próximo evento está aguardando confirmação de que você está a caminho.',
      'WHATSAPP',
      jsonb_build_object('vaga_id', p_vaga_id, 'action', 'activate_transit')
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 10. ALERTAS DE 60 MINUTOS (cron/edge a cada 5 min)
-- ---------------------------------------------------------------------
create or replace function check_pre_event_alerts()
returns int language plpgsql security definer as $$
declare
  v_rec            record;
  v_pro_user_id    uuid;
  v_client_user_id uuid;
  v_alerts_sent    int := 0;
begin
  for v_rec in
    select v.id as vaga_id, v.professional_id, e.id as event_id, e.client_id, e.starts_at
    from vagas v
    join events e on e.id = v.event_id
    where v.worker_status = 'ACCEPTED'
      and v.gps_active = false
      and v.alert_60_sent = false
      and e.starts_at between now() and now() + interval '60 minutes'
  loop
    select p.user_id into v_pro_user_id    from professionals p where p.id = v_rec.professional_id;
    select c.user_id into v_client_user_id from clients c       where c.id = v_rec.client_id;

    insert into notifications (user_id, title, body, channel, payload)
    values (
      v_pro_user_id,
      '⏰ Seu evento começa em 60 minutos!',
      'Por favor, confirme que está em deslocamento. Caso não responda, o sistema poderá acionar um substituto.',
      'PUSH',
      jsonb_build_object('vaga_id', v_rec.vaga_id, 'event_id', v_rec.event_id, 'action', 'activate_transit', 'deadline_minutes', 60)
    );

    if exists (select 1 from users where id = v_pro_user_id and whatsapp_opt_in = true) then
      insert into notifications (user_id, title, body, channel, payload)
      values (
        v_pro_user_id,
        'EventPro: Seu evento em 60 minutos',
        'Confirme agora que está a caminho ou o contrato poderá ser repassado.',
        'WHATSAPP',
        jsonb_build_object('vaga_id', v_rec.vaga_id, 'action', 'activate_transit')
      );
    end if;

    insert into notifications (user_id, title, body, channel, payload)
    values (
      v_client_user_id,
      'Atenção: profissional ainda não confirmou deslocamento',
      'Faltam 60 minutos para seu evento e um profissional ainda não confirmou que está a caminho.',
      'PUSH',
      jsonb_build_object('vaga_id', v_rec.vaga_id, 'event_id', v_rec.event_id, 'action', 'request_transit_or_emergency')
    );

    update vagas set alert_60_sent = true where id = v_rec.vaga_id;
    v_alerts_sent := v_alerts_sent + 1;
  end loop;

  return v_alerts_sent;
end;
$$;

-- ---------------------------------------------------------------------
-- 11. CHECK-IN (com chegada antecipada)
-- ---------------------------------------------------------------------
drop function if exists professional_checkin(uuid);
create or replace function professional_checkin(p_vaga_id uuid)
returns void language plpgsql security definer as $$
declare
  v_vaga           vagas%rowtype;
  v_event          events%rowtype;
  v_client_user_id uuid;
  v_minutes_before int;
  v_is_early       boolean;
  v_msg_title      text;
  v_msg_body       text;
begin
  select * into v_vaga  from vagas  where id = p_vaga_id;
  select * into v_event from events where id = v_vaga.event_id;

  if not exists (
    select 1 from professionals p
    where p.id = v_vaga.professional_id and p.user_id = auth_user_id()
  ) then
    raise exception 'Acesso negado';
  end if;

  v_minutes_before := extract(epoch from (v_event.starts_at - now())) / 60;
  v_is_early       := v_minutes_before > 0;

  update vagas
  set worker_status = 'CHECKED_IN', status = 'IN_PROGRESS', gps_active = false,
      checkin_at = now(), early_checkin = v_is_early, early_minutes = v_minutes_before
  where id = p_vaga_id;

  select c.user_id into v_client_user_id from clients c where c.id = v_event.client_id;

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
    v_client_user_id, v_msg_title, v_msg_body, 'PUSH',
    jsonb_build_object('vaga_id', p_vaga_id, 'event_id', v_vaga.event_id,
                       'early_checkin', v_is_early, 'early_minutes', v_minutes_before)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 12. NO-SHOW + busca de substituto (emergência)
-- ---------------------------------------------------------------------
drop function if exists handle_no_show(uuid);
create or replace function handle_no_show(p_vaga_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_vaga        vagas%rowtype;
  v_event       events%rowtype;
  v_replacement uuid;
  v_client_user uuid;
begin
  select * into v_vaga  from vagas  where id = p_vaga_id;
  select * into v_event from events where id = v_vaga.event_id;

  -- marca falta e anota no perfil
  update vagas set worker_status = 'NO_SHOW', no_show_flag = true where id = p_vaga_id;
  update professionals set updated_at = now() where id = v_vaga.professional_id;

  insert into notifications (user_id, title, body, channel, payload)
  select p.user_id, 'Falta registrada',
    'Você não compareceu ao evento e recebeu uma anotação em seu perfil.',
    'PUSH', jsonb_build_object('vaga_id', p_vaga_id, 'event_id', v_vaga.event_id)
  from professionals p where p.id = v_vaga.professional_id;

  -- busca substituto mais próximo (raio expandido p/ emergência)
  select professional_id into v_replacement
  from find_available_professionals(
    v_event.starts_at, v_event.ends_at, v_event.location,
    v_vaga.function_id, v_vaga.category, 50, 1
  );

  if v_replacement is not null then
    -- reabre a MESMA vaga como convite direcionado ao substituto, em emergência
    update vagas
    set professional_id = v_replacement,
        worker_status   = 'INVITED',
        status          = 'OPEN',
        offer_phase     = 'DIRECTED',
        multiplier_type = 'EMERGENCY',
        invited_at      = now(),
        no_show_flag    = false
    where id = p_vaga_id;

    insert into notifications (user_id, title, body, channel, payload)
    select p.user_id, '🚨 Serviço de Emergência!',
      'Há um evento precisando de você agora. Aceite e ganhe estrelas extras!',
      'PUSH', jsonb_build_object('vaga_id', p_vaga_id, 'emergency', true)
    from professionals p where p.id = v_replacement;

    select c.user_id into v_client_user from clients c where c.id = v_event.client_id;
    insert into notifications (user_id, title, body, channel, payload)
    values (v_client_user, 'Profissional substituto a caminho',
      'Encontramos um substituto para o profissional que não compareceu.',
      'PUSH', jsonb_build_object('vaga_id', p_vaga_id));
  end if;

  return v_replacement;
end;
$$;

-- ---------------------------------------------------------------------
-- 13. EMERGÊNCIA POR FALTA DE RESPOSTA
-- ---------------------------------------------------------------------
drop function if exists trigger_emergency_replacement(uuid);
create or replace function trigger_emergency_replacement(p_vaga_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_vaga vagas%rowtype;
begin
  select * into v_vaga from vagas where id = p_vaga_id;

  if v_vaga.alert_60_sent = false then
    raise exception 'Alerta de 60 minutos ainda não foi enviado para esta vaga';
  end if;
  if v_vaga.gps_active = true then
    raise exception 'Profissional já está em deslocamento';
  end if;

  return handle_no_show(p_vaga_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 14. ESTRELAS — recontagem sobre vagas concluídas
-- ---------------------------------------------------------------------
create or replace function update_professional_stars(p_professional_id uuid)
returns void language plpgsql as $$
declare
  v_events_count int;
  v_new_stars    int;
  v_new_cache    numeric;
  v_base_cache   numeric;
  v_bonus_pct    numeric;
  v_avg_rating   numeric;
  v_early_rate   numeric;
  v_pro          professionals%rowtype;
begin
  select * into v_pro from professionals where id = p_professional_id;

  select count(*) into v_events_count
  from vagas v
  where v.professional_id = p_professional_id
    and v.worker_status = 'CHECKED_OUT'
    and v.status in ('CLOSING','FINISHED');

  select avg(r.rating) into v_avg_rating
  from reviews r
  join users u on u.id = r.reviewee_id
  join professionals p on p.user_id = u.id
  where p.id = p_professional_id;

  select round(
      count(*) filter (where early_minutes >= 30)::numeric /
      nullif(count(*), 0) * 100, 1) into v_early_rate
  from vagas
  where professional_id = p_professional_id and checkin_at is not null;

  select star_level, cache_bonus_pct into v_new_stars, v_bonus_pct
  from star_milestones
  where min_events <= v_events_count
  order by star_level desc limit 1;

  v_new_stars := coalesce(v_new_stars, 0);
  v_bonus_pct := coalesce(v_bonus_pct, 0);

  if coalesce(v_avg_rating, 0) >= 4.5 and coalesce(v_early_rate, 0) >= 70 then
    v_bonus_pct := v_bonus_pct + 10;
  end if;

  -- cache base: primeira função do profissional (tabela functions) ou legado
  select case when v_pro.professional_type = 'MEI' then f.base_pay_mei else f.base_pay_diarista end
  into v_base_cache
  from professional_functions pf
  join functions f on f.id = pf.function_id
  where pf.professional_id = p_professional_id
  order by f.display_order limit 1;

  if v_base_cache is null then
    select pt.price_8h into v_base_cache
    from price_table pt
    where pt.category = v_pro.category and pt.star_level = 0;
  end if;

  v_new_cache := round(coalesce(v_base_cache, 0) * (1 + v_bonus_pct / 100), 2);

  update professionals
  set stars = v_new_stars, events_count = v_events_count,
      hourly_cache = v_new_cache, updated_at = now()
  where id = p_professional_id;
end;
$$;

-- trigger: atualizar estrelas quando a vaga é concluída (checkout)
create or replace function trigger_update_stars_on_vaga_checkout()
returns trigger language plpgsql as $$
begin
  if new.worker_status = 'CHECKED_OUT' and old.worker_status is distinct from 'CHECKED_OUT' then
    perform update_professional_stars(new.professional_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_vaga_checkout on vagas;
create trigger on_vaga_checkout
  after update on vagas
  for each row execute procedure trigger_update_stars_on_vaga_checkout();
