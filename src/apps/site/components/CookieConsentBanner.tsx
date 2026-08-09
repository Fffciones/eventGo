import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { COOKIE_CONSENT_STORAGE_KEY } from '../legal/legalConfig';

/**
 * Aviso informativo de cookies/armazenamento local (LGPD).
 *
 * O EventPro não usa cookies de rastreamento próprios — só localStorage
 * essencial (sessão de login) e serviços de terceiros necessários pro
 * funcionamento (Google Maps, login com Google). Por isso o banner é só
 * informativo, com um único botão de ciência — sem categorias opcionais
 * pra desligar, já que não há nenhuma hoje.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage indisponível (ex.: modo privado restrito) — não bloqueia a navegação
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify({ acceptedAt: new Date().toISOString() }));
    } catch {
      // segue mesmo se não conseguir persistir
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="w-6 h-6 text-primary flex-shrink-0" aria-hidden="true" />
        <p className="flex-grow text-xs text-on-surface-variant leading-relaxed">
          Usamos armazenamento local essencial para manter sua sessão de login e serviços de
          terceiros (Google Maps, login com Google) necessários para o funcionamento do
          EventPro. Não usamos cookies de rastreamento ou publicidade próprios. Saiba mais na{' '}
          <a href="/site/privacidade" className="text-primary font-semibold hover:underline">
            Política de Privacidade
          </a>.
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
