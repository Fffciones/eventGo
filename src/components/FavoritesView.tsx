import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  Check, 
  Star, 
  Map, 
  Calendar, 
  UserCheck, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  PhoneCall,
  Search,
  X
} from 'lucide-react';
import { Professional } from '../types';
import { FAVORITE_PROFESSIONALS, DECORATIVE_MAP, RICARDO_PROFILE } from '../data';

interface FavoritesViewProps {
  favoritePros: Professional[];
  onToggleFavorite: (id: string) => void;
  selectedProId: string | null;
  onSelectPro: (id: string | null) => void;
}

export default function FavoritesView({ favoritePros, onToggleFavorite, selectedProId, onSelectPro }: FavoritesViewProps) {
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [activeDateModal, setActiveDateModal] = useState(false);
  const [rehireModal, setRehireModal] = useState(false);
  const [isFavoritedLocal, setIsFavoritedLocal] = useState<Record<string, boolean>>({
    'ricardo-1': true,
    'marcos-1': true,
    'ana-1': true
  });

  // Calculate chosen pro
  const currentPro = selectedProId 
    ? favoritePros.find(p => p.id === selectedProId) || RICARDO_PROFILE
    : selectedPro;

  const handleBackToDirectory = () => {
    onSelectPro(null);
    setSelectedPro(null);
  };

  const handleToggleFavoriteInner = (proId: string) => {
    setIsFavoritedLocal(prev => ({
      ...prev,
      [proId]: !prev[proId]
    }));
    onToggleFavorite(proId);
  };

  // Rendering the list of all favorites (Page 3 Directory or Profile detail)
  if (!currentPro) {
    return (
      <main className="max-w-5xl mx-auto px-margin-mobile mt-6 space-y-6 pb-12 text-left">
        <div className="space-y-1">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-on-surface">Meus Favoritos</h1>
          <p className="text-xs text-on-surface-variant">Seus profissionais táticos prediletos prontos para o envio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favoritePros.map((pro) => (
            <div 
              key={pro.id}
              className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <img 
                    onClick={() => {
                      onSelectPro(pro.id);
                      setSelectedPro(pro);
                    }}
                    src={pro.image} 
                    alt={pro.name} 
                    className="w-14 h-14 rounded-xl object-cover cursor-pointer hover:brightness-95 transition-all" 
                  />
                  {pro.verified && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-on-primary p-0.5 rounded-full border border-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h4 
                    onClick={() => {
                      onSelectPro(pro.id);
                      setSelectedPro(pro);
                    }}
                    className="font-display font-bold text-base text-primary truncate hover:underline cursor-pointer"
                  >
                    {pro.name}
                  </h4>
                  <p className="text-xs text-on-surface-variant truncate">{pro.role}</p>
                  <p className="text-[10px] font-mono font-bold text-secondary">{pro.category}</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 mt-3 pt-3">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-mono text-xs font-bold">{pro.rating}</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleFavoriteInner(pro.id)}
                    className="p-1.5 focus:outline-none hover:bg-slate-50 rounded-lg text-rose-500 transition-transform active:scale-90"
                  >
                    <Heart className={`w-5 h-5 ${isFavoritedLocal[pro.id] ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  </button>
                  <button 
                    onClick={() => {
                      onSelectPro(pro.id);
                      setSelectedPro(pro);
                    }}
                    className="bg-primary/5 hover:bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                  >
                    <span>Ver Perfil</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // Individual high fidelity Profile detail view (e.g., Ricardo)
  return (
    <main className="max-w-5xl mx-auto pb-12">
      {/* Header Back to directory action */}
      <h1 className="hidden">EventGo - Perfil</h1>
      <div className="px-margin-mobile py-4 flex items-center justify-between border-b border-outline-variant/30 bg-white">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBackToDirectory}
            className="text-primary hover:bg-surface-container-low transition-colors p-2 rounded-full active:scale-95 duration-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-extrabold text-xl text-primary md:text-2xl">Perfil</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => handleToggleFavoriteInner(currentPro.id)}
            className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-full active:scale-95 duration-100"
          >
            <Heart className={`w-5 h-5 ${isFavoritedLocal[currentPro.id] ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed">
            <img 
              alt="User rodrigo small profile headshot button" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaUMWEk5RR5cN45ze6awCxupOd_haLenYDV_07jaLAXx6CLXQDFMfrSdbAoPW85BULl4cHGbwD6kGnbdjOziYdkq4A69CUxyb88jK03BHY97p1x2p4-M7FlTVnCSYEvYlf3UMTfwQAPJIfx5gOByHHAR81N0ZQ5HQ3mE1vlJNa8XN1BVPsIAq7eFAa220QzsiEHKV9OESrhlW-Zhg1-6XB8VdNrhEd9HoiVAwsMVoPpf0JDwbbJ9rGMijkVIKdW31d0ooHujr20w" 
            />
          </div>
        </div>
      </div>

      {/* Hero Section / Profile Card split layout */}
      <section className="px-margin-mobile py-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        
        {/* Left column: Profile Large avatar image & stats */}
        <div className="md:col-span-5 lg:col-span-4 space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-square bg-surface-container-highest border border-outline-variant/30">
            <img 
              alt={`${currentPro.name} premium visual portfolio representation`} 
              className="w-full h-full object-cover select-none pointer-events-none" 
              src={currentPro.image} 
            />
            {currentPro.verified && (
              <div className="absolute bottom-4 left-4 bg-primary-container text-on-primary-container px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <UserCheck className="w-4 h-4 text-on-primary-container" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Verificado por EventGo</span>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-primary leading-tight">{currentPro.name}</h2>
                <p className="text-on-surface-variant text-xs font-semibold">{currentPro.role}</p>
              </div>
              <div className="flex items-center gap-1 bg-secondary-container/10 text-secondary px-2 py-1 rounded-lg shrink-0">
                <Star className="w-4 h-4 fill-secondary text-secondary" />
                <span className="font-mono font-bold text-xs">{currentPro.rating}/5.0</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div className="bg-surface-container-low p-3 rounded-xl text-center">
                <p className="text-primary font-bold text-xl md:text-2xl leading-none">{currentPro.eventsCount}</p>
                <p className="text-on-surface-variant text-[9px] uppercase font-mono font-bold mt-1">Eventos Realizados</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl text-center">
                <p className="text-primary font-bold text-xl md:text-2xl leading-none">{currentPro.successRate}%</p>
                <p className="text-on-surface-variant text-[9px] uppercase font-mono font-bold mt-1">Taxa de Sucesso</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Actions, Skills, Reviews */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          
          {/* Main call-to-actions row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button 
              onClick={() => setRehireModal(true)}
              className="flex-1 bg-primary hover:bg-primary-container text-on-primary font-bold py-4 px-5 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Chamar Novamente</span>
            </button>
            <button 
              onClick={() => setActiveDateModal(true)}
              className="flex-1 border-2 border-primary text-primary hover:bg-primary/5 font-bold py-4 px-5 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Ver Disponibilidade</span>
            </button>
          </div>

          {/* Skills / Specialities panel */}
          <div className="space-y-3">
            <h3 className="font-display font-extrabold text-lg text-primary">Habilidades &amp; Especialidades</h3>
            <div className="flex flex-wrap gap-2">
              {currentPro.skills.map((skill) => (
                <span 
                  key={skill}
                  className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-xs font-semibold border border-outline-variant/10 shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Reviews list panel */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-lg text-primary">Avaliações Recentes</h3>
              <span className="text-secondary text-xs font-mono font-bold hover:underline cursor-pointer">Ver todas (87)</span>
            </div>
            
            <div className="space-y-3">
              {currentPro.reviews.map((review, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-secondary border border-outline-variant/10 transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2.5 text-left">
                      <img 
                        src={review.clientImage} 
                        alt="Client Review avatar" 
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div>
                        <h5 className="font-bold text-on-surface text-sm leading-tight">{review.clientName}</h5>
                        <p className="text-[10px] font-semibold text-outline tracking-wider font-mono uppercase">{review.eventInfo}</p>
                      </div>
                    </div>
                    <div className="flex text-amber-500 gap-[1px]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-xs leading-relaxed italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    "{review.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Regional coverage map bento element */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-primary text-base">Atendimento em toda São Paulo</h4>
                <p className="text-on-surface-variant text-xs mt-1">{currentPro.transport}</p>
              </div>
              <button 
                onClick={() => alert("Exibindo mapa da região metropolitana de Campinas, Baixada Santista e Grande São Paulo nas preferências do profissional.")}
                className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
              >
                <Map className="w-4 h-4" />
                <span>Ver Área</span>
              </button>
            </div>
            
            {/* Decorative Map overlay */}
            <div className="absolute inset-0 opacity-5 grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none">
              <img alt="Scenic map visual SP design" className="w-full h-full object-cover" src={DECORATIVE_MAP} />
            </div>
          </div>

        </div>

      </section>

      {/* CALENDAR DISPONIBILIDADE MODAL */}
      <AnimatePresence>
        {activeDateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-2xl border border-outline-variant max-w-sm w-full relative space-y-4"
            >
              <button 
                onClick={() => setActiveDateModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 text-primary">
                <Calendar className="w-5 h-5 text-secondary" />
                <h3 className="font-display font-extrabold text-lg">Agenda de {currentPro.name}</h3>
              </div>

              <p className="text-xs text-on-surface-variant text-left">
                Ricardo possui alta demanda em casamentos corporativos de luxo e reservas espontâneas aos fins de semana. Veja os slots disponíveis sugeridos:
              </p>

              <div className="space-y-2.5 text-left text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-800">Hoje - Período: Tarde/Noite</p>
                    <p className="text-[11px] text-emerald-700">Disponibilidade Imediata</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveDateModal(false);
                      setRehireModal(true);
                    }}
                    className="bg-emerald-600 text-white font-bold  px-2.5 py-1 rounded text-[10px]"
                  >
                    RESERVAR
                  </button>
                </div>

                <div className="bg-slate-50 border p-2.5 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-700">Amanhã (Domingo) - Integral</p>
                    <p className="text-[11px] text-slate-600">Disponibilidade Média</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveDateModal(false);
                      setRehireModal(true);
                    }}
                    className="bg-primary text-white font-bold px-2.5 py-1 rounded text-[10px]"
                  >
                    AGENDAR
                  </button>
                </div>

                <div className="bg-slate-100 opacity-60 p-2.5 rounded-lg flex justify-between items-center pointer-events-none">
                  <div>
                    <p className="font-bold text-slate-500">Próxima Sexta (Gala de Inverno)</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">Reservado</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveDateModal(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Voltar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REHIRE/CALL MODAL */}
      <AnimatePresence>
        {rehireModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-2xl border border-outline-variant max-w-sm w-full relative space-y-4"
            >
              <button 
                onClick={() => setRehireModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <PhoneCall className="w-6 h-6 text-primary" />
              </div>

              <div className="text-center space-y-1">
                <h4 className="font-display font-extrabold text-lg text-primary">Chamar {currentPro.name} Novamente</h4>
                <p className="text-xs text-on-surface-variant">Confirme o envio expresso do garçom verificado para as suas operações táticas.</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2 text-left">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Profissional tático:</span>
                  <span className="text-primary">{currentPro.name} ({currentPro.category})</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Taxa de sucesso anterior:</span>
                  <span className="text-emerald-600">{currentPro.successRate}% OK</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">ETA médio no local:</span>
                  <span className="text-secondary font-bold">5 - 10 min</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setRehireModal(false)}
                  className="flex-1 py-2.5 border text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setRehireModal(false);
                    alert(`O Ricardo foi notificado e aceitou o chamado! Ele já está empacotando os fardamentos e se dirige ao Palácio das Artes.`);
                  }}
                  className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-lg shadow-md hover:brightness-110"
                >
                  Confirmar Chamado
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
