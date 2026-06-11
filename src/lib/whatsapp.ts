// =====================================================================
// WhatsApp — helpers de deep link (fase 5A, sem provedor)
// =====================================================================
// Toda a integração com WhatsApp na 5A é via "deep link" wa.me, que abre
// o app/web do WhatsApp do próprio usuário. Nenhuma API é chamada aqui.
// Quando entrar um provedor (5B), o envio automático vai pelo edge function
// `whatsapp-dispatch`; estes helpers continuam servindo para os botões de UI.
// Ver docs/etapa5_whatsapp_plano.md.

/** Número do WhatsApp da plataforma (para onboarding por clique). Ex.: "5511999999999". */
export const PLATFORM_WHATSAPP: string =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim() || '';

/**
 * Normaliza um telefone para o formato que o wa.me espera: só dígitos, com
 * DDI do Brasil (55) quando não houver. Aceita entradas tipo "(11) 99999-9999".
 * Retorna null se não sobrar nada utilizável.
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  // Remove zeros à esquerda (ex.: "011...").
  digits = digits.replace(/^0+/, '');
  // Se não começa com o DDI 55 e tem cara de número nacional (10-11 dígitos), prefixa.
  if (!digits.startsWith('55') && digits.length >= 10 && digits.length <= 11) {
    digits = '55' + digits;
  }
  return digits || null;
}

/**
 * Monta um link wa.me. Se `phone` for null/vazio, gera o link "genérico"
 * (https://wa.me/?text=...) que deixa o usuário escolher o destinatário.
 */
export function waLink(phone?: string | null, text?: string): string {
  const num = normalizePhone(phone);
  const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `${base}${query}`;
}

/** True se o número da plataforma está configurado (controla a exibição dos botões de onboarding). */
export const hasPlatformWhatsApp = (): boolean => PLATFORM_WHATSAPP.length > 0;
