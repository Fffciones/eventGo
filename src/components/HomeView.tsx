import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api';
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
  X,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { BookingTeam } from '../types';
import { useAvailableProfessionalsMap, type ProfessionalPin } from '../hooks/useAvailableProfessionalsMap';
import type { ProfessionalCategory } from '../lib/database.types';

// ─── Mapa ────────────────────────────────────────────────────────────────────

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI:  true,
  zoomControl:       true,
  clickableIcons:    false,
  styles: [
    { featureType: 'poi',     elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

const SP_CENTER = { lat: -23.5505, lng: -46.6333 };

// ─── Mapeamento categoria → filtro ───────────────────────────────────────────

const FILTER_CATEGORIES: { label: string; val: ProfessionalCategory; icon: React.ReactNode }[] = [
  { label: 'Garçons',   val: 'GARCOM',    icon: <Utensils  className="w-4 h-4" /> },
  { label: 'Segurança', val: 'SEGURANCA', icon: <Shield    className="w-4 h-4" /> },
  { label: 'DJ',        val: 'DJ',        icon: <Headphones className="w-4 h-4" /> },
  { label: 'Limpeza',   val: 'FAXINEIRO', icon: <Sparkles  className="w-4 h-4" /> },
];

const CATEGORY_LABEL: Partial<Record<ProfessionalCategory, string>> = {
  GARCOM:    'Garçom',
  DJ:        'DJ',
  SEGURANCA: 'Segurança',
  FAXINEIRO: 'Limpeza',
  FOTOGRAFO: 'Fotógrafo',
  MESTRE_CERIMONIAS:  'Mestre de Cerimônias',
  PRODUTOR:           'Produtor',
  CONTROLADOR_ACESSO: 'Controle de Acesso',
};

const CATEGORY_ICON: Partial<Record<ProfessionalCategory, React.ReactNode>> = {
  GARCOM:    <Utensils   className="w-4 h-4" />,
  DJ:        <Headphones className="w-4 h-4" />,
  SEGURANCA: <Shield     className="w-4 h-4" />,
  FAXINEIRO: <Sparkles   className="w-4 h-4" />,
};

// ─── Pin de profissional no mapa ─────────────────────────────────────────────

function ProPin({ pin, selected, onClick }: {
  pin: ProfessionalPin;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer"
    >
      <div className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-lg border-2 transition-all
        ${selected
          ? 'bg-primary border-primary text-white scale-110'
          : 'bg-white border-primary text-primary hover:scale-105'}
      `}>
        <span className={selected ? 'text-white' : 'text-primary'}>
          {CATEGORY_ICON[pin.category] ?? <MapPin className="w-4 h-4" />}
        </span>
        <span className="text-[11px] font-bold whitespace-nowrap">
          {pin.full_name.split(' ')[0]}
        </span>
      </div>
      <div className="w-2 h-2 bg-primary rounded-full mt-0.5" />
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface HomeViewProps {
  onAddBooking: (newBooking: BookingTeam) => void;
  onSelectPro: (proId: string) => void;
  onNavigate: (tab: 'home' | 'bookings' | 'favorites' | 'profile') => void;
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function HomeView({ onAddBooking, onSelectPro, onNavigate }: HomeViewProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  });

  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedFilter,  setSelectedFilter]  = useState<ProfessionalCategory | null>(null);
  const [selectedPin,     setSelectedPin]     = useState<ProfessionalPin | null>(null);
  const [center,          setCenter]          = useState(SP_CENTER);
  const [mapRef,          setMapRef]          = useState<google.maps.Map | null>(null);
  const onMapLoad = useCallback((map: google.maps.Map) => setMapRef(map), []);

  // Booking imediato
  const [isRequesting,   setIsRequesting]   = useState(false);
  const [requestStep,    setRequestStep]    = useState<'idle' | 'category' | 'locating' | 'success'>('idle');
  const [requestCategory, setRequestCategory] = useState<'Garçons' | 'Segurança' | 'DJ' | 'Limpeza'>('Garçons');
  const [reqStaffCount,  setReqStaffCount]  = useState(4);
  const [reqLocation,    setReqLocation]    = useState('São Paulo, SP');

  // Profissionais disponíveis via banco
  const { pins, loading } = useAvailableProfessionalsMap(selectedFilter);

  // Geolocalização do contratante
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setCenter(pos);
        mapRef?.panTo(pos);
      },
      () => { /* fallback São Paulo */ }
    );
  }, [mapRef]);

  const handleStartRequest = () => { setRequestStep('category'); setIsRequesting(true); };

  const handleConfirmRequest = () => {
    setRequestStep('locating');
    setTimeout(() => {
      setRequestStep('success');
      const categoryMap: Record<string, string> = {
        'Garçons':   'Equipe de Garçons',
        'Segurança': 'Equipe de Segurança',
        'DJ':        'DJ Contratado',
        'Limpeza':   'Equipe de Limpeza',
      };
      const newTeam: BookingTeam = {
        id: `created-${Date.now()}`,
        name: categoryMap[requestCategory] ?? requestCategory,
        status: 'EM TRÂNSITO',
        countConfirmed: reqStaffCount,
        countReserve: 1,
        rating: 4.8,
        distance: '1.5 km',
        eta: '10 min',
        members: [],
      };
      onAddBooking(newTeam);
    }, 3000);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex-grow flex items-center justify-center flex-col gap-3 text-on-surface-variant">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm">Erro ao carregar o mapa.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex-grow w-full overflow-hidden h-[calc(100vh-140px)] md:h-[calc(100vh-80px)]">

      {/* ── Mapa Google Maps ── */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
        onClick={() => setSelectedPin(null)}
      >
        {pins.map(pin => (
          <OverlayView
            key={pin.professional_id}
            position={{ lat: pin.lat, lng: pin.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <ProPin
              pin={pin}
              selected={selectedPin?.professional_id === pin.professional_id}
              onClick={() => {
                setSelectedPin(pin);
                mapRef?.panTo({ lat: pin.lat, lng: pin.lng });
              }}
            />
          </OverlayView>
        ))}
      </GoogleMap>

      {/* ── Barra de busca ── */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-4 z-30">
        <div className="glass-card shadow-lg rounded-xl flex items-center p-1.5 border border-white/50 focus-within:ring-2 focus-within:ring-primary/40">
          <Search className="text-primary w-5 h-5 ml-3 shrink-0" />
          <input
            className="flex-grow bg-transparent border-none focus:outline-none text-on-surface py-2 px-3 text-sm placeholder:text-on-surface-variant"
            placeholder="Onde será seu evento?"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => {
              if (searchQuery.trim()) {
                alert(`Buscando por: "${searchQuery}"…`);
              }
            }}
            className="bg-primary hover:bg-primary-container text-on-primary rounded-lg px-4 py-2 text-xs font-semibold active:scale-95 transition-transform shrink-0"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* ── Contador de profissionais disponíveis ── */}
      <div className="absolute top-[84px] left-1/2 -translate-x-1/2 z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md border border-slate-100 flex items-center gap-2">
          {loading
            ? <Loader2 className="w-3 h-3 text-primary animate-spin" />
            : <span className="w-2 h-2 rounded-full bg-emerald-500" />
          }
          <span className="text-xs font-semibold text-slate-700">
            {loading ? 'Carregando…' : `${pins.length} profissional${pins.length !== 1 ? 'is' : ''} disponível${pins.length !== 1 ? 'is' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Painel de detalhe do profissional ── */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute top-28 left-4 right-4 md:left-[20%] md:right-[20%] mx-auto bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-outline-variant/40 z-40 max-w-lg"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  {CATEGORY_ICON[selectedPin.category] ?? <MapPin className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-display font-semibold text-primary">{selectedPin.full_name}</h4>
                  <p className="text-xs text-on-surface-variant">
                    {CATEGORY_LABEL[selectedPin.category] ?? selectedPin.category}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedPin(null)} className="p-1 rounded-full hover:bg-slate-100 text-on-surface-variant">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4 mt-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <strong className="text-on-surface">{selectedPin.stars.toFixed(1)}</strong>
              </span>
              <span>{selectedPin.events_count} eventos</span>
              {selectedPin.hourly_cache > 0 && (
                <span className="text-primary font-semibold">
                  R$ {selectedPin.hourly_cache.toFixed(0)}/h
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-3.5">
              <button
                onClick={() => {
                  setRequestCategory('Garçons');
                  handleStartRequest();
                  setSelectedPin(null);
                }}
                className="px-4 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                Solicitar Este Profissional
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom bar: filtros + botão de emergência ── */}
      <div className="absolute bottom-6 w-full px-4 z-20">
        <div className="max-w-[700px] mx-auto flex flex-col gap-4">

          {/* Filtros de categoria */}
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1 select-none">
            {FILTER_CATEGORIES.map(cat => (
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
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
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

      {/* ── Modal de contratação imediata ── */}
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
                onClick={() => { setIsRequesting(false); setRequestStep('idle'); }}
                className="absolute top-4 right-4 text-on-surface-variant hover:bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              {requestStep === 'category' && (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <Bolt className="w-6 h-6 text-secondary" />
                    <h3 className="font-display font-extrabold text-xl">Novo Pedido Expresso</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant">Especificações rápidas para sua equipe eventual.</p>

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
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        QUANTIDADE ({reqStaffCount})
                      </label>
                      <input
                        type="range" min="1" max="12" value={reqStaffCount}
                        onChange={e => setReqStaffCount(Number(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>1</span><span>12 Profissionais</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">LOCAL DO EVENTO</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={reqLocation}
                          onChange={e => setReqLocation(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-outline-variant/70 focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmRequest}
                    className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl shadow-lg active:scale-[0.98] transition-all"
                  >
                    Solicitar Envio de Equipe
                  </button>
                </>
              )}

              {requestStep === 'locating' && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                    <Compass className="w-7 h-7 text-secondary absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-lg text-primary">Localizando Profissionais…</h4>
                    <p className="text-xs text-on-surface-variant max-w-[280px] mx-auto mt-1">
                      Conectando aos profissionais de alta reputação disponíveis.
                    </p>
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
                      Equipe de {requestCategory} com {reqStaffCount} profissional{reqStaffCount !== 1 ? 'is' : ''} a caminho.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setIsRequesting(false); setRequestStep('idle'); }}
                      className="flex-1 py-2.5 border border-outline-variant text-on-surface hover:bg-slate-50 text-xs font-semibold rounded-xl"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => { setIsRequesting(false); setRequestStep('idle'); onNavigate('bookings'); }}
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
