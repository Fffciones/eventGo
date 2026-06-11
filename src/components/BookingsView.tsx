import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Calendar, Clock, Users, PlusCircle,
  Utensils, Headphones, Shield, Sparkles, Camera, Mic,
  Settings, UserCheck, Loader2, CheckCircle, AlertCircle,
  Navigation, ArrowLeft, ChevronRight, RefreshCw, Star, X,
  MessageCircle, Link2, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { waLink } from '../lib/whatsapp';
import type { UserProfile } from '../hooks/useProfile';

interface BookingsViewProps {
  profile?: UserProfile | null;
  onNavigate: (tab: 'home' | 'bookings' | 'favorites' | 'profile') => void;
  onCreateEvent: () => void;
}

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
  booking_count?: number;
  confirmed_count?: number;
}

// Uma vaga individual (linha de `vagas`)
interface VagaRow {
  id: string;
  category: string;
  function_id: string | null;
  status: string;          // vaga_status (OPEN/FILLED/...)
  worker_status: string | null;
  base_pay: number | null;
  multiplier_type: string;
  professional_id: string | null;
  gps_active: boolean;
  checkin_at: string | null;
  checkout_at: string | null;
  early_minutes: number | null;
  professionals: { users: { full_name: string; avatar_url: string | null; phone: string | null } } | null;
}

// Agrupamento por função para exibição (substitui o antigo "booking")
interface VagaGroup {
  key: string;
  category: string;
  multiplier_type: string;
  total: number;
  vagas: VagaRow[];
}

// ── Mapeamentos ────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  GARCOM:             { label: 'Garçom',            icon: Utensils,   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DJ:                 { label: 'DJ',                icon: Headphones, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SEGURANCA:          { label: 'Segurança',         icon: Shield,     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  FAXINEIRO:          { label: 'Limpeza',           icon: Sparkles,   color: 'bg-green-50 text-green-700 border-green-200' },
  FOTOGRAFO:          { label: 'Fotógrafo',         icon: Camera,     color: 'bg-pink-50 text-pink-700 border-pink-200' },
  MESTRE_CERIMONIAS:  { label: 'Mestre de Cerimôn.',icon: Mic,        color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PRODUTOR:           { label: 'Produtor',          icon: Settings,   color: 'bg-orange-50 text-orange-700 border-orange-200' },
  CONTROLADOR_ACESSO: { label: 'Controle de Acesso',icon: UserCheck,  color: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const EVENT_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  SCHEDULED:   { label: 'Agendado',    color: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-400' },
  ACTIVE:      { label: 'Ativo',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500 animate-pulse' },
  COMPLETED:   { label: 'Concluído',   color: 'bg-slate-50 text-slate-600 border-slate-200',      dot: 'bg-slate-400' },
  CANCELLED:   { label: 'Cancelado',   color: 'bg-red-50 text-red-600 border-red-200',            dot: 'bg-red-400' },
};

const BOOKING_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:     { label: 'Aguardando',   color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400' },
  CONFIRMED:   { label: 'Confirmado',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  IN_PROGRESS: { label: 'Em andamento', color: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500 animate-pulse' },
  COMPLETED:   { label: 'Concluído',    color: 'bg-slate-50 text-slate-600 border-slate-200',       dot: 'bg-slate-400' },
  CANCELLED:   { label: 'Cancelado',    color: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-400' },
  EMERGENCY:   { label: 'Emergência',   color: 'bg-red-100 text-red-800 border-red-300',            dot: 'bg-red-600 animate-ping' },
};

const PRO_STATUS: Record<string, { label: string; color: string }> = {
  INVITED:     { label: 'Convidado',      color: 'text-amber-600' },
  ACCEPTED:    { label: 'Confirmado',     color: 'text-emerald-600' },
  DECLINED:    { label: 'Recusou',        color: 'text-red-500' },
  IN_TRANSIT:  { label: 'Em trânsito',    color: 'text-blue-600' },
  CHECKED_IN:  { label: 'No local',       color: 'text-emerald-700' },
  CHECKED_OUT: { label: 'Concluído',      color: 'text-slate-500' },
  NO_SHOW:     { label: 'Não compareceu', color: 'text-red-600' },
};

export default function BookingsView({ profile, onNavigate, onCreateEvent }: BookingsViewProps) {
  const [events, setEvents]               = useState<DbEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [groups, setGroups]               = useState<VagaGroup[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [ratingVaga, setRatingVaga]   = useState<VagaRow | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  const openRating = (v: VagaRow) => { setRatingVaga(v); setRatingStars(5); setRatingComment(''); };

  const finalizeVaga = async () => {
    if (!ratingVaga) return;
    setSavingRating(true);
    const { error } = await supabase.rpc('finalize_and_pay_vaga', {
      p_vaga_id: ratingVaga.id,
      p_rating:  ratingStars,
      p_comment: ratingComment.trim() || null,
    });
    setSavingRating(false);
    if (!error) { setRatingVaga(null); fetchBookings(); }
  };

  // ── buscar lista de eventos ───────────────────────────────────────
  useEffect(() => {
    if (!profile?.client_id) return;
    fetchEvents();
  }, [profile?.client_id]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    const { data } = await supabase
      .from('events')
      .select(`
        id, name, location_name, starts_at, ends_at, status,
        responsible_1_name, responsible_1_role, responsible_1_whatsapp,
        responsible_2_name, responsible_2_role, responsible_2_whatsapp,
        whatsapp_group_link
      `)
      .eq('client_id', profile!.client_id!)
      .order('starts_at', { ascending: false });

    setEvents(data ?? []);
    setLoadingEvents(false);
  };

  // ── buscar bookings do evento selecionado + realtime ─────────────
  useEffect(() => {
    if (!selectedEvent) return;
    fetchBookings();

    const channel = supabase
      .channel(`vagas:${selectedEvent.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'vagas',
        filter: `event_id=eq.${selectedEvent.id}`,
      }, () => fetchBookings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedEvent?.id]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    const { data } = await supabase
      .from('vagas')
      .select(`
        id, category, function_id, status, worker_status, base_pay, multiplier_type,
        professional_id, gps_active, checkin_at, checkout_at, early_minutes,
        professionals ( users ( full_name, avatar_url, phone ) )
      `)
      .eq('event_id', selectedEvent!.id)
      .order('created_at', { ascending: true });

    // Agrupar vagas por função/categoria
    const map = new Map<string, VagaGroup>();
    for (const v of ((data as any[]) ?? [])) {
      const key = v.function_id ?? v.category ?? 'outros';
      const g = map.get(key);
      if (g) { g.vagas.push(v); g.total += 1; }
      else map.set(key, { key, category: v.category ?? '', multiplier_type: v.multiplier_type, total: 1, vagas: [v] });
    }
    setGroups([...map.values()]);
    setLoadingBookings(false);
  };

  const patchSelectedEvent = (patch: Partial<DbEvent>) => {
    setSelectedEvent(prev => prev ? { ...prev, ...patch } : prev);
    setEvents(prev => prev.map(e => e.id === selectedEvent?.id ? { ...e, ...patch } : e));
  };

  const isConfirmed = (ws: string | null) =>
    !!ws && ['ACCEPTED','IN_TRANSIT','CHECKED_IN','CHECKED_OUT'].includes(ws);

  const totalConfirmed = groups.reduce((sum, g) =>
    sum + g.vagas.filter(v => isConfirmed(v.worker_status)).length, 0);
  const totalRequested = groups.reduce((sum, g) => sum + g.total, 0);

  // ════════════════════════════════════════════════════════════════
  // VIEW 1 — LISTA DE EVENTOS
  // ════════════════════════════════════════════════════════════════
  if (!selectedEvent) {
    return (
      <main className="px-4 md:px-6 pt-4 pb-24 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-primary">Meus Eventos</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Selecione um evento para ver a equipe.</p>
          </div>
          <button
            onClick={onCreateEvent}
            className="flex items-center gap-1.5 bg-primary text-on-primary text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Novo evento
          </button>
        </div>

        {loadingEvents ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-outline-variant/30 rounded-2xl p-10 text-center space-y-3">
            <Calendar className="w-10 h-10 text-on-surface-variant mx-auto" />
            <p className="font-display text-lg font-bold text-primary">Nenhum evento ainda</p>
            <p className="text-sm text-on-surface-variant">Crie seu primeiro evento para montar sua equipe.</p>
            <button
              onClick={onCreateEvent}
              className="mt-2 flex items-center gap-2 bg-primary text-on-primary font-semibold px-5 py-3 rounded-xl shadow-md mx-auto active:scale-[0.98] transition-all text-sm"
            >
              <PlusCircle className="w-4 h-4" /> Criar evento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev, idx) => {
              const st = EVENT_STATUS[ev.status] ?? EVENT_STATUS.SCHEDULED;
              const startDate = new Date(ev.starts_at);
              const endDate   = new Date(ev.ends_at);

              return (
                <motion.button
                  key={ev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-primary truncate group-hover:underline">
                        {ev.name}
                      </h3>
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {ev.location_name}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {startDate.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {startDate.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                          {' – '}
                          {endDate.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // VIEW 2 — DETALHE DO EVENTO (bookings)
  // ════════════════════════════════════════════════════════════════
  const evStatus = EVENT_STATUS[selectedEvent.status] ?? EVENT_STATUS.SCHEDULED;

  return (
    <main className="pb-24 max-w-3xl mx-auto">
      {/* Header fixo */}
      <div className="sticky top-0 bg-white border-b border-outline-variant/30 z-10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => { setSelectedEvent(null); setGroups([]); setExpandedBooking(null); }}
          className="p-2 rounded-full hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-primary truncate">{selectedEvent.name}</p>
          <p className="text-xs text-on-surface-variant">{selectedEvent.location_name}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${evStatus.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${evStatus.dot}`} />
          {evStatus.label}
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Resumo do evento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5" /> Data
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {new Date(selectedEvent.starts_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
            </p>
          </div>
          <div className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5" /> Horário
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {new Date(selectedEvent.starts_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
              {' – '}
              {new Date(selectedEvent.ends_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
          <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wide">Equipe</p>
                <p className="text-sm text-on-surface-variant">
                  {totalConfirmed} confirmados de {totalRequested} solicitados
                </p>
              </div>
            </div>
            <button onClick={fetchBookings} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <RefreshCw className={`w-4 h-4 text-primary ${loadingBookings ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contatos & WhatsApp do evento (Etapa 5A) */}
        <EventContactsPanel event={selectedEvent} onPatch={patchSelectedEvent} />

        {/* Bookings */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-lg text-primary">Equipe Contratada</h2>

          {loadingBookings ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white border border-outline-variant/30 rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-on-surface-variant mx-auto mb-2" />
              <p className="text-sm font-semibold text-on-surface">Nenhuma vaga ainda</p>
            </div>
          ) : (
            groups.map((group) => {
              const catInfo  = CATEGORY_MAP[group.category] ?? { label: group.category, icon: Users, color: 'bg-slate-50 text-slate-700 border-slate-200' };
              const CatIcon  = catInfo.icon;
              const assigned  = group.vagas.filter(v => v.professional_id);
              const confirmed = group.vagas.filter(v => isConfirmed(v.worker_status));
              const inTransit = group.vagas.filter(v => v.worker_status === 'IN_TRANSIT');
              const openSlots = group.total - assigned.length;
              const isExpanded = expandedBooking === group.key;

              return (
                <motion.div key={group.key} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedBooking(isExpanded ? null : group.key)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-container/50 transition-colors"
                  >
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${catInfo.color}`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-primary">{catInfo.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {confirmed.length}/{group.total} confirmados
                        {inTransit.length > 0 && ` · ${inTransit.length} em trânsito`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {openSlots > 0 && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {openSlots} em aberto
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 text-on-surface-variant transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-outline-variant/20"
                      >
                        <div className="p-4 space-y-2">
                          {assigned.map(v => {
                            const proStatus = PRO_STATUS[v.worker_status ?? ''] ?? { label: v.worker_status ?? '—', color: 'text-on-surface-variant' };
                            const proName = v.professionals?.users?.full_name ?? 'Profissional';

                            return (
                              <div key={v.id} className="flex items-center gap-3 py-1.5">
                                {v.professionals?.users?.avatar_url ? (
                                  <img src={v.professionals.users.avatar_url} alt={proName}
                                    className="w-9 h-9 rounded-full object-cover border border-outline-variant/30" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <span className="text-sm font-bold text-primary">{proName[0]}</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-on-surface truncate">{proName}</p>
                                  <p className={`text-xs font-medium ${proStatus.color} flex items-center gap-1`}>
                                    {v.worker_status === 'IN_TRANSIT'  && <Navigation className="w-3 h-3" />}
                                    {v.worker_status === 'CHECKED_IN'  && <CheckCircle className="w-3 h-3" />}
                                    {proStatus.label}
                                    {v.early_minutes != null && v.early_minutes > 0 && (
                                      <span className="text-primary font-bold">· {v.early_minutes} min antes</span>
                                    )}
                                  </p>
                                </div>
                                {v.professionals?.users?.phone && (
                                  <a
                                    href={waLink(v.professionals.users.phone, `Olá ${proName.split(' ')[0]}, sou do evento "${selectedEvent.name}" pelo EventPro.`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Falar no WhatsApp"
                                    className="shrink-0 w-8 h-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4 text-[#128C7E]" />
                                  </a>
                                )}
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                  {v.base_pay != null && v.base_pay > 0 && (
                                    <span className="font-mono text-xs font-bold text-on-surface-variant">
                                      R$ {Number(v.base_pay).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </span>
                                  )}
                                  {v.status === 'FINISHED' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      <CheckCircle className="w-3 h-3" /> Paga
                                    </span>
                                  ) : v.worker_status === 'CHECKED_OUT' ? (
                                    <button
                                      onClick={() => openRating(v)}
                                      className="text-[10px] font-bold text-on-primary bg-primary px-2.5 py-1 rounded-full active:scale-95 transition-all"
                                    >
                                      Finalizar e avaliar
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}

                          {openSlots > 0 && (
                            <div className="text-center py-3">
                              <p className="text-xs text-on-surface-variant">
                                {openSlots} vaga{openSlots > 1 ? 's' : ''} aguardando profissionais...
                              </p>
                              <div className="flex justify-center gap-1 mt-2">
                                {[...Array(openSlots)].map((_, i) => (
                                  <div key={i} className="w-8 h-8 rounded-full bg-surface-container border-2 border-dashed border-outline-variant flex items-center justify-center">
                                    <Users className="w-3.5 h-3.5 text-on-surface-variant" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {group.multiplier_type === 'EMERGENCY' && (
                            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 font-medium flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              Vaga de emergência — multiplicador 1.5x aplicado
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de finalização + avaliação */}
      {ratingVaga && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !savingRating && setRatingVaga(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
              <div>
                <h2 className="font-display font-bold text-primary">Finalizar contratação</h2>
                <p className="text-xs text-on-surface-variant">{ratingVaga.professionals?.users?.full_name ?? 'Profissional'}</p>
              </div>
              <button onClick={() => !savingRating && setRatingVaga(null)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-on-surface-variant">Avalie o profissional para concluir e liberar o pagamento.</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRatingStars(n)} className="active:scale-90 transition-transform">
                    <Star className={`w-9 h-9 ${n <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                rows={3} maxLength={300} placeholder="Comentário (opcional)"
                className="w-full text-sm border border-outline-variant rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {ratingVaga.base_pay != null && ratingVaga.base_pay > 0 && (
                <p className="text-xs text-on-surface-variant text-center">
                  Remuneração a pagar: <strong className="text-primary">R$ {Number(ratingVaga.base_pay).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </p>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-outline-variant/20">
              <button onClick={() => setRatingVaga(null)} disabled={savingRating}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={finalizeVaga} disabled={savingRating}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {savingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Finalizar e pagar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ════════════════════════════════════════════════════════════════════
// Painel de contatos do evento — responsáveis (deep link WhatsApp) +
// link do grupo do WhatsApp (fallback manual, Etapa 5A).
// ════════════════════════════════════════════════════════════════════
function EventContactsPanel({ event, onPatch }: { event: DbEvent; onPatch: (patch: Partial<DbEvent>) => void }) {
  const responsibles = [
    { name: event.responsible_1_name, role: event.responsible_1_role, whats: event.responsible_1_whatsapp },
    { name: event.responsible_2_name, role: event.responsible_2_role, whats: event.responsible_2_whatsapp },
  ].filter(r => r.name);

  const [editing, setEditing] = useState(false);
  const [link, setLink]       = useState(event.whatsapp_group_link ?? '');
  const [saving, setSaving]   = useState(false);

  const saveLink = async () => {
    setSaving(true);
    const value = link.trim() || null;
    const { error } = await supabase.from('events')
      .update({ whatsapp_group_link: value })
      .eq('id', event.id);
    setSaving(false);
    if (!error) { onPatch({ whatsapp_group_link: value }); setEditing(false); }
  };

  if (responsibles.length === 0 && !event.whatsapp_group_link && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-outline-variant rounded-2xl py-3 text-xs font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Link2 className="w-4 h-4" /> Adicionar link do grupo de WhatsApp
      </button>
    );
  }

  return (
    <div className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm space-y-3">
      <h3 className="font-display font-bold text-sm text-primary flex items-center gap-1.5">
        <MessageCircle className="w-4 h-4 text-[#128C7E]" /> Contato & WhatsApp
      </h3>

      {responsibles.length > 0 && (
        <div className="space-y-2">
          {responsibles.map((r, i) => (
            <div key={i} className="flex items-center gap-2 border border-outline-variant/20 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {r.name}{r.role && <span className="font-normal text-on-surface-variant"> — {r.role}</span>}
                </p>
                {r.whats && <p className="text-xs text-on-surface-variant">📱 {r.whats}</p>}
              </div>
              {r.whats && (
                <a
                  href={waLink(r.whats, `Olá ${(r.name ?? '').split(' ')[0]}, sobre o evento "${event.name}" no EventPro.`)}
                  target="_blank" rel="noopener noreferrer" title="Falar no WhatsApp"
                  className="shrink-0 w-8 h-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#128C7E]" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link do grupo */}
      {editing ? (
        <div className="space-y-2">
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full text-sm border border-outline-variant rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[11px] text-on-surface-variant">
            Crie um grupo no WhatsApp, copie o link de convite e cole aqui. Os profissionais confirmados verão o botão "Entrar no grupo" na agenda.
          </p>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setLink(event.whatsapp_group_link ?? ''); }}
              className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold">
              Cancelar
            </button>
            <button onClick={saveLink} disabled={saving}
              className="flex-1 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Salvar
            </button>
          </div>
        </div>
      ) : event.whatsapp_group_link ? (
        <div className="flex items-center gap-2 border border-[#25D366]/30 bg-[#25D366]/5 rounded-xl px-3 py-2">
          <Link2 className="w-4 h-4 text-[#128C7E] shrink-0" />
          <a href={event.whatsapp_group_link} target="_blank" rel="noopener noreferrer"
            className="flex-1 min-w-0 text-xs font-medium text-[#128C7E] truncate hover:underline">
            {event.whatsapp_group_link}
          </a>
          <button onClick={() => setEditing(true)} className="shrink-0 text-xs font-semibold text-primary">Editar</button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-outline-variant rounded-xl py-2.5 text-xs font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors">
          <Link2 className="w-4 h-4" /> Adicionar link do grupo de WhatsApp
        </button>
      )}
    </div>
  );
}
