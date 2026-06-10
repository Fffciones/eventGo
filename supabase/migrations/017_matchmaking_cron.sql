-- =====================================================================
-- 017 - ETAPA 3 (infra): agendar o motor de matchmaking via pg_cron
-- =====================================================================
-- Roda process_matchmaking() no servidor a cada 10s, sem depender de
-- nenhum app de profissional aberto.
--
-- Pré-requisito: extensão pg_cron habilitada. No Supabase, se o
-- `create extension` abaixo falhar, habilite em
--   Dashboard → Database → Extensions → pg_cron
-- e rode novamente a partir do agendamento.
-- =====================================================================

create extension if not exists pg_cron;

-- remove agendamento anterior (se existir) para poder reexecutar sem erro
do $$
begin
  perform cron.unschedule('matchmaking-tick');
exception when others then null;
end $$;

-- tick a cada 10 segundos
select cron.schedule('matchmaking-tick', '10 seconds', $$select process_matchmaking();$$);
