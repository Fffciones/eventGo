-- =====================================================================
-- 004 - RASTREIO DE DESLOCAMENTO E ALERTA PRÉ-EVENTO
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CAMPOS EXTRAS EM BOOKING_PROFESSIONALS
--    gps_active     → profissional ativou o GPS manualmente
--    transit_requested_at → momento em que o cliente solicitou ativação
--    alert_60_sent   → alerta de 60 min antes já foi disparado
-- ---------------------------------------------------------------------
alter table booking_professionals
  add column gps_active            boolean default false,
  add column transit_requested_at  timestamptz,
  add column alert_60_sent         boolean default false;

-- ---------------------------------------------------------------------
-- 2. ATUALIZAR RLS DE PROFESSIONAL_LOCATIONS
--    Rastreio visível ao cliente SOMENTE quando gps_active = true
-- ---------------------------------------------------------------------
drop policy if exists "locations: cliente rastreia contratado" on professional_locations;

create policy "locations: cliente rastreia contratado"
  on professional_locations for select using (
    exists (
      select 1 from booking_professionals bp
      join bookings b on b.id = bp.booking_id
      join events e on e.id = b.event_id
      join clients c on c.id = e.client_id
      where bp.professional_id = professional_locations.professional_id
        and c.user_id = auth_user_id()
        and bp.status = 'IN_TRANSIT'
        and bp.gps_active = true
    )
  );

-- ---------------------------------------------------------------------
-- 3. PROFISSIONAL ATIVA "EM DESLOCAMENTO"
--    Chamado quando o profissional clica no botão no app
-- ---------------------------------------------------------------------
create or replace function activate_transit(p_booking_professional_id uuid)
returns void language plpgsql security definer as $$
declare
  v_bp      booking_professionals%rowtype;
  v_booking bookings%rowtype;
  v_event   events%rowtype;
  v_client_user_id uuid;
begin
  select * into v_bp from booking_professionals where id = p_booking_professional_id;

  -- Só o próprio profissional pode ativar
  if not exists (
    select 1 from professionals p
    where p.id = v_bp.professional_id and p.user_id = auth_user_id()
  ) then
    raise exception 'Acesso negado';
  end if;

  -- Atualizar status e ativar GPS
  update booking_professionals
  set
    status     = 'IN_TRANSIT',
    gps_active = true
  where id = p_booking_professional_id;

  -- Buscar info do evento para notificar cliente
  select * into v_booking from bookings where id = v_bp.booking_id;
  select * into v_event   from events   where id = v_booking.event_id;

  select c.user_id into v_client_user_id
  from clients c where c.id = v_event.client_id;

  -- Notificar cliente que o profissional está a caminho
  insert into notifications (user_id, title, body, channel, payload)
  values (
    v_client_user_id,
    'Profissional em deslocamento',
    'Um profissional do seu evento acabou de iniciar o deslocamento.',
    'PUSH',
    jsonb_build_object(
      'booking_professional_id', p_booking_professional_id,
      'booking_id', v_bp.booking_id,
      'event_id', v_booking.event_id
    )
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 4. CLIENTE SOLICITA ATIVAÇÃO DO GPS
--    Envia notificação ao profissional pedindo que marque deslocamento
-- ---------------------------------------------------------------------
create or replace function request_transit_activation(p_booking_professional_id uuid)
returns void language plpgsql security definer as $$
declare
  v_bp             booking_professionals%rowtype;
  v_booking        bookings%rowtype;
  v_event          events%rowtype;
  v_pro_user_id    uuid;
  v_client_user_id uuid;
begin
  select * into v_bp      from booking_professionals where id = p_booking_professional_id;
  select * into v_booking from bookings              where id = v_bp.booking_id;
  select * into v_event   from events                where id = v_booking.event_id;

  -- Só o cliente do evento pode solicitar
  if not exists (
    select 1 from clients c
    where c.id = v_event.client_id and c.user_id = auth_user_id()
  ) then
    raise exception 'Acesso negado';
  end if;

  -- Registrar momento da solicitação
  update booking_professionals
  set transit_requested_at = now()
  where id = p_booking_professional_id;

  -- Buscar usuário do profissional
  select p.user_id into v_pro_user_id
  from professionals p where p.id = v_bp.professional_id;

  -- Notificar profissional via PUSH
  insert into notifications (user_id, title, body, channel, payload)
  values (
    v_pro_user_id,
    'O cliente está aguardando você',
    'Por favor, confirme que está em deslocamento para o evento.',
    'PUSH',
    jsonb_build_object(
      'booking_professional_id', p_booking_professional_id,
      'action', 'activate_transit'
    )
  );

  -- Notificar também via WhatsApp se optou
  if exists (select 1 from users where id = v_pro_user_id and whatsapp_opt_in = true) then
    insert into notifications (user_id, title, body, channel, payload)
    values (
      v_pro_user_id,
      'EventPro: Confirme seu deslocamento',
      'O cliente do seu próximo evento está aguardando confirmação de que você está a caminho.',
      'WHATSAPP',
      jsonb_build_object(
        'booking_professional_id', p_booking_professional_id,
        'action', 'activate_transit'
      )
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. VERIFICAR ALERTAS DE 60 MINUTOS
--    Chamado periodicamente (cron/edge function a cada 5 min)
--    Para cada profissional que NÃO marcou deslocamento e faltam <= 60min
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
    select
      bp.id               as bp_id,
      bp.professional_id,
      b.id                as booking_id,
      e.id                as event_id,
      e.client_id,
      e.starts_at
    from booking_professionals bp
    join bookings b on b.id = bp.booking_id
    join events e   on e.id  = b.event_id
    where bp.status = 'ACCEPTED'
      and bp.gps_active = false
      and bp.alert_60_sent = false
      and e.starts_at between now() and now() + interval '60 minutes'
  loop
    -- Buscar usuários
    select p.user_id into v_pro_user_id
    from professionals p where p.id = v_rec.professional_id;

    select c.user_id into v_client_user_id
    from clients c where c.id = v_rec.client_id;

    -- Notificar profissional
    insert into notifications (user_id, title, body, channel, payload)
    values (
      v_pro_user_id,
      '⏰ Seu evento começa em 60 minutos!',
      'Por favor, confirme que está em deslocamento. Caso não responda, o sistema poderá acionar um substituto.',
      'PUSH',
      jsonb_build_object(
        'booking_professional_id', v_rec.bp_id,
        'event_id', v_rec.event_id,
        'action', 'activate_transit',
        'deadline_minutes', 60
      )
    );

    -- WhatsApp se habilitado
    if exists (select 1 from users where id = v_pro_user_id and whatsapp_opt_in = true) then
      insert into notifications (user_id, title, body, channel, payload)
      values (
        v_pro_user_id,
        'EventPro: Seu evento em 60 minutos',
        'Confirme agora que está a caminho ou o contrato poderá ser repassado.',
        'WHATSAPP',
        jsonb_build_object(
          'booking_professional_id', v_rec.bp_id,
          'action', 'activate_transit'
        )
      );
    end if;

    -- Notificar cliente que o profissional ainda não confirmou deslocamento
    insert into notifications (user_id, title, body, channel, payload)
    values (
      v_client_user_id,
      'Atenção: profissional ainda não confirmou deslocamento',
      'Faltam 60 minutos para seu evento e um profissional ainda não confirmou que está a caminho.',
      'PUSH',
      jsonb_build_object(
        'booking_professional_id', v_rec.bp_id,
        'event_id', v_rec.event_id,
        'action', 'request_transit_or_emergency'
      )
    );

    -- Marcar alerta como enviado
    update booking_professionals
    set alert_60_sent = true
    where id = v_rec.bp_id;

    v_alerts_sent := v_alerts_sent + 1;
  end loop;

  return v_alerts_sent;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. ACIONAR EMERGÊNCIA POR FALTA DE RESPOSTA
--    Chamado pelo cliente ou automaticamente após o alerta de 60 min
--    sem resposta. Reutiliza handle_no_show mas com contexto de prazo.
-- ---------------------------------------------------------------------
create or replace function trigger_emergency_replacement(p_booking_professional_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_bp          booking_professionals%rowtype;
  v_event       events%rowtype;
  v_booking     bookings%rowtype;
begin
  select * into v_bp      from booking_professionals where id = p_booking_professional_id;
  select * into v_booking from bookings              where id = v_bp.booking_id;
  select * into v_event   from events                where id = v_booking.event_id;

  -- Só permite acionar se o alerta de 60 min foi enviado e ainda sem GPS
  if v_bp.alert_60_sent = false then
    raise exception 'Alerta de 60 minutos ainda não foi enviado para este profissional';
  end if;

  if v_bp.gps_active = true then
    raise exception 'Profissional já está em deslocamento';
  end if;

  -- Delega para handle_no_show que já faz tudo
  return handle_no_show(p_booking_professional_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 7. PROFISSIONAL DESATIVA GPS AO CHEGAR (CHECK-IN)
-- ---------------------------------------------------------------------
create or replace function professional_checkin(p_booking_professional_id uuid)
returns void language plpgsql security definer as $$
declare
  v_bp             booking_professionals%rowtype;
  v_booking        bookings%rowtype;
  v_event          events%rowtype;
  v_client_user_id uuid;
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

  update booking_professionals
  set
    status     = 'CHECKED_IN',
    gps_active = false,       -- desliga rastreio ao chegar
    checkin_at = now()
  where id = p_booking_professional_id;

  -- Notificar cliente
  select c.user_id into v_client_user_id
  from clients c where c.id = v_event.client_id;

  insert into notifications (user_id, title, body, channel, payload)
  values (
    v_client_user_id,
    'Profissional chegou!',
    'Um profissional acabou de fazer check-in no seu evento.',
    'PUSH',
    jsonb_build_object(
      'booking_professional_id', p_booking_professional_id,
      'event_id', v_booking.event_id
    )
  );
end;
$$;
