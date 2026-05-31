-- =====================================================================
-- 006 - SEED: Preços base + Profissionais fictícios para testes
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABELA DE PREÇOS BASE (por categoria, nível 0)
-- ---------------------------------------------------------------------
insert into price_table (category, star_level, price_8h) values
  ('GARCOM',             0, 280.00),
  ('GARCOM',             1, 308.00),
  ('GARCOM',             2, 336.00),
  ('GARCOM',             3, 378.00),
  ('GARCOM',             4, 420.00),
  ('GARCOM',             5, 490.00),
  ('DJ',                 0, 800.00),
  ('DJ',                 1, 880.00),
  ('DJ',                 2, 960.00),
  ('DJ',                 3, 1080.00),
  ('DJ',                 4, 1200.00),
  ('DJ',                 5, 1400.00),
  ('SEGURANCA',          0, 320.00),
  ('SEGURANCA',          1, 352.00),
  ('SEGURANCA',          2, 384.00),
  ('SEGURANCA',          3, 432.00),
  ('SEGURANCA',          4, 480.00),
  ('SEGURANCA',          5, 560.00),
  ('FAXINEIRO',          0, 200.00),
  ('FAXINEIRO',          1, 220.00),
  ('FAXINEIRO',          2, 240.00),
  ('FAXINEIRO',          3, 270.00),
  ('FAXINEIRO',          4, 300.00),
  ('FAXINEIRO',          5, 350.00),
  ('FOTOGRAFO',          0, 1200.00),
  ('FOTOGRAFO',          1, 1320.00),
  ('FOTOGRAFO',          2, 1440.00),
  ('FOTOGRAFO',          3, 1620.00),
  ('FOTOGRAFO',          4, 1800.00),
  ('FOTOGRAFO',          5, 2100.00),
  ('MESTRE_CERIMONIAS',  0, 600.00),
  ('MESTRE_CERIMONIAS',  1, 660.00),
  ('MESTRE_CERIMONIAS',  2, 720.00),
  ('MESTRE_CERIMONIAS',  3, 810.00),
  ('MESTRE_CERIMONIAS',  4, 900.00),
  ('MESTRE_CERIMONIAS',  5, 1050.00),
  ('PRODUTOR',           0, 1500.00),
  ('PRODUTOR',           1, 1650.00),
  ('PRODUTOR',           2, 1800.00),
  ('PRODUTOR',           3, 2025.00),
  ('PRODUTOR',           4, 2250.00),
  ('PRODUTOR',           5, 2625.00),
  ('CONTROLADOR_ACESSO', 0, 240.00),
  ('CONTROLADOR_ACESSO', 1, 264.00),
  ('CONTROLADOR_ACESSO', 2, 288.00),
  ('CONTROLADOR_ACESSO', 3, 324.00),
  ('CONTROLADOR_ACESSO', 4, 360.00),
  ('CONTROLADOR_ACESSO', 5, 420.00);

-- ---------------------------------------------------------------------
-- PROFISSIONAIS FICTÍCIOS
-- Usamos auth.users bypass via insert direto (ambiente de teste)
-- ---------------------------------------------------------------------
do $$
declare
  -- IDs fixos para facilitar referência em testes
  u1  uuid := 'a0000001-0000-0000-0000-000000000001';
  u2  uuid := 'a0000001-0000-0000-0000-000000000002';
  u3  uuid := 'a0000001-0000-0000-0000-000000000003';
  u4  uuid := 'a0000001-0000-0000-0000-000000000004';
  u5  uuid := 'a0000001-0000-0000-0000-000000000005';
  u6  uuid := 'a0000001-0000-0000-0000-000000000006';
  u7  uuid := 'a0000001-0000-0000-0000-000000000007';
  u8  uuid := 'a0000001-0000-0000-0000-000000000008';
  u9  uuid := 'a0000001-0000-0000-0000-000000000009';
  u10 uuid := 'a0000001-0000-0000-0000-000000000010';
begin

  -- USERS
  insert into users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (u1,  'ricardo.mendes@teste.com',   '(11) 98001-0001', 'Ricardo Mendes',       'PROFESSIONAL', true),
    (u2,  'ana.lima@teste.com',         '(11) 98001-0002', 'Ana Lima',             'PROFESSIONAL', true),
    (u3,  'dj.marcos@teste.com',        '(11) 98001-0003', 'Marcos DJ Silva',      'PROFESSIONAL', false),
    (u4,  'carla.fotografia@teste.com', '(11) 98001-0004', 'Carla Souza',          'PROFESSIONAL', true),
    (u5,  'joao.seguranca@teste.com',   '(11) 98001-0005', 'João Carlos',          'PROFESSIONAL', false),
    (u6,  'patricia.mc@teste.com',      '(11) 98001-0006', 'Patrícia Rocha',       'PROFESSIONAL', true),
    (u7,  'bruno.limpeza@teste.com',    '(11) 98001-0007', 'Bruno Oliveira',       'PROFESSIONAL', false),
    (u8,  'fernanda.garcom@teste.com',  '(11) 98001-0008', 'Fernanda Costa',       'PROFESSIONAL', true),
    (u9,  'diego.acesso@teste.com',     '(11) 98001-0009', 'Diego Ferreira',       'PROFESSIONAL', false),
    (u10, 'lucia.produtor@teste.com',   '(11) 98001-0010', 'Lúcia Albuquerque',    'PROFESSIONAL', true)
  on conflict (id) do nothing;

  -- PROFESSIONALS
  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio) values
    (u1,  '12.345.678/0001-01', 'GARCOM',             'ACTIVE', 4, 142, 420.00,  'Garçom especialista em eventos de luxo. Bilíngue PT/EN. Barman certificado.'),
    (u2,  '12.345.678/0001-02', 'GARCOM',             'ACTIVE', 3, 67,  378.00,  'Buffet gourmet e finger food. Experiência em casamentos e eventos corporativos.'),
    (u3,  '12.345.678/0001-03', 'DJ',                 'ACTIVE', 5, 210, 1400.00, 'DJ com 10 anos de experiência. Especialista em eventos corporativos e casamentos.'),
    (u4,  '12.345.678/0001-04', 'FOTOGRAFO',          'ACTIVE', 5, 198, 2100.00, 'Fotografia de moda e eventos. Edição avançada. Entrega em 48h.'),
    (u5,  '12.345.678/0001-05', 'SEGURANCA',          'ACTIVE', 2, 34,  384.00,  'Vigilante patrimonial. Primeiros socorros. Experiência em festas e shows.'),
    (u6,  '12.345.678/0001-06', 'MESTRE_CERIMONIAS',  'ACTIVE', 4, 89,  900.00,  'Mestre de cerimônias bilíngue. Especialista em casamentos e formaturas.'),
    (u7,  '12.345.678/0001-07', 'FAXINEIRO',          'ACTIVE', 1, 12,  220.00,  'Limpeza pós-evento rápida e eficiente. Equipe própria disponível.'),
    (u8,  '12.345.678/0001-08', 'GARCOM',             'ACTIVE', 3, 55,  378.00,  'Garçonete com experiência em coquetel e buffet executivo.'),
    (u9,  '12.345.678/0001-09', 'CONTROLADOR_ACESSO', 'ACTIVE', 2, 28,  288.00,  'Controle de acesso com leitor de QR. Experiência em shows e feiras.'),
    (u10, '12.345.678/0001-10', 'PRODUTOR',           'ACTIVE', 5, 320, 2625.00, 'Produtora executiva com 15 anos. Gerenciamento completo de eventos até 5.000 pessoas.')
  on conflict (user_id) do nothing;

  -- LOCALIZAÇÕES INICIAIS (região de São Paulo)
  insert into professional_locations (professional_id, location, recorded_at)
  select p.id,
    ST_GeogFromText(pos.wkt),
    now()
  from professionals p
  join users u on u.id = p.user_id
  join (values
    ('a0000001-0000-0000-0000-000000000001'::uuid, 'POINT(-46.6388 -23.5489)'),
    ('a0000001-0000-0000-0000-000000000002'::uuid, 'POINT(-46.6560 -23.5612)'),
    ('a0000001-0000-0000-0000-000000000003'::uuid, 'POINT(-46.6623 -23.5543)'),
    ('a0000001-0000-0000-0000-000000000004'::uuid, 'POINT(-46.6300 -23.5700)'),
    ('a0000001-0000-0000-0000-000000000005'::uuid, 'POINT(-46.6478 -23.5671)'),
    ('a0000001-0000-0000-0000-000000000006'::uuid, 'POINT(-46.6200 -23.5400)'),
    ('a0000001-0000-0000-0000-000000000007'::uuid, 'POINT(-46.6700 -23.5800)'),
    ('a0000001-0000-0000-0000-000000000008'::uuid, 'POINT(-46.6450 -23.5550)'),
    ('a0000001-0000-0000-0000-000000000009'::uuid, 'POINT(-46.6350 -23.5620)'),
    ('a0000001-0000-0000-0000-000000000010'::uuid, 'POINT(-46.6580 -23.5480)')
  ) as pos(uid, wkt) on u.id = pos.uid;

  -- DISPONIBILIDADE (próximos 30 dias, fins de semana livres)
  insert into professional_availability (professional_id, starts_at, ends_at, is_available)
  select
    p.id,
    date_trunc('day', gs) + interval '8 hours',
    date_trunc('day', gs) + interval '23 hours',
    true
  from professionals p
  cross join generate_series(
    now()::date,
    (now() + interval '30 days')::date,
    interval '1 day'
  ) as gs
  where extract(dow from gs) in (5, 6, 0);  -- sex, sab, dom

end $$;

-- ---------------------------------------------------------------------
-- CLIENTE DE TESTE
-- ---------------------------------------------------------------------
do $$
declare
  uc uuid := 'b0000001-0000-0000-0000-000000000001';
begin
  insert into users (id, email, phone, full_name, user_type) values
    (uc, 'cliente.teste@eventpro.com', '(11) 97000-0001', 'Rodrigo Silva', 'CLIENT')
  on conflict (id) do nothing;

  insert into clients (user_id, document, is_company, credit_balance, credit_limit) values
    (uc, '123.456.789-00', false, 5000.00, 10000.00)
  on conflict (user_id) do nothing;
end $$;
