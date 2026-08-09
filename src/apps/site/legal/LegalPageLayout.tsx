import type { ReactNode } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { LEGAL_LAST_UPDATED } from './legalConfig';

interface Props {
  title: string;
  children: ReactNode;
}

/** Layout comum das páginas legais (/site/termos, /site/privacidade). */
export default function LegalPageLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-background text-on-background antialiased flex flex-col">
      <header className="border-b border-outline-variant py-4 px-4 md:px-12">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/site" className="font-display font-extrabold text-xl tracking-tight text-primary hover:opacity-90 transition-all flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
            <span>EventPro</span>
          </a>
          <a href="/site" className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
            <ArrowLeft size={14} aria-hidden="true" />
            Voltar
          </a>
        </div>
      </header>

      <main className="flex-grow px-4 md:px-12 py-12 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-on-surface">{title}</h1>
            <p className="text-xs text-on-surface-variant">Última atualização: {LEGAL_LAST_UPDATED}</p>
          </div>

          <div className="space-y-8 text-sm text-on-surface-variant leading-relaxed">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-outline-variant py-8 px-4 md:px-12">
        <p className="max-w-3xl mx-auto text-[10px] text-on-surface-variant">
          © 2026 EventPro. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
