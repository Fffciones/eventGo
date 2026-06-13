# EventPro — Fase 7: Pagamento (Pix)
## Documento de decisões para o cliente

> **Objetivo deste documento:** apresentar as decisões de negócio que precisam ser
> tomadas **antes** de implementarmos a integração de pagamento real. A mecânica
> interna de cobrança e repasse já está construída e testada — falta escolher o
> provedor e definir as regras do fluxo do dinheiro.
>
> Data: 11/06/2026 · Status: aguardando definições do cliente

---

## 1. O que já está pronto (Etapa 4 — concluída)

A plataforma já possui toda a **contabilidade interna** do ciclo de pagamento:

| Componente | O que faz | Estado |
|---|---|---|
| Pedido com total estimado | Cada evento calcula o valor total (soma das vagas) | ✅ Funcionando |
| Método de pagamento | Contratante escolhe: limite de crédito ou cartão | ✅ Funcionando (sem captura real) |
| Status de cobrança | PENDING → AUTHORIZED → CHARGED / FAILED | ✅ Funcionando |
| Finalização da contratação | Contratante avalia e "paga" o profissional ao final | ✅ Funcionando |
| Registro Pix do repasse | Tabela própria com chave Pix, valor, status e campo para o ID do provedor | ✅ Pronta para integrar |
| Chave Pix do profissional | Cadastrada no perfil do app do profissional | ✅ Funcionando |
| Margem da plataforma | Preço ao contratante ≠ remuneração ao profissional, por função e por tipo (MEI/Diarista) | ✅ Funcionando |
| Cobrança manual pelo admin | Admin marca a cobrança do evento como efetuada | ✅ Funcionando (placeholder) |

**Em resumo:** hoje o dinheiro "circula" dentro do sistema de forma simulada.
A Fase 7 substitui essa simulação por movimentação financeira real. O sistema
foi desenhado para que essa troca seja pontual — não exige reescrever telas
nem fluxos.

---

## 2. Como o dinheiro flui (modelo atual)

```
CONTRATANTE                    PLATAFORMA                    PROFISSIONAL
    │                              │                              │
    │ 1. Cria evento               │                              │
    │    (total estimado) ────────▶│                              │
    │                              │ 2. Profissionais aceitam     │
    │                              │    as vagas                  │
    │ 3. Evento acontece           │                              │
    │    (check-in / check-out)    │                              │
    │                              │                              │
    │ 4. Finaliza e avalia ───────▶│ 5. Repasse ao profissional ─▶│
    │                              │    (remuneração-base, Pix)   │
    │ 6. Cobrança do evento ◀──────│                              │
    │    (preço cheio)             │   Margem = preço − remuneração │
```

A margem da plataforma é a diferença entre o **preço por função** (pago pelo
contratante) e a **remuneração-base** (recebida pelo profissional), ambos
definidos pelo admin na tabela de Funções.

---

## 3. Decisões necessárias

### Decisão 1 — Provedor de pagamento (PSP)

Qual provedor processará os pagamentos reais?

| Opção | Prós | Contras |
|---|---|---|
| **Mercado Pago** | Marca conhecida no BR, Pix + cartão, split de pagamento nativo (Marketplace), boa documentação | Taxas médias; conta vinculada ao ecossistema MP |
| **Asaas** | Forte em Pix e cobranças recorrentes, transferência Pix para terceiros (repasse), suporte BR | Menos conhecido pelo público final |
| **Pagar.me / Stone** | Split nativo, robusto para marketplace | Processo comercial mais longo |
| **Efí (ex-Gerencianet)** | Pix barato, API Pix completa (cobrança e envio) | Cartão menos forte |

**O que muda na prática:** taxas por transação, prazo de liquidação, se o
repasse ao profissional é nativo (split) ou se a plataforma precisa fazer
transferências Pix de saída, e os requisitos de credenciamento (CNPJ,
documentação, antecipação).

> ❓ **Pergunta ao cliente:** já existe relacionamento bancário/adquirência
> preferido? Há restrição de taxa máxima aceitável por transação?

---

### Decisão 2 — Fluxo do dinheiro

Por onde o dinheiro passa?

**Opção A — Plataforma recebe e repassa (conta de passagem)**
- Contratante paga a plataforma (preço cheio) → plataforma transfere a
  remuneração ao profissional via Pix → margem fica na conta da plataforma.
- ✅ Controle total, simples de conciliar, funciona com qualquer PSP.
- ⚠️ A plataforma "toca" no dinheiro: pode ter implicações fiscais/contábeis
  (receita cheia vs. receita de comissão) — validar com o contador.

**Opção B — Split automático no PSP**
- O PSP divide o pagamento na entrada: a parte do profissional vai direto
  para ele, a margem vai para a plataforma.
- ✅ Plataforma não custodia o valor do profissional; contabilidade mais limpa.
- ⚠️ Exige que cada profissional tenha conta/cadastro no PSP (onboarding extra);
  nem todo PSP suporta split para Pix.

> ❓ **Pergunta ao cliente:** a empresa prefere custodiar o dinheiro
> (Opção A) ou evitar custódia com split (Opção B)? Há orientação do contador?

---

### Decisão 3 — Momento da cobrança ao contratante

Quando o contratante é efetivamente cobrado?

| Opção | Como funciona | Risco |
|---|---|---|
| **Na criação do evento** (pré-pago) | Paga o total estimado ao publicar o evento | Menor risco de calote; pode afastar contratantes; exige estorno se vagas não preencherem |
| **Na confirmação da equipe** | Cobra quando as vagas são preenchidas | Equilíbrio risco × conveniência |
| **Após o evento** (pós-pago) | Cobra na finalização, junto com a avaliação | Modelo atual do sistema; maior risco de inadimplência |
| **Híbrido** | Sinal antecipado (ex.: 30%) + saldo na finalização | Mais complexo, melhor proteção |

> ⚠️ **Atenção:** hoje o repasse ao profissional acontece na finalização,
> **antes** da cobrança real do contratante. Em produção isso significa que a
> plataforma **adianta** o dinheiro. Se isso não for desejado, é preciso
> escolher cobrança antecipada (pré-pago ou na confirmação).

> ❓ **Pergunta ao cliente:** a plataforma aceita adiantar o repasse, ou a
> cobrança deve sempre anteceder o pagamento ao profissional?

---

### Decisão 4 — Meios de pagamento de entrada

O que o contratante pode usar para pagar?

- **Pix** — liquidação imediata, taxa baixa (≈ 0,4–1%), sem chargeback.
- **Cartão de crédito** — conveniência e parcelamento, taxa maior (≈ 3–5%),
  risco de chargeback, liquidação em D+2 a D+30.
- **Limite de crédito (faturado)** — já existe no sistema: admin define limite
  por contratante, cobrança consolidada depois. Útil para PJ recorrente.

> ❓ **Pergunta ao cliente:** lançamos só com **Pix** (mais simples e barato)
> e adicionamos cartão depois, ou cartão é obrigatório desde o início?
> O modelo faturado (limite de crédito) continua para clientes PJ selecionados?

---

### Decisão 5 — Repasse ao profissional: automático ou com aprovação?

| Opção | Como funciona |
|---|---|
| **Automático** | Pix disparado na hora em que o contratante finaliza a contratação |
| **Aprovação do admin** | Repasse entra numa fila; admin (perfil financeiro) aprova em lote (ex.: 1× por dia) |
| **Janela de segurança** | Automático, mas com retenção de X horas/dias para tratar disputas |

**Recomendação técnica:** começar com **aprovação do admin** (ou janela de
24–48h) enquanto o volume é baixo — protege contra fraude e erro de avaliação —
e automatizar quando houver confiança no fluxo.

> ❓ **Pergunta ao cliente:** concorda em iniciar com aprovação manual no
> painel admin e automatizar depois? Qual prazo máximo aceitável para o
> profissional receber (imediato, D+1, D+2)?

---

### Decisão 6 — Notas, impostos e comprovantes

- **Profissional MEI** → emite nota fiscal para a plataforma (ou para o
  contratante?). Quem cobra/valida a emissão?
- **Profissional Diarista** → recibo de pagamento (RPA?). Há retenção de
  INSS/IRRF a fazer? **Validar com o contador.**
- **Plataforma** → emite NF de quê: do valor cheio ou só da comissão?
  (Depende da Decisão 2.)

> ❓ **Pergunta ao cliente:** já existe orientação contábil sobre o modelo de
> emissão de notas? Podemos agendar uma conversa com o contador da empresa?

---

### Decisão 7 — Política de cancelamento e estorno

Falta definir as regras de dinheiro para os casos de exceção:

1. Contratante cancela o evento **antes** do preenchimento das vagas → estorno integral?
2. Contratante cancela **depois** das vagas aceitas → multa? % para o profissional?
3. Profissional faz **no-show** → contratante não paga aquela vaga; substituto (1,5×) é cobrado como?
4. Evento cancelado **durante** (força maior) → pagamento proporcional?

> ❓ **Pergunta ao cliente:** definir os 4 cenários acima (podemos propor uma
> tabela-padrão de mercado como ponto de partida, se preferir).

---

## 4. Resumo das perguntas (checklist para resposta)

| # | Decisão | Resposta do cliente |
|---|---|---|
| 1 | Provedor de pagamento (PSP) | |
| 2 | Fluxo do dinheiro: custódia (A) ou split (B) | |
| 3 | Momento da cobrança ao contratante | |
| 4 | Meios de entrada no lançamento (Pix só? + cartão? faturado?) | |
| 5 | Repasse: automático, aprovação admin ou janela de retenção | |
| 6 | Modelo fiscal (notas/recibos) — contato do contador | |
| 7 | Política de cancelamento/estorno (4 cenários) | |

---

## 5. O que acontece depois das respostas

Com as 7 decisões tomadas, a implementação da Fase 7 segue esta sequência
(estimativa de esforço técnico, sem bloqueios externos):

1. **Credenciamento no PSP** (depende do cliente: CNPJ, conta, documentação)
2. **Integração de cobrança** — Pix dinâmico (QR Code/copia-e-cola) no fluxo
   escolhido na Decisão 3
3. **Integração de repasse** — transferência Pix ou split, conforme Decisão 2,
   preenchendo o campo de ID externo já existente no banco
4. **Fila/aprovação no painel admin** (Decisão 5) — tela financeira já existe,
   ganha as ações reais
5. **Webhooks do PSP** — confirmação de pagamento atualiza o status da cobrança
   automaticamente (hoje é manual)
6. **Regras de estorno** (Decisão 7) no fluxo de cancelamento

> O sistema foi construído com os pontos de integração já reservados
> (status de cobrança, tabela de pagamentos Pix com campo para o ID do
> provedor, transações por vaga). A troca da simulação pelo provedor real é
> **cirúrgica**, não estrutural.

---

*EventPro · Documento técnico-comercial · Fase 7 (Pagamento) · rev. 11/06/2026*
