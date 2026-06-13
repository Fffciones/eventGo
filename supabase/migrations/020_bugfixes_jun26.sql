-- =============================================================
-- Migration 020 — Bug fixes (jun/2026)
-- 1. vagas.category: professional_category enum → text
--    (slug de funções novas como "LIMPEZA" não estavam no enum)
-- 2. RLS events: profissional pode ver eventos via vagas
-- 3. RPC accept_open_vaga: aceita qualquer vaga disponível do
--    grupo event+function (evita race condition)
-- =============================================================

-- ── 1. Mudar tipo de vagas.category para text ─────────────────
alter table vagas
  alter column category type text;

-- ── 2. RLS — profissional vê eventos onde tem vaga ────────────
drop policy if exists "events: profissional vê eventos via vagas" on events;
create policy "events: profissional vê eventos via vagas"
  on events for select using (
    exists (
      select 1
      from vagas v
      join professionals p on p.id = v.professional_id
      where v.event_id = events.id
        and p.user_id = auth_user_id()
    )
  );

-- ── 3. RPC accept_open_vaga ───────────────────────────────────
-- Aceita a primeira vaga OPEN disponível para (event_id, function_id).
-- Usa FOR UPDATE SKIP LOCKED para evitar race condition.
create or replace function accept_open_vaga(
  p_event_id    uuid,
  p_function_id uuid
)
returns uuid   -- retorna o vaga_id aceito, ou null se não havia vaga
language plpgsql security definer
as $$
declare
  v_professional_id  uuid;
  v_vaga_id          uuid;
  v_conflict         boolean;
  v_starts_at        timestamptz;
  v_ends_at          timestamptz;
begin
  -- Resolver professional_id do usuário autenticado
  select id into v_professional_id
    from professionals
   where user_id = auth.uid();

  if v_professional_id is null then
    raise exception 'Profissional não encontrado';
  end if;

  -- Datas do evento (para checar conflito de agenda)
  select starts_at, ends_at
    into v_starts_at, v_ends_at
    from events
   where id = p_event_id;

  -- Checar conflito de horário com outras vagas do profissional
  select exists(
    select 1 from vagas v2
     where v2.professional_id = v_professional_id
       and v2.worker_status in ('ACCEPTED','IN_TRANSIT','CHECKED_IN')
       and v2.event_id <> p_event_id
       and (
         select e2.starts_at < v_ends_at and e2.ends_at > v_starts_at
           from events e2 where e2.id = v2.event_id
       )
  ) into v_conflict;

  if v_conflict then
    raise exception 'Conflito de horário com outro evento';
  end if;

  -- Pegar a primeira vaga disponível (FOR UPDATE SKIP LOCKED evita duplo-aceite)
  select id into v_vaga_id
    from vagas
   where event_id    = p_event_id
     and function_id = p_function_id
     and status      = 'OPEN'
     and professional_id is null
   order by created_at
   limit 1
   for update skip locked;

  if v_vaga_id is null then
    return null;  -- sem vagas disponíveis
  end if;

  -- Alocar o profissional na vaga
  update vagas
     set professional_id = v_professional_id,
         worker_status   = 'ACCEPTED',
         status          = 'FILLED',
         responded_at    = now()
   where id = v_vaga_id;

  return v_vaga_id;
end;
$$;

-- Permissão pública (autenticação via security definer)
grant execute on function accept_open_vaga(uuid, uuid) to authenticated;
