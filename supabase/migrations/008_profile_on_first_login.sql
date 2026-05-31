-- =====================================================================
-- 008 - CRIAR PERFIL NO PRIMEIRO LOGIN (confirmação de e-mail ativa)
-- =====================================================================

-- Guarda dados extras do signup em user_metadata até o e-mail ser confirmado
-- Ao confirmar e fazer login, o perfil é criado automaticamente

create or replace function handle_user_login()
returns trigger language plpgsql security definer as $$
declare
  v_user_type text;
  v_document  text;
  v_mei       text;
  v_category  text;
begin
  v_user_type := new.raw_user_meta_data->>'user_type';
  v_document  := new.raw_user_meta_data->>'document';
  v_mei       := new.raw_user_meta_data->>'mei_number';
  v_category  := new.raw_user_meta_data->>'category';

  if v_user_type = 'CLIENT' and v_document is not null then
    insert into public.clients (user_id, document, is_company, credit_balance, credit_limit)
    values (
      new.id,
      v_document,
      length(regexp_replace(v_document, '\D', '', 'g')) > 11,
      0, 0
    )
    on conflict (user_id) do nothing;

  elsif v_user_type = 'PROFESSIONAL' and v_mei is not null then
    insert into public.professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache)
    values (
      new.id,
      v_mei,
      v_category::professional_category,
      'PENDING', 0, 0, 0
    )
    on conflict (user_id) do nothing;

    -- Bônus de boas-vindas
    insert into public.transactions (from_user_id, to_user_id, type, amount, description)
    values (null, new.id, 'SIGNUP_BONUS', 5.00, 'Bônus de cadastro — aguardando documentação')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- Dispara no update do auth.users (quando e-mail é confirmado / login ocorre)
drop trigger if exists on_user_login on auth.users;
create trigger on_user_login
  after update on auth.users
  for each row
  when (
    old.email_confirmed_at is null
    and new.email_confirmed_at is not null
  )
  execute procedure handle_user_login();
