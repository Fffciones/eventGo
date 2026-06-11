# Etapa 5 — Canais WhatsApp (plano técnico detalhado)

> Itens L (messageria) e M (onboarding via WhatsApp) da revisão 10jun26.
> Arquitetura **provider-agnóstica**: a escolha do provedor afeta só um "adapter";
> todo o resto (UI, schema, fila de envio, templates) é independente.

## Base já existente
- `users.whatsapp_opt_in` (opt-in por usuário)
- `notifications.channel = 'WHATSAPP'` — funções SQL **já geram** essas linhas
  (alerta 60min, pedido de deslocamento), mas **nada entrega**.
- Campos de WhatsApp dos responsáveis no evento (mig 013).
- Regras: `docs/cliente_notifications_rules.md` (WhatsApp **só emergências** p/ contratante).

## Restrição que define o desenho (grupos)
| Provedor | Enviar msg | Criar grupo | Notas |
|---|---|---|---|
| Meta Cloud API (oficial) | ✅ | ❌ | grátis, exige verificação Meta + templates pré-aprovados |
| Twilio | ✅ | ❌ | sandbox p/ teste, pago |
| Z-API / Evolution (BR, não-oficial) | ✅ | ✅ | cria grupos (atende doc), fora do ToS |

→ "Grupo por evento" só com provedor não-oficial. Com oficial: 1:1 OU grupo criado
manualmente pelo contratante + link compartilhado pela plataforma (fallback do 5A).

---

## Arquitetura de entrega (núcleo)
```
notifications (channel=WHATSAPP, sent_at NULL)
        │  (cron 1min OU DB webhook on insert)
        ▼
Edge Function `whatsapp-dispatch`
  - resolve telefone do user (users.phone)
  - escolhe template + params
  - chama adapter do provedor (env: WHATSAPP_PROVIDER)
        ├─ stub()   → só loga (5A)
        ├─ meta()   → Cloud API (5B)
        ├─ twilio() → (5B)
        └─ zapi()   → (5B, suporta grupo)
  - marca notifications.sent_at
```
Trocar de provedor = trocar a env `WHATSAPP_PROVIDER` + secrets. Nada mais muda.

---

## FASE 5A — sem provedor (entregável já, valor imediato)

### Schema (migration 019)
- `notifications.sent_at timestamptz` — controle de fila de envio.
- `events.whatsapp_group_link text` — link de convite do grupo (fallback manual).

### Frontend
1. **`src/lib/whatsapp.ts`** — helper:
   - `waLink(phone, text?)` → `https://wa.me/55XXXXXXX?text=...` (sanitiza dígitos, +55 se faltar).
   - `PLATFORM_WHATSAPP` de `import.meta.env.VITE_WHATSAPP_NUMBER`.
2. **Deep links "Falar no WhatsApp"** (abre o app, sem API):
   - `BookingsView` (equipe do evento): botão por profissional alocado (usa `users.phone`).
   - `BookingsView`/`EventosAdmin` (detalhe do evento): botão p/ Responsável 1 e 2 (WhatsApp já cadastrado).
   - `AgendaView` (pro): botão "Falar com o organizador" (responsáveis do evento).
3. **Onboarding por clique (M)**: em `AuthScreen` (e landing), botão
   "Cadastre-se pelo WhatsApp" → `waLink(PLATFORM_WHATSAPP, 'Quero me cadastrar como Profissional')`.
4. **Opt-in**: toggle `whatsapp_opt_in` em `ProfileView` (contratante) e `ProfileViewPro` (pro).
5. **Grupo (fallback)**: contratante cola o link do grupo no evento (`whatsapp_group_link`);
   profissionais veem "Entrar no grupo do evento" na Agenda.

### Backend (skeleton, stubado)
6. **Edge Function `supabase/functions/whatsapp-dispatch`**:
   - lê `notifications` com channel=WHATSAPP e sent_at NULL;
   - adapter `stub()` que loga (sem enviar);
   - marca `sent_at`;
   - interface `WhatsAppAdapter { send(to, template, params) }`.
7. **`src/lib/whatsappTemplates.ts`** (ou tabela `whatsapp_templates`):
   - templates por tipo: no-show emergência, substituto acionado, cancelamento crítico,
     alerta 60min, etc. (conforme as regras já documentadas).
8. Agendamento: cron `select net.http_post(...)` OU Database Webhook em notifications.

---

## FASE 5B — com provedor

1. **Escolher provedor** → setar secrets na Edge Function
   (`WHATSAPP_PROVIDER`, `WHATSAPP_API_URL`, `WHATSAPP_TOKEN`, `WHATSAPP_FROM`).
2. **Implementar o adapter** escolhido (meta/twilio/zapi) no `whatsapp-dispatch`.
3. **Templates Meta**: se Cloud API, registrar e aprovar templates no Business Manager
   (mensagens fora de janela de 24h exigem template aprovado).
4. **Grupo por evento (só Z-API/Evolution)**:
   - `create_event_whatsapp_group(event_id)` → cria grupo, adiciona responsáveis +
     telefones dos pros aceitos, salva id/link em `events.whatsapp_group_link`.
   - Gatilho: ao preencher a 1ª vaga do evento (ou na véspera).
5. **Onboarding conversacional (M)**: Edge Function `whatsapp-webhook` (inbound):
   - máquina de estados em tabela `whatsapp_sessions` (coleta nome, tipo, função, CEP);
   - ao concluir, cria `users` + perfil (reutiliza lógica do signup).
6. **Política de canal**: dispatch envia ao WhatsApp só o que as regras mandam
   (contratante: emergências; profissional: alertas definidos em `profissional_interface_rules.md`).

---

## Decisões em aberto (precisam de você)
- **Provedor** (define se "grupo por evento" automático é viável).
- **Número WhatsApp da plataforma** (para os deep links de onboarding e o `from`).
- **Escopo de envio**: seguir "só emergências" (regras atuais) ou ampliar.

## Sequência sugerida de implementação
1. 5A schema + `lib/whatsapp.ts` + deep links (rápido, sem custo).
2. 5A opt-in + onboarding por clique + grupo-fallback.
3. 5A Edge Function stub + templates (deixa a fila pronta).
4. 5B: plugar provedor + (grupos/webhook conforme escolha).
