# Plano de implementação — Documentação EventPro rev 10jun26

> Origem: `Documentação EventPro rev 10jun26.pdf` (e-mail Rafael Lamardo, 10/06/2026).
> Pontos riscados no PDF (seção 1.1.1 Função; linha "informar funções" no onboarding) já
> estão implementados — são marcas de revisão, não pendências.

## Decisões de produto tomadas (2026-06-10)
- **Vaga = registro individual**: cada posição aberta vira uma linha própria com status
  independente (em vez do `bookings.quantity` agregado de hoje). Mais fiel ao doc e ao
  matchmaking "1 subprocesso por vaga".
- Implementação começa apenas após revisão deste plano (nada de código ainda).

## Já coberto
- Domínios (Profissional, Função, Contratante PF/PJ, Admin)
- Tabela de Funções (Nome, Ativo, Preço, Remuneração-Base, ordenação, CRUD admin) — mig 011
- Múltiplas funções por profissional (`professional_functions`)
- Tipo de profissional MEI/Diarista — mig 010
- Georreferenciamento + localização-base (CEP/bairro)
- Mural de vagas abertas no mapa do profissional
- Painel admin: Dashboard, Profissionais, Contratantes, Funções, Eventos

## Lacunas (itens da revisão)
| # | Requisito | Estado | Impacto |
|---|---|---|---|
| A | Evento: horário de chegada da equipe + Responsável 1 e 2 (nome, função, WhatsApp) | ❌ | banco + CreateEventScreen + admin |
| B | Status de vaga do doc (Em aberto, Preenchida, Em andamento, Em finalização, Finalizada, Cancelada) | ⚠️ enum diverge | banco + telas |
| C | Vaga individual (1 registro por posição) | ⚠️ hoje usa `quantity` | **decidido: migrar p/ individual** |
| D | Aprovação de pagamento: checar limite de crédito; sem crédito → cartão, cobrança ao fim | ❌ | banco + fluxo de criação |
| E | Admin edita limite de crédito em "editar contratante" | ⚠️ lê, não edita | ContratantesAdmin |
| F | Matchmaking 2 fases: oferta direcionada (fila ~15s/pro) → oferta aberta | ❌ só fase aberta | banco + funções + timers |
| G | Variáveis Gerais de Sistema (admin) — timers do matchmaking | ❌ | banco + nova aba admin |
| H | Chave PIX no cadastro do profissional | ❌ | banco + perfil pro |
| I | Pagamento automático ao profissional via PIX + componente "Remuneração" (descontos MEI/autônomo) | ❌ | banco + serviço |
| J | Cobrança do contratante + aba "Financeiro" no admin (cobranças em aberto) | ❌ (role existe) | banco + admin |
| K | Fechamento: "Finalizar contratação" → Em fechamento + avaliação individual 5★ | ⚠️ reviews existe | telas + status |
| L | Messageria via grupo WhatsApp | ❌ | integração externa |
| M | Onboarding via WhatsApp (pro e contratante) | ⏳ Fase 8 | integração externa |

## Etapas
1. **Modelo de evento e vaga** (A, B, C) — ✅ CONCLUÍDA (2026-06-10)
   - 1A: campos novos em `events` (mig 013: team_arrival_at + responsible_1/2) + form + admin.
   - 1B: nova tabela `vagas` (mig 014) como entidade central, absorvendo bookings +
     booking_professionals. Enum `vaga_status` (doc 1.4.2) + `worker_status` operacional.
     Funções SQL de ciclo de vida reescritas (accept_vaga, respond_to_vaga_invite,
     activate_transit, professional_checkin, handle_no_show, check_pre_event_alerts,
     update_professional_stars...). Cutover de todo o frontend (criação, mural/convites/
     agenda do profissional, equipe do contratante, admin). Tabelas legadas mantidas (não
     dropadas) para compat de pagamento/preço (Etapa 4). offer_phase default OPEN_POOL até
     a Etapa 3 introduzir a oferta direcionada.
   - ⚠️ Rodar migrations 013 e 014 no Supabase. `TRUNCATE` opcional comentado no topo da 014.
2. **Crédito e aprovação de pagamento** (D, E) — ✅ CONCLUÍDA (2026-06-10)
   - Mig 015: `events.estimated_total/payment_method/charge_status`; policy admin edita
     `clients.credit_limit`; fix RLS `vagas_admin_select`.
   - Admin: modal de edição de limite/saldo no ContratantesAdmin.
   - Criação de evento: calcula total, checa `credit_limit >= total` → CREDIT; senão exige
     autorização de cartão (placeholder sem PAN; gateway na Etapa 7) → CARD.
   - Decisões: cartão = placeholder; checagem simples (consumo acumulado fica p/ Etapa 4).
3. **Matchmaking 2 fases + Variáveis de Sistema** (F, G) — ✅ CONCLUÍDA (2026-06-10)
   - Mig 016: `system_variables` (timers) + colunas em vagas (offered_pro_ids,
     current_offer_expires_at, directed_until) + motor: get_system_var, offer_vaga_to_next,
     start_event_matchmaking, process_matchmaking; respond_to_vaga_invite avança a fila.
   - Criação de evento dispara `start_event_matchmaking` (vagas nascem DIRECTED).
   - App do pro: polling de `process_matchmaking` a cada 10s + countdown ao vivo no convite.
   - Admin: aba "Variáveis" (VariaveisAdmin) edita os tempos.
   - ⚠️ Motor roda via polling do app do pro; produção = pg_cron/edge chamando
     process_matchmaking(). Pré-requisito p/ convites: profissionais ACTIVE + função.
4. **Pagamento e Cobrança** (H, I, J, K): `chave_pix` em professionals; botão "Finalizar
   contratação"; componente Remuneração; PIX automático ao pro; cobrança do contratante;
   aba "Financeiro" no admin.
5. **Canais externos** (L, M): messageria e onboarding via WhatsApp (depende de provedor).
