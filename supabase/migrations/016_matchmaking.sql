-- =====================================================================
-- 016 - ETAPA 3: Matchmaking em 2 fases + Variáveis Gerais de Sistema
--       (doc rev 10jun26, seção 2.3.3 e componente 3.4)
-- =====================================================================
-- Fase 1 "oferta direcionada": a vaga é oferecida a um profissional por vez
--   (fila estilo Uber). Cada um tem X segundos para aceitar; senão passa ao
--   próximo. A fase dura no máximo Y minutos.
-- Fase 2 "oferta aberta": expirada a fase direcionada (ou sem candidatos), a
--   vaga vai para o mural e o primeiro a clicar fica com ela.
--
-- Os tempos X e Y são geridos pelo admin em "Variáveis Gerais de Sistema".
--
-- O motor (process_matchmaking) é idempotente e pode ser chamado por:
--   - polling do app do profissional (test env)
--   - pg_cron / edge function a cada ~10s (produção)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VARIÁVEIS GERAIS DE SISTEMA
-- ---------------------------------------------------------------------
create table if not exists system_variables (
  key         text primary key,
  value       numeric not null,
  label       text,
  description text,
  updated_at  timestamptz default now()
);

insert into system_variables (key, value, label, description) values
  ('directed_offer_seconds_per_pro', 15,
   'Tempo por profissional (s)',
   'Segundos que cada profissional tem para aceitar a vaga na oferta direcionada antes de passar ao próximo.'),
  ('directed_phase_total_minutes', 3,
   'Duração da oferta direcionada (min)',
   'Tempo total da fase de oferta direcionada antes da vaga ir para a oferta aberta (mural).')
on conflict (key) do nothing;

alter table system_variables enable row level security;

drop policy if exists "system_variables_select_all" on system_variables;
create policy "system_variables_select_all" on system_variables
  for select using (true);

drop policy if exists "system_variables_admin_write" on system_variables;
create policy "system_variables_admin_write" on system_variables
  for all using (is_admin()) with check (is_admin());

create or replace function get_system_var(p_key text)
returns numeric language sql stable as $$
  select value from system_variables where key = p_key;
$$;

-- ---------------------------------------------------------------------
-- 2. COLUNAS DE MATCHMAKING NA VAGA
-- ---------------------------------------------------------------------
alter table vagas add column if not exists offered_pro_ids          uuid[] default '{}';
alter table vagas add column if not exists current_offer_expires_at timestamptz;
alter table vagas add column if not exists directed_until           timestamptz;

comment on column vagas.offered_pro_ids          is 'Profissionais que já receberam a oferta direcionada (não reofertar).';
comment on column vagas.current_offer_expires_at is 'Quando o convite direcionado atual expira.';
comment on column vagas.directed_until           is 'Quando a fase de oferta direcionada termina (vai para o mural).';

-- ---------------------------------------------------------------------
-- 3. OFERTAR A VAGA AO PRÓXIMO PROFISSIONAL ELEGÍVEL
-- ---------------------------------------------------------------------
create or replace function offer_vaga_to_next(p_vaga_id uuid, p_per_pro_seconds int)
returns uuid language plpgsql security definer as $$
declare
  v_vaga  vagas%rowtype;
  v_event events%rowtype;
  v_next  uuid;
begin
  select * into v_vaga  from vagas  where id = p_vaga_id;
  select * into v_event from events where id = v_vaga.event_id;

  -- próximo candidato: exerce a função, ATIVO, ainda não ofertado, sem conflito de agenda
  select p.id into v_next
  from professionals p
  join professional_functions pf on pf.professional_id = p.id
  where pf.function_id = v_vaga.function_id
    and p.status = 'ACTIVE'
    and not (p.id = any(coalesce(v_vaga.offered_pro_ids, '{}')))
    and check_professional_availability(p.id, v_event.starts_at, v_event.ends_at, v_event.location)
  order by p.stars desc, p.online_score desc nulls last, p.last_seen_at desc nulls last
  limit 1;

  if v_next is null then
    return null;
  end if;

  update vagas
  set professional_id          = v_next,
      worker_status            = 'INVITED',
      invited_at               = now(),
      current_offer_expires_at = now() + (p_per_pro_seconds || ' seconds')::interval,
      offered_pro_ids          = array_append(coalesce(offered_pro_ids, '{}'), v_next)
  where id = p_vaga_id;

  insert into notifications (user_id, title, body, channel, payload)
  select p.user_id,
    '🔔 Nova vaga para você!',
    'Você tem uma oferta de vaga. Aceite antes que expire!',
    'PUSH',
    jsonb_build_object('vaga_id', p_vaga_id, 'action', 'respond_invite')
  from professionals p where p.id = v_next;

  return v_next;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. INICIAR MATCHMAKING DAS VAGAS DE UM EVENTO
-- ---------------------------------------------------------------------
create or replace function start_event_matchmaking(p_event_id uuid)
returns void language plpgsql security definer as $$
declare
  v_per_pro   int;
  v_total_min int;
  v_vaga      record;
begin
  v_per_pro   := coalesce(get_system_var('directed_offer_seconds_per_pro'), 15);
  v_total_min := coalesce(get_system_var('directed_phase_total_minutes'), 3);

  -- coloca as vagas abertas do evento na fase direcionada
  update vagas
  set offer_phase   = 'DIRECTED',
      directed_until = now() + (v_total_min || ' minutes')::interval
  where event_id = p_event_id
    and status = 'OPEN'
    and professional_id is null;

  -- primeira oferta de cada vaga
  for v_vaga in
    select id from vagas
    where event_id = p_event_id and offer_phase = 'DIRECTED'
      and status = 'OPEN' and professional_id is null
  loop
    perform offer_vaga_to_next(v_vaga.id, v_per_pro);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. MOTOR DO MATCHMAKING (um "tick" — idempotente)
--    Avança convites expirados, passa ao próximo, ou cai na oferta aberta.
-- ---------------------------------------------------------------------
create or replace function process_matchmaking()
returns int language plpgsql security definer as $$
declare
  v_rec       record;
  v_per_pro   int;
  v_next      uuid;
  v_count     int := 0;
begin
  v_per_pro := coalesce(get_system_var('directed_offer_seconds_per_pro'), 15);

  for v_rec in
    select v.id, v.professional_id, v.worker_status, v.current_offer_expires_at, v.directed_until
    from vagas v
    join events e on e.id = v.event_id
    where v.offer_phase = 'DIRECTED'
      and v.status = 'OPEN'
      and coalesce(v.multiplier_type, 'NORMAL') <> 'EMERGENCY'
      and e.starts_at > now()
  loop
    -- fase direcionada terminou → oferta aberta (mural)
    if v_rec.directed_until is not null and now() >= v_rec.directed_until then
      update vagas set offer_phase = 'OPEN_POOL', status = 'OPEN',
        professional_id = null, worker_status = null, current_offer_expires_at = null
      where id = v_rec.id;
      v_count := v_count + 1;
      continue;
    end if;

    -- convite ativo ainda no prazo → aguarda
    if v_rec.professional_id is not null and v_rec.worker_status = 'INVITED'
       and v_rec.current_offer_expires_at is not null
       and now() < v_rec.current_offer_expires_at then
      continue;
    end if;

    -- convite expirou (ou não há convite) → oferta ao próximo
    v_next := offer_vaga_to_next(v_rec.id, v_per_pro);
    if v_next is null then
      -- sem mais candidatos → oferta aberta
      update vagas set offer_phase = 'OPEN_POOL', status = 'OPEN',
        professional_id = null, worker_status = null, current_offer_expires_at = null
      where id = v_rec.id;
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. RESPONDER CONVITE DIRECIONADO — recusa avança a fila imediatamente
-- ---------------------------------------------------------------------
create or replace function respond_to_vaga_invite(p_vaga_id uuid, p_accept boolean)
returns void language plpgsql security definer as $$
declare
  v_pro_id    uuid;
  v_vaga      vagas%rowtype;
  v_per_pro   int;
  v_next      uuid;
begin
  select p.id into v_pro_id from professionals p where p.user_id = auth_user_id();
  select * into v_vaga from vagas where id = p_vaga_id;

  if v_vaga.professional_id is distinct from v_pro_id then
    raise exception 'Convite não pertence a este profissional';
  end if;

  if p_accept then
    update vagas
    set worker_status = 'ACCEPTED', status = 'FILLED', responded_at = now(),
        current_offer_expires_at = null
    where id = p_vaga_id;
    return;
  end if;

  -- recusou: mantém o pro em offered_pro_ids (não reofertar) e avança a fila
  update vagas
  set professional_id = null, worker_status = null, responded_at = now(),
      current_offer_expires_at = null
  where id = p_vaga_id;

  -- se ainda na fase direcionada, oferta ao próximo; senão vai pro mural
  if v_vaga.offer_phase = 'DIRECTED'
     and (v_vaga.directed_until is null or now() < v_vaga.directed_until) then
    v_per_pro := coalesce(get_system_var('directed_offer_seconds_per_pro'), 15);
    v_next := offer_vaga_to_next(p_vaga_id, v_per_pro);
    if v_next is null then
      update vagas set offer_phase = 'OPEN_POOL', status = 'OPEN' where id = p_vaga_id;
    end if;
  else
    update vagas set offer_phase = 'OPEN_POOL', status = 'OPEN' where id = p_vaga_id;
  end if;
end;
$$;

drop trigger if exists touch_system_variables on system_variables;
create trigger touch_system_variables
  before update on system_variables
  for each row execute procedure touch_updated_at();
