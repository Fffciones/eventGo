import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, MapPin, Clock, DollarSign, Star, Calendar,
  CheckCircle, XCircle, ChevronDown, ChevronUp, Shirt,
  Utensils, Navigation, Bus, AlertCircle, Loader2
} from 'lucide-react';
import type { PendingInvite } from '../../hooks/useProfessionalProfile';

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

interface Props {
  invites: PendingInvite[];
  onRespond: (vagaId: string, accept: boolean) => Promise<void>;
}

export default function ConviteView({ invites, onRespond }: Props) {
  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Bell className="w-7 h-7 text-slate-300" />
        </div>
        <h2 className="text-lg font-bold text-slate-600">Nenhum convite pendente</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          Quando um cliente solicitar seu serviço, o convite aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-32 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        {invites.length} convite{invites.length > 1 ? 's' : ''} pendente{invites.length > 1 ? 's' : ''}
      </h2>
      {invites.map(invite => (
        <InviteCard key={invite.vaga_id} invite={invite} onRespond={onRespond} />
      ))}
    </div>
  );
}

function InviteCard({ invite, onRespond }: { invite: PendingInvite; onRespond: Props['onRespond'] }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);

  const startsAt = new Date(invite.starts_at);
  const endsAt   = new Date(invite.ends_at);
  const durationH = Math.round((endsAt.getTime() - startsAt.getTime()) / 3_600_000);

  const dateLabel = startsAt.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });
  const timeLabel = `${startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const handleRespond = async (accept: boolean) => {
    setLoading(accept ? 'accept' : 'decline');
    try {
      await onRespond(invite.vaga_id, accept);
    } finally {
      setLoading(null);
    }
  };

  const briefing = invite.briefing ?? {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
        invite.is_favorite ? 'border-amber-300' : 'border-slate-100'
      }`}
    >
      {/* Badge favorito */}
      {invite.is_favorite && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span className="text-xs font-semibold text-amber-700">
            Este cliente te favoritou! Aceitar eleva suas estrelas.
          </span>
        </div>
      )}

      {/* Header do card */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
              {CATEGORY_LABEL[invite.category] ?? invite.category}
              {invite.multiplier === 'EMERGENCY' && (
                <span className="ml-2 text-red-500">· Emergência 1.5×</span>
              )}
            </p>
            <h3 className="text-base font-bold text-slate-800 truncate">{invite.event_name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">por {invite.client_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-primary">
              R$ {invite.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400">{durationH}h de evento</p>
          </div>
        </div>

        {/* Infos rápidas */}
        <div className="mt-3 flex flex-col gap-1.5">
          <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} text={dateLabel} />
          <InfoRow icon={<Clock className="w-3.5 h-3.5" />} text={timeLabel} />
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5" />}
            text={invite.location_name}
            sub={invite.distance_km != null ? `${invite.distance_km.toFixed(1)} km de você` : undefined}
          />
        </div>
      </div>

      {/* Briefing expansível */}
      {Object.keys(briefing).length > 0 && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <span>Ver briefing do evento</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="briefing"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60">
                  {briefing.uniforme && (
                    <BriefingRow icon={<Shirt className="w-3.5 h-3.5 text-primary" />} label="Uniforme" value={briefing.uniforme} />
                  )}
                  {briefing.alimentacao && (
                    <BriefingRow icon={<Utensils className="w-3.5 h-3.5 text-primary" />} label="Alimentação" value={briefing.alimentacao} />
                  )}
                  {briefing.ponto_encontro && (
                    <BriefingRow icon={<Navigation className="w-3.5 h-3.5 text-primary" />} label="Ponto de encontro" value={briefing.ponto_encontro} />
                  )}
                  {briefing.transporte && (
                    <BriefingRow icon={<Bus className="w-3.5 h-3.5 text-primary" />} label="Transporte" value={briefing.transporte} />
                  )}
                  {briefing.observacoes && (
                    <BriefingRow icon={<AlertCircle className="w-3.5 h-3.5 text-primary" />} label="Observações" value={briefing.observacoes} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Timer de expiração */}
      {invite.expires_at && (
        <ExpiresTimer expiresAt={invite.expires_at} />
      )}

      {/* Botões */}
      <div className="flex gap-2 px-4 pb-4 pt-3 border-t border-slate-100">
        <button
          disabled={loading !== null}
          onClick={() => handleRespond(false)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading === 'decline'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <XCircle className="w-4 h-4 text-slate-400" />
          }
          Recusar
        </button>
        <button
          disabled={loading !== null}
          onClick={() => handleRespond(true)}
          className="flex-2 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {loading === 'accept'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle className="w-4 h-4" />
          }
          Aceitar
        </button>
      </div>
    </motion.div>
  );
}

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

function BriefingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function ExpiresTimer({ expiresAt }: { expiresAt: string }) {
  const expires = new Date(expiresAt);
  const now = new Date();
  const diffMin = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 60_000));

  return (
    <div className="mx-4 mb-3 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
      <span className="text-xs font-semibold text-red-600">
        {diffMin > 0
          ? `Expira em ${diffMin} min`
          : 'Convite expirado'}
      </span>
    </div>
  );
}
