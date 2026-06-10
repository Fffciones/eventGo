import { useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Home, Clock, DollarSign, Users,
  X, Navigation, CheckCircle, Loader2, AlertCircle
} from 'lucide-react';
import { useOpenBookings, type OpenBooking } from '../../hooks/useOpenBookings';
import type { ProfessionalProfile } from '../../hooks/useProfessionalProfile';

const CATEGORY_LABEL: Record<string, string> = {
  GARCOM:             'Garçom',
  DJ:                 'DJ',
  SEGURANCA:          'Segurança',
  FAXINEIRO:          'Faxineiro',
  FOTOGRAFO:          'Fotógrafo',
  MESTRE_CERIMONIAS:  'Mestre de Cerimônias',
  PRODUTOR:           'Produtor',
  CONTROLADOR_ACESSO: 'Controlador de Acesso',
};

const CATEGORY_EMOJI: Record<string, string> = {
  GARCOM: '🍽️', DJ: '🎧', SEGURANCA: '🛡️', FAXINEIRO: '🧹',
  FOTOGRAFO: '📸', MESTRE_CERIMONIAS: '🎤', PRODUTOR: '🎬', CONTROLADOR_ACESSO: '🚪',
};

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI:   true,
  zoomControl:        true,
  clickableIcons:     false,
  styles: [
    { featureType: 'poi',    elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

interface Props {
  profile: ProfessionalProfile;
}

export default function HomeViewPro({ profile }: Props) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  });

  const center = profile.home_lat && profile.home_lng
    ? { lat: profile.home_lat, lng: profile.home_lng }
    : { lat: -23.5505, lng: -46.6333 }; // São Paulo fallback

  const { bookings, loading, acceptVaga } = useOpenBookings(
    profile.professional_id,
    profile.functions.map(f => f.id),
    profile.home_lat,
    profile.home_lng,
    profile.action_radius_km,
  );

  const [selected, setSelected]   = useState<OpenBooking | null>(null);
  const [mapRef, setMapRef]       = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => setMapRef(map), []);

  const handlePinClick = (b: OpenBooking) => {
    setSelected(b);
    mapRef?.panTo({ lat: b.lat, lng: b.lng });
  };

  if (loadError) return <MapError msg="Erro ao carregar o mapa." />;
  if (!isLoaded)  return <MapLoading />;

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 130px)' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
        onClick={() => setSelected(null)}
      >
        {/* Pin da residência */}
        {profile.home_lat && profile.home_lng && (
          <OverlayView
            position={{ lat: profile.home_lat, lng: profile.home_lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="flex flex-col items-center -translate-x-1/2 -translate-y-full">
              <div className="w-9 h-9 bg-white border-2 border-primary rounded-full flex items-center justify-center shadow-md">
                <Home className="w-4 h-4 text-primary" />
              </div>
              <div className="w-2 h-2 bg-primary rounded-full mt-0.5" />
            </div>
          </OverlayView>
        )}

        {/* Pins de eventos */}
        {bookings.map(b => (
          <OverlayView
            key={b.group_key}
            position={{ lat: b.lat, lng: b.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <EventPin
              booking={b}
              selected={selected?.group_key === b.group_key}
              onClick={() => handlePinClick(b)}
            />
          </OverlayView>
        ))}
      </GoogleMap>

      {/* Contador de vagas no topo */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white rounded-full px-4 py-1.5 shadow-md border border-slate-100 flex items-center gap-2">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            : <span className="w-2 h-2 rounded-full bg-primary" />
          }
          <span className="text-xs font-semibold text-slate-700">
            {loading
              ? 'Buscando eventos…'
              : bookings.length === 0
                ? 'Nenhuma vaga próxima'
                : `${bookings.length} evento${bookings.length > 1 ? 's' : ''} com vaga${bookings.length > 1 ? 's' : ''} próximo${bookings.length > 1 ? 's' : ''}`
            }
          </span>
        </div>
      </div>

      {/* Card de detalhe do evento selecionado */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.group_key}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="absolute bottom-4 left-4 right-4 z-20"
          >
            <EventCard
              booking={selected}
              onClose={() => setSelected(null)}
              onAccept={async () => {
                const ok = await acceptVaga(selected.vaga_id);
                setSelected(null);
                if (!ok) alert('Esta vaga acabou de ser preenchida por outro profissional.');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pin no mapa ──────────────────────────────────────────────────────────────

function EventPin({ booking: b, selected, onClick }: {
  booking: OpenBooking;
  selected: boolean;
  onClick: () => void;
}) {
  const emoji = CATEGORY_EMOJI[b.category] ?? '📌';
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`flex flex-col items-center -translate-x-1/2 -translate-y-full transition-transform ${selected ? 'scale-125' : 'hover:scale-110'}`}
    >
      <div className={`rounded-2xl px-2.5 py-1.5 shadow-lg border flex items-center gap-1.5 transition-colors ${
        selected
          ? 'bg-primary text-white border-primary'
          : b.already_invited
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-white text-slate-800 border-slate-200'
      }`}>
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-bold whitespace-nowrap">
          R$ {Math.round(b.amount).toLocaleString('pt-BR')}
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          selected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
        }`}>
          {b.slots_open} vaga{b.slots_open > 1 ? 's' : ''}
        </span>
      </div>
      <div className={`w-2 h-2 rounded-full mt-0.5 ${selected ? 'bg-primary' : 'bg-slate-400'}`} />
    </button>
  );
}

// ── Card de detalhe ──────────────────────────────────────────────────────────

function EventCard({ booking: b, onClose, onAccept }: { booking: OpenBooking; onClose: () => void; onAccept: () => Promise<void> }) {
  const [accepting, setAccepting] = useState(false);
  const startsAt  = new Date(b.starts_at);
  const endsAt    = new Date(b.ends_at);
  const durationH = Math.round((endsAt.getTime() - startsAt.getTime()) / 3_600_000);
  const perSlot   = b.amount;  // preço já é por vaga

  const dateLabel = startsAt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeLabel = `${startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
            {CATEGORY_EMOJI[b.category]} {CATEGORY_LABEL[b.category] ?? b.category}
          </p>
          <h3 className="text-base font-bold text-slate-800 truncate">{b.event_name}</h3>
        </div>
        <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Infos */}
      <div className="px-4 pb-3 flex flex-col gap-1.5">
        <InfoRow icon={<Clock className="w-3.5 h-3.5" />}      text={`${dateLabel} · ${timeLabel} (${durationH}h)`} />
        <InfoRow icon={<MapPin className="w-3.5 h-3.5" />}     text={b.location_name} sub={b.distance_km != null ? `${b.distance_km.toFixed(1)} km de você` : undefined} />
        <InfoRow icon={<Users className="w-3.5 h-3.5" />}      text={`${b.slots_open} vaga${b.slots_open > 1 ? 's' : ''} disponível${b.slots_open > 1 ? 'is' : ''} de ${b.slots_total}`} />
        <InfoRow icon={<DollarSign className="w-3.5 h-3.5" />} text={`R$ ${perSlot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por profissional`} />
      </div>

      {/* Alerta já convidado */}
      {b.already_invited && (
        <div className="mx-4 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-amber-700">Você já recebeu convite para este evento. Confira a aba Convites.</p>
        </div>
      )}

      {/* Ações */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        <button
          disabled={accepting}
          onClick={async () => { setAccepting(true); try { await onAccept(); } finally { setAccepting(false); } }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
        >
          {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Aceitar vaga
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Navigation className="w-4 h-4 text-primary" />
          Ver rota no Google Maps
        </a>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, text, sub }: { icon: React.ReactNode; text: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-sm text-slate-700">{text}</span>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function MapLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

function MapError({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <MapPin className="w-8 h-8 text-slate-300" />
      <p className="text-sm text-slate-400">{msg}</p>
    </div>
  );
}
