# EventPro — Regras da Interface do Profissional e Notificações

## 1. Presença Online e Pontuação

### 1.1 Bônus de tempo online
- O profissional que permanecer **online na plataforma acumula pontos de presença**
- Esses pontos entram como critério de desempate no ranking de busca (além de estrelas e proximidade)
- Objetivo: incentivar profissionais a manterem o app aberto e disponíveis
- Sugestão de implementação: campo `last_seen_at` + `online_score` na tabela `professionals`
- Score decai progressivamente se o profissional ficar offline (ex: -1 ponto por hora offline, +2 por hora online)

### 1.2 Indicador de status no app
- Profissional pode marcar **Disponível / Indisponível** manualmente
- Quando disponível + online: aparece como prioridade nas buscas
- Quando indisponível: não recebe convites mas mantém score de presença pausado

---

## 2. Recebimento de Convites (Notificações)

### 2.1 Prioridade de envio
A plataforma envia convites nesta ordem:
1. Profissional **favoritado pelo cliente** + online + disponível
2. Profissional com **maior score de presença** + próximo à localização do evento
3. Profissional com **maior número de estrelas** dentro do raio de busca
4. Demais profissionais por proximidade

### 2.2 Proximidade residencial
- No cadastro, o profissional informa seu **endereço residencial** (geocodificado)
- Convites são enviados prioritariamente para eventos **dentro do raio de preferência** do profissional
- O profissional pode configurar seu raio de atuação (ex: até 5km, 10km, 20km da residência)

### 2.3 Canais de notificação
- **Push notification** no celular (sempre que o app estiver instalado)
- **WhatsApp** (se opt-in ativado no cadastro)
- Notificações só chegam quando o profissional está com status **Disponível**

---

## 3. Tela de Convite de Evento

### 3.1 O que o profissional vê ao receber o convite
- Nome e tipo do evento
- Data, horário de início e fim
- Local (endereço + distância da residência)
- Cachê oferecido (líquido após comissão)
- Briefing resumido: uniforme, alimentação, ponto de encontro, transporte
- Botões: **Aceitar** | **Recusar**

### 3.2 Regra de confirmação de favoritos
- Quando o convite é de um **cliente que o favoritou**, aparece destaque visual:
  _"Este cliente te favoritou! Confirmar eleva suas estrelas."_
- Aceitar convites de favoritos tem peso **maior na pontuação de estrelas**
- Recusar convites de favoritos repetidamente pode reduzir a prioridade futura

### 3.3 Tempo de resposta
- Profissional tem **X minutos** para responder (a definir, sugestão: 10 min)
- Se não responder, o convite é repassado ao próximo profissional da lista

---

## 4. Mapa na Interface do Profissional

### 4.1 Visualização
- Mapa centralizado na **localização residencial** do profissional
- Pinos marcando os **eventos disponíveis** (convites pendentes)
- Pino da **residência** sempre visível como referência
- Ao clicar em um pino: abre o card de detalhes do evento com opção de aceitar/recusar

### 4.2 Informações nos pinos
- Ícone da categoria do evento (garçom, DJ, segurança, etc.)
- Distância em km da residência
- Cachê oferecido
- Horário do evento

### 4.3 Regra de visibilidade — vagas abertas no mapa
- O profissional **só enxerga eventos da sua própria categoria** no mapa (segurança vê só eventos de segurança, DJ vê só eventos de DJ, etc.)
- Um pino aparece no mapa enquanto o evento ainda tem **vagas abertas** — ou seja, o cliente solicitou N profissionais e ainda não recebeu todas as confirmações
- Exemplo: cliente pediu 10 seguranças, 6 confirmaram → o evento ainda aparece no mapa para os demais seguranças disponíveis com "4 vagas restantes"
- Quando a última vaga é preenchida o pino **desaparece automaticamente** do mapa de todos
- Filtros aplicados para um profissional ver um pino:
  1. Categoria do booking bate com a categoria do profissional
  2. Profissional está com `is_available = true`
  3. Evento está dentro do `action_radius_km` do profissional
  4. Ainda há `booking_professionals` com vagas não preenchidas (INVITED ou sem resposta)

---

## 5. Agenda de Eventos do Profissional

### 5.1 Estrutura da agenda
- Visualização em **lista cronológica** de todos os eventos aceitos
- Status de cada evento: CONFIRMADO / EM TRÂNSITO / CHECKED-IN / CONCLUÍDO
- Filtros: Próximos / Passados / Todos

### 5.2 Card de evento na agenda
- Nome e local do evento
- Data e horário
- Status atual
- Cachê a receber
- Briefing completo (uniforme, alimentação, ponto de encontro)
- Botão de ação conforme o status:
  - Confirmado → **"Estou a caminho"** (ativa deslocamento)
  - Em trânsito → **"Fiz check-in"**
  - Checked-in → **"Concluir evento"**

---

## 6. Notificações Temporais

### 6.1 Alerta de 60 minutos (já implementado)
- Se profissional não marcou deslocamento, recebe push + WhatsApp
- Cliente também é notificado
- Se sem resposta: protocolo de emergência ativado

### 6.2 Alerta de 6 horas antes do evento ⭐ novo
Conteúdo da notificação:
> _"Seu evento [Nome] começa em 6 horas!_
> 👔 Uniforme: [detalhe do briefing]_
> 🍽️ Alimentação: [detalhe do briefing]_
> 📍 Ponto de encontro: [se houver]_
> 🚌 Transporte: [se houver]_
> Lembre-se de marcar 'Estou a caminho' quando sair!"_

### 6.3 Modo silencioso durante o evento ⭐ novo
- Das `starts_at` até `ends_at` + 30 min: **nenhuma notificação enviada** ao profissional
- Exceção: apenas emergências críticas da plataforma (ex: cancelamento do evento)
- Após `ends_at` + 30 min: notificações retomadas normalmente

### 6.4 Notificação pós-evento ⭐ novo
Disparada após `checkout_at` (ou `ends_at` + 1h se não houve checkout):
> _"Evento concluído! 🎉_
> Pagamento de R$ [valor] confirmado e a caminho da sua conta._
> Avalie o evento e ajude a melhorar a plataforma!"_
> [Botão: Avaliar evento]

---

## 7. Regras de Silêncio e Respeito ao Profissional

| Situação | Notificações |
|---|---|
| Profissional disponível + online | Todas as notificações |
| Profissional indisponível | Nenhuma |
| Durante o evento (starts_at → ends_at + 30min) | Silêncio total (exceto emergências) |
| Após o evento | Resumo de pagamento + link de avaliação |
| Alerta de 60 min sem deslocamento | Push + WhatsApp |
| Alerta de 6h pré-evento | Push + WhatsApp com briefing |

---

## 8. Dados Necessários no Cadastro do Profissional (adições)

- `home_address` — endereço residencial (texto)
- `home_location` — coordenadas geocodificadas (geography Point)
- `action_radius_km` — raio de atuação em km (padrão: 10km)
- `online_score` — pontuação acumulada de presença online
- `last_seen_at` — último acesso ao app
- `is_available` — toggle manual de disponibilidade

---

## 9. Implementação Futura (fora do escopo atual)

- Sistema de avaliação mútua pós-evento com critérios ponderados
- Histórico de pagamentos na conta do profissional
- Badge especial para profissionais com alta taxa de resposta a favoritos
- Ranking público de profissionais por categoria na região
