-- =====================================================================
-- 018 - ETAPA 4: Fechamento, remuneração e cobrança (doc 2.3.5/2.3.6/2.3.7)
-- =====================================================================
-- - Chave PIX no cadastro do profissional
-- - "Finalizar contratação" → avaliação individual + pagamento ao pro
-- - Remuneração: valor BRUTO da remuneração-base (doc 3.3 — sem descontos
--   por ora; gateway/impostos na Etapa 7)
-- - Cobrança do contratante (placeholder; captura real na Etapa 7)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CAMPOS NOVOS
-- ---------------------------------------------------------------------
alter table professionals add column if not exists pix_key text;
alter table vagas         add column if not exists paid_at timestamptz;

-- avaliações passam a referenciar a vaga (booking_id vira legado/opcional)
alter table reviews alter column booking_id drop not null;
alter table reviews add column if not exists vaga_id uuid references vagas(id);
create unique index if not exists uq_reviews_vaga_reviewer
  on reviews(vaga_id, reviewer_id) where vaga_id is not null;

-- rastreabilidade da transação por vaga
alter table transactions add column if not exists vaga_id uuid references vagas(id);

-- ---------------------------------------------------------------------
-- 2. ESTRELAS — contar eventos concluídos pelo worker_status (não pelo
--    status da vaga, que só vira FINISHED após a finalização do contratante)
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
    and v.worker_status = 'CHECKED_OUT';

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

-- ---------------------------------------------------------------------
-- 3. FINALIZAR CONTRATAÇÃO + AVALIAR + PAGAR O PROFISSIONAL
--    Chamado pelo contratante, por vaga (doc 2.3.5/2.3.6).
-- ---------------------------------------------------------------------
create or replace function finalize_and_pay_vaga(
  p_vaga_id uuid,
  p_rating  numeric default null,
  p_comment text    default null
) returns void language plpgsql security definer as $$
declare
  v_vaga     vagas%rowtype;
  v_event    events%rowtype;
  v_client   clients%rowtype;
  v_pro      professionals%rowtype;
  v_amount   numeric;
  v_txn      uuid;
begin
  select * into v_vaga   from vagas   where id = p_vaga_id;
  select * into v_event  from events  where id = v_vaga.event_id;
  select * into v_client from clients where id = v_event.client_id;

  -- só o contratante do evento finaliza
  if v_client.user_id <> auth_user_id() then
    raise exception 'Acesso negado';
  end if;
  if v_vaga.worker_status <> 'CHECKED_OUT' then
    raise exception 'A vaga ainda não foi concluída pelo profissional';
  end if;
  if v_vaga.status = 'FINISHED' then
    return;  -- já finalizada
  end if;

  select * into v_pro from professionals where id = v_vaga.professional_id;
  v_amount := coalesce(v_vaga.base_pay, 0);

  -- Em finalização
  update vagas set status = 'CLOSING' where id = p_vaga_id;

  -- Avaliação individual (contratante → profissional)
  if p_rating is not null
     and not exists (select 1 from reviews where vaga_id = p_vaga_id and reviewer_id = v_client.user_id) then
    insert into reviews (vaga_id, reviewer_id, reviewee_id, rating, comment)
    values (p_vaga_id, v_client.user_id, v_pro.user_id, p_rating, nullif(p_comment, ''));
  end if;

  -- Pagamento ao profissional via PIX (valor bruto — placeholder pago)
  insert into transactions (vaga_id, from_user_id, to_user_id, type, amount, description)
  values (p_vaga_id, v_client.user_id, v_pro.user_id, 'BOOKING', v_amount,
          'Remuneração da vaga ' || p_vaga_id)
  returning id into v_txn;

  insert into pix_payments (transaction_id, pix_key, amount, status, paid_at)
  values (v_txn, coalesce(nullif(v_pro.pix_key, ''), 'SEM_CHAVE'), v_amount, 'PAID', now());

  -- Finalizada + paga
  update vagas set status = 'FINISHED', paid_at = now() where id = p_vaga_id;

  -- Recalcula estrelas (a avaliação entra na média)
  perform update_professional_stars(v_vaga.professional_id);

  -- Cobrança do contratante fica autorizada (captura na Etapa 7)
  update events set charge_status = 'AUTHORIZED'
  where id = v_event.id and charge_status = 'PENDING';
end;
$$;

-- ---------------------------------------------------------------------
-- 4. ADMIN MARCA COBRANÇA DO CONTRATANTE COMO EFETUADA (placeholder)
-- ---------------------------------------------------------------------
create or replace function mark_event_charged(p_event_id uuid)
returns void language plpgsql security definer as $$
declare v_event events%rowtype; v_client clients%rowtype;
begin
  if not is_admin() then raise exception 'Acesso negado'; end if;

  select * into v_event  from events  where id = p_event_id;
  select * into v_client from clients where id = v_event.client_id;

  update events set charge_status = 'CHARGED' where id = p_event_id;

  insert into transactions (from_user_id, to_user_id, type, amount, description)
  values (v_client.user_id, null, 'BOOKING', coalesce(v_event.estimated_total, 0),
          'Cobrança do evento ' || p_event_id);
end;
$$;
