import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Headphones,
  Utensils,
  Shield,
  Sparkles,
  Bolt,

  Check,
  Compass,
  X
} from 'lucide-react';
import { MAP_BACKGROUND, MAP_MARKERS_PRESET } from '../data';
import { BookingTeam } from '../types';

interface HomeViewProps {
  onAddBooking: (newBooking: BookingTeam) => void;
  onSelectPro: (proId: string) => void;
  onNavigate: (tab: 'home' | 'bookings' | 'favorites' | 'profile') => void;
}

export default function HomeView({ onAddBooking, onSelectPro, onNavigate }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<typeof MAP_MARKERS_PRESET[0] | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStep, setRequestStep] = useState<'idle' | 'category' | 'locating' | 'success'>('idle');
  
  // Custom states for interactive calling
  const [requestCategory, setRequestCategory] = useState<'Garçons' | 'Segurança' | 'DJ' | 'Limpeza'>('Garçons');
  const [reqStaffCount, setReqStaffCount] = useState(4);
  const [reqLocation, setReqLocation] = useState('Palácio das Artes, São Paulo');


  // Simple handlers
  const handleMarkerClick = (marker: typeof MAP_MARKERS_PRESET[0]) => {
    setSelectedMarker(marker);
    if (marker.category === 'Garçom') {
      // Allow jumping to premium profile of Ricardo
      // just set chosen marker
    }
  };

  const handleStartRequest = () => {
    setRequestStep('category');
    setIsRequesting(true);
  };

  const handleConfirmRequest = () => {
    setRequestStep('locating');
    // Simulate real-time professional location retrieval
    setTimeout(() => {
      setRequestStep('success');
      // Create new booking team and add to global store
      const categoryMap: Record<string, string> = {
        'Garçons': 'Equipe de Garçons Auxiliares',
        'Segurança': 'Equipe de Escolta Tática',
        'DJ': 'DJ Convidado Adicional',
        'Limpeza': 'Limpeza Pós-Evento Fast'
      };

      const newTeam: BookingTeam = {
        id: `created-${Date.now()}`,
        name: categoryMap[requestCategory] || `${requestCategory} Contratatado`,
        status: 'EM TRÂNSITO',
        countConfirmed: reqStaffCount,
        countReserve: 1,
        rating: 4.8,
        distance: '1.5 km',
        eta: '10 min',
        members: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop']
      };
      
      onAddBooking(newTeam);
    }, 3000);
  };

  const filteredMarkers = selectedFilter 
    ? MAP_MARKERS_PRESET.filter(m => m.category === selectedFilter)
    : MAP_MARKERS_PRESET;

  return (
    <div className="relative flex-grow w-full overflow-hidden h-[calc(100vh-140px)] md:h-[calc(100vh-80px)]">
      {/* Background Overhead Map Image */}
      <div className="absolute inset-0 w-full h-full bg-surface-dim select-none">
        <img
          className="w-full h-full object-cover opacity-90 transition-all duration-500 pointer-events-none"
          src={MAP_BACKGROUND}
          alt="Overhead satellite map view of São Paulo metropolitan grid"
        />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply pointer-events-none" />
      </div>

      {/* FLOATING MARKERS */}
      <div className="absolute inset-0 pointer-events-none z-15">
        {filteredMarkers.map((marker) => {
          const isHovered = hoveredMarker === marker.id;
          return (
            <div
              key={marker.id}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{ top: `${marker.latPercent}%`, left: `${marker.lngPercent}%` }}
              onMouseEnter={() => setHoveredMarker(marker.id)}
              onMouseLeave={() => setHoveredMarker(null)}
              onClick={() => handleMarkerClick(marker)}
            >
              <div className="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                <div className={`marker-pulse bg-primary text-on-primary w-11 h-11 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                  {marker.iconName === 'Headphones' && <Headphones className="w-5 h-5" />}
                  {marker.iconName === 'Utensils' && <Utensils className="w-5 h-5" />}
                  {marker.iconName === 'Shield' && <Shield className="w-5 h-5" />}
                  {marker.iconName === 'Sparkles' && <Sparkles className="w-5 h-5" />}
                </div>
                <div className="mt-1 bg-white/95 backdrop-blur-sm px-2.5 py-0.5 rounded-full shadow-sm border border-outline-variant flex items-center gap-1">
                  <span className="font-mono text-[10px] font-bold text-primary">{marker.eta}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Header Actions / Search Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-margin-mobile z-30">
        <div className="glass-card shadow-lg rounded-xl flex items-center p-1.5 border border-white/50 transition-all focus-within:ring-2 focus-within:ring-primary/40">
          <Search className="text-primary w-5 h-5 ml-3 shrink-0" />
          <input 
            className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface py-2 px-3 text-sm placeholder:text-on-surface-variant" 
            placeholder="Onde será seu evento?" 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            onClick={() => {
              if (searchQuery.trim().toLowerCase().includes('ricardo')) {
                onSelectPro('ricardo-1');
              } else if (searchQuery.trim().toLowerCase().includes('gala')) {
                onNavigate('bookings');
              } else {
                alert(`Buscando por: "${searchQuery}" em São Paulo...`);
              }
            }}
            className="bg-primary hover:bg-primary-container text-on-primary rounded-lg px-4 py-2 text-xs font-semibold active:scale-95 transition-transform shrink-0"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Marker Detail Overlay Panel when clicked */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute top-28 left-4 right-4 md:left-[20%] md:right-[20%] mx-auto bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-outline-variant/40 z-40 max-w-lg"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  {selectedMarker.iconName === 'Headphones' && <Headphones className="w-5 h-5" />}
                  {selectedMarker.iconName === 'Utensils' && <Utensils className="w-5 h-5 animate-bounce" />}
                  {selectedMarker.iconName === 'Shield' && <Shield className="w-5 h-5" />}
                  {selectedMarker.iconName === 'Sparkles' && <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-display font-semibold text-primary">{selectedMarker.category} Disponível</h4>
                  <p className="text-xs font-mono font-bold text-secondary">Tempo estimado de chegada: {selectedMarker.eta}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMarker(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-on-surface-variant transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-on-surface-variant mt-2.5 bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30">
              {selectedMarker.details}
            </p>

            <div className="flex justify-end gap-2 mt-3.5">
              {selectedMarker.category === 'Garçom' && (
                <button 
                  onClick={() => {
                    onSelectPro('ricardo-1');
                    setSelectedMarker(null);
                  }}
                  className="px-3.5 py-1.5 border border-primary text-primary hover:bg-primary/5 rounded-lg text-xs font-semibold transition-all"
                >
                  Ver Perfil Ricardo
                </button>
              )}
              <button 
                onClick={() => {
                  setRequestCategory(selectedMarker.category as any);
                  handleStartRequest();
                  setSelectedMarker(null);
                }}
                className="px-4 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                Solicitar Este Serviço
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Bottom-sheet context & Booking overlays */}
      <div className="absolute bottom-6 w-full px-margin-mobile z-20">
        <div className="max-w-[700px] mx-auto flex flex-col gap-4">
          
          {/* Quick Category Filters row */}
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1 select-none">
            {[
              { label: 'Garçons', val: 'Garçom', icon: <Utensils className="w-4 h-4" /> },
              { label: 'Segurança', val: 'Segurança', icon: <Shield className="w-4 h-4" /> },
              { label: 'DJ', val: 'DJ', icon: <Headphones className="w-4 h-4" /> },
              { label: 'Limpeza', val: 'Limpeza', icon: <Sparkles className="w-4 h-4" /> }
            ].map((cat) => (
              <button 
                key={cat.label}
                onClick={() => setSelectedFilter(selectedFilter === cat.val ? null : cat.val)}
                className={`flex-shrink-0 flex items-center gap-1.5 shadow-sm border rounded-full px-5 py-2.5 transition-all text-xs font-medium active:scale-95 ${
                  selectedFilter === cat.val 
                    ? 'bg-primary border-primary text-on-primary' 
                    : 'bg-white border-outline-variant/40 text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className={selectedFilter === cat.val ? 'text-on-primary' : 'text-secondary'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            ))}
            {selectedFilter && (
              <button 
                onClick={() => setSelectedFilter(null)}
                className="flex-shrink-0 bg-red-100 text-red-700 px-3 py-2 rounded-full text-xs font-bold active:scale-95"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Chamada de Urgência */}
          <div className="glass-card rounded-2xl p-4 md:p-5 border border-red-200/60 bg-red-50/80 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-red-100 p-3 rounded-xl shadow-inner text-red-600">
                <Bolt className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-lg md:text-xl text-red-700 leading-tight">Contratação Imediata</h3>
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  Desfalque na sua equipe? Chame agora!
                </p>
              </div>
            </div>
            <button
              onClick={handleStartRequest}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs md:text-sm px-5 py-3 rounded-xl active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-1"
            >
              Localizar Profissional
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Booking Flow Dialog */}
      <AnimatePresence>
        {isRequesting && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-2xl border border-outline-variant max-w-md w-full relative space-y-4 text-left"
            >
              <button 
                onClick={() => {
                  setIsRequesting(false);
                  setRequestStep('idle');
                }}
                className="absolute top-4 right-4 text-on-surface-variant hover:bg-slate-100 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {requestStep === 'category' && (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <Bolt className="w-6 h-6 text-secondary" />
                    <h3 className="font-display font-extrabold text-xl">Novo Pedido Expresso</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant">Selecione as especificações rápidas para a sua equipe eventual.</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">CATEGORIA</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Garçons', 'Segurança', 'DJ', 'Limpeza'] as const).map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setRequestCategory(cat)}
                            className={`py-2 px-3 text-xs rounded-xl border font-semibold text-center transition-all ${
                              requestCategory === cat 
                                ? 'bg-primary-container/20 border-primary text-primary' 
                                : 'bg-slate-50 border-outline-variant/60 text-on-surface'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">QUANTIDADE DE PROFISSIONAIS ({reqStaffCount})</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="12" 
                        value={reqStaffCount}
                        onChange={(e) => setReqStaffCount(Number(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>1 Profissional</span>
                        <span>12 Profissionais</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">LOCAL DO EVENTO</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          value={reqLocation} 
                          onChange={(e) => setReqLocation(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-outline-variant/70 focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleConfirmRequest}
                      className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <span>Solicitar Envio de Equipe</span>
                    </button>
                  </div>
                </>
              )}

              {requestStep === 'locating' && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                    <Compass className="w-7 h-7 text-secondary absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-lg text-primary">Localizando Profissionais...</h4>
                    <p className="text-xs text-on-surface-variant max-w-[280px] mx-auto mt-1">Conectando aos garçons e staffs de alta reputação disponíveis em SP.</p>
                  </div>
                </div>
              )}

              {requestStep === 'success' && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-xl text-primary">Solicitação Confirmada!</h4>
                    <p className="text-xs text-on-surface-variant max-w-[300px] mx-auto mt-1">
                      Sua equipe de {requestCategory} com {reqStaffCount} profissionais já está a caminho. Consulte a aba de agendamentos para acompanhar em tempo real.
                    </p>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setIsRequesting(false);
                        setRequestStep('idle');
                      }}
                      className="flex-1 py-2.5 border border-outline-variant text-on-surface hover:bg-slate-50 text-xs font-semibold rounded-xl"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => {
                        setIsRequesting(false);
                        setRequestStep('idle');
                        onNavigate('bookings');
                      }}
                      className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold rounded-xl shadow-md"
                    >
                      Acompanhar
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
