from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import date

OUTPUT = "/Users/fabricio/EventPro/EventPro_Regras_Profissionais.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2.5*cm, bottomMargin=2*cm,
    title="EventPro — Regras para Profissionais",
    author="EventPro"
)

W, H = A4
PRIMARY   = colors.HexColor("#5a5a40")
SECONDARY = colors.HexColor("#6b705c")
ACCENT    = colors.HexColor("#d4a373")
LIGHT     = colors.HexColor("#f5f5f0")
ERROR     = colors.HexColor("#ba1a1a")
WHITE     = colors.white
DARK      = colors.HexColor("#2d2d2a")

styles = getSampleStyleSheet()

def s(name, **kw):
    return ParagraphStyle(name, **kw)

COVER_TITLE = s("CoverTitle",
    fontName="Helvetica-Bold", fontSize=32, textColor=WHITE,
    alignment=TA_CENTER, spaceAfter=8)

COVER_SUB = s("CoverSub",
    fontName="Helvetica", fontSize=13, textColor=colors.HexColor("#e9edc9"),
    alignment=TA_CENTER, spaceAfter=4)

COVER_DATE = s("CoverDate",
    fontName="Helvetica", fontSize=10, textColor=colors.HexColor("#ccd5ae"),
    alignment=TA_CENTER)

SECTION = s("Section",
    fontName="Helvetica-Bold", fontSize=14, textColor=PRIMARY,
    spaceBefore=18, spaceAfter=6, borderPadding=(0,0,4,0))

SUBSECTION = s("SubSection",
    fontName="Helvetica-Bold", fontSize=11, textColor=SECONDARY,
    spaceBefore=10, spaceAfter=4)

BODY = s("Body",
    fontName="Helvetica", fontSize=10, textColor=DARK,
    leading=16, alignment=TA_JUSTIFY, spaceAfter=4)

BULLET = s("Bullet",
    fontName="Helvetica", fontSize=10, textColor=DARK,
    leading=15, leftIndent=16, bulletIndent=4, spaceAfter=3)

NOTE = s("Note",
    fontName="Helvetica-Oblique", fontSize=9, textColor=SECONDARY,
    leading=13, leftIndent=12, spaceAfter=4)

HIGHLIGHT = s("Highlight",
    fontName="Helvetica-Bold", fontSize=10, textColor=PRIMARY,
    leading=14, leftIndent=12, spaceAfter=2)

story = []

# ── CAPA ──────────────────────────────────────────────────────────────
def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # faixa decorativa
    canvas.setFillColor(colors.HexColor("#4a4a30"))
    canvas.rect(0, H*0.38, W, H*0.02, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, H*0.36, W, H*0.02, fill=1, stroke=0)
    canvas.restoreState()

story.append(Spacer(1, 5*cm))
story.append(Paragraph("EventPro", COVER_TITLE))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Guia de Regras para Profissionais", COVER_SUB))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Versão 1.0 — Ambiente de Testes", COVER_DATE))
story.append(Paragraph(f"Emitido em {date.today().strftime('%d/%m/%Y')}", COVER_DATE))
story.append(Spacer(1, 10*cm))

# ── QUEBRA DE PÁGINA ──
from reportlab.platypus import PageBreak
story.append(PageBreak())

def add_section(title):
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=4))
    story.append(Paragraph(title, SECTION))

def add_sub(title):
    story.append(Paragraph(title, SUBSECTION))

def add_body(text):
    story.append(Paragraph(text, BODY))

def add_bullet(items):
    for item in items:
        story.append(Paragraph(f"&bull; &nbsp; {item}", BULLET))

def add_note(text):
    story.append(Paragraph(f"<i>Obs.: {text}</i>", NOTE))

def add_box(title, items, color=LIGHT):
    data = [[Paragraph(f"<b>{title}</b>", s("bh", fontName="Helvetica-Bold",
        fontSize=10, textColor=PRIMARY))]]
    for item in items:
        data.append([Paragraph(f"• {item}", BODY)])
    t = Table(data, colWidths=[W - 5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), color),
        ("BACKGROUND", (0,1), (-1,-1), WHITE),
        ("BOX", (0,0), (-1,-1), 1, PRIMARY),
        ("LINEBELOW", (0,0), (-1,0), 1, PRIMARY),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

# ══════════════════════════════════════════════════════════════════════
# 1. QUEM PODE SER PROFISSIONAL
# ══════════════════════════════════════════════════════════════════════
add_section("1. Quem Pode Ser Profissional na EventPro")

add_body(
    "A EventPro conecta profissionais da área de eventos a clientes (produtores e organizadores) "
    "de forma semelhante ao modelo Uber — a plataforma realiza o matching inteligente, você recebe "
    "o convite e decide aceitar ou não."
)

add_sub("1.1 Categorias aceitas")
add_bullet([
    "Garçom / Barman",
    "DJ",
    "Segurança / Vigilante",
    "Limpeza e Manutenção",
    "Fotógrafo / Videógrafo",
    "Mestre de Cerimônias",
    "Produtor de Eventos",
    "Controlador de Acesso",
])

add_sub("1.2 Requisitos obrigatórios")
add_bullet([
    "Possuir MEI (Microempreendedor Individual) ativo — necessário para emissão de nota fiscal",
    "Enviar documentação completa durante o cadastro",
    "Ter conta bancária ou chave Pix vinculada ao CNPJ do MEI para recebimento",
])
add_note(
    "Profissionais sem MEI ficam com cadastro bloqueado até regularização. "
    "A plataforma poderá flexibilizar esse requisito em versões futuras mediante análise."
)

# ══════════════════════════════════════════════════════════════════════
# 2. CADASTRO E ATIVAÇÃO
# ══════════════════════════════════════════════════════════════════════
add_section("2. Cadastro e Ativação da Conta")

add_body(
    "O processo de cadastro é simples e rápido. Após a confirmação do e-mail e envio da "
    "documentação, sua conta será ativada pela equipe EventPro."
)

add_sub("2.1 Passo a passo")

data = [
    ["Passo", "Ação", "Status"],
    ["1", "Preencher cadastro no app (nome, e-mail, MEI, categoria)", "Imediato"],
    ["2", "Confirmar e-mail recebido", "Automático"],
    ["3", "Enviar documentação (MEI, RG/CPF)", "Até 48h análise"],
    ["4", "Receber R$ 5,00 de bônus via Pix", "Após aprovação"],
    ["5", "Conta ATIVA — receber convites de eventos", "Liberado"],
]
t = Table(data, colWidths=[1.5*cm, 9*cm, 4*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("ALIGN", (0,0), (0,-1), "CENTER"),
    ("ALIGN", (2,0), (2,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
]))
story.append(t)
story.append(Spacer(1, 10))

add_sub("2.2 Bônus de boas-vindas")
add_body(
    "Ao completar o cadastro e ter a documentação aprovada, você recebe <b>R$ 5,00 via Pix</b> "
    "diretamente em sua conta. Este valor é creditado automaticamente como reconhecimento "
    "pelo processo de verificação."
)

# ══════════════════════════════════════════════════════════════════════
# 3. SISTEMA DE ESTRELAS E RANKING
# ══════════════════════════════════════════════════════════════════════
add_section("3. Sistema de Estrelas e Evolução de Cache")

add_body(
    "Quanto mais eventos você trabalha com qualidade, mais estrelas você acumula — "
    "e maior fica o seu cachê por evento. As estrelas são calculadas automaticamente "
    "pela plataforma após cada evento concluído."
)

add_sub("3.1 Tabela de milestones")

data = [
    ["Estrelas", "Mín. Eventos", "Bônus no Cachê", "Requisito Extra"],
    ["⭐ (1 estrela)", "10 eventos", "+10%", "—"],
    ["⭐⭐ (2 estrelas)", "25 eventos", "+20%", "—"],
    ["⭐⭐⭐ (3 estrelas)", "50 eventos", "+35%", "—"],
    ["⭐⭐⭐⭐ (4 estrelas)", "100 eventos", "+50%", "—"],
    ["⭐⭐⭐⭐⭐ (5 estrelas)", "200 eventos", "+75%", "—"],
    ["Bônus Pontualidade", "Qualquer nível", "+10% adicional",
     "Avaliação ≥ 4.5 + chegada antecipada ≥ 70%"],
]
t = Table(data, colWidths=[3.5*cm, 3*cm, 3*cm, 5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("ALIGN", (1,0), (2,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BACKGROUND", (0,7), (-1,7), colors.HexColor("#fff9e6")),
]))
story.append(t)
story.append(Spacer(1, 10))

add_note(
    "O bônus de pontualidade (+10%) é cumulativo ao bônus de estrelas e é concedido "
    "quando sua média de avaliações é ≥ 4.5 E você chegou com 30+ minutos de antecedência "
    "em pelo menos 70% dos seus eventos."
)

add_sub("3.2 Tabela de cachê base por categoria (8 horas)")

data = [
    ["Categoria", "Nível 0 (base)", "Nível 3 (⭐⭐⭐)", "Nível 5 (⭐⭐⭐⭐⭐)"],
    ["Garçom",              "R$ 280,00",   "R$ 378,00",   "R$ 490,00"],
    ["DJ",                  "R$ 800,00",   "R$ 1.080,00", "R$ 1.400,00"],
    ["Segurança",           "R$ 320,00",   "R$ 432,00",   "R$ 560,00"],
    ["Limpeza",             "R$ 200,00",   "R$ 270,00",   "R$ 350,00"],
    ["Fotógrafo",           "R$ 1.200,00", "R$ 1.620,00", "R$ 2.100,00"],
    ["Mestre de Cerimônias","R$ 600,00",   "R$ 810,00",   "R$ 1.050,00"],
    ["Produtor",            "R$ 1.500,00", "R$ 2.025,00", "R$ 2.625,00"],
    ["Controle de Acesso",  "R$ 240,00",   "R$ 324,00",   "R$ 420,00"],
]
t = Table(data, colWidths=[4.5*cm, 3*cm, 3.5*cm, 3.5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), SECONDARY),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("ALIGN", (1,0), (-1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
]))
story.append(t)
story.append(Spacer(1, 10))

add_note("Eventos com duração superior a 8h: cada fração adicional de 4h equivale a 50% do cachê base.")

# ══════════════════════════════════════════════════════════════════════
# 4. COMO FUNCIONA O CONVITE DE EVENTO
# ══════════════════════════════════════════════════════════════════════
story.append(PageBreak())
add_section("4. Como Funciona o Convite de Evento")

add_body(
    "O modelo da EventPro é semelhante ao Uber: você não se candidata a vagas — "
    "a plataforma te encontra e envia um convite com base no seu perfil, localização "
    "e disponibilidade."
)

add_sub("4.1 Critérios de seleção pela plataforma")
add_bullet([
    "Proximidade ao local do evento (raio configurável pelo cliente: 1, 2, 5 ou 10 km)",
    "Disponibilidade de horário sem conflito com outros eventos",
    "Nível de estrelas (profissionais com mais estrelas aparecem primeiro)",
    "Histórico de favoritos do cliente (favoritos têm prioridade no convite)",
    "Compatibilidade de distância entre eventos consecutivos",
])

add_sub("4.2 Fluxo do convite")

data = [
    ["Status", "Descrição"],
    ["INVITED", "Você recebeu um convite — aguardando sua resposta"],
    ["ACCEPTED", "Você aceitou — compromisso confirmado"],
    ["DECLINED", "Você recusou — sem penalidade para recusas eventuais"],
    ["IN_TRANSIT", "Você marcou 'Em deslocamento' no app"],
    ["CHECKED_IN", "Você chegou ao local e fez check-in"],
    ["CHECKED_OUT", "Evento concluído — pagamento processado"],
    ["NO_SHOW", "Você não compareceu — anotação registrada no perfil"],
]
t = Table(data, colWidths=[4*cm, 10.5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BACKGROUND", (0,8), (-1,8), colors.HexColor("#fff0f0")),
    ("TEXTCOLOR", (0,8), (0,8), ERROR),
    ("FONTNAME", (0,8), (0,8), "Helvetica-Bold"),
]))
story.append(t)
story.append(Spacer(1, 10))

add_sub("4.3 Conflito de agenda")
add_body(
    "A plataforma verifica automaticamente se você já tem outro compromisso no mesmo período "
    "ou em local incompatível. As regras são:"
)
add_bullet([
    "Não é possível aceitar dois eventos com horários sobrepostos",
    "Se o evento anterior termina menos de 1h antes do próximo E os locais distam mais de 10km, "
    "o convite não será enviado",
    "Você pode aceitar eventos consecutivos se houver tempo hábil de deslocamento",
])

# ══════════════════════════════════════════════════════════════════════
# 5. DESLOCAMENTO E CHECK-IN
# ══════════════════════════════════════════════════════════════════════
add_section("5. Deslocamento e Check-in")

add_sub("5.1 Marcar 'Em deslocamento'")
add_body(
    "Quando você sair de casa em direção ao evento, abra o app e clique em "
    "<b>'Em deslocamento'</b>. Isso:"
)
add_bullet([
    "Ativa seu GPS para que o cliente acompanhe sua chegada em tempo real",
    "Confirma ao cliente que você está a caminho",
    "O rastreamento é desligado automaticamente ao fazer check-in no local",
])
add_note("O GPS só é ativado após você clicar no botão — nunca rastreamos em segundo plano.")

add_sub("5.2 Alerta de 60 minutos")
add_body(
    "Se faltarem 60 minutos para o início do evento e você ainda não marcou "
    "'Em deslocamento', o sistema enviará um alerta via <b>notificação push</b> e "
    "<b>WhatsApp</b> (se habilitado). "
    "O cliente também será notificado."
)

add_sub("5.3 Chegada antecipada — um diferencial valorizado")
add_body(
    "Chegar antes do evento é uma das formas mais eficientes de se destacar na plataforma. "
    "Isso permite conhecer o espaço, conversar com o cliente e se preparar para oferecer "
    "um serviço de excelência."
)

data = [
    ["Antecedência na chegada", "Pontuação de Pontualidade"],
    ["60 minutos ou mais antes",   "10 / 10 pontos"],
    ["30 a 59 minutos antes",      "8 / 10 pontos"],
    ["15 a 29 minutos antes",      "6 / 10 pontos"],
    ["0 a 14 minutos antes",       "5 / 10 pontos"],
    ["Atraso",                     "0 / 10 pontos"],
]
t = Table(data, colWidths=[9*cm, 5.5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), SECONDARY),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("ALIGN", (1,0), (1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BACKGROUND", (0,6), (-1,6), colors.HexColor("#fff0f0")),
]))
story.append(t)
story.append(Spacer(1, 8))

add_note(
    "A pontuação de pontualidade entra no cálculo das suas avaliações e contribui "
    "diretamente para a evolução das suas estrelas."
)

# ══════════════════════════════════════════════════════════════════════
# 6. AVALIAÇÕES E CRITÉRIOS
# ══════════════════════════════════════════════════════════════════════
story.append(PageBreak())
add_section("6. Sistema de Avaliação")

add_body(
    "Após cada evento, o cliente avalia você e você avalia o cliente. "
    "As avaliações são baseadas em critérios com pesos diferentes — "
    "não é apenas uma nota única de 1 a 5."
)

add_sub("6.1 Critérios que o cliente avalia em você")

data = [
    ["Critério", "Peso", "O que é avaliado"],
    ["Pontualidade",       "2.0x", "Chegou no horário ou antes para conhecer o espaço"],
    ["Qualidade Técnica",  "2.0x", "Executou o serviço com competência e qualidade"],
    ["Apresentação",       "1.5x", "Visual, uniforme e postura adequados ao evento"],
    ["Proatividade",       "1.5x", "Antecipou necessidades sem precisar ser solicitado"],
    ["Comunicação",        "1.0x", "Respondeu chamados e manteve o cliente informado"],
    ["Trabalho em Equipe", "1.0x", "Colaborou bem com outros profissionais do evento"],
    ["Impressão Geral",    "1.0x", "Avaliação geral do profissional no evento"],
]
t = Table(data, colWidths=[4.5*cm, 1.5*cm, 8.5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("ALIGN", (1,0), (1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
]))
story.append(t)
story.append(Spacer(1, 10))

add_sub("6.2 Critérios que você avalia no cliente")
add_bullet([
    "Clareza do briefing — o cliente explicou bem o que era esperado (peso 2.0x)",
    "Respeito e cordialidade — tratamento respeitoso durante todo o evento (peso 2.0x)",
    "Agilidade no pagamento — confirmado sem problemas (peso 2.0x)",
    "Estrutura oferecida — local adequado, materiais e condições de trabalho (peso 1.5x)",
    "Impressão geral (peso 2.5x)",
])
add_note(
    "Sua avaliação do cliente é confidencial e ajuda a plataforma a identificar "
    "clientes que oferecem boas condições de trabalho."
)

# ══════════════════════════════════════════════════════════════════════
# 7. PAGAMENTO
# ══════════════════════════════════════════════════════════════════════
add_section("7. Pagamento")

add_sub("7.1 Como funciona")
add_body(
    "O pagamento é realizado <b>via Pix</b> diretamente pela plataforma EventPro. "
    "Você não precisa cobrar o cliente diretamente."
)
add_bullet([
    "O cliente paga à plataforma via Pix ou créditos da conta",
    "A EventPro retém a comissão (15% sobre o valor total)",
    "O valor líquido é transferido para sua conta após o checkout do evento",
    "Cada profissional recebe individualmente na sua conta da plataforma",
])

add_sub("7.2 Duração e frações")

add_box("Regra de duração", [
    "Evento de até 8 horas: cachê integral conforme tabela",
    "Cada fração adicional de 4 horas: 50% do cachê base",
    "Exemplo: evento de 10h = cachê integral + 50% (total: 150%)",
])

add_sub("7.3 Multiplicadores de preço")

data = [
    ["Situação", "Multiplicador", "Descrição"],
    ["Normal",       "1.00x", "Contratação padrão com antecedência"],
    ["Emergência",   "1.50x", "Convocado com urgência para substituir ausente"],
    ["Fora de hora", "1.25x", "Eventos em horários atípicos"],
]
t = Table(data, colWidths=[3.5*cm, 3*cm, 8*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), SECONDARY),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("ALIGN", (1,0), (1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BACKGROUND", (0,2), (-1,2), colors.HexColor("#fff9e6")),
    ("FONTNAME", (0,2), (0,2), "Helvetica-Bold"),
]))
story.append(t)
story.append(Spacer(1, 8))

add_note(
    "Em situações de emergência, além do multiplicador de 1.5x, a plataforma pode "
    "providenciar transporte (ex.: Uber) pago pela EventPro para garantir sua chegada ao evento. "
    "Esses eventos de emergência também rendem estrelas extras."
)

# ══════════════════════════════════════════════════════════════════════
# 8. NO-SHOW E PENALIDADES
# ══════════════════════════════════════════════════════════════════════
add_section("8. Ausência e Penalidades (No-Show)")

add_body(
    "O compromisso com o cliente é o pilar da sua reputação na plataforma. "
    "Não comparecer a um evento sem aviso prévio é uma falta grave."
)

add_sub("8.1 O que acontece em caso de no-show")
add_bullet([
    "Anotação registrada automaticamente no seu perfil",
    "A plataforma aciona imediatamente um substituto de emergência",
    "O substituto recebe o multiplicador de emergência (1.5x) no cachê",
    "Múltiplos no-shows podem resultar em suspensão ou bloqueio da conta",
])

add_box("Importante", [
    "Se você souber com antecedência que não poderá comparecer, entre em contato "
    "com o suporte da EventPro o quanto antes. Cancelamentos antecipados são tratados "
    "de forma diferente de ausências sem aviso.",
], color=colors.HexColor("#fff0f0"))

# ══════════════════════════════════════════════════════════════════════
# 9. FAVORITOS E VANTAGENS
# ══════════════════════════════════════════════════════════════════════
add_section("9. Favoritos e Vantagens para Profissionais Recorrentes")

add_body(
    "Clientes podem favoritar profissionais com quem tiveram boas experiências. "
    "Ser favoritado é um dos maiores diferenciais na plataforma."
)

add_bullet([
    "Profissionais favoritados aparecem em primeiro lugar na busca do cliente",
    "A plataforma prioriza o envio de convites para favoritos antes de buscar outros",
    "Equipes inteiras podem ser salvas pelo cliente para reuso em futuros eventos",
    "Ser recorrente com o mesmo cliente tende a aumentar sua avaliação média",
])

# ══════════════════════════════════════════════════════════════════════
# 10. NOTIFICAÇÕES
# ══════════════════════════════════════════════════════════════════════
add_section("10. Notificações")

add_bullet([
    "Notificação push no celular para novos convites de eventos",
    "Alerta 60 minutos antes do evento se o deslocamento não foi confirmado",
    "WhatsApp (opcional): ative nas configurações para receber avisos também por lá",
    "Notificação de pagamento após conclusão do evento",
    "Alertas de emergência: serviços urgentes com destaque especial no app",
])

# ══════════════════════════════════════════════════════════════════════
# RODAPÉ / CONTATO
# ══════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 1*cm))
story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
story.append(Paragraph(
    "EventPro &mdash; Gestão inteligente de eventos &nbsp;|&nbsp; "
    f"eventpro-black.vercel.app &nbsp;|&nbsp; Versão 1.0 &mdash; {date.today().strftime('%d/%m/%Y')}",
    s("footer", fontName="Helvetica", fontSize=8, textColor=SECONDARY, alignment=TA_CENTER)
))

# ── BUILD ──
def first_page(canvas, doc):
    cover_page(canvas, doc)

def later_pages(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SECONDARY)
    canvas.drawString(2*cm, 1.2*cm, "EventPro — Regras para Profissionais")
    canvas.drawRightString(W - 2*cm, 1.2*cm, f"Pág. {doc.page}")
    canvas.restoreState()

doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
print(f"PDF gerado: {OUTPUT}")
