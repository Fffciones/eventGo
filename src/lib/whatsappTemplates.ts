// =====================================================================
// WhatsApp — catálogo de templates (fase 5A)
// =====================================================================
// Mensagens que o dispatcher (`whatsapp-dispatch`) usa ao entregar uma
// notification com channel = 'WHATSAPP'. Na 5A nada é enviado de fato (stub
// só loga), mas o catálogo já fica pronto e tipado.
//
// Quando entrar a Meta Cloud API (5B), cada `key` aqui vira o "name" de um
// template aprovado no Business Manager, e `params` a ordem dos {{1}}, {{2}}...
// Por isso `params` é uma LISTA ORDENADA, não um objeto.
//
// Política de canal (NÃO mudar sem rever as regras):
//   - Contratante  → WhatsApp APENAS emergências (no-show, substituto, cancelamento).
//     Ver docs/cliente_notifications_rules.md
//   - Profissional → alertas definidos em docs/profissional_interface_rules.md
// =====================================================================

export type WhatsAppAudience = 'CLIENT' | 'PROFESSIONAL';

export interface WhatsAppTemplate {
  /** Identificador estável — vira o nome do template aprovado na Meta (5B). */
  key: string;
  /** Para quem este template se destina (só documentação/validação). */
  audience: WhatsAppAudience;
  /** Nomes dos parâmetros, na ordem em que aparecem no corpo. */
  params: readonly string[];
  /** Monta o texto final (usado pelo stub e pelos provedores sem template aprovado). */
  build: (p: Record<string, string>) => string;
}

const t = (
  key: string,
  audience: WhatsAppAudience,
  params: readonly string[],
  build: (p: Record<string, string>) => string,
): WhatsAppTemplate => ({ key, audience, params, build });

export const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  // ── Contratante — SOMENTE emergências ──────────────────────────────
  client_no_show: t(
    'client_no_show', 'CLIENT',
    ['event_name', 'function_name'],
    p => `⚠️ EventPro — ${p.event_name}\nUm profissional de ${p.function_name} não compareceu. Já estamos acionando um substituto. Vamos te manter informado por aqui.`,
  ),
  client_replacement_dispatched: t(
    'client_replacement_dispatched', 'CLIENT',
    ['event_name', 'function_name'],
    p => `🔁 EventPro — ${p.event_name}\nSubstituto de ${p.function_name} acionado. Assim que alguém aceitar, você verá a confirmação no app.`,
  ),
  client_critical_cancellation: t(
    'client_critical_cancellation', 'CLIENT',
    ['event_name'],
    p => `🚨 EventPro — ${p.event_name}\nHouve um cancelamento crítico na sua equipe. Abra o app para ver os detalhes e as opções disponíveis.`,
  ),

  // ── Profissional — alertas operacionais ────────────────────────────
  pro_alert_60min: t(
    'pro_alert_60min', 'PROFESSIONAL',
    ['event_name', 'location_name', 'starts_at'],
    p => `⏰ EventPro — ${p.event_name}\nSeu evento começa às ${p.starts_at} em ${p.location_name}. Já está a caminho? Toque em "Estou a caminho" no app.`,
  ),
  pro_transit_request: t(
    'pro_transit_request', 'PROFESSIONAL',
    ['event_name', 'starts_at'],
    p => `🚗 EventPro — ${p.event_name}\nHora de se deslocar para o evento das ${p.starts_at}. Ative "Em deslocamento" no app para liberar o GPS.`,
  ),
  pro_invite: t(
    'pro_invite', 'PROFESSIONAL',
    ['event_name', 'function_name', 'amount'],
    p => `🎉 EventPro — Novo convite!\n${p.function_name} em "${p.event_name}" por R$ ${p.amount}. Abra o app para aceitar antes que a vaga abra para todos.`,
  ),
};

/** Resolve um template por chave (ou null se não existir). */
export function getWhatsAppTemplate(key: string): WhatsAppTemplate | null {
  return WHATSAPP_TEMPLATES[key] ?? null;
}

/** Renderiza o texto de um template; lança se a chave for desconhecida. */
export function renderWhatsAppTemplate(key: string, params: Record<string, string>): string {
  const tpl = getWhatsAppTemplate(key);
  if (!tpl) throw new Error(`Template de WhatsApp desconhecido: ${key}`);
  return tpl.build(params);
}
