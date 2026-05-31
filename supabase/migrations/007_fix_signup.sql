-- =====================================================================
-- 007 - CORRIGIR FLUXO DE CADASTRO
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. POLÍTICAS DE INSERT QUE FALTAVAM
-- ---------------------------------------------------------------------
create policy "clients: inserir próprio perfil"
  on clients for insert with check (user_id = auth.uid());

create policy "professionals: inserir próprio perfil"
  on professionals for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. FUNÇÃO SEGURA PARA CRIAR PERFIL PÓS-CADASTRO
--    Chamada pelo frontend logo após auth.signUp()
--    security definer garante execução mesmo com RLS
-- ---------------------------------------------------------------------
create or replace function create_client_profile(
  p_document   text,
  p_is_company boolean default false
) returns void language plpgsql security definer as $$
begin
  insert into clients (user_id, document, is_company, credit_balance, credit_limit)
  values (auth.uid(), p_document, p_is_company, 0, 0)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function create_professional_profile(
  p_mei_number text,
  p_category   professional_category
) returns void language plpgsql security definer as $$
begin
  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache)
  values (auth.uid(), p_mei_number, p_category, 'PENDING', 0, 0, 0)
  on conflict (user_id) do nothing;

  -- Bônus de boas-vindas R$5 via transação pendente
  insert into transactions (from_user_id, to_user_id, type, amount, description)
  values (null, auth.uid(), 'SIGNUP_BONUS', 5.00, 'Bônus de cadastro - aguardando envio de documentação');
end;
$$;
