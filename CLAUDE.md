# EventPro — Guia para o Claude

## O que é o projeto
Marketplace de profissionais para eventos (modelo Uber). Conecta **Contratantes** (produtores de eventos, donos de estabelecimentos, PF ou PJ) com **Profissionais** (pessoas físicas que prestam serviços: garçons, DJs, seguranças, etc.) em tempo real.

## Nomenclaturas padrão (definidas pelo produto)
- **Profissional** — pessoa física que presta o serviço. Exerce uma ou mais **Funções**.
- **Contratante** — quem contrata. Pode ser PF (CPF) ou PJ (CNPJ). Cria eventos.
- **Administrador** — equipe interna. Gerencia profissionais, contratantes, vagas e eventos.
- **Função** — papel exercido pelo profissional (ex: Segurança, Limpeza, Garçom). Tabela central do sistema, gerenciada pelo admin. Campos: Nome, Ativo (S/N), Preço (valor ao contratante), Remuneração-Base (valor líquido ao profissional).
- **Evento** — criado pelo contratante para contratar profissionais.
- **Vaga** — cada posição aberta dentro de um evento para uma função específica.
- **Contratação** — processo completo do evento ao pagamento.

> ⚠️ O código atual usa "Cliente" e "Categoria" — a nomenclatura de produto é "Contratante" e "Função". Alinhar gradualmente nas novas telas.

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
VITE_GOOGLE_MAPS_API_KEY=
```
Pedir ao Fabricio as chaves para criar o `.env.local` local.

## Estrutura do projeto
```
src/
├── components/
│   ├── auth/AuthScreen.tsx           # Login + cadastro (Contratante e Profissional)
│   ├── CreateEventScreen.tsx         # Criação de evento em 3 passos
│   ├── HomeView.tsx                  # Mapa + busca (dados ainda estáticos)
│   ├── BookingsView.tsx              # Bookings do evento ativo
│   ├── FavoritesView.tsx             # Profissionais favoritos
│   ├── ProfileView.tsx               # Perfil do contratante logado
│   └── pro/
│       ├── HomeViewPro.tsx           # Mapa com vagas abertas (Google Maps real)
│       ├── ConviteView.tsx           # Convites pendentes + aceitar/recusar
│       ├── AgendaView.tsx            # Agenda cronológica + botões de ação
│       ├── ProfileViewPro.tsx        # Perfil do profissional
│       └── ProNotifications.tsx      # Banners e modal de notificações
├── hooks/
│   ├── useAuth.ts                    # Auth Supabase + auto-criação de perfil
│   ├── useProfile.ts                 # Dados do contratante logado
│   ├── useEvents.ts                  # CRUD de eventos
│   ├── useBookings.ts                # Bookings + realtime
│   ├── useProfessionals.ts           # Busca de profissionais disponíveis
│   ├── useNotifications.ts           # Notificações realtime
│   ├── useProfessionalProfile.ts     # Perfil completo + convites + agenda do profissional
│   ├── useProNotifications.ts        # Lógica de alertas e silêncio do profissional
│   ├── useOpenBookings.ts            # Vagas abertas no mapa do profissional
│   ├── useAvatarUpload.ts            # Upload de avatar para Supabase Storage
│   └── useGeocoding.ts              # Geocoding via OpenStreetMap Nominatim
├── lib/
│   ├── supabase.ts                   # Cliente Supabase
│   └── database.types.ts            # Tipos das tabelas
├── App.tsx                           # App do Contratante
├── ProfessionalApp.tsx               # App do Profissional (/pro)
└── main-pro.tsx                      # Entry point do app profissional
pro/
└── index.html                        # HTML entry point de /pro
supabase/
└── migrations/
    ├── 001_initial_schema.sql        # Schema completo (20 tabelas)
    ├── 002_auth_and_rls.sql          # RLS + trigger de auth
    ├── 003_business_logic.sql        # Funções de negócio
    ├── 004_transit_tracking.sql      # Rastreio de deslocamento
    ├── 005_early_checkin.sql         # Chegada antecipada + critérios de avaliação
    ├── 006_seed_professionals.sql    # 10 profissionais fictícios + preços
    ├── 007_fix_signup.sql            # Políticas INSERT + funções de perfil
    ├── 008_profile_on_first_login.sql# Criação de perfil pós-confirmação
    └── 009_reseed_professionals.sql  # 40 profissionais seed (5 por categoria)
```

## Dois apps separados (modelo Uber / Uber Driver)
| URL | App | Quem acessa |
|-----|-----|-------------|
| `eventpro-black.vercel.app/` | Contratante | Produtores de eventos, donos de estabelecimentos |
| `eventpro-black.vercel.app/pro` | Profissional | Garçons, DJs, Seguranças, etc. |

## Fluxo principal (modelo Uber)
1. **Contratante cria evento** → define nome, local, data, horário e funções/quantidades
2. **Oferta direcionada** → plataforma envia convites por fila (critérios de matchmaking)
3. **Se não aceito em X min** → vaga muda para "oferta aberta" → aparece no mapa para todos da função
4. **Profissional aceita** → status INVITED → ACCEPTED
5. **Contratante vê equipe confirmada** → não escolhe manualmente, vê quem aceitou
6. **No dia** → profissional marca "Em deslocamento" → GPS ativo → Check-in → Check-out
7. **Fechamento** → avaliação mútua → pagamento → remuneração

## Regras de negócio importantes
- Profissional pode exercer **uma ou mais funções** (ex: Garçom + Bartender)
- Preço é **fixo por função** (ex: Limpeza R$250, Segurança R$260) — gerenciado pelo admin
- Remuneração-Base separada do preço (margem da plataforma)
- Profissional precisa ter MEI ativo para aparecer nas buscas (status ACTIVE)
- Bônus de R$5 no cadastro do profissional (após envio de documentação)
- Emergência: multiplicador 1.5x; plataforma pode chamar Uber para o profissional
- GPS só ativo quando profissional clica "Em deslocamento"
- Alerta 60 min antes do evento se profissional não marcou deslocamento
- Chegada antecipada (60+ min) = 10/10 pontualidade → impacta estrelas

## Canais de cadastro (a implementar)
- Formulário web (atual)
- Aplicativo mobile (futuro)
- **WhatsApp** (prioritário para profissionais — a explorar)
- **SSO Google / Facebook** (a implementar)

## Estado atual (o que está feito)
- ✅ Schema completo no Supabase
- ✅ RLS + funções de negócio
- ✅ Auth (cadastro + login + confirmação de e-mail)
- ✅ Perfil do contratante conectado ao banco
- ✅ Criação de evento (3 passos) salva no Supabase
- ✅ Deploy na Vercel (dois apps separados)
- ✅ App do Profissional (/pro) — Mapa, Convites, Agenda, Perfil
- ✅ Notificações do profissional (alertas 6h, 60min, silêncio, pós-evento)
- ✅ Mapa com vagas abertas em tempo real (Google Maps)
- ⏳ Múltiplas funções por profissional (banco suporta só 1 hoje)
- ⏳ Tabela de Funções gerenciável pelo admin
- ⏳ Painel Administrador
- ⏳ SSO Google / Facebook
- ⏳ Cadastro via WhatsApp
- ⏳ Messageria contratante ↔ profissional
- ⏳ Pagamento (Pix)
- ⏳ Notificações WhatsApp
- ⏳ GPS tracking em tempo real (aguarda testes mobile)

## Notificações do Contratante — Regras definidas
Ver `/docs/cliente_notifications_rules.md` para especificação completa. Resumo:
- **Push (app)**: todas as notificações rotineiras (confirmações, alertas, pós-evento)
- **WhatsApp**: APENAS emergências — no-show, substituto acionado, cancelamento crítico
- **Silêncio durante o evento**: zero push de `starts_at` até `ends_at + 30min`
- **Pós-evento**: push de conclusão + pagamento + até 2 lembretes de avaliação

## Notificações do Profissional — Implementadas
Ver `/docs/profissional_interface_rules.md` para especificação completa. Resumo:
- **Alerta 6h antes**: banner com briefing completo (uniforme, alimentação, transporte)
- **Alerta 60min**: banner urgente + CTA "Estou a caminho"
- **Modo silencioso**: zero notificações durante o evento (starts_at → ends_at + 30min)
- **Pós-evento**: modal com pagamento confirmado + avaliação
- **TODO FCM**: substituir banners por push notification quando virar app nativo

## Roadmap de fases
- ✅ **Fase 1** — Base: schema, hooks, dois apps separados
- ✅ **Fase 2** — Telas do profissional: Mapa, Convites, Agenda, Perfil
- ✅ **Fase 3** — Notificações do profissional (web, pendente FCM)
- ⏳ **Fase 4** — Onboarding por tipo de profissional (MEI ou Diarista)
- ⏳ **Fase 5** — Múltiplas funções por profissional + Tabela de Funções admin
- ⏳ **Fase 6** — Painel Administrador
- ⏳ **Fase 7** — Pagamento (documentar antes de implementar)
- ⏳ **Fase 8** — SSO Google/Facebook + cadastro WhatsApp
- ⏳ **Fase 9** — GPS tracking mobile + FCM push notifications
- ⏳ **Fase 10** — Assistente guiado para criação de MEI (checklist CNAE, deep link Portal do Empreendedor)

## Fase 4 — Onboarding por tipo de profissional
A plataforma suporta **dois tipos de profissional** desde o início:

| Tipo | Campo | Documento | Pagamento |
|------|-------|-----------|-----------|
| `MEI` | `mei_number` (CNPJ) | CNPJ ativo | Nota fiscal |
| `DIARISTA` | CPF (já em `users`) | CPF | Recibo de pagamento |

**Regras definidas (2026-06-05):**
- Ambos os tipos podem exercer múltiplas funções (ex: barman + garçom, manobrista + segurança)
- Preço ao contratante e remuneração ao profissional diferem por tipo
- `mei_number` não é mais obrigatório para `status = ACTIVE`
- O tipo determina qual fluxo de onboarding é apresentado

**Impacto no banco:**
```sql
-- Adicionar à tabela professionals
alter table professionals add column if not exists professional_type text not null default 'DIARISTA';
-- Valores: 'MEI' | 'DIARISTA'
```

**Fluxo de onboarding por tipo:**
- **MEI:** informa CNPJ → sistema valida → libera perfil
- **Diarista:** informa CPF + dados bancários para recibo → libera perfil

> Assistente guiado para criação de MEI (checklist CNAE, Portal do Empreendedor) → ver Fase 10

**Decisões finais (2026-06-05):**
- Nenhuma função exige MEI — todas as funções estão disponíveis para ambos os tipos
- Preço e remuneração são definidos individualmente por função (não há multiplicador global)

## Fase 5 — Múltiplas funções por profissional + Tabela de Funções
Hoje `professionals.category` é um único valor. Precisa evoluir para:
```sql
-- Tabela de funções (gerenciada pelo admin)
create table functions (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  active          boolean default true,
  price_mei       numeric(10,2) not null,      -- preço ao contratante quando profissional é MEI
  price_diarista  numeric(10,2) not null,      -- preço ao contratante quando profissional é Diarista
  base_pay_mei    numeric(10,2) not null,      -- remuneração líquida ao profissional MEI
  base_pay_diarista numeric(10,2) not null,   -- remuneração líquida ao profissional Diarista
  display_order   int default 0,
  created_at      timestamptz default now()
);

-- N funções por profissional
create table professional_functions (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid references professionals(id) on delete cascade,
  function_id     uuid references functions(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(professional_id, function_id)
);
```

## Fase 6 — Painel Administrador
Terceiro app separado (`/admin`), com:
- Gestão de Profissionais (aprovar, bloquear, ver documentos)
- Gestão de Contratantes
- Gestão de Funções (CRUD + ordenação + ativar/desativar)
- Gestão de Eventos e Vagas
- Relatórios financeiros

---

## Arquitetura do banco — Modelagem por perfil

### Decisão: tabelas separadas por perfil (já implementado parcialmente)

```
auth.users          ← Supabase Auth (autenticação, senha, email confirmado)
      ↓
public.users        ← dados comuns a todos: nome, email, phone, user_type, avatar
      ↓
┌─────────────┬──────────────────┬────────────┐
│   clients   │  professionals   │   admins   │
│ (contratante│  (profissional)  │  (interno) │
│  PF ou PJ)  │                  │            │
└─────────────┴──────────────────┴────────────┘
```

**Por que separar:** cada perfil tem atributos completamente diferentes. Queries do app do profissional nunca tocam em `clients` ou `admins`, e vice-versa — performance e segurança.

### Tabela `clients` — campos atuais + pendentes
```sql
-- já existe
clients (
  id, user_id, credit_balance, credit_limit, document, is_company, ...
)

-- a adicionar (contratante PJ)
alter table clients add column if not exists company_name text;
alter table clients add column if not exists cnpj         text;
-- document já existe para CPF (PF)
```

### Tabela `professionals` — campos atuais
```sql
-- já existe + campos adicionados na Fase 1
professionals (
  id, user_id, mei_number, category,   -- category vira legado na Fase 5
  status, stars, events_count, hourly_cache, bio,
  home_address, home_location, action_radius_km,
  online_score, last_seen_at, is_available
)
```

### Tabela `admins` — a criar na Fase 6
```sql
create table admins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade,
  role         text not null default 'operator',
  -- 'operator'   → acesso operacional (aprovar profissionais, ver eventos)
  -- 'financial'  → acesso financeiro (pagamentos, extratos)
  -- 'super'      → acesso total
  active       boolean default true,
  created_at   timestamptz default now(),
  unique(user_id)
);
```

### Tabela `functions` — a criar na Fase 5
```sql
create table functions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                    -- ex: "Garçom", "Segurança"
  slug          text unique not null,             -- ex: "garcom", "seguranca"
  active        boolean default true,             -- admin pode desativar
  price         numeric(10,2) not null,           -- preço ao contratante
  base_pay      numeric(10,2) not null,           -- remuneração líquida ao profissional
  display_order int default 0,                    -- ordem no menu (admin controla)
  created_at    timestamptz default now()
);

-- N funções por profissional
create table professional_functions (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid references professionals(id) on delete cascade,
  function_id     uuid references functions(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(professional_id, function_id)
);
```

### Impacto da Fase 5 no código existente
- `professionals.category` vira **legado** — manter por compatibilidade, não remover
- Matchmaking (`find_available_professionals`) precisa aceitar `function_id` em vez de `category`
- `useOpenBookings.ts` filtra por `function_id` em vez de `category`
- `bookings.category` também vira referência para `functions.id` no futuro
- Seed de profissionais precisa inserir em `professional_functions`

### Terceiro app — `/admin`
Seguir o mesmo padrão de entry point separado:
```
admin/index.html   ← entry point HTML
src/main-admin.tsx ← bootstrap React
src/AdminApp.tsx   ← app do administrador
vercel.json        ← adicionar rewrite /admin → /admin/index.html
```

---

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
