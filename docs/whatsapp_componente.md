# 3.7 Componente de WhatsApp

Módulo transversal — utilizado em diferentes etapas do processo.
Modos de uso: **pergunta a pergunta** (cadastro), **chat direto** (vagas/notificações), **grupos** (evento).

> ⚠️ Implementação pendente de definição do provedor (ver seção "Provedor" ao final).
> Deep links sem provedor já implementados na Etapa 5A.

---

## Caso de uso 1 — Cadastro de profissional via WhatsApp

Quando um novo usuário entrar em contato pelo WhatsApp da plataforma, inicia-se um fluxo conversacional passo a passo:

```
Bot: Olá boa tarde. Sou uma assistente virtual e vou te ajudar no seu cadastro. Vamos lá?
     Por favor, qual é o seu nome?
User: José da Silva
Bot:  Celular/WhatsApp (capturado automaticamente do número de origem)
Bot:  Qual é o seu CEP? (para recomendarmos eventos perto de você)
User: 04617-011
      [alternativa] "Não sei o CEP — clique aqui para selecionar seu bairro ou compartilhar localização"
Bot:  Em que funções você se interessa em trabalhar?
      [lista de funções ativas com seleção múltipla]
Bot:  Vamos agora pegar o seu documento. Me mande uma foto do seu RG.
User: [foto RG]
Bot:  Ok, recebi. Me mande agora uma selfie segurando o documento.
User: [selfie com documento]
Bot:  Cadastro finalizado! Informe sua chave Pix que enviaremos R$ 5,00 de bônus.
User: (11)99993-3333
Bot:  Aguarde, estamos realizando o Pix.
Bot:  Pronto! Seu Pix de R$ 5,00 foi realizado. Segue seu recibo em anexo.
      Trabalhar com a gente é assim — tudo simples e rápido. Dinheiro na mão.
```

**Dados coletados:** nome, telefone (automático), CEP/localização, funções de interesse, foto RG, selfie+doc, chave Pix.  
**Pós-cadastro:** envio automático de mensagem com instruções iniciais da plataforma.

---

## Caso de uso 2 — Boas-vindas pós-cadastro (site ou app)

Quando o profissional se cadastra pelo formulário web ou app, a plataforma envia automaticamente uma mensagem de boas-vindas para ativar o canal:

```
Bot: Oi José, boa tarde.
     Obrigado pelo seu cadastro.
     Esse é o nosso chat — por aqui você será avisado de novas vagas e poderá interagir conosco.
```

**Gatilho:** finalização do cadastro (webhook pós-insert em `professionals`).  
**Pré-requisito:** `whatsapp_opt_in = true` (checkbox de autorização no formulário — a avaliar inclusão).

---

## Caso de uso 3 — Envio de oferta de vaga

Quando uma vaga é criada e o profissional é selecionado pelo matchmaking, o convite é enviado via WhatsApp além da notificação in-app:

```
Bot: Oi João, temos uma nova vaga de Segurança para início hoje às 18h. Interessa?
     Clique para saber mais: [link deep link para o app]
```

**Gatilho:** vaga com `worker_status = 'INVITED'` criada para o profissional.  
**Prazo:** respeitar o `current_offer_expires_at` da vaga.

---

## Caso de uso 4 — Notificações ao longo da contratação

Mensagens de acompanhamento durante o ciclo de vida do evento:

| Momento | Mensagem |
|---------|----------|
| 6h antes | Briefing do evento (uniforme, alimentação, transporte) |
| 60min antes | Alerta urgente: "Você está a caminho?" + CTA |
| Profissional não marcou deslocamento | Lembrete de ativar "Estou a caminho" |
| Check-in confirmado | Confirmação para o contratante |

**Observação:** check-in pelo WhatsApp também pode ser implementado (profissional responde uma palavra-chave para confirmar chegada).

---

## Caso de uso 5 — Aviso de pagamento

Após o pagamento do profissional ser processado, notificação via WhatsApp:

```
Bot: Oi João, você recebeu um Pix de R$ 150,00 referente ao trabalho prestado hoje.
     [anexo: comprovante/recibo]
```

**Gatilho:** `vagas.paid_at` preenchido ou evento de pagamento confirmado.

---

## Caso de uso 6 — Avaliação do contratante pós-evento

Ao final do evento, profissional recebe pesquisa de avaliação do contratante via WhatsApp:

```
Bot: Oi João, como foi o evento de hoje?
     Avalie de 1 a 5 a sua experiência com o contratante.
User: 4
Bot:  Obrigado pelo feedback!
```

**Gatilho:** `worker_status = 'CHECKED_OUT'` + período de carência (ex: 30 min após checkout).

---

## Caso de uso 7 — Grupo de WhatsApp por evento

No cadastro de um evento, o contratante tem a opção **"Criar grupo de WhatsApp para o Evento"**.

**Comportamento esperado:**
- Grupo criado com o nome do evento
- Participantes iniciais: plataforma (admin do grupo) + contratante
- Profissionais adicionados automaticamente conforme aceitam a vaga
- Contratante pode definir quem pode postar (só admins ou todos)
- Grupo usado como canal de comunicação ao longo do evento

**Status atual:** campo `events.whatsapp_group_link` já existe no banco (link de convite manual — fallback enquanto não há API automática).  
**Limitação conhecida:** a API oficial do WhatsApp Business **não suporta criação de grupos programaticamente**. Alternativas: Z-API / Evolution API (não-oficiais) ou link manual preenchido pelo contratante.

---

## Provedor — decisão pendente

| Provedor | Tipo | Cria grupos | Estabilidade | Indicado para |
|----------|------|-------------|--------------|---------------|
| **Z-API** | Não-oficial | ✅ Sim | Médio (risco de ban) | MVP / testes |
| **Evolution API** | Não-oficial (self-host) | ✅ Sim | Médio | MVP com mais controle |
| **Twilio** | Oficial Meta | ❌ Não | Alto | Produção estável |
| **360dialog** | Oficial Meta | ❌ Não | Alto | Produção estável |

**Casos de uso que exigem provedor não-oficial:** criação automática de grupos (caso 7).  
**Casos de uso compatíveis com API oficial:** todos os demais (1–6).

---

## Impacto no banco (já preparado)

- `users.whatsapp_opt_in` — autorização do profissional
- `users.phone` — número de destino
- `events.whatsapp_group_link` — link do grupo (preenchimento manual ou automático)
- Gatilhos de disparo já mapeados nas funções PL/pgSQL das vagas
