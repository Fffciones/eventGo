# Gera docs/fase7_pagamento_decisoes.pdf a partir do conteúdo da Fase 7.
# Uso: python3 docs/.gen_fase7_pdf.py  (script descartável, não versionar)
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont("ArialUni", "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"))

# ── Paleta ──────────────────────────────────────────────────────────────
PRIMARY   = colors.HexColor("#1e3a5f")   # azul-marinho
ACCENT    = colors.HexColor("#0d9488")   # teal
LIGHT_BG  = colors.HexColor("#f1f5f9")
HEAD_BG   = colors.HexColor("#1e3a5f")
ROW_ALT   = colors.HexColor("#f8fafc")
WARN_BG   = colors.HexColor("#fff7ed")
WARN_BD   = colors.HexColor("#fb923c")
ASK_BG    = colors.HexColor("#eef2ff")
ASK_BD    = colors.HexColor("#6366f1")
OK_GREEN  = colors.HexColor("#15803d")
GRID      = colors.HexColor("#cbd5e1")

ss = getSampleStyleSheet()
def st(name, **kw):
    base = kw.pop("base", "Normal")
    s = ParagraphStyle(name, parent=ss[base], **kw)
    return s

H1   = st("H1", base="Heading1", fontName="Helvetica-Bold", fontSize=17, leading=21,
          textColor=PRIMARY, spaceBefore=14, spaceAfter=6)
H2   = st("H2", base="Heading2", fontName="Helvetica-Bold", fontSize=13, leading=17,
          textColor=PRIMARY, spaceBefore=12, spaceAfter=4)
BODY = st("BODY", fontName="Helvetica", fontSize=9.5, leading=14, spaceAfter=6,
          textColor=colors.HexColor("#1f2937"))
CELL = st("CELL", fontName="Helvetica", fontSize=8.5, leading=12,
          textColor=colors.HexColor("#1f2937"))
CELLB= st("CELLB", base="CELL" if False else "Normal", fontName="Helvetica-Bold",
          fontSize=8.5, leading=12, textColor=colors.HexColor("#1f2937"))
CELLH= st("CELLH", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
          textColor=colors.white)
OK   = st("OK", fontName="ArialUni", fontSize=8.5, leading=12, textColor=OK_GREEN)
ASK  = st("ASK", fontName="Helvetica", fontSize=9.5, leading=14,
          textColor=colors.HexColor("#312e81"))
WARN = st("WARN", fontName="Helvetica", fontSize=9.5, leading=14,
          textColor=colors.HexColor("#7c2d12"))
SMALL= st("SMALL", fontName="Helvetica-Oblique", fontSize=8, leading=11,
          textColor=colors.HexColor("#64748b"))

def ask_box(text):
    t = Table([[Paragraph(f"<b>Pergunta ao cliente:</b> {text}", ASK)]],
              colWidths=[166*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), ASK_BG),
        ("LINEBEFORE", (0,0), (0,-1), 3, ASK_BD),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return t

def warn_box(text):
    t = Table([[Paragraph(f"<b>Atenção:</b> {text}", WARN)]], colWidths=[166*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), WARN_BG),
        ("LINEBEFORE", (0,0), (0,-1), 3, WARN_BD),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return t

def make_table(headers, rows, widths, align_left=True):
    data = [[Paragraph(h, CELLH) for h in headers]]
    for r in rows:
        data.append([c if not isinstance(c, str) else Paragraph(c, CELL) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0,0), (-1,0), HEAD_BG),
        ("GRID", (0,0), (-1,-1), 0.5, GRID),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0,i), (-1,i), ROW_ALT))
    t.setStyle(TableStyle(style))
    return t

def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    # header rule
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, h-12*mm, w, 12*mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(22*mm, h-8*mm, "EventPro — Fase 7: Pagamento (Pix)")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w-22*mm, h-8*mm, "Documento de decisões · rev. 11/06/2026")
    # footer
    canvas.setFillColor(colors.HexColor("#94a3b8"))
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(w/2, 10*mm, f"EventPro · confidencial · página {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(
    "docs/fase7_pagamento_decisoes.pdf", pagesize=A4,
    leftMargin=22*mm, rightMargin=22*mm, topMargin=22*mm, bottomMargin=18*mm,
    title="EventPro — Fase 7: Pagamento (Pix) — Decisões",
    author="EventPro",
)

E = []  # story

# ── Capa compacta / título ──────────────────────────────────────────────
E.append(Paragraph("Fase 7 — Pagamento (Pix)", st("T", fontName="Helvetica-Bold",
        fontSize=24, leading=28, textColor=PRIMARY)))
E.append(Paragraph("Documento de decisões para o cliente", st("ST",
        fontName="Helvetica", fontSize=12, leading=16, textColor=ACCENT, spaceAfter=10)))
E.append(Paragraph(
    "<b>Objetivo:</b> apresentar as decisões de negócio que precisam ser tomadas "
    "<b>antes</b> de implementarmos a integração de pagamento real. A mecânica interna "
    "de cobrança e repasse já está construída e testada — falta escolher o provedor e "
    "definir as regras do fluxo do dinheiro.", BODY))
E.append(Paragraph("Data: 11/06/2026 &nbsp;·&nbsp; Status: aguardando definições do cliente", SMALL))
E.append(Spacer(1, 6))

# ── 1. O que já está pronto ────────────────────────────────────────────
E.append(Paragraph("1. O que já está pronto (Etapa 4 — concluída)", H1))
E.append(Paragraph("A plataforma já possui toda a <b>contabilidade interna</b> do ciclo de pagamento:", BODY))
ok = lambda txt: Paragraph(f'<font color="#15803d"><b>✓</b></font> {txt}', CELL)
E.append(make_table(
    ["Componente", "O que faz", "Estado"],
    [
        ["Pedido com total estimado", "Cada evento calcula o valor total (soma das vagas)", ok("Funcionando")],
        ["Método de pagamento", "Contratante escolhe: limite de crédito ou cartão", ok("Funcionando (sem captura real)")],
        ["Status de cobrança", "PENDING → AUTHORIZED → CHARGED / FAILED", ok("Funcionando")],
        ["Finalização da contratação", "Contratante avalia e “paga” o profissional ao final", ok("Funcionando")],
        ["Registro Pix do repasse", "Tabela própria com chave Pix, valor, status e campo para o ID do provedor", ok("Pronta para integrar")],
        ["Chave Pix do profissional", "Cadastrada no perfil do app do profissional", ok("Funcionando")],
        ["Margem da plataforma", "Preço ao contratante ≠ remuneração ao profissional, por função e por tipo (MEI/Diarista)", ok("Funcionando")],
        ["Cobrança manual pelo admin", "Admin marca a cobrança do evento como efetuada", ok("Funcionando (placeholder)")],
    ],
    [42*mm, 84*mm, 40*mm],
))
E.append(Spacer(1, 4))
E.append(Paragraph(
    "<b>Em resumo:</b> hoje o dinheiro “circula” dentro do sistema de forma simulada. "
    "A Fase 7 substitui essa simulação por movimentação financeira real. O sistema foi "
    "desenhado para que essa troca seja pontual — não exige reescrever telas nem fluxos.", BODY))

# ── 2. Fluxo do dinheiro ───────────────────────────────────────────────
E.append(Paragraph("2. Como o dinheiro flui (modelo atual)", H1))
flow = make_table(
    ["Passo", "Quem", "O que acontece"],
    [
        ["1", "Contratante", "Cria o evento — o sistema calcula o total estimado"],
        ["2", "Profissionais", "Aceitam as vagas (matchmaking direcionado ou oferta aberta)"],
        ["3", "Equipe", "Evento acontece: em deslocamento → check-in → check-out"],
        ["4", "Contratante", "Finaliza a contratação e avalia cada profissional"],
        ["5", "Plataforma", "Repassa a remuneração-base ao profissional (Pix)"],
        ["6", "Plataforma", "Cobra o contratante (preço cheio das funções)"],
    ],
    [16*mm, 32*mm, 118*mm],
)
E.append(flow)
E.append(Spacer(1, 4))
E.append(Paragraph(
    "A <b>margem da plataforma</b> é a diferença entre o <b>preço por função</b> (pago pelo "
    "contratante) e a <b>remuneração-base</b> (recebida pelo profissional), ambos definidos "
    "pelo administrador na tabela de Funções.", BODY))

# ── 3. Decisões ────────────────────────────────────────────────────────
E.append(Paragraph("3. Decisões necessárias", H1))

# D1
E.append(KeepTogether([
    Paragraph("Decisão 1 — Provedor de pagamento (PSP)", H2),
    Paragraph("Qual provedor processará os pagamentos reais?", BODY),
    make_table(
        ["Opção", "Prós", "Contras"],
        [
            ["<b>Mercado Pago</b>", "Marca conhecida no BR; Pix + cartão; split de pagamento nativo (Marketplace); boa documentação", "Taxas médias; conta vinculada ao ecossistema MP"],
            ["<b>Asaas</b>", "Forte em Pix e cobranças; transferência Pix para terceiros (repasse); suporte BR", "Menos conhecido pelo público final"],
            ["<b>Pagar.me / Stone</b>", "Split nativo; robusto para marketplace", "Processo comercial mais longo"],
            ["<b>Efí (ex-Gerencianet)</b>", "Pix barato; API Pix completa (cobrança e envio)", "Cartão menos forte"],
        ],
        [34*mm, 76*mm, 56*mm],
    ),
]))
E.append(Spacer(1, 4))
E.append(Paragraph(
    "<b>O que muda na prática:</b> taxas por transação, prazo de liquidação, se o repasse ao "
    "profissional é nativo (split) ou se a plataforma precisa fazer transferências Pix de "
    "saída, e os requisitos de credenciamento (CNPJ, documentação, antecipação).", BODY))
E.append(ask_box("já existe relacionamento bancário/adquirência preferido? "
                 "Há restrição de taxa máxima aceitável por transação?"))

# D2
E.append(KeepTogether([
    Paragraph("Decisão 2 — Fluxo do dinheiro", H2),
    Paragraph("Por onde o dinheiro passa?", BODY),
    Paragraph("<b>Opção A — Plataforma recebe e repassa (conta de passagem)</b>", BODY),
    Paragraph("Contratante paga a plataforma (preço cheio) → plataforma transfere a remuneração "
              "ao profissional via Pix → margem fica na conta da plataforma.<br/>"
              '<font color="#15803d">+ Controle total, simples de conciliar, funciona com qualquer PSP.</font><br/>'
              '<font color="#b45309">– A plataforma “toca” no dinheiro: pode ter implicações fiscais/contábeis '
              "(receita cheia vs. receita de comissão) — validar com o contador.</font>", BODY),
    Paragraph("<b>Opção B — Split automático no PSP</b>", BODY),
    Paragraph("O PSP divide o pagamento na entrada: a parte do profissional vai direto para ele, "
              "a margem vai para a plataforma.<br/>"
              '<font color="#15803d">+ Plataforma não custodia o valor do profissional; contabilidade mais limpa.</font><br/>'
              '<font color="#b45309">– Exige que cada profissional tenha conta/cadastro no PSP (onboarding extra); '
              "nem todo PSP suporta split para Pix.</font>", BODY),
]))
E.append(ask_box("a empresa prefere custodiar o dinheiro (Opção A) ou evitar custódia com "
                 "split (Opção B)? Há orientação do contador?"))

# D3
E.append(KeepTogether([
    Paragraph("Decisão 3 — Momento da cobrança ao contratante", H2),
    Paragraph("Quando o contratante é efetivamente cobrado?", BODY),
    make_table(
        ["Opção", "Como funciona", "Risco"],
        [
            ["<b>Na criação do evento</b> (pré-pago)", "Paga o total estimado ao publicar o evento", "Menor risco de calote; pode afastar contratantes; exige estorno se vagas não preencherem"],
            ["<b>Na confirmação da equipe</b>", "Cobra quando as vagas são preenchidas", "Equilíbrio risco × conveniência"],
            ["<b>Após o evento</b> (pós-pago)", "Cobra na finalização, junto com a avaliação", "Modelo atual do sistema; maior risco de inadimplência"],
            ["<b>Híbrido</b>", "Sinal antecipado (ex.: 30%) + saldo na finalização", "Mais complexo, melhor proteção"],
        ],
        [40*mm, 60*mm, 66*mm],
    ),
]))
E.append(Spacer(1, 4))
E.append(warn_box(
    "hoje o repasse ao profissional acontece na finalização, <b>antes</b> da cobrança real do "
    "contratante. Em produção isso significa que a plataforma <b>adianta</b> o dinheiro. Se isso "
    "não for desejado, é preciso escolher cobrança antecipada (pré-pago ou na confirmação)."))
E.append(Spacer(1, 4))
E.append(ask_box("a plataforma aceita adiantar o repasse, ou a cobrança deve sempre anteceder "
                 "o pagamento ao profissional?"))

# D4
E.append(KeepTogether([
    Paragraph("Decisão 4 — Meios de pagamento de entrada", H2),
    Paragraph("O que o contratante pode usar para pagar?", BODY),
    make_table(
        ["Meio", "Características"],
        [
            ["<b>Pix</b>", "Liquidação imediata; taxa baixa (≈ 0,4–1%); sem chargeback"],
            ["<b>Cartão de crédito</b>", "Conveniência e parcelamento; taxa maior (≈ 3–5%); risco de chargeback; liquidação em D+2 a D+30"],
            ["<b>Limite de crédito (faturado)</b>", "Já existe no sistema: admin define limite por contratante, cobrança consolidada depois. Útil para PJ recorrente"],
        ],
        [48*mm, 118*mm],
    ),
]))
E.append(Spacer(1, 4))
E.append(ask_box("lançamos só com <b>Pix</b> (mais simples e barato) e adicionamos cartão depois, "
                 "ou cartão é obrigatório desde o início? O modelo faturado (limite de crédito) "
                 "continua para clientes PJ selecionados?"))

# D5
E.append(KeepTogether([
    Paragraph("Decisão 5 — Repasse ao profissional: automático ou com aprovação?", H2),
    make_table(
        ["Opção", "Como funciona"],
        [
            ["<b>Automático</b>", "Pix disparado na hora em que o contratante finaliza a contratação"],
            ["<b>Aprovação do admin</b>", "Repasse entra numa fila; admin (perfil financeiro) aprova em lote (ex.: 1× por dia)"],
            ["<b>Janela de segurança</b>", "Automático, mas com retenção de X horas/dias para tratar disputas"],
        ],
        [48*mm, 118*mm],
    ),
]))
E.append(Spacer(1, 4))
E.append(Paragraph(
    "<b>Recomendação técnica:</b> começar com <b>aprovação do admin</b> (ou janela de 24–48h) "
    "enquanto o volume é baixo — protege contra fraude e erro de avaliação — e automatizar "
    "quando houver confiança no fluxo.", BODY))
E.append(ask_box("concorda em iniciar com aprovação manual no painel admin e automatizar depois? "
                 "Qual prazo máximo aceitável para o profissional receber (imediato, D+1, D+2)?"))

# D6
E.append(KeepTogether([
    Paragraph("Decisão 6 — Notas, impostos e comprovantes", H2),
    Paragraph("• <b>Profissional MEI</b> → emite nota fiscal para a plataforma (ou para o contratante?). "
              "Quem cobra/valida a emissão?<br/>"
              "• <b>Profissional Diarista</b> → recibo de pagamento (RPA?). Há retenção de INSS/IRRF a fazer? "
              "<b>Validar com o contador.</b><br/>"
              "• <b>Plataforma</b> → emite NF de quê: do valor cheio ou só da comissão? (Depende da Decisão 2.)", BODY),
]))
E.append(ask_box("já existe orientação contábil sobre o modelo de emissão de notas? "
                 "Podemos agendar uma conversa com o contador da empresa?"))

# D7
E.append(KeepTogether([
    Paragraph("Decisão 7 — Política de cancelamento e estorno", H2),
    Paragraph("Falta definir as regras de dinheiro para os casos de exceção:", BODY),
    make_table(
        ["#", "Cenário", "A definir"],
        [
            ["1", "Contratante cancela o evento <b>antes</b> do preenchimento das vagas", "Estorno integral?"],
            ["2", "Contratante cancela <b>depois</b> das vagas aceitas", "Multa? % para o profissional?"],
            ["3", "Profissional faz <b>no-show</b>", "Contratante não paga aquela vaga; substituto (1,5×) é cobrado como?"],
            ["4", "Evento cancelado <b>durante</b> (força maior)", "Pagamento proporcional?"],
        ],
        [10*mm, 86*mm, 70*mm],
    ),
]))
E.append(Spacer(1, 4))
E.append(ask_box("definir os 4 cenários acima (podemos propor uma tabela-padrão de mercado "
                 "como ponto de partida, se preferir)."))

# ── 4. Checklist ───────────────────────────────────────────────────────
E.append(Paragraph("4. Resumo das perguntas (checklist para resposta)", H1))
E.append(make_table(
    ["#", "Decisão", "Resposta do cliente"],
    [
        ["1", "Provedor de pagamento (PSP)", ""],
        ["2", "Fluxo do dinheiro: custódia (A) ou split (B)", ""],
        ["3", "Momento da cobrança ao contratante", ""],
        ["4", "Meios de entrada no lançamento (Pix só? + cartão? faturado?)", ""],
        ["5", "Repasse: automático, aprovação admin ou janela de retenção", ""],
        ["6", "Modelo fiscal (notas/recibos) — contato do contador", ""],
        ["7", "Política de cancelamento/estorno (4 cenários)", ""],
    ],
    [10*mm, 96*mm, 60*mm],
))

# ── 5. Próximos passos ─────────────────────────────────────────────────
E.append(Paragraph("5. O que acontece depois das respostas", H1))
E.append(Paragraph(
    "Com as 7 decisões tomadas, a implementação da Fase 7 segue esta sequência:", BODY))
E.append(make_table(
    ["#", "Etapa", "Observação"],
    [
        ["1", "Credenciamento no PSP", "Depende do cliente: CNPJ, conta, documentação"],
        ["2", "Integração de cobrança", "Pix dinâmico (QR Code / copia-e-cola) no fluxo escolhido na Decisão 3"],
        ["3", "Integração de repasse", "Transferência Pix ou split, conforme Decisão 2 — campo de ID externo já existe no banco"],
        ["4", "Fila/aprovação no painel admin", "Tela financeira já existe; ganha as ações reais (Decisão 5)"],
        ["5", "Webhooks do PSP", "Confirmação de pagamento atualiza o status da cobrança automaticamente (hoje é manual)"],
        ["6", "Regras de estorno", "Decisão 7, aplicada no fluxo de cancelamento"],
    ],
    [10*mm, 56*mm, 100*mm],
))
E.append(Spacer(1, 6))
E.append(Paragraph(
    "O sistema foi construído com os pontos de integração já reservados (status de cobrança, "
    "tabela de pagamentos Pix com campo para o ID do provedor, transações por vaga). A troca da "
    "simulação pelo provedor real é <b>cirúrgica</b>, não estrutural.", BODY))
E.append(Spacer(1, 10))
E.append(Paragraph("EventPro · Documento técnico-comercial · Fase 7 (Pagamento) · rev. 11/06/2026", SMALL))

doc.build(E, onFirstPage=header_footer, onLaterPages=header_footer)
print("OK: docs/fase7_pagamento_decisoes.pdf")
