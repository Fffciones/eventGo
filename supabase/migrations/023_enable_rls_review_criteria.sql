-- Corrige alerta crítico do Supabase: RLS desabilitado em review_criteria
alter table public.review_criteria enable row level security;

create policy "review_criteria_select_all"
  on public.review_criteria
  for select
  to anon, authenticated
  using (true);
