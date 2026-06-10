import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarCheck, MapPin, Clock, ChevronDown, ChevronUp,
  Shirt, Utensils, Navigation, Bus, AlertCircle,
  Truck, LogIn, LogOut, CheckCircle, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AgendaEvent } from '../../hooks/useProfessionalProfile';

type Filter = 'proximos' | 'passados' | 'todos';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ACCEPTED:   { label: 'Confirmado',   color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  IN_TRANSIT: { label: 'Em trânsito',  color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CHECKED_IN: { label: 'No local',     color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  CHECKED_OUT:{ label: 'Concluído',    color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
};

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
  agenda: AgendaEvent[];
  onRefetch: () => void;
}

export default function AgendaView({ agenda, onRefetch }: Props) {
  const [filter, setFilter] = useState<Filter>('proximos');
  const now = new Date();

  const filtered = agenda.filter(ev => {
    const end = new Date(ev.ends_at);
    if (filter === 'proximos') return end >= now;
    if (filter === 'passados') return end < now;
    return true;
  });

  return (
    <div className="px-4 pt-5 pb-32 flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex gap-2">
        {(['proximos', 'todos', 'passados'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filter === f
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f === 'proximos' ? 'Próximos' : f === 'passados' ? 'Passados' : 'Todos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <CalendarCheck className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">Nenhum evento {filter === 'proximos' ? 'próximo' : filter === 'passados' ? 'passado' : ''} encontrado.</p>
        </div>
      ) : (
        filtered.map(ev => (
          <AgendaCard key={ev.vaga_id} event={ev} onRefetch={onRefetch} />
        ))
      )}
    </div>
  );
}

function AgendaCard({ event, onRefetch }: { event: AgendaEvent; onRefetch: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const meta = STATUS_META[event.status] ?? { label: event.status, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
  const startsAt = new Date(event.starts_at);
  const endsAt   = new Date(event.ends_at);

  const dateLabel = startsAt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeLabel = `${startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const durationH = Math.round((endsAt.getTime() - startsAt.getTime()) / 3_600_000);

  const briefing = event.briefing ?? {};
  const hasBriefing = Object.keys(briefing).length > 0;

  const runAction = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      await fn();
      onRefetch();
    } finally {
      setLoading(false);
    }
  };

  const activateTransit = () =>
    runAction(() => supabase.rpc('activate_transit', { p_vaga_id: event.vaga_id }));

  const checkIn = () =>
    runAction(() => supabase.rpc('professional_checkin', { p_vaga_id: event.vaga_id }));

  const checkOut = () =>
    runAction(() => supabase
      .from('vagas')
      .update({ worker_status: 'CHECKED_OUT', status: 'CLOSING', checkout_at: new Date().toISOString(), gps_active: false })
      .eq('id', event.vaga_id));

  const actionButton = () => {
    if (event.status === 'ACCEPTED') return (
      <ActionBtn
        icon={<Truck className="w-4 h-4" />}
        label="Estou a caminho"
        color="bg-amber-500 hover:bg-amber-600"
        loading={loading}
        onClick={activateTransit}
      />
    );
    if (event.status === 'IN_TRANSIT') return (
      <ActionBtn
        icon={<LogIn className="w-4 h-4" />}
        label="Fiz check-in"
        color="bg-green-600 hover:bg-green-700"
        loading={loading}
        onClick={checkIn}
      />
    );
    if (event.status === 'CHECKED_IN') return (
      <ActionBtn
        icon={<LogOut className="w-4 h-4" />}
        label="Concluir evento"
        color="bg-primary hover:bg-primary/90"
        loading={loading}
        onClick={checkOut}
      />
    );
    if (event.status === 'CHECKED_OUT') return (
      <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold">
        <CheckCircle className="w-4 h-4 text-green-500" />
        Evento concluído
      </div>
    );
    return null;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
              {CATEGORY_LABEL[event.category] ?? event.category}
            </p>
            <h3 className="text-base font-bold text-slate-800 truncate">{event.event_name}</h3>
          </div>
          <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <InfoRow icon={<Clock className="w-3.5 h-3.5" />}    text={`${dateLabel} · ${timeLabel} (${durationH}h)`} />
          <InfoRow icon={<MapPin className="w-3.5 h-3.5" />}   text={event.location_name} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-black text-primary">
            R$ {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {event.checkin_at && (
            <p className="text-xs text-slate-400">
              Check-in {new Date(event.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* Botão de ação */}
      <div className="px-4 pb-3">
        {actionButton()}
      </div>

      {/* Briefing expansível */}
      {hasBriefing && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <span>Briefing do evento</span>
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
                <div className="px-4 pb-4 pt-2 flex flex-col gap-2 bg-slate-50/60 border-t border-slate-100">
                  {briefing.uniforme        && <BriefingRow icon={<Shirt className="w-3.5 h-3.5 text-primary" />}     label="Uniforme"          value={briefing.uniforme} />}
                  {briefing.alimentacao     && <BriefingRow icon={<Utensils className="w-3.5 h-3.5 text-primary" />}  label="Alimentação"       value={briefing.alimentacao} />}
                  {briefing.ponto_encontro  && <BriefingRow icon={<Navigation className="w-3.5 h-3.5 text-primary" />}label="Ponto de encontro" value={briefing.ponto_encontro} />}
                  {briefing.transporte      && <BriefingRow icon={<Bus className="w-3.5 h-3.5 text-primary" />}       label="Transporte"        value={briefing.transporte} />}
                  {briefing.observacoes     && <BriefingRow icon={<AlertCircle className="w-3.5 h-3.5 text-primary" />}label="Observações"      value={briefing.observacoes} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

function ActionBtn({ icon, label, color, loading, onClick }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-60 shadow-sm ${color}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-slate-700">{text}</span>
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
