from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import date

OUTPUT = "/Users/fabricio/EventPro/EventPro_Regras_Clientes.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2.5*cm, bottomMargin=2*cm,
    title="EventPro — Guia para Clientes",
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

def s(name, **kw):
    return ParagraphStyle(name, **kw)

COVER_TITLE = s("CoverTitle", fontName="Helvetica-Bold", fontSize=32,
    textColor=WHITE, alignment=TA_CENTER, spaceAfter=8)
COVER_SUB = s("CoverSub", fontName="Helvetica", fontSize=13,
    textColor=colors.HexColor("#e9edc9"), alignment=TA_CENTER, spaceAfter=4)
COVER_DATE = s("CoverDate", fontName="Helvetica", fontSize=10,
    textColor=colors.HexColor("#ccd5ae"), alignment=TA_CENTER)
SECTION = s("Section", fontName="Helvetica-Bold", fontSize=14,
    textColor=PRIMARY, spaceBefore=18, spaceAfter=6)
SUBSECTION = s("SubSection", fontName="Helvetica-Bold", fontSize=11,
    textColor=SECONDARY, spaceBefore=10, spaceAfter=4)
BODY = s("Body", fontName="Helvetica", fontSize=10, textColor=DARK,
    leading=16, alignment=TA_JUSTIFY, spaceAfter=4)
BULLET = s("Bullet", fontName="Helvetica", fontSize=10, textColor=DARK,
    leading=15, leftIndent=16, bulletIndent=4, spaceAfter=3)
NOTE = s("Note", fontName="Helvetica-Oblique", fontSize=9, textColor=SECONDARY,
    leading=13, leftIndent=12, spaceAfter=4)
FOOTER = s("Footer", fontName="Helvetica", fontSize=8,
    textColor=SECONDARY, alignment=TA_CENTER)

story = []

# ── CAPA ──────────────────────────────────────────────────────────────
def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(ACCENT)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#c49363"))
    canvas.rect(0, H*0.38, W, H*0.02, fill=1, stroke=0)
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, H*0.36, W, H*0.02, fill=1, stroke=0)
    canvas.restoreState()

def later_pages(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SECONDARY)
    canvas.drawString(2*cm, 1.2*cm, "EventPro — Guia para Clientes")
    canvas.drawRightString(W - 2*cm, 1.2*cm, f"Pág. {doc.page}")
    canvas.restoreState()

story.append(Spacer(1, 5*cm))
story.append(Paragraph("EventPro", COVER_TITLE))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Guia Completo para Clientes", COVER_SUB))
story.append(Paragraph("Produtores e Organizadores de Eventos", COVER_SUB))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Versão 1.0 — Ambiente de Testes", COVER_DATE))
story.append(Paragraph(f"Emitido em {date.today().strftime('%d/%m/%Y')}", COVER_DATE))
story.append(PageBreak())

# ── HELPERS ──────────────────────────────────────────────────────────
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

def make_table(data, colWidths, header_color=PRIMARY):
    t = Table(data, colWidths=colWidths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), header_color),
        ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

# ══════════════════════════════════════════════════════════════════════
# 1. O QUE É A EVENTPRO
# ══════════════════════════════════════════════════════════════════════
add_section("1. O que é a EventPro")

add_body(
    "A EventPro é uma plataforma de gestão inteligente de equipes para eventos. "
    "Funcionamos como o Uber, mas para profissionais de eventos: você cria seu evento, "
    "define quantos e quais profissionais precisa, e a plataforma encontra, convida e "
    "confirma a equipe ideal para você — tudo em tempo real."
)

add_sub("1.1 Quem é o Cliente EventPro")
add_bullet([
    "Produtores e organizadores de eventos",
    "Empresas e pessoas físicas que realizam eventos corporativos, sociais ou culturais",
    "Pode ser cadastrado como pessoa física (CPF) ou empresa (CNPJ)",
    "Acesso via web e mobile (web disponível agora; mobile em breve)",
])

add_sub("1.2 O que você pode contratar")
make_table([
    ["Categoria", "Exemplos de uso"],
    ["Garçom / Barman",       "Buffet, coquetel, serviço de mesa"],
    ["DJ",                    "Animação musical, sonorização"],
    ["Segurança / Vigilante", "Controle de acesso, escolta"],
    ["Limpeza",               "Pré, durante e pós-evento"],
    ["Fotógrafo",             "Cobertura fotográfica e de vídeo"],
    ["Mestre de Cerimônias",  "Casamentos, formaturas, eventos corporativos"],
    ["Produtor de Eventos",   "Gestão completa ou parcial do evento"],
    ["Controle de Acesso",    "Credenciamento, leitura de QR Code"],
], colWidths=[5*cm, 9.5*cm])

# ══════════════════════════════════════════════════════════════════════
# 2. CADASTRO E CONTA
# ══════════════════════════════════════════════════════════════════════
add_section("2. Cadastro e Conta")

add_sub("2.1 Como se cadastrar")
add_bullet([
    "Acesse eventpro-black.vercel.app e clique em 'Criar conta'",
    "Selecione o perfil <b>Cliente</b>",
    "Preencha nome, e-mail, telefone, CPF ou CNPJ e senha",
    "Confirme o e-mail recebido na sua caixa de entrada",
    "Pronto — sua conta está ativa",
])

add_sub("2.2 Tipos de conta")
make_table([
    ["Tipo", "Documento", "Diferencial"],
    ["Pessoa Física",  "CPF",  "Contratações avulsas e eventos pessoais"],
    ["Pessoa Jurídica","CNPJ", "Limite de crédito ampliado, relatórios fiscais, notas fiscais"],
], colWidths=[4*cm, 3*cm, 7.5*cm])

add_sub("2.3 Créditos e formas de pagamento")
add_body(
    "A EventPro opera com um sistema de créditos. Você pode carregar sua conta "
    "com créditos via Pix e utilizá-los para contratar profissionais. "
    "Clientes CNPJ também podem solicitar limite de crédito pós-pago."
)
add_bullet([
    "Recarga via Pix — aprovação instantânea",
    "Pacotes de crédito disponíveis com bônus percentual",
    "Limite de crédito para empresas — sujeito a aprovação",
    "Todos os pagamentos aos profissionais são processados pela plataforma",
])
add_note(
    "A EventPro retém uma comissão de 15% sobre cada contratação. "
    "O valor exibido na contratação já é o valor total que será debitado da sua conta."
)

# ══════════════════════════════════════════════════════════════════════
# 3. CRIANDO UM EVENTO
# ══════════════════════════════════════════════════════════════════════
add_section("3. Criando um Evento")

add_body(
    "Para contratar profissionais, você primeiro cria um evento. "
    "O processo é dividido em 3 passos simples."
)

make_table([
    ["Passo", "O que preencher"],
    ["1 — Dados do evento",   "Nome do evento, local (endereço), data, horário de início e término"],
    ["2 — Equipe necessária", "Selecione as categorias e a quantidade de profissionais por categoria"],
    ["3 — Resumo",            "Revise tudo e confirme — a busca pelos profissionais é iniciada"],
], colWidths=[4.5*cm, 10*cm])

add_sub("3.1 Duração e cobrança")
add_body(
    "O cachê dos profissionais é calculado com base na duração do evento:"
)
add_bullet([
    "Até 8 horas: valor integral conforme tabela da categoria e nível de estrelas",
    "Cada 4 horas adicionais: 50% do valor base (ex.: evento de 12h = 150% do cachê)",
])

add_sub("3.2 Raio de busca")
add_body(
    "Na criação do evento, você define o raio de busca dos profissionais:"
)
make_table([
    ["Raio", "Indicado para"],
    ["1 km",  "Centros urbanos com alta densidade de profissionais"],
    ["2 km",  "Padrão para a maioria dos eventos em cidade"],
    ["5 km",  "Eventos em bairros com menor oferta"],
    ["10 km", "Eventos em regiões mais afastadas"],
], colWidths=[3*cm, 11.5*cm], header_color=SECONDARY)

# ══════════════════════════════════════════════════════════════════════
# 4. COMO A PLATAFORMA ESCOLHE OS PROFISSIONAIS
# ══════════════════════════════════════════════════════════════════════
add_section("4. Como a Plataforma Seleciona os Profissionais")

add_body(
    "Você não escolhe manualmente os profissionais antes da contratação. "
    "A EventPro realiza o matching automaticamente — como o Uber seleciona "
    "o motorista mais adequado para cada corrida."
)

add_sub("4.1 Critérios de seleção (por prioridade)")
make_table([
    ["Prioridade", "Critério", "Descrição"],
    ["1ª", "Favoritos",      "Profissionais que você favoritou em eventos anteriores"],
    ["2ª", "Estrelas",       "Profissionais com maior nível de estrelas"],
    ["3ª", "Proximidade",    "Mais próximos ao local do evento dentro do raio definido"],
    ["4ª", "Disponibilidade","Sem conflito de horário ou distância com outros eventos"],
], colWidths=[1.5*cm, 3.5*cm, 9.5*cm])

add_sub("4.2 Quando os profissionais aparecem para você")
add_body(
    "Após o envio dos convites pela plataforma, você acompanha em tempo real "
    "quem aceitou. O painel de bookings exibe apenas profissionais <b>confirmados</b>."
)
add_bullet([
    "PENDENTE: aguardando resposta dos profissionais convidados",
    "CONFIRMADO: profissional aceitou — compromisso estabelecido",
    "EM TRÂNSITO: profissional marcou deslocamento — GPS ativo",
    "CHECK-IN: profissional chegou ao local",
    "CONCLUÍDO: evento finalizado — avaliação liberada",
])

# ══════════════════════════════════════════════════════════════════════
# 5. FAVORITOS E EQUIPES SALVAS
# ══════════════════════════════════════════════════════════════════════
add_section("5. Favoritos e Equipes Salvas")

add_body(
    "Uma das funcionalidades mais poderosas da EventPro é a possibilidade de "
    "salvar profissionais e equipes inteiras para reutilização em eventos futuros."
)

add_sub("5.1 Favoritar profissionais")
add_bullet([
    "Após um evento, você pode favoritar os profissionais que se destacaram",
    "Favoritos aparecem em primeiro lugar na próxima busca para a mesma categoria",
    "A plataforma envia o convite para seus favoritos antes de buscar outros",
    "Quanto mais você contrata o mesmo profissional, mais personalizado fica o serviço",
])

add_sub("5.2 Equipes salvas")
add_bullet([
    "Salve uma equipe completa após um evento bem-sucedido",
    "Na criação do próximo evento, selecione a equipe salva e a plataforma convida todos",
    "Relatórios de eventos passados ficam acessíveis para consulta e reuso",
])

add_note(
    "Salvar equipes é especialmente útil para clientes que realizam eventos recorrentes "
    "como feiras, shows mensais ou eventos corporativos periódicos."
)

# ══════════════════════════════════════════════════════════════════════
# 6. ACOMPANHAMENTO EM TEMPO REAL
# ══════════════════════════════════════════════════════════════════════
story.append(PageBreak())
add_section("6. Acompanhamento em Tempo Real")

add_sub("6.1 Rastreamento de deslocamento")
add_body(
    "Quando um profissional confirma que está a caminho, você pode acompanhar "
    "sua localização em tempo real no mapa dentro do app. O GPS é ativado "
    "voluntariamente pelo profissional ao clicar em 'Em deslocamento' e é "
    "desligado automaticamente quando ele faz o check-in no local."
)

add_sub("6.2 Alertas automáticos que você recebe")
make_table([
    ["Alerta", "Quando ocorre"],
    ["Profissional confirmado",          "Logo após aceitar o convite"],
    ["Profissional em deslocamento",     "Quando ele clica 'Em deslocamento' no app"],
    ["Profissional chegou cedo",         "Check-in com 60+ min de antecedência"],
    ["Profissional chegou",              "Qualquer check-in no local"],
    ["Profissional ainda não confirmou", "60 minutos antes do evento sem deslocamento"],
    ["Substituto a caminho",             "Em caso de emergência (no-show)"],
], colWidths=[7*cm, 7.5*cm])

add_sub("6.3 Solicitando ativação do GPS")
add_body(
    "Se você quiser acompanhar o profissional e ele ainda não marcou deslocamento, "
    "você pode enviar uma solicitação pelo app — ele receberá uma notificação "
    "pedindo que confirme que está a caminho."
)

# ══════════════════════════════════════════════════════════════════════
# 7. EMERGÊNCIAS
# ══════════════════════════════════════════════════════════════════════
add_section("7. Situações de Emergência")

add_sub("7.1 Profissional não apareceu (No-Show)")
add_body(
    "Se um profissional confirmado não comparecer ao evento, a EventPro age automaticamente:"
)
add_bullet([
    "O no-show é registrado no perfil do profissional ausente",
    "A plataforma busca imediatamente o profissional substituto mais próximo e disponível",
    "O substituto recebe o convite de emergência com cachê majorado (1.5x)",
    "Se necessário, a plataforma pode providenciar transporte (ex.: Uber) para o substituto",
    "Você é notificado assim que um substituto for confirmado",
])

add_sub("7.2 Contratação de emergência")
add_body(
    "Você também pode solicitar profissionais de emergência diretamente pelo app, "
    "mesmo sem um evento previamente cadastrado, em situações de última hora."
)
add_bullet([
    "Define o raio de busca (1, 2, 5 ou 10 km)",
    "A plataforma busca o profissional mais próximo e disponível",
    "O cachê é calculado com o multiplicador de emergência (1.5x)",
])

add_box("Importante sobre emergências", [
    "Contratações de emergência têm custo 50% maior que o valor padrão.",
    "Profissionais que atendem emergências ganham estrelas extras pela disponibilidade.",
    "O prazo mínimo para acionamento de emergência é dentro de 60 minutos antes do evento.",
], color=colors.HexColor("#fff9e6"))

# ══════════════════════════════════════════════════════════════════════
# 8. TABELA DE PREÇOS
# ══════════════════════════════════════════════════════════════════════
add_section("8. Tabela de Preços de Referência")

add_body(
    "Os preços variam conforme a categoria do profissional e seu nível de estrelas. "
    "Abaixo, os valores de referência para eventos de até 8 horas."
)

make_table([
    ["Categoria", "Nível Base", "3 Estrelas", "5 Estrelas (topo)"],
    ["Garçom",               "R$ 280",   "R$ 378",   "R$ 490"],
    ["DJ",                   "R$ 800",   "R$ 1.080", "R$ 1.400"],
    ["Segurança",            "R$ 320",   "R$ 432",   "R$ 560"],
    ["Limpeza",              "R$ 200",   "R$ 270",   "R$ 350"],
    ["Fotógrafo",            "R$ 1.200", "R$ 1.620", "R$ 2.100"],
    ["Mestre de Cerimônias", "R$ 600",   "R$ 810",   "R$ 1.050"],
    ["Produtor de Eventos",  "R$ 1.500", "R$ 2.025", "R$ 2.625"],
    ["Controle de Acesso",   "R$ 240",   "R$ 324",   "R$ 420"],
], colWidths=[5*cm, 3*cm, 3.5*cm, 3*cm])

add_note(
    "A comissão da plataforma (15%) já está incluída nos valores exibidos durante a contratação. "
    "Eventos acima de 8h: cada fração de 4h adicional equivale a 50% do valor base."
)

add_sub("8.1 Multiplicadores de situação")
make_table([
    ["Situação", "Multiplicador", "Quando se aplica"],
    ["Normal",       "1.00x", "Contratação padrão com antecedência"],
    ["Emergência",   "1.50x", "No-show substituído ou contratação urgente"],
    ["Fora de hora", "1.25x", "Eventos em horários atípicos"],
], colWidths=[3.5*cm, 3*cm, 8*cm], header_color=SECONDARY)

# ══════════════════════════════════════════════════════════════════════
# 9. AVALIAÇÃO DOS PROFISSIONAIS
# ══════════════════════════════════════════════════════════════════════
add_section("9. Como Avaliar os Profissionais")

add_body(
    "Após cada evento concluído, você avalia cada profissional da equipe. "
    "Sua avaliação impacta diretamente o ranking e o cachê dos profissionais na plataforma."
)

add_sub("9.1 Critérios de avaliação")
make_table([
    ["Critério", "Peso", "O que observar"],
    ["Pontualidade",       "2.0x", "Chegou antes para conhecer o espaço e se preparar?"],
    ["Qualidade Técnica",  "2.0x", "Executou bem o serviço para o qual foi contratado?"],
    ["Apresentação",       "1.5x", "Visual, uniforme e postura adequados ao evento?"],
    ["Proatividade",       "1.5x", "Antecipou necessidades sem precisar ser solicitado?"],
    ["Comunicação",        "1.0x", "Respondeu chamados e manteve contato durante o evento?"],
    ["Trabalho em Equipe", "1.0x", "Colaborou bem com os demais profissionais?"],
    ["Impressão Geral",    "1.0x", "Avaliação geral — contrataria novamente?"],
], colWidths=[4.5*cm, 1.5*cm, 8.5*cm])

add_sub("9.2 Por que sua avaliação importa")
add_bullet([
    "Avaliações com nota alta aumentam o cachê do profissional em futuras contratações",
    "Profissionais bem avaliados sobem no ranking e aparecem primeiro nas suas buscas",
    "Avaliações ruins alertam a plataforma sobre problemas de qualidade",
    "O sistema é mútuo: o profissional também avalia você como cliente",
])
add_note(
    "A avaliação que o profissional faz de você é confidencial e ajuda a plataforma "
    "a identificar clientes que oferecem boas condições de trabalho. Clientes bem "
    "avaliados tendem a receber respostas mais rápidas nos convites."
)

# ══════════════════════════════════════════════════════════════════════
# 10. CANCELAMENTOS E POLÍTICAS
# ══════════════════════════════════════════════════════════════════════
add_section("10. Cancelamentos e Políticas")

add_body(
    "Entendemos que imprevistos acontecem. A política de cancelamento da EventPro "
    "busca equilibrar a proteção do cliente com o respeito ao tempo dos profissionais."
)

make_table([
    ["Antecedência do cancelamento", "Consequência"],
    ["Mais de 48h antes do evento",  "Créditos totalmente devolvidos à sua conta"],
    ["Entre 24h e 48h antes",        "Devolução de 70% dos créditos"],
    ["Entre 12h e 24h antes",        "Devolução de 50% dos créditos"],
    ["Menos de 12h antes",           "Sem devolução — profissionais já se organizaram"],
], colWidths=[6.5*cm, 8*cm])

add_note(
    "Políticas de cancelamento podem ser revisadas e atualizadas. "
    "Versões futuras da plataforma terão regras mais detalhadas por categoria e situação."
)

# ══════════════════════════════════════════════════════════════════════
# 11. RELATÓRIOS E HISTÓRICO
# ══════════════════════════════════════════════════════════════════════
add_section("11. Relatórios e Histórico")

add_body(
    "A EventPro mantém um histórico completo de todos os seus eventos e contratações, "
    "disponível a qualquer momento no painel do cliente."
)

add_bullet([
    "Histórico completo de eventos com status e equipe contratada",
    "Relatório de gastos por evento, por categoria e por período",
    "Lista de equipes salvas para reuso rápido",
    "Histórico de avaliações dadas e recebidas",
    "Relatórios exportáveis para controle financeiro e declaração fiscal (em breve)",
])

# ══════════════════════════════════════════════════════════════════════
# 12. DICAS PARA MELHORES RESULTADOS
# ══════════════════════════════════════════════════════════════════════
add_section("12. Dicas para os Melhores Resultados")

add_box("Antes do evento", [
    "Crie o evento com pelo menos 48h de antecedência para garantir mais opções de profissionais",
    "Descreva bem o local e confirme o endereço completo — isso facilita o deslocamento",
    "Defina horários realistas: inclua o tempo de montagem e desmontagem se necessário",
    "Quanto maior o raio de busca, mais profissionais disponíveis serão encontrados",
])

add_box("Durante o evento", [
    "Esteja disponível para receber os profissionais com antecedência",
    "Faça um briefing rápido ao chegarem — explique o espaço e suas expectativas",
    "Use o app para acompanhar o status de deslocamento de cada profissional",
    "Em caso de problema, acione o suporte pelo app imediatamente",
])

add_box("Após o evento", [
    "Avalie todos os profissionais — sua avaliação é essencial para o ranking da plataforma",
    "Favorite os profissionais que se destacaram para priorizá-los no próximo evento",
    "Salve a equipe se pretende realizar eventos recorrentes com o mesmo time",
    "Confira o resumo financeiro do evento no painel de histórico",
])

# ══════════════════════════════════════════════════════════════════════
# RODAPÉ
# ══════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 1*cm))
story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
story.append(Paragraph(
    "EventPro &mdash; Gestão inteligente de eventos &nbsp;|&nbsp; "
    f"eventpro-black.vercel.app &nbsp;|&nbsp; Versão 1.0 &mdash; {date.today().strftime('%d/%m/%Y')}",
    FOOTER
))

# ── BUILD ──────────────────────────────────────────────────────────────
def first_page(canvas, doc):
    cover_page(canvas, doc)

doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
print(f"PDF gerado: {OUTPUT}")
