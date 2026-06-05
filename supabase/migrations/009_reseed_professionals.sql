-- =====================================================================
-- 009 - RESEED: 5 profissionais por categoria (40 total)
-- =====================================================================

-- Limpar dados anteriores
delete from professional_availability where professional_id in (
  select id from professionals
);
delete from professional_locations where professional_id in (
  select id from professionals
);
delete from client_favorites;
delete from booking_professionals;
delete from bookings;
delete from professionals;
delete from public.users where user_type = 'PROFESSIONAL';
delete from auth.identities where provider = 'email' and provider_id like '%pro%teste%';
delete from auth.users where email like '%pro%teste%';

-- =====================================================================
-- GARÇONS
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'ricardo.mendes@pro.teste',   '(11) 91001-0001', 'Ricardo Mendes',    'PROFESSIONAL', true),
    (ids[2], 'fernanda.costa@pro.teste',   '(11) 91001-0002', 'Fernanda Costa',    'PROFESSIONAL', true),
    (ids[3], 'marcos.aurelio@pro.teste',   '(11) 91001-0003', 'Marcos Aurélio',    'PROFESSIONAL', false),
    (ids[4], 'ana.julia@pro.teste',        '(11) 91001-0004', 'Ana Júlia Ferreira','PROFESSIONAL', true),
    (ids[5], 'pedro.henrique@pro.teste',   '(11) 91001-0005', 'Pedro Henrique',    'PROFESSIONAL', false);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '11.111.111/0001-01', 'GARCOM', 'ACTIVE', 4, 142, 420.00, 'Garçom especialista em eventos de luxo. Barman certificado, bilíngue PT/EN.', 'Vila Madalena, São Paulo', ST_GeogFromText('POINT(-46.6904 -23.5505)'), 15, true),
    (ids[2], '11.111.111/0001-02', 'GARCOM', 'ACTIVE', 3,  67, 378.00, 'Buffet gourmet e finger food. Experiência em casamentos e eventos corporativos.', 'Pinheiros, São Paulo', ST_GeogFromText('POINT(-46.6826 -23.5641)'), 10, true),
    (ids[3], '11.111.111/0001-03', 'GARCOM', 'ACTIVE', 5, 215, 490.00, 'Sommelier júnior, 10 anos de experiência. Especialista em casamentos de alto padrão.', 'Moema, São Paulo', ST_GeogFromText('POINT(-46.6642 -23.6014)'), 20, false),
    (ids[4], '11.111.111/0001-04', 'GARCOM', 'ACTIVE', 2,  28, 336.00, 'Garçonete com foco em eventos corporativos e coquetéis executivos.', 'Tatuapé, São Paulo', ST_GeogFromText('POINT(-46.5741 -23.5441)'), 10, true),
    (ids[5], '11.111.111/0001-05', 'GARCOM', 'ACTIVE', 1,  11, 308.00, 'Recém formado em hotelaria, dedicado e pontual.', 'Santo André, SP', ST_GeogFromText('POINT(-46.5329 -23.6639)'), 15, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('ricardo.mendes@pro.teste',   'POINT(-46.6850 -23.5490)'),
    ('fernanda.costa@pro.teste',   'POINT(-46.6780 -23.5600)'),
    ('marcos.aurelio@pro.teste',   'POINT(-46.6600 -23.5980)'),
    ('ana.julia@pro.teste',        'POINT(-46.5700 -23.5400)'),
    ('pedro.henrique@pro.teste',   'POINT(-46.5400 -23.6600)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- DJs
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'dj.carlos@pro.teste',     '(11) 92001-0001', 'DJ Carlos Silva',    'PROFESSIONAL', true),
    (ids[2], 'dj.patrícia@pro.teste',   '(11) 92001-0002', 'DJ Patrícia Rocha',  'PROFESSIONAL', true),
    (ids[3], 'dj.thiago@pro.teste',     '(11) 92001-0003', 'DJ Thiago Mix',      'PROFESSIONAL', true),
    (ids[4], 'dj.amanda@pro.teste',     '(11) 92001-0004', 'Amanda DJ',          'PROFESSIONAL', false),
    (ids[5], 'dj.rodrigo@pro.teste',    '(11) 92001-0005', 'Rodrigo Beats',      'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '22.222.222/0001-01', 'DJ', 'ACTIVE', 5, 210, 1400.00, 'DJ com 10 anos de experiência. Especialista em casamentos e eventos corporativos. Pioneer Nexus 2.', 'Consolação, São Paulo', ST_GeogFromText('POINT(-46.6563 -23.5505)'), 25, true),
    (ids[2], '22.222.222/0001-02', 'DJ', 'ACTIVE', 4,  98, 1200.00, 'DJ e produtora musical. Especialidade: festas temáticas e formaturas.', 'Perdizes, São Paulo', ST_GeogFromText('POINT(-46.6700 -23.5380)'), 20, true),
    (ids[3], '22.222.222/0001-03', 'DJ', 'ACTIVE', 3,  55, 1080.00, 'Equipamento próprio completo. Open format: eletrônico, pagode, sertanejo.', 'Santana, São Paulo', ST_GeogFromText('POINT(-46.6280 -23.4980)'), 20, false),
    (ids[4], '22.222.222/0001-04', 'DJ', 'ACTIVE', 2,  22,  960.00, 'Especialista em eventos infantis e festas de aniversário.', 'Osasco, SP', ST_GeogFromText('POINT(-46.7919 -23.5329)'), 15, true),
    (ids[5], '22.222.222/0001-05', 'DJ', 'ACTIVE', 1,  10,  880.00, 'Iniciando na carreira, preços acessíveis e alta dedicação.', 'Guarulhos, SP', ST_GeogFromText('POINT(-46.5333 -23.4549)'), 20, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('dj.carlos@pro.teste',     'POINT(-46.6520 -23.5480)'),
    ('dj.patrícia@pro.teste',   'POINT(-46.6650 -23.5350)'),
    ('dj.thiago@pro.teste',     'POINT(-46.6250 -23.4950)'),
    ('dj.amanda@pro.teste',     'POINT(-46.7880 -23.5300)'),
    ('dj.rodrigo@pro.teste',    'POINT(-46.5300 -23.4520)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- SEGURANÇAS
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'joao.seguranca@pro.teste',    '(11) 93001-0001', 'João Carlos Lima',     'PROFESSIONAL', false),
    (ids[2], 'wellington.silva@pro.teste',  '(11) 93001-0002', 'Wellington Silva',     'PROFESSIONAL', true),
    (ids[3], 'claudia.seg@pro.teste',       '(11) 93001-0003', 'Claudia Segurança',    'PROFESSIONAL', true),
    (ids[4], 'roberto.guarda@pro.teste',    '(11) 93001-0004', 'Roberto Guarda',       'PROFESSIONAL', false),
    (ids[5], 'fabio.vigilante@pro.teste',   '(11) 93001-0005', 'Fábio Vigilante',      'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '33.333.333/0001-01', 'SEGURANCA', 'ACTIVE', 2,  34, 384.00, 'Vigilante patrimonial certificado. Primeiros socorros. Experiência em festas e shows.', 'Ipiranga, São Paulo', ST_GeogFromText('POINT(-46.6078 -23.5900)'), 15, false),
    (ids[2], '33.333.333/0001-02', 'SEGURANCA', 'ACTIVE', 4,  89, 480.00, 'Ex-militar. Especialista em controle de acesso e eventos de grande porte.', 'Santo Amaro, São Paulo', ST_GeogFromText('POINT(-46.7100 -23.6500)'), 20, true),
    (ids[3], '33.333.333/0001-03', 'SEGURANCA', 'ACTIVE', 3,  51, 432.00, 'Segurança feminina para eventos sociais e corporativos.', 'Itaim Bibi, São Paulo', ST_GeogFromText('POINT(-46.6836 -23.5858)'), 15, true),
    (ids[4], '33.333.333/0001-04', 'SEGURANCA', 'ACTIVE', 1,   8, 352.00, 'Vigilante credenciado, disponível para eventos noturnos.', 'ABC Paulista, SP', ST_GeogFromText('POINT(-46.5200 -23.7000)'), 20, true),
    (ids[5], '33.333.333/0001-05', 'SEGURANCA', 'ACTIVE', 5, 203, 560.00, 'Chefe de segurança com equipe própria. Referência em eventos VIP.', 'Jardins, São Paulo', ST_GeogFromText('POINT(-46.6664 -23.5730)'), 25, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('joao.seguranca@pro.teste',    'POINT(-46.6050 -23.5870)'),
    ('wellington.silva@pro.teste',  'POINT(-46.7050 -23.6450)'),
    ('claudia.seg@pro.teste',       'POINT(-46.6800 -23.5820)'),
    ('roberto.guarda@pro.teste',    'POINT(-46.5180 -23.6980)'),
    ('fabio.vigilante@pro.teste',   'POINT(-46.6630 -23.5700)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- LIMPEZA / FAXINEIROS
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'bruno.limpeza@pro.teste',    '(11) 94001-0001', 'Bruno Oliveira',       'PROFESSIONAL', false),
    (ids[2], 'maria.faxina@pro.teste',     '(11) 94001-0002', 'Maria das Graças',     'PROFESSIONAL', true),
    (ids[3], 'jose.limpador@pro.teste',    '(11) 94001-0003', 'José Limpador',        'PROFESSIONAL', false),
    (ids[4], 'lucia.clean@pro.teste',      '(11) 94001-0004', 'Lúcia Clean',          'PROFESSIONAL', true),
    (ids[5], 'edson.pos@pro.teste',        '(11) 94001-0005', 'Edson Pós-Evento',     'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '44.444.444/0001-01', 'FAXINEIRO', 'ACTIVE', 1,  12, 220.00, 'Limpeza pós-evento rápida e eficiente. Equipe própria disponível.', 'Campos Elíseos, São Paulo', ST_GeogFromText('POINT(-46.6441 -23.5329)'), 10, false),
    (ids[2], '44.444.444/0001-02', 'FAXINEIRO', 'ACTIVE', 3,  58, 270.00, 'Especialista em limpeza de salões de festas e espaços de eventos.', 'Brás, São Paulo', ST_GeogFromText('POINT(-46.6213 -23.5400)'), 15, true),
    (ids[3], '44.444.444/0001-03', 'FAXINEIRO', 'ACTIVE', 2,  31, 240.00, 'Limpeza durante e após eventos. Rápido e discreto.', 'Belém, São Paulo', ST_GeogFromText('POINT(-46.5902 -23.5367)'), 12, true),
    (ids[4], '44.444.444/0001-04', 'FAXINEIRO', 'ACTIVE', 4,  95, 300.00, 'Supervisora de limpeza com equipe treinada para grandes eventos.', 'Jabaquara, São Paulo', ST_GeogFromText('POINT(-46.6451 -23.6541)'), 20, true),
    (ids[5], '44.444.444/0001-05', 'FAXINEIRO', 'ACTIVE', 5, 178, 350.00, 'Referência em limpeza de eventos corporativos. Produtos próprios.', 'Morumbi, São Paulo', ST_GeogFromText('POINT(-46.7200 -23.6100)'), 15, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('bruno.limpeza@pro.teste',    'POINT(-46.6420 -23.5310)'),
    ('maria.faxina@pro.teste',     'POINT(-46.6190 -23.5380)'),
    ('jose.limpador@pro.teste',    'POINT(-46.5880 -23.5350)'),
    ('lucia.clean@pro.teste',      'POINT(-46.6430 -23.6520)'),
    ('edson.pos@pro.teste',        'POINT(-46.7180 -23.6080)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- FOTÓGRAFOS
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'carla.foto@pro.teste',       '(11) 95001-0001', 'Carla Souza',          'PROFESSIONAL', true),
    (ids[2], 'vitor.lens@pro.teste',       '(11) 95001-0002', 'Vítor Lens',           'PROFESSIONAL', true),
    (ids[3], 'isabela.foto@pro.teste',     '(11) 95001-0003', 'Isabela Fotografia',   'PROFESSIONAL', true),
    (ids[4], 'rafael.clicks@pro.teste',    '(11) 95001-0004', 'Rafael Clicks',        'PROFESSIONAL', false),
    (ids[5], 'camila.imagem@pro.teste',    '(11) 95001-0005', 'Camila Imagem',        'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '55.555.555/0001-01', 'FOTOGRAFO', 'ACTIVE', 5, 198, 2100.00, 'Fotografia de moda e eventos. Edição avançada. Entrega em 48h.', 'Vila Olímpia, São Paulo', ST_GeogFromText('POINT(-46.6902 -23.5960)'), 25, true),
    (ids[2], '55.555.555/0001-02', 'FOTOGRAFO', 'ACTIVE', 4, 112, 1800.00, 'Especialista em casamentos. Drone certificado. Vídeo e foto.', 'Higienópolis, São Paulo', ST_GeogFromText('POINT(-46.6570 -23.5380)'), 30, true),
    (ids[3], '55.555.555/0001-03', 'FOTOGRAFO', 'ACTIVE', 3,  67, 1620.00, 'Fotografia documental e corporativa. Entrega digital em 72h.', 'Lapa, São Paulo', ST_GeogFromText('POINT(-46.7040 -23.5243)'), 20, false),
    (ids[4], '55.555.555/0001-04', 'FOTOGRAFO', 'ACTIVE', 2,  29, 1440.00, 'Fotografia de eventos sociais e aniversários. Álbum incluso.', 'Penha, São Paulo', ST_GeogFromText('POINT(-46.5382 -23.5200)'), 15, true),
    (ids[5], '55.555.555/0001-05', 'FOTOGRAFO', 'ACTIVE', 1,   9, 1320.00, 'Fotógrafa iniciante com portfólio crescente. Preço competitivo.', 'Mauá, SP', ST_GeogFromText('POINT(-46.4614 -23.6678)'), 20, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('carla.foto@pro.teste',       'POINT(-46.6880 -23.5940)'),
    ('vitor.lens@pro.teste',       'POINT(-46.6550 -23.5360)'),
    ('isabela.foto@pro.teste',     'POINT(-46.7020 -23.5220)'),
    ('rafael.clicks@pro.teste',    'POINT(-46.5360 -23.5180)'),
    ('camila.imagem@pro.teste',    'POINT(-46.4590 -23.6650)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- MESTRES DE CERIMÔNIAS
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'patricia.mc@pro.teste',      '(11) 96001-0001', 'Patrícia Rocha',       'PROFESSIONAL', true),
    (ids[2], 'sergio.cerimonias@pro.teste','(11) 96001-0002', 'Sérgio Cerimonias',    'PROFESSIONAL', true),
    (ids[3], 'aline.mc@pro.teste',         '(11) 96001-0003', 'Aline Mestra',         'PROFESSIONAL', false),
    (ids[4], 'gustavo.voz@pro.teste',      '(11) 96001-0004', 'Gustavo Voz',          'PROFESSIONAL', true),
    (ids[5], 'renata.mc@pro.teste',        '(11) 96001-0005', 'Renata MC',            'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '66.666.666/0001-01', 'MESTRE_CERIMONIAS', 'ACTIVE', 4,  89, 900.00, 'MC bilíngue PT/EN. Especialista em casamentos e formaturas.', 'Jardim Paulista, São Paulo', ST_GeogFromText('POINT(-46.6637 -23.5692)'), 25, true),
    (ids[2], '66.666.666/0001-02', 'MESTRE_CERIMONIAS', 'ACTIVE', 5, 201, 1050.00,'MC com 15 anos de experiência. Eventos corporativos e sociais.', 'Paraíso, São Paulo', ST_GeogFromText('POINT(-46.6396 -23.5836)'), 30, true),
    (ids[3], '66.666.666/0001-03', 'MESTRE_CERIMONIAS', 'ACTIVE', 3,  45,  810.00,'Especialista em formaturas e eventos acadêmicos.', 'Água Funda, São Paulo', ST_GeogFromText('POINT(-46.6220 -23.6400)'), 20, false),
    (ids[4], '66.666.666/0001-04', 'MESTRE_CERIMONIAS', 'ACTIVE', 2,  18,  720.00,'MC de eventos infantis e festas temáticas.', 'Pirituba, São Paulo', ST_GeogFromText('POINT(-46.7300 -23.4900)'), 20, true),
    (ids[5], '66.666.666/0001-05', 'MESTRE_CERIMONIAS', 'ACTIVE', 1,   7,  660.00,'Iniciando na carreira. Ótima dicção e simpatia natural.', 'Diadema, SP', ST_GeogFromText('POINT(-46.6228 -23.6860)'), 15, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('patricia.mc@pro.teste',      'POINT(-46.6620 -23.5670)'),
    ('sergio.cerimonias@pro.teste','POINT(-46.6380 -23.5820)'),
    ('aline.mc@pro.teste',         'POINT(-46.6200 -23.6380)'),
    ('gustavo.voz@pro.teste',      'POINT(-46.7280 -23.4880)'),
    ('renata.mc@pro.teste',        'POINT(-46.6210 -23.6840)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- PRODUTORES
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'lucia.prod@pro.teste',       '(11) 97001-0001', 'Lúcia Albuquerque',    'PROFESSIONAL', true),
    (ids[2], 'henrique.events@pro.teste',  '(11) 97001-0002', 'Henrique Events',      'PROFESSIONAL', true),
    (ids[3], 'monica.producer@pro.teste',  '(11) 97001-0003', 'Mônica Produtora',     'PROFESSIONAL', true),
    (ids[4], 'diego.prod@pro.teste',       '(11) 97001-0004', 'Diego Producer',       'PROFESSIONAL', false),
    (ids[5], 'tatiane.eventos@pro.teste',  '(11) 97001-0005', 'Tatiane Eventos',      'PROFESSIONAL', true);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '77.777.777/0001-01', 'PRODUTOR', 'ACTIVE', 5, 320, 2625.00,'Produtora executiva com 15 anos. Eventos até 5.000 pessoas.', 'Bela Vista, São Paulo', ST_GeogFromText('POINT(-46.6480 -23.5620)'), 30, true),
    (ids[2], '77.777.777/0001-02', 'PRODUTOR', 'ACTIVE', 4, 134, 2250.00,'Produtor de eventos corporativos. Gestão completa de fornecedores.', 'Brooklin, São Paulo', ST_GeogFromText('POINT(-46.6978 -23.6169)'), 25, false),
    (ids[3], '77.777.777/0001-03', 'PRODUTOR', 'ACTIVE', 3,  72, 2025.00,'Especialista em festas sociais e casamentos. Decoração inclusa.', 'Vila Mariana, São Paulo', ST_GeogFromText('POINT(-46.6357 -23.5895)'), 20, true),
    (ids[4], '77.777.777/0001-04', 'PRODUTOR', 'ACTIVE', 2,  25, 1800.00,'Produtor jovem especializado em eventos culturais e shows.', 'Liberdade, São Paulo', ST_GeogFromText('POINT(-46.6340 -23.5605)'), 20, true),
    (ids[5], '77.777.777/0001-05', 'PRODUTOR', 'ACTIVE', 1,   6, 1650.00,'Assistente de produção buscando primeiras experiências solo.', 'Guarulhos, SP', ST_GeogFromText('POINT(-46.5333 -23.4549)'), 25, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('lucia.prod@pro.teste',       'POINT(-46.6460 -23.5600)'),
    ('henrique.events@pro.teste',  'POINT(-46.6960 -23.6150)'),
    ('monica.producer@pro.teste',  'POINT(-46.6340 -23.5875)'),
    ('diego.prod@pro.teste',       'POINT(-46.6320 -23.5585)'),
    ('tatiane.eventos@pro.teste',  'POINT(-46.5310 -23.4530)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- CONTROLADORES DE ACESSO
-- =====================================================================
do $$
declare ids uuid[] := array[
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
];
begin
  insert into public.users (id, email, phone, full_name, user_type, whatsapp_opt_in) values
    (ids[1], 'diego.acesso@pro.teste',     '(11) 98001-0001', 'Diego Ferreira',       'PROFESSIONAL', false),
    (ids[2], 'simone.portaria@pro.teste',  '(11) 98001-0002', 'Simone Portaria',      'PROFESSIONAL', true),
    (ids[3], 'leandro.cred@pro.teste',     '(11) 98001-0003', 'Leandro Credencial',   'PROFESSIONAL', true),
    (ids[4], 'vanessa.acesso@pro.teste',   '(11) 98001-0004', 'Vanessa Acesso',       'PROFESSIONAL', true),
    (ids[5], 'alex.controle@pro.teste',    '(11) 98001-0005', 'Alex Controle',        'PROFESSIONAL', false);

  insert into professionals (user_id, mei_number, category, status, stars, events_count, hourly_cache, bio, home_address, home_location, action_radius_km, is_available) values
    (ids[1], '88.888.888/0001-01', 'CONTROLADOR_ACESSO', 'ACTIVE', 2,  28, 288.00,'Controle de acesso com leitor de QR. Experiência em shows e feiras.', 'Penha, São Paulo', ST_GeogFromText('POINT(-46.5382 -23.5200)'), 15, false),
    (ids[2], '88.888.888/0001-02', 'CONTROLADOR_ACESSO', 'ACTIVE', 4,  91, 360.00,'Supervisora de portaria com equipe. Credenciamento de eventos corporativos.', 'Butantã, São Paulo', ST_GeogFromText('POINT(-46.7213 -23.5704)'), 20, true),
    (ids[3], '88.888.888/0001-03', 'CONTROLADOR_ACESSO', 'ACTIVE', 3,  54, 324.00,'Credenciamento digital. Sistemas de lista e QR Code.', 'Tucuruvi, São Paulo', ST_GeogFromText('POINT(-46.6070 -23.4750)'), 20, true),
    (ids[4], '88.888.888/0001-04', 'CONTROLADOR_ACESSO', 'ACTIVE', 1,   9, 264.00,'Recém ingresso na área. Proativa e organizada.', 'São Caetano do Sul, SP', ST_GeogFromText('POINT(-46.5500 -23.6200)'), 15, true),
    (ids[5], '88.888.888/0001-05', 'CONTROLADOR_ACESSO', 'ACTIVE', 5, 187, 420.00,'Especialista em grandes eventos. Controle de fluxo de até 10.000 pessoas.', 'Centro, São Paulo', ST_GeogFromText('POINT(-46.6333 -23.5505)'), 30, true);

  insert into professional_locations (professional_id, location)
  select p.id, ST_GeogFromText(pos.wkt) from professionals p
  join public.users u on u.id = p.user_id
  join (values
    ('diego.acesso@pro.teste',     'POINT(-46.5360 -23.5180)'),
    ('simone.portaria@pro.teste',  'POINT(-46.7190 -23.5680)'),
    ('leandro.cred@pro.teste',     'POINT(-46.6050 -23.4730)'),
    ('vanessa.acesso@pro.teste',   'POINT(-46.5480 -23.6180)'),
    ('alex.controle@pro.teste',    'POINT(-46.6310 -23.5485)')
  ) as pos(email, wkt) on u.email = pos.email;
end $$;

-- =====================================================================
-- DISPONIBILIDADE — próximos 30 dias (sex/sab/dom) para todos
-- =====================================================================
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
where extract(dow from gs) in (5, 6, 0);

-- Resultado
select
  c.label,
  count(*) as total,
  sum(p.stars) as total_stars,
  round(avg(p.hourly_cache), 0) as avg_cache
from professionals p
join (values
  ('GARCOM','Garçom'), ('DJ','DJ'), ('SEGURANCA','Segurança'),
  ('FAXINEIRO','Limpeza'), ('FOTOGRAFO','Fotógrafo'),
  ('MESTRE_CERIMONIAS','MC'), ('PRODUTOR','Produtor'),
  ('CONTROLADOR_ACESSO','Controle Acesso')
) as c(code, label) on p.category::text = c.code
group by c.label order by c.label;
