import { useState, useEffect } from 'react';
import {
  MapPin, Clock, Users, MessageCircle, Navigation,
  CheckCircle, Truck, UserCheck, X, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { waLink } from '../lib/whatsapp';

interface DbEvent {
  id: string;
  name: string;
  location_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  responsible_1_name?: string | null;
  responsible_1_role?: string | null;
  responsible_1_whatsapp?: string | null;
  responsible_2_name?: string | null;
  responsible_2_role?: string | null;
  responsible_2_whatsapp?: string | null;
  whatsapp_group_link?: string | null;
}

interface VagaTeam {
  id: string;
  category: string;
  worker_status: string | null;
  professional_id: string | null;
  checkin_at: string | null;
  gps_active: boolean;
  professionals: { users: { full_name: string; avatar_url: string | null } } | null;
}

interface Props {
  event: DbEvent;
  onViewAll: () => void;
}

const WORKER_META: Record<string, { label: string; color: string; icon: React.ReactNode; order: number }> = {
  ACCEPTED:    { label: 'Confirmado',  color: 'text-emerald-600 bg-emerald-50',  icon: <CheckCircle className="w-3.5 h-3.5" />, order: 1 },
  IN_TRANSIT:  { label: 'A caminho',   color: 'text-blue-600 bg-blue-50',         icon: <Truck className="w-3.5 h-3.5" />,       order: 2 },
  CHECKED_IN:  { label: 'No local',    color: 'text-violet-600 bg-violet-50',     icon: <UserCheck className="w-3.5 h-3.5" />,   order: 3 },
  CHECKED_OUT: { label: 'Concluído',   color: 'text-slate-500 bg-slate-50',       icon: <CheckCircle className="w-3.5 h-3.5" />, order: 4 },
};

function useRemaining(end: string) {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((new Date(end).getTime() - Date.now()) / 1000);
      if (diff <= 0) { setTxt('encerrado'); return; }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      setTxt(h > 0 ? `${h}h ${m}min restantes` : `${m}min restantes`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [end]);
  return txt;
}

export default function ActiveEventClient({ event, onViewAll }: Props) {
  const [team, setTeam] = useState<VagaTeam[]>([]);
  const remaining = useRemaining(event.ends_at);

  const fetchTeam = async () => {
    const { data } = await supabase
      .from('vagas')
      .select('id, category, worker_status, professional_id, checkin_at, gps_active, professionals(users(full_name, avatar_url))')
      .eq('event_id', event.id)
      .not('worker_status', 'is', null);
    setTeam((data as VagaTeam[]) ?? []);
  };

  useEffect(() => {
    fetchTeam();
    const ch = supabase
      .channel(`active-event-client-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vagas', filter: `event_id=eq.${event.id}` }, fetchTeam)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [event.id]);

  const counts = {
    accepted:   team.filter(v => v.worker_status === 'ACCEPTED').length,
    inTransit:  team.filter(v => v.worker_status === 'IN_TRANSIT').length,
    onSite:     team.filter(v => v.worker_status === 'CHECKED_IN').length,
    done:       team.filter(v => v.worker_status === 'CHECKED_OUT').length,
  };
  const total = team.length;

  const startsAt = new Date(event.starts_at);
  const endsAt   = new Date(event.ends_at);
  const timeRange = `${startsAt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} – ${endsAt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;

  // Sort team: CHECKED_IN first, then IN_TRANSIT, then ACCEPTED, then CHECKED_OUT
  const sortedTeam = [...team].sort((a, b) => {
    const ao = WORKER_META[a.worker_status ?? '']?.order ?? 99;
    const bo = WORKER_META[b.worker_status ?? '']?.order ?? 99;
    return ao - bo;
  });

  const contacts = [
    event.responsible_1_name ? {
      name: event.responsible_1_name,
      role: event.responsible_1_role,
      whatsapp: event.responsible_1_whatsapp,
    } : null,
    event.responsible_2_name ? {
      name: event.responsible_2_name,
      role: event.responsible_2_role,
      whatsapp: event.responsible_2_whatsapp,
    } : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)]">

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-5 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-40 h-40 rounded-full border-4 border-white animate-ping" style={{animationDuration:'3s'}} />
          <div className="absolute top-10 right-10 w-24 h-24 rounded-full border-4 border-white animate-ping" style={{animationDuration:'3s',animationDelay:'0.7s'}} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              EVENTO EM ANDAMENTO
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight mb-4">{event.name}</h1>
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
        </div>
      </div>

      {/* Stats da equipe */}
      <div className="bg-white border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase">Equipe ({total})</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatChip icon={<CheckCircle className="w-4 h-4" />} label="Confirmados" value={counts.accepted} color="text-emerald-600" bg="bg-emerald-50" />
          <StatChip icon={<Truck className="w-4 h-4" />} label="A caminho" value={counts.inTransit} color="text-blue-600" bg="bg-blue-50" />
          <StatChip icon={<UserCheck className="w-4 h-4" />} label="No local" value={counts.onSite} color="text-violet-600" bg="bg-violet-50" />
        </div>
        {/* Barra de progresso */}
        {total > 0 && (
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-emerald-400 transition-all" style={{width:`${(counts.accepted/total)*100}%`}} />
            <div className="bg-blue-400 transition-all"    style={{width:`${(counts.inTransit/total)*100}%`}} />
            <div className="bg-violet-500 transition-all"  style={{width:`${(counts.onSite/total)*100}%`}} />
            <div className="bg-slate-300 transition-all"   style={{width:`${(counts.done/total)*100}%`}} />
          </div>
        )}
      </div>

      {/* Lista da equipe */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-4">
        {sortedTeam.length > 0 && (
          <div className="flex flex-col gap-2">
            {sortedTeam.map(vaga => {
              const meta   = WORKER_META[vaga.worker_status ?? ''];
              const proName = vaga.professionals?.users?.full_name ?? '—';
              const avatar  = vaga.professionals?.users?.avatar_url;
              return (
                <div key={vaga.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3">
                  {avatar ? (
                    <img src={avatar} alt={proName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-500">{proName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{proName}</p>
                    <p className="text-xs text-slate-400">{vaga.category}</p>
                  </div>
                  {meta && (
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  )}
                  {vaga.gps_active && (
                    <Navigation className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Contatos */}
        {contacts.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Contatos no local</p>
            <div className="flex flex-col gap-3">
              {contacts.map((c, i) => c && (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                    {c.role && <p className="text-xs text-slate-400">{c.role}</p>}
                  </div>
                  {c.whatsapp && (
                    <a
                      href={waLink(c.whatsapp, `Olá! Sou o organizador do evento "${event.name}".`)}
                      target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-[#128C7E]" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grupo WhatsApp do evento */}
        {event.whatsapp_group_link && (
          <a
            href={event.whatsapp_group_link}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl px-4 py-3 hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-[#128C7E] shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-[#128C7E] text-sm">Grupo WhatsApp do evento</p>
              <p className="text-xs text-slate-500">Comunicação com toda a equipe</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#128C7E]" />
          </a>
        )}

        {/* Ver todos os eventos */}
        <button
          onClick={onViewAll}
          className="flex items-center justify-between w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-semibold text-slate-600">Ver todos os eventos</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl px-3 py-2 flex flex-col items-center`}>
      <div className={`${color} mb-0.5`}>{icon}</div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500 font-semibold text-center leading-tight">{label}</p>
    </div>
  );
}
