import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MapPin, Clock, Phone, CheckCircle, Loader2,
  Navigation, LogIn, LogOut, Truck, MessageCircle, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { waLink } from '../../lib/whatsapp';
import type { AgendaEvent } from '../../hooks/useProfessionalProfile';

interface Props {
  event: AgendaEvent;
  onRefetch: () => void;
  onViewAgenda: () => void;
}

const STATUS_STEP = {
  ACCEPTED:    0,
  IN_TRANSIT:  1,
  CHECKED_IN:  2,
  CHECKED_OUT: 3,
};

const STEPS = [
  { key: 'ACCEPTED',    label: 'Confirmado'   },
  { key: 'IN_TRANSIT',  label: 'A caminho'    },
  { key: 'CHECKED_IN',  label: 'No local'     },
  { key: 'CHECKED_OUT', label: 'Concluído'    },
];

function useElapsed(start: string) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(start).getTime()) / 1000);
      if (diff < 0) { setElapsed(''); return; }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(h > 0 ? `${h}h ${String(m).padStart(2,'0')}min` : `${m}min ${String(s).padStart(2,'0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);
  return elapsed;
}

function useRemaining(end: string) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((new Date(end).getTime() - Date.now()) / 1000);
      if (diff <= 0) { setRemaining('encerrado'); return; }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      setRemaining(h > 0 ? `${h}h ${m}min restantes` : `${m}min restantes`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [end]);
  return remaining;
}

export default function ActiveEventPro({ event, onRefetch, onViewAgenda }: Props) {
  const [loading, setLoading] = useState(false);
  const elapsed   = useElapsed(event.starts_at);
  const remaining = useRemaining(event.ends_at);
  const currentStep = STATUS_STEP[event.status as keyof typeof STATUS_STEP] ?? 0;

  const startsAt = new Date(event.starts_at);
  const endsAt   = new Date(event.ends_at);
  const timeRange = `${startsAt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} – ${endsAt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;

  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try { await fn(); onRefetch(); }
    finally { setLoading(false); }
  };

  const activateTransit = () => run(() => supabase.rpc('activate_transit', { p_vaga_id: event.vaga_id }));
  const checkIn  = () => run(() => supabase.rpc('professional_checkin', { p_vaga_id: event.vaga_id }));
  const checkOut = () => run(() =>
    supabase.from('vagas').update({
      worker_status: 'CHECKED_OUT', status: 'IN_PROGRESS',
      checkout_at: new Date().toISOString(), gps_active: false,
    }).eq('id', event.vaga_id)
  );

  const organizer = event.organizer_name
    ? { name: event.organizer_name, whatsapp: event.organizer_whatsapp }
    : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)]">

      {/* Hero verde pulsante */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-5 pt-6 pb-8 relative overflow-hidden">
        {/* pulse de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white animate-ping" style={{animationDuration:'3s'}} />
          <div className="absolute top-8 right-8 w-20 h-20 rounded-full border-4 border-white animate-ping" style={{animationDuration:'3s',animationDelay:'0.5s'}} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              EVENTO EM ANDAMENTO
            </span>
          </div>

          <h1 className="text-2xl font-black leading-tight mb-1">{event.event_name}</h1>
          <p className="text-emerald-100 text-sm font-medium mb-4">{event.category}</p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{event.location_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{timeRange}</span>
              {remaining && <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">{remaining}</span>}
            </div>
          </div>

          {elapsed && event.status === 'CHECKED_IN' && (
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-emerald-200 font-medium">Tempo no local</p>
              <p className="text-2xl font-black tabular-nums mt-0.5">{elapsed}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const done    = i < currentStep;
            const current = i === currentStep;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {i < STEPS.length - 1 && (
                  <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done    ? 'bg-emerald-500 border-emerald-500 text-white' :
                  current ? 'bg-white border-emerald-500 text-emerald-600' :
                            'bg-white border-slate-200 text-slate-400'
                }`}>
                  {done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <p className={`text-[10px] mt-1 font-semibold text-center ${current ? 'text-emerald-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-4">

        {/* Remuneração */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 font-semibold">Remuneração</p>
            <p className="text-2xl font-black text-emerald-700">
              R$ {event.amount.toLocaleString('pt-BR',{minimumFractionDigits:2})}
            </p>
          </div>
          {event.checkin_at && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Check-in</p>
              <p className="text-sm font-bold text-slate-700">
                {new Date(event.checkin_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
              </p>
            </div>
          )}
        </div>

        {/* Botão de ação principal */}
        {event.status === 'ACCEPTED' && (
          <ActionButton loading={loading} color="bg-amber-500" onClick={activateTransit}
            icon={<Truck className="w-5 h-5" />} label="Estou a caminho" sub="Ativa o rastreamento GPS" />
        )}
        {event.status === 'IN_TRANSIT' && (
          <ActionButton loading={loading} color="bg-emerald-600" onClick={checkIn}
            icon={<LogIn className="w-5 h-5" />} label="Fazer check-in" sub="Confirme que chegou ao local" />
        )}
        {event.status === 'CHECKED_IN' && (
          <ActionButton loading={loading} color="bg-primary" onClick={checkOut}
            icon={<LogOut className="w-5 h-5" />} label="Concluir evento" sub="Registre a saída ao terminar" />
        )}
        {event.status === 'CHECKED_OUT' && (
          <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-700">Evento concluído!</p>
              <p className="text-xs text-slate-500">Pagamento processado em breve.</p>
            </div>
          </div>
        )}

        {/* Contato do organizador */}
        {organizer && (
          <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Organizador no local</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{organizer.name}</p>
                {organizer.whatsapp && (
                  <p className="text-xs text-slate-400 mt-0.5">{organizer.whatsapp}</p>
                )}
              </div>
              {organizer.whatsapp && (
                <a
                  href={waLink(organizer.whatsapp, `Olá! Sou o profissional do evento "${event.event_name}".`)}
                  target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-[#128C7E]" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Link para agenda completa */}
        <button
          onClick={onViewAgenda}
          className="flex items-center justify-between w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-semibold text-slate-600">Ver todos os eventos</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}

function ActionButton({ loading, color, onClick, icon, label, sub }: {
  loading: boolean; color: string; onClick: () => void;
  icon: React.ReactNode; label: string; sub: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-4 ${color} text-white rounded-2xl px-5 py-4 shadow-lg disabled:opacity-60 transition-all`}
    >
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </div>
      <div className="text-left">
        <p className="font-black text-base">{label}</p>
        <p className="text-xs opacity-80">{sub}</p>
      </div>
    </motion.button>
  );
}
