-- =============================================================
-- Migration 021 — Fix recursão infinita na policy de events
--
-- Problema: a policy criada na 020 consultava vagas dentro de
-- events. A policy de vagas (contratante) consulta events de
-- volta → loop infinito.
--
-- Solução: função security definer que bypassa RLS ao verificar
-- se o profissional autenticado tem uma vaga para o evento.
-- =============================================================

-- 1. Função helper (security definer — bypassa RLS internamente)
create or replace function professional_has_vaga_for_event(p_event_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from vagas v
    join professionals p on p.id = v.professional_id
    where v.event_id = p_event_id
      and p.user_id  = auth.uid()
  );
$$;

grant execute on function professional_has_vaga_for_event(uuid) to authenticated;

-- 2. Recriar a policy de events para profissionais usando a função
drop policy if exists "events: profissional vê eventos via vagas" on events;
create policy "events: profissional vê eventos via vagas"
  on events for select using (
    professional_has_vaga_for_event(id)
  );
