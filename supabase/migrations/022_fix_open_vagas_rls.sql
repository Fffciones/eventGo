-- =============================================================
-- Migration 022 — Profissional vê eventos com vagas abertas
--
-- Problema: a policy de events não permitia profissionais
-- lerem eventos com vagas OPEN (professional_id IS NULL),
-- então o join events retornava null e o mural ficava vazio.
--
-- Solução: security definer function (bypassa RLS internamente)
-- + nova policy que a usa.
-- =============================================================

-- Função helper: verifica se existem vagas abertas para as
-- funções do profissional autenticado neste evento.
create or replace function event_has_open_vaga_for_professional(p_event_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from vagas v
    join professional_functions pf on pf.function_id = v.function_id
    join professionals p            on p.id           = pf.professional_id
    where v.event_id         = p_event_id
      and v.status           = 'OPEN'
      and v.professional_id  is null
      and p.user_id          = auth.uid()
  );
$$;

grant execute on function event_has_open_vaga_for_professional(uuid) to authenticated;

-- Nova policy: profissional vê eventos que têm vagas abertas para ele
drop policy if exists "events: profissional vê eventos com vagas abertas" on events;
create policy "events: profissional vê eventos com vagas abertas"
  on events for select using (
    event_has_open_vaga_for_professional(id)
  );
