# EventPro — Regras de Notificação do Cliente

## 1. Canais por Prioridade

| Canal | Quando usar |
|---|---|
| **Push (app)** | Todas as notificações rotineiras |
| **WhatsApp** | Apenas emergências — profissional não compareceu, substituto acionado |

> O WhatsApp do cliente **não** é usado para atualizações de rotina.
> É reservado para situações críticas que exigem atenção imediata.

---

## 2. Notificações Push — Fluxo Completo

### 2.1 Criação do evento
| Momento | Mensagem |
|---|---|
| Evento criado | _"Evento [Nome] criado! Buscando profissionais..."_ |
| Profissional convidado | (silencioso — aguarda confirmação) |
| Profissional confirmado | _"[Nome] confirmou presença no seu evento!"_ |
| Equipe completa | _"Sua equipe está completa para [Nome do evento]!"_ |

### 2.2 Pré-evento
| Momento | Mensagem |
|---|---|
| 24h antes | _"Seu evento [Nome] é amanhã! Equipe confirmada: X profissionais."_ |
| 60 min antes — profissional sem deslocamento | _"Atenção: [Nome do profissional] ainda não confirmou deslocamento."_ |
| Profissional a caminho | _"[Nome] está a caminho do seu evento. Acompanhe no mapa!"_ |
| Profissional chegou | _"[Nome] chegou ao local!"_ |
| Profissional chegou cedo (60+ min) | _"[Nome] chegou 60 minutos antes — ótimo para o briefing!"_ |

### 2.3 Durante o evento
> **Silêncio**: das `starts_at` até `ends_at` + 30min, nenhuma notificação de rotina.
> Exceção: emergências críticas (ver seção 3).

### 2.4 Pós-evento
| Momento | Mensagem |
|---|---|
| Evento concluído | _"Evento [Nome] concluído! Avalie sua equipe."_ |
| Pagamento processado | _"Pagamento de R$ [valor] processado com sucesso."_ |
| Avaliação pendente | Lembrete após 2h se ainda não avaliou |

---

## 3. WhatsApp — Apenas Emergências

Acionado **somente** nas seguintes situações:

| Situação | Mensagem |
|---|---|
| No-show de profissional | _"⚠️ [Nome] não compareceu ao evento. Acionando substituto de emergência agora."_ |
| Substituto confirmado | _"✅ Substituto encontrado! [Nome] está a caminho. ETA: X min."_ |
| Falha na busca de substituto | _"⚠️ Não encontramos substituto próximo. Entre em contato com o suporte."_ |
| Cancelamento crítico | _"⚠️ Seu evento [Nome] foi afetado. Acesse o app para mais detalhes."_ |

---

## 4. Regras Gerais

- Cliente recebe push **somente** se o app estiver instalado e com notificações ativas
- WhatsApp exige opt-in no cadastro (campo `whatsapp_opt_in` na tabela `users`)
- Durante o evento: **silêncio total** de push — respeita o cliente que está trabalhando
- Após o evento: máximo **2 lembretes** de avaliação (evitar spam)
- Notificações de rotina não acordam o celular em modo não-perturbe (prioridade normal)
- Notificações de emergência usam prioridade alta (podem furar não-perturbe)
