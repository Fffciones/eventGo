import { useState, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import {
  Brush, Utensils, Shield, Camera, GlassWater, Music,
  Star, CheckCircle, Clock, Sparkles, ArrowRight, Check,
  Apple, Play, User,
} from 'lucide-react';

import { AUTH_LINKS, APP_STORE_URL, GOOGLE_PLAY_URL, IMAGES, CATEGORIES } from './site/siteConfig';

/** Ícone inline de cifrão (não existe DollarSign no set importado acima). */
function DollarSignIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function categoryIcon(iconName: string, className = 'w-6 h-6') {
  switch (iconName) {
    case 'Brush':      return <Brush className={className} aria-hidden="true" />;
    case 'Utensils':   return <Utensils className={className} aria-hidden="true" />;
    case 'Shield':     return <Shield className={className} aria-hidden="true" />;
    case 'Camera':     return <Camera className={className} aria-hidden="true" />;
    case 'GlassWater': return <GlassWater className={className} aria-hidden="true" />;
    case 'Music':      return <Music className={className} aria-hidden="true" />;
    default:           return <User className={className} aria-hidden="true" />;
  }
}

/** Badge de loja: vira link real só quando a URL existir; senão, "Em breve" acessível. */
function StoreBadge({ url, icon, store }: { url: string; icon: ReactNode; store: string }) {
  const inner = (
    <>
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[9px] uppercase tracking-wide opacity-80">Baixar na</span>
        <span className="block text-sm font-bold">{store}</span>
      </span>
    </>
  );
  const base = 'inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-on-primary-fixed/20 bg-on-primary-fixed/5 text-on-primary-fixed';
  if (url) {
    return (
      <a href={url} className={`${base} hover:bg-on-primary-fixed/10 active:scale-95 transition-all`}>
        {inner}
      </a>
    );
  }
  return (
    <span
      className={`${base} opacity-60 cursor-default`}
      aria-disabled="true"
      title="Em breve"
    >
      {inner}
    </span>
  );
}

export default function SiteApp() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: RefObject<HTMLDivElement | null>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background text-on-background antialiased flex flex-col selection:bg-primary/30 selection:text-primary">

      {/* 1. Header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-background/85 backdrop-blur-md border-b border-outline-variant py-4 px-4 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-10">
            <a href="/site" className="font-display font-extrabold text-2xl tracking-tight text-primary hover:opacity-90 transition-all flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" aria-hidden="true" />
              <span>EventPro</span>
            </a>
            <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
              <button onClick={() => scrollTo(howItWorksRef)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">
                Como funciona
              </button>
              <button onClick={() => scrollTo(categoriesRef)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">
                Categorias
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={AUTH_LINKS.login}
              className="text-on-surface-variant hover:text-primary transition-colors font-semibold text-sm px-3 py-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Já tem conta? Entrar
            </a>
            <div className="hidden md:flex gap-3">
              <a
                href={AUTH_LINKS.signupProfessional}
                className="bg-surface-container-high text-on-surface border border-outline-variant hover:border-outline transition-all px-5 py-2 rounded-xl text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Quero oferecer meus serviços
              </a>
              <a
                href={AUTH_LINKS.signupClient}
                className="bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98] transition-all px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Quero contratar
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24">

        {/* 2. Hero */}
        <section className="relative min-h-[560px] md:min-h-[680px] flex items-center px-4 md:px-12 py-12 max-w-7xl mx-auto overflow-hidden">
          <div className="relative z-10 w-full lg:w-3/5 space-y-6 md:space-y-8 animate-fade-in pr-0 lg:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Sparkles size={14} aria-hidden="true" />
              <span>Profissionais de eventos, sob demanda</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-on-background leading-tight tracking-tight">
              O profissional certo para o seu evento, na hora que você precisar.
            </h1>

            <p className="font-sans text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              EventPro conecta você a garçons, seguranças, bartenders, DJs e mais — disponíveis perto de você.
              Precisa de gente boa para amanhã? Resolvemos agora.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a
                href={AUTH_LINKS.signupClient}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span>Quero contratar um profissional</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
              <a
                href={AUTH_LINKS.signupProfessional}
                className="border border-outline text-on-surface hover:bg-surface-container hover:border-primary/50 px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Quero oferecer meus serviços
              </a>
            </div>

            {/* Prova social compacta */}
            <div className="pt-6 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex -space-x-3">
                <img className="w-11 h-11 rounded-full border-2 border-background object-cover" src={IMAGES.bartenderAvatar} alt="Bartender cadastrado no EventPro" referrerPolicy="no-referrer" />
                <img className="w-11 h-11 rounded-full border-2 border-background object-cover" src={IMAGES.photographerAvatar} alt="Fotógrafa cadastrada no EventPro" referrerPolicy="no-referrer" />
                <img className="w-11 h-11 rounded-full border-2 border-background object-cover" src={IMAGES.securityAvatar} alt="Segurança cadastrado no EventPro" referrerPolicy="no-referrer" />
                <div className="w-11 h-11 rounded-full border-2 border-background bg-surface-container-high text-xs text-primary font-bold flex items-center justify-center" aria-hidden="true">
                  +10k
                </div>
              </div>
              <p className="text-sm font-semibold text-on-surface-variant">
                {/* TODO: número real de profissionais (placeholder de prova social) */}
                <span className="font-bold text-primary text-base">Milhares</span> de profissionais prontos para atender.
              </p>
            </div>
          </div>

          {/* Imagem decorativa */}
          <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-10" />
            <div
              className="w-full h-[95%] bg-cover bg-center rounded-l-[120px] overflow-hidden opacity-90 border-l border-b border-outline-variant/30"
              style={{ backgroundImage: `url(${IMAGES.galaBackground})` }}
            />
          </div>
        </section>

        {/* 6. Prova social / confiança — faixa de números */}
        {/* TODO: dados de prova social são ilustrativos até termos métricas reais. */}
        <section className="bg-surface-container-low border-y border-outline-variant py-10 px-4 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              ['+10 mil', 'Profissionais na base'],
              ['50+', 'Cidades atendidas'],
              ['4,9/5', 'Avaliação média'],
              ['24h', 'Suporte dedicado'],
            ].map(([num, label]) => (
              <div key={label} className="space-y-1 group">
                <p className="font-display text-4xl font-extrabold text-primary tracking-tight transition-transform duration-300 group-hover:scale-105">{num}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Por que ser um profissional EventPro */}
        <section className="py-20 md:py-28 px-4 md:px-12 max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-on-surface">
              Por que ser um profissional EventPro
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Você decide quando e onde atuar. A gente cuida do resto — pagamentos, segurança e um fluxo constante de oportunidades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Clock className="w-7 h-7" aria-hidden="true" />, title: 'Flexibilidade total', body: 'Você decide quando e onde atender. Aceite chamados avulsos ou frequentes e monte a agenda do seu jeito.' },
              { icon: <DollarSignIcon className="w-7 h-7" />, title: 'Renda sob demanda', body: 'Receba com segurança por cada evento. Ganhe na hora que precisar, com regras claras e sem letras miúdas.' },
              { icon: <CheckCircle className="w-7 h-7" aria-hidden="true" />, title: 'Suporte contínuo', body: 'Equipe à disposição, pagamentos garantidos e respaldo durante toda a execução do serviço.' },
            ].map((p) => (
              <div key={p.title} className="p-8 bg-surface-container border border-outline-variant rounded-2xl hover:border-primary/50 hover:bg-surface-container-high transition-all group duration-300">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                  {p.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-on-surface mb-3">{p.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a href={AUTH_LINKS.signupProfessional} className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1">
              Quero oferecer meus serviços <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* 4. Como funciona para quem contrata */}
        <section ref={howItWorksRef} className="bg-surface-container-lowest py-20 md:py-28 px-4 md:px-12 border-y border-outline-variant scroll-mt-24">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2 space-y-10">
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Fluxo simplificado</span>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-on-surface">Como funciona para quem contrata</h2>
              </div>

              <div className="space-y-4">
                {[
                  { n: 1, title: 'Diga o que precisa e para quando', body: 'Escolha o tipo de profissional (garçom, DJ, bartender, segurança…) e informe local, data e horário.' },
                  { n: 2, title: 'Veja quem está perto de você', body: 'Consulte perfis verificados, avaliações reais e disponibilidade — tudo geolocalizado.' },
                  { n: 3, title: 'Contrate, acompanhe e pague pelo app', body: 'Confirmação na hora. O pagamento fica retido em segurança e só é liberado após o serviço.' },
                ].map((s) => (
                  <button
                    key={s.n}
                    onClick={() => setActiveStep(s.n as 1 | 2 | 3)}
                    aria-pressed={activeStep === s.n}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex gap-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      activeStep === s.n ? 'border-primary/50 bg-surface-container-low shadow-lg' : 'border-transparent hover:bg-surface-container-low/50'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      activeStep === s.n ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>{s.n}</div>
                    <div>
                      <h3 className="font-bold text-on-surface text-base mb-1">{s.title}</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{s.body}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mockup do app */}
            <div className="w-full lg:w-1/2 flex justify-center relative">
              <div className="relative w-[320px] sm:w-[360px] aspect-[9/18] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-surface-container-high outline outline-1 outline-outline-variant/30 overflow-hidden group">
                <div className="w-full h-full bg-surface-container-lowest rounded-[38px] overflow-hidden relative flex flex-col">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-30" aria-hidden="true" />
                  <div className="h-9 bg-zinc-950 flex items-center justify-between px-6 pt-3 text-[10px] text-zinc-400 font-semibold select-none z-20" aria-hidden="true">
                    <span>10:42</span>
                    <div className="flex gap-1.5 items-center"><span>5G</span><div className="w-4 h-2.5 bg-zinc-700 rounded-sm" /></div>
                  </div>
                  <div className="flex-grow overflow-hidden flex flex-col relative">
                    <div className="p-4 bg-background border-b border-outline-variant flex items-center justify-between">
                      <span className="font-bold text-xs text-primary tracking-wider uppercase">EventPro App</span>
                      <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">SP</span>
                    </div>

                    {activeStep === 1 && (
                      <div className="absolute inset-x-3 top-20 z-10 p-3 bg-surface-container border border-primary/50 rounded-xl shadow-xl space-y-2 animate-fade-in text-xs">
                        <p className="font-bold text-primary flex items-center gap-1.5"><Check size={14} aria-hidden="true" /> Passo 1: Solicitar</p>
                        <p className="text-[10px] text-on-surface-variant">Descreva o evento. Ex: "Garçom e bar para coquetel de sábado."</p>
                        <div className="h-6 bg-surface-container-low rounded border border-outline-variant flex items-center px-2 text-[9px] text-outline">Sábado, 19:00 · Jardins</div>
                      </div>
                    )}
                    {activeStep === 3 && (
                      <div className="absolute inset-x-3 top-20 z-10 p-3 bg-surface-container border border-primary/50 rounded-xl shadow-xl space-y-2 animate-fade-in text-xs">
                        <p className="font-bold text-primary flex items-center gap-1.5"><Check size={14} aria-hidden="true" /> Passo 3: Pagamento seguro</p>
                        <p className="text-[10px] text-on-surface-variant">O valor fica retido em custódia até o término do evento.</p>
                        <div className="p-2 bg-primary/10 border border-primary/20 text-primary font-mono text-[9px] text-center rounded">✓ PAGAMENTO RESERVADO</div>
                      </div>
                    )}

                    <div
                      className={`w-full h-full bg-cover bg-center transition-all duration-300 ${activeStep !== 2 ? 'brightness-50 blur-[1px]' : ''}`}
                      style={{ backgroundImage: `url(${IMAGES.appScreen})` }}
                      role="img"
                      aria-label="Tela do app EventPro mostrando profissionais no mapa"
                    />
                  </div>
                </div>
                <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary/15 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
                <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-tertiary/15 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Categorias de serviço (vitrine, sem busca) */}
        <section ref={categoriesRef} className="py-20 md:py-28 px-4 md:px-12 max-w-7xl mx-auto space-y-12 scroll-mt-24">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Tudo em um só lugar</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-on-surface">Categorias de serviço</h2>
            <p className="text-sm text-on-surface-variant">
              Escolha a especialidade que seu evento precisa. Novas categorias entram continuamente.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={AUTH_LINKS.signupClient}
                title={cat.description}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-outline-variant bg-surface-container hover:bg-surface-container-high hover:border-primary/40 transition-all duration-300 text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-surface-container-low text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  {categoryIcon(cat.iconName, 'w-5 h-5')}
                </div>
                <p className="text-xs font-bold">{cat.name}</p>
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-on-surface-variant/70">
            {/* TODO: lista final de categorias do lançamento pendente (ex.: Cerimonial, Decoração). */}
            E mais categorias a caminho.
          </p>
        </section>

        {/* 7. Download dos apps */}
        <section className="px-4 md:px-12 py-12 max-w-7xl mx-auto mb-20">
          <div className="bg-primary-container rounded-3xl p-10 md:p-16 text-on-primary-container flex flex-col items-center text-center overflow-hidden relative border border-primary/20">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-4 relative z-10 text-on-primary-fixed">
              Baixe o app e comece agora
            </h2>
            <p className="text-sm sm:text-base mb-8 max-w-xl relative z-10 text-on-primary-fixed-variant font-medium leading-relaxed">
              Contrate ou receba chamados de onde estiver. Tudo na palma da mão.
            </p>

            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <StoreBadge url={APP_STORE_URL} store="App Store" icon={<Apple className="w-6 h-6" aria-hidden="true" />} />
              <StoreBadge url={GOOGLE_PLAY_URL} store="Google Play" icon={<Play className="w-6 h-6" aria-hidden="true" />} />
            </div>

            <a
              href={AUTH_LINKS.signupClient}
              className="mt-8 font-semibold text-xs text-on-primary-fixed hover:underline relative z-10 tracking-wide uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-on-primary-fixed rounded px-2 py-1"
            >
              Ou cadastre-se de forma rápida pela web
            </a>
          </div>
        </section>
      </main>

      {/* 8. Footer institucional */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant py-12 px-4 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <h3 className="font-display font-extrabold text-2xl text-primary tracking-tight">EventPro</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Marketplace on-demand de profissionais para eventos no Brasil. Contrate na hora que precisar.
            </p>
          </div>

          <nav aria-label="Empresa">
            <h4 className="text-xs font-bold text-on-surface mb-4 uppercase tracking-wider">Empresa</h4>
            <ul className="space-y-3">
              {/* TODO: rotas institucionais reais */}
              <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Sobre nós</a></li>
              <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Carreiras</a></li>
              <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Blog</a></li>
              <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Contato</a></li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h4 className="text-xs font-bold text-on-surface mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {/* TODO: páginas legais reais */}
              <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Termos de Uso</a></li>
              <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Política de Privacidade</a></li>
              <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Segurança e Confiança</a></li>
            </ul>
          </nav>

          <div className="flex flex-col justify-between">
            <nav aria-label="Suporte" className="space-y-4">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Suporte</h4>
              <ul className="space-y-3">
                <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors block" href="#">Central de Ajuda</a></li>
                <li><a className="text-xs text-on-surface-variant hover:text-primary transition-colors block" href={AUTH_LINKS.signupProfessional}>Seja um parceiro</a></li>
              </ul>
            </nav>
            <p className="text-[10px] text-on-surface-variant mt-8 md:mt-0 font-medium">
              {/* TODO: dados legais da empresa (razão social + CNPJ) pendentes */}
              © 2026 EventPro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
