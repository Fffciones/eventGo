/**
 * Dados institucionais usados nas páginas legais (Termos de Uso, Política
 * de Privacidade) e no banner de cookies.
 *
 * ATENÇÃO: os campos marcados com [PREENCHER] são placeholders — a empresa
 * ainda não tem razão social/CNPJ/endereço formalizados no código (mesmo
 * TODO já existe no rodapé da landing, em SiteApp.tsx). Todo o texto das
 * páginas legais é um RASCUNHO TÉCNICO baseado no que o produto realmente
 * coleta e faz hoje — precisa de revisão por um advogado antes de publicar
 * em produção.
 */

export const COMPANY = {
  legalName: '[PREENCHER: Razão social Ltda.]',
  tradeName: 'EventPro',
  cnpj: '[PREENCHER: 00.000.000/0001-00]',
  address: '[PREENCHER: endereço completo]',
  dpoEmail: '[PREENCHER: privacidade@eventpro.com.br]',
  supportEmail: '[PREENCHER: suporte@eventpro.com.br]',
};

// Atualizar sempre que o conteúdo das páginas legais mudar de fato.
export const LEGAL_LAST_UPDATED = '2026-07-24';

export const COOKIE_CONSENT_STORAGE_KEY = 'eventpro_cookie_consent';
