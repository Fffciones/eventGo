# EventPro — Guia para o Claude

## O que é o projeto
Marketplace de profissionais para eventos (modelo Uber). Conecta produtores de eventos (Clientes) com profissionais da área (garçons, DJs, seguranças, fotógrafos, etc.) em tempo real.

## Stack
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS v4
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Deploy:** Vercel → https://eventpro-black.vercel.app
- **AI:** Gemini (Google AI Studio)

## Credenciais de ambiente
Nunca commitar o `.env.local`. As variáveis necessárias são:
```
GEMINI_API_KEY=
VITE_SUPABASE_URL=https://vrkhzkfxmsicutirsgun.supabase.co
VITE_SUPABASE_ANON_KEY=
```
Pedir ao Fabricio as chaves para criar o `.env.local` local.

## Estrutura do projeto
```
src/
├── components/
│   ├── auth/AuthScreen.tsx       # Login + cadastro (Cliente e Profissional)
│   ├── CreateEventScreen.tsx     # Criação de evento em 3 passos
│   ├── HomeView.tsx              # Mapa + busca (dados ainda estáticos)
│   ├── BookingsView.tsx          # Bookings do evento ativo
│   ├── FavoritesView.tsx         # Profissionais favoritos
│   └── ProfileView.tsx           # Perfil do usuário logado
├── hooks/
│   ├── useAuth.ts                # Auth Supabase + auto-criação de perfil
│   ├── useProfile.ts             # Dados do usuário logado
│   ├── useEvents.ts              # CRUD de eventos
│   ├── useBookings.ts            # Bookings + realtime
│   ├── useProfessionals.ts       # Busca de profissionais disponíveis
│   └── useNotifications.ts       # Notificações realtime
├── lib/
│   ├── supabase.ts               # Cliente Supabase
│   └── database.types.ts         # Tipos das tabelas
├── App.tsx                       # Roteamento principal + guards de auth
├── types.ts                      # Tipos do domínio (legado AI Studio)
└── data.ts                       # Dados estáticos de demonstração (legado)
supabase/
└── migrations/
    ├── 001_initial_schema.sql    # Schema completo (20 tabelas)
    ├── 002_auth_and_rls.sql      # RLS + trigger de auth
    ├── 003_business_logic.sql    # Funções de negócio
    ├── 004_transit_tracking.sql  # Rastreio de deslocamento
    ├── 005_early_checkin.sql     # Chegada antecipada + critérios de avaliação
    ├── 006_seed_professionals.sql # 10 profissionais fictícios + preços
    ├── 007_fix_signup.sql        # Políticas INSERT + funções de perfil
    └── 008_profile_on_first_login.sql # Criação de perfil pós-confirmação
```

## Fluxo principal (modelo Uber)
1. **Cliente cria evento** → define nome, local, data, horário e categorias/quantidades
2. **Plataforma busca profissionais** → `find_available_professionals()` por raio, estrelas, favoritos
3. **Profissionais recebem convite** → aceitam ou recusam (status INVITED → ACCEPTED)
4. **Cliente vê equipe confirmada** → não escolhe manualmente, vê quem aceitou
5. **No dia** → profissional marca "Em deslocamento" → GPS ativo → Check-in → Check-out
6. **Avaliação mútua** → critérios com peso → atualiza estrelas e cache do profissional

## Regras de negócio importantes
- Profissional precisa ter MEI ativo para se cadastrar
- Bônus de R$5 no cadastro do profissional (após envio de documentação)
- Preço: tabela por categoria × nível de estrelas; evento até 8h = preço cheio; +4h = 50% adicional
- Emergência: multiplicador 1.5x; plataforma pode chamar Uber para o profissional
- GPS só ativo quando profissional clica "Em deslocamento"
- Alerta 60 min antes do evento se profissional não marcou deslocamento
- Chegada antecipada (60+ min) = 10/10 pontualidade → impacta estrelas

## Estado atual (o que está feito)
- ✅ Schema completo no Supabase
- ✅ RLS + funções de negócio
- ✅ Auth (cadastro + login + confirmação de e-mail)
- ✅ Perfil do usuário logado conectado ao banco
- ✅ Criação de evento (3 passos) salva no Supabase
- ✅ Deploy na Vercel funcionando
- ⏳ HomeView ainda usa dados estáticos (mapa e profissionais)
- ⏳ BookingsView ainda usa dados estáticos
- ⏳ Disparo de convites para profissionais (aguarda profissionais reais)
- ⏳ Frontend do profissional (painel separado)
- ⏳ Pagamento via Pix
- ⏳ Notificações WhatsApp

## Notificações do Cliente — Regras definidas
Ver `/docs/cliente_notifications_rules.md` para especificação completa. Resumo:

- **Push (app)**: todas as notificações rotineiras (confirmações, alertas, pós-evento)
- **WhatsApp**: APENAS emergências — no-show, substituto acionado, cancelamento crítico
- **Silêncio durante o evento**: zero push de `starts_at` até `ends_at + 30min`
- **Pós-evento**: push de conclusão + pagamento + até 2 lembretes de avaliação

## Interface do Profissional — Regras definidas (ainda não implementadas)
Ver `/docs/profissional_interface_rules.md` para especificação completa. Resumo:

- **Presença online**: `online_score` acumula pontos por tempo online → critério de desempate no ranking
- **Raio de atuação**: profissional cadastra endereço residencial + raio de preferência (km)
- **Convites**: mapa centrado na residência com pinos de eventos disponíveis
- **Favoritos**: aceitar convite de cliente que favoritou o profissional eleva estrelas
- **Tempo de resposta**: X minutos para aceitar (sugestão: 10 min), depois repassa ao próximo
- **Alerta 6h antes**: push + WhatsApp com briefing completo (uniforme, alimentação, transporte)
- **Modo silencioso**: zero notificações durante o evento (starts_at → ends_at + 30min)
- **Pós-evento**: confirmação de pagamento + link de avaliação
- **Agenda**: lista cronológica de eventos aceitos com botões de ação por status

## Campos a adicionar em `professionals` (para interface do profissional)
```sql
home_address     text
home_location    geography(Point, 4326)
action_radius_km int default 10
online_score     int default 0
last_seen_at     timestamptz
is_available     boolean default false
```

## Checklist pré-produção
Ver `/memory/project_test_flags.md` — itens a reativar antes do release:
- Confirmação de e-mail do Supabase (atualmente ligada ✅)
- Restrição de domínio na Google Maps API Key
- Revisar políticas RLS

## Comandos úteis
```bash
npm run dev          # rodar local (porta 3000)
npm run build        # build de produção
vercel --prod        # deploy manual
```
