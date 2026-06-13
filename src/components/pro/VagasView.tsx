import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Clock, DollarSign, Calendar, Users,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  Shirt, Utensils, Navigation, Bus, AlertCircle,
  Loader2, Star, Briefcase, Search
} from 'lucide-react';
import type { PendingInvite } from '../../hooks/useProfessionalProfile';
import type { OpenBooking } from '../../hooks/useOpenBookings';

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
  openVagas: OpenBooking[];
  loadingVagas: boolean;
  onRespond: (vagaId: string, accept: boolean) => Promise<void>;
  onAcceptVaga: (eventId: string, functionId: string) => Promise<boolean>;
}

export default function VagasView({ invites, openVagas, loadingVagas, onRespond, onAcceptVaga }: Props) {
  // Ordenar vagas abertas: por distância (nulls por último), depois por starts_at
  const sorted = [...openVagas].sort((a, b) => {
    if (a.distance_km !== null && b.distance_km !== null) {
      if (Math.abs(a.distance_km - b.distance_km) > 0.5) return a.distance_km - b.distance_km;
    }
    if (a.distance_km !== null && b.distance_km === null) return -1;
    if (a.distance_km === null && b.distance_km !== null) return 1;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });

  const hasContent = invites.length > 0 || sorted.length > 0;

  if (!hasContent && !loadingVagas) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Briefcase className="w-7 h-7 text-slate-300" />
        </div>
        <h2 className="text-lg font-bold text-slate-600">Nenhuma vaga disponível</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          As vagas abertas próximas a você aparecerão aqui assim que surgirem.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-32 flex flex-col gap-6">

      {/* Convites pendentes */}
      {invites.length > 0 && (
        <section>
          <SectionHeader
            label={`${invites.length} convite${invites.length > 1 ? 's' : ''} direto${invites.length > 1 ? 's' : ''}`}
            sub="Oferta exclusiva para você — aceite antes de expirar"
            color="text-amber-600"
            dot="bg-amber-500"
          />
          <div className="flex flex-col gap-3 mt-3">
            <AnimatePresence>
              {invites.map(inv => (
                <InviteCard key={inv.vaga_id} invite={inv} onRespond={onRespond} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Vagas abertas no mural */}
      <section>
        <SectionHeader
          label="Vagas disponíveis"
          sub={sorted.length > 0 ? `${sorted.length} vaga${sorted.length > 1 ? 's' : ''} · ordenadas por proximidade e horário` : 'Buscando vagas próximas…'}
          color="text-primary"
          dot="bg-primary"
        />

        {loadingVagas ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="mt-3 bg-slate-50 rounded-2xl px-4 py-8 text-center">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhuma vaga aberta no momento na sua área.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {sorted.map(v => (
              <VagaCard key={v.group_key} vaga={v} onAccept={onAcceptVaga} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Cabeçalho de seção ────────────────────────────────────────────────────────
function SectionHeader({ label, sub, color, dot }: {
  label: string; sub: string; color: string; dot: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div>
        <p className={`text-sm font-bold ${color}`}>{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

// ── Card de convite (direcionado) ─────────────────────────────────────────────
function InviteCard({ invite, onRespond }: { invite: PendingInvite; onRespond: Props['onRespond'] }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading]   = useState<'accept' | 'decline' | null>(null);

  const startsAt   = new Date(invite.starts_at);
  const endsAt     = new Date(invite.ends_at);
  const durationH  = Math.round((endsAt.getTime() - startsAt.getTime()) / 3_600_000);
  const dateLabel  = startsAt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeLabel  = `${startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const briefing   = invite.briefing ?? {};

  const handle = async (accept: boolean) => {
    setLoading(accept ? 'accept' : 'decline');
    try { await onRespond(invite.vaga_id, accept); } finally { setLoading(null); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
        invite.is_favorite ? 'border-amber-300' : 'border-amber-100'
      }`}
    >
      {invite.is_favorite && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span className="text-xs font-semibold text-amber-700">Este cliente te favoritou</span>
        </div>
      )}

      {/* Topo: faixa laranja "convite direto" */}
      <div className="bg-amber-500 px-4 py-1.5 flex items-center justify-between">
        <span className="text-xs font-bold text-white">CONVITE DIRETO</span>
        {invite.multiplier === 'EMERGENCY' && (
          <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">Emergência 1.5×</span>
        )}
      </div>

      <div className="px-4 pt-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
              {CATEGORY_LABEL[invite.category] ?? invite.category}
            </p>
            <h3 className="text-base font-bold text-slate-800 leading-tight">{invite.event_name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">por {invite.client_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black text-primary">
              R$ {invite.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400">{durationH}h</p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} text={`${dateLabel} · ${timeLabel}`} />
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
            <span>Ver briefing</span>
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
                  {briefing.uniforme     && <BriefingRow icon={<Shirt className="w-3.5 h-3.5 text-primary" />}    label="Uniforme"        value={briefing.uniforme} />}
                  {briefing.alimentacao  && <BriefingRow icon={<Utensils className="w-3.5 h-3.5 text-primary" />} label="Alimentação"     value={briefing.alimentacao} />}
                  {briefing.ponto_encontro && <BriefingRow icon={<Navigation className="w-3.5 h-3.5 text-primary" />} label="Ponto de encontro" value={briefing.ponto_encontro} />}
                  {briefing.transporte   && <BriefingRow icon={<Bus className="w-3.5 h-3.5 text-primary" />}      label="Transporte"      value={briefing.transporte} />}
                  {briefing.observacoes  && <BriefingRow icon={<AlertCircle className="w-3.5 h-3.5 text-primary" />} label="Observações"  value={briefing.observacoes} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {invite.expires_at && <ExpiresTimer expiresAt={invite.expires_at} />}

      <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-slate-100">
        <button
          disabled={loading !== null}
          onClick={() => handle(false)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading === 'decline' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 text-slate-400" />}
          Recusar
        </button>
        <button
          disabled={loading !== null}
          onClick={() => handle(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {loading === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Aceitar
        </button>
      </div>
    </motion.div>
  );
}

// ── Card de vaga aberta (mural) ───────────────────────────────────────────────
function VagaCard({ vaga, onAccept }: { vaga: OpenBooking; onAccept: Props['onAcceptVaga'] }) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startsAt  = new Date(vaga.starts_at);
  const endsAt    = new Date(vaga.ends_at);
  const durationH = Math.round((endsAt.getTime() - startsAt.getTime()) / 3_600_000);
  const dateLabel = startsAt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeLabel = `${startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  // Urgência: evento nas próximas 4h
  const hoursUntil = (startsAt.getTime() - Date.now()) / 3_600_000;
  const isUrgent = hoursUntil > 0 && hoursUntil <= 4;

  const handle = async () => {
    setLoading(true);
    setErr(null);
    try {
      const ok = await onAccept(vaga.event_id);
      if (ok) setAccepted(true);
      else setErr('Vaga preenchida por outro profissional agora mesmo.');
    } catch (e: any) {
      setErr(e?.message ?? 'Erro ao aceitar vaga.');
    } finally {
      setLoading(false);
    }
  };

  if (accepted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border-2 border-emerald-400 overflow-hidden shadow-lg"
      >
        {/* Faixa de sucesso */}
        <div className="bg-emerald-500 px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-white shrink-0" />
          <div>
            <p className="text-white font-black text-sm">Vaga confirmada! Você está na equipe.</p>
            <p className="text-emerald-100 text-xs">Confira os detalhes abaixo e prepare-se.</p>
          </div>
        </div>

        {/* Detalhes do evento */}
        <div className="px-4 pt-3 pb-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
            {CATEGORY_LABEL[vaga.category] ?? vaga.category}
          </p>
          <h3 className="text-base font-bold text-slate-800 mb-3">{vaga.event_name}</h3>

          <div className="flex flex-col gap-1.5">
            <InfoRow icon={<Calendar className="w-3.5 h-3.5" />}
              text={`${startsAt.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}`} />
            <InfoRow icon={<Clock className="w-3.5 h-3.5" />} text={timeLabel} />
            <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} text={vaga.location_name}
              sub={vaga.distance_km != null ? `${vaga.distance_km.toFixed(1)} km de você` : undefined} />
          </div>
        </div>

        {/* Remuneração */}
        <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-emerald-700">Sua remuneração</p>
          <p className="text-xl font-black text-emerald-700">
            R$ {vaga.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
        isUrgent ? 'border-red-200' : 'border-slate-100'
      }`}
    >
      {isUrgent && (
        <div className="bg-red-500 px-4 py-1.5">
          <span className="text-xs font-bold text-white">URGENTE — começa em {Math.floor(hoursUntil)}h</span>
        </div>
      )}

      <div className="px-4 pt-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
              {CATEGORY_LABEL[vaga.category] ?? vaga.category}
            </p>
            <h3 className="text-base font-bold text-slate-800 leading-tight">{vaga.event_name}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black text-primary">
              R$ {vaga.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400">{durationH}h</p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} text={`${dateLabel} · ${timeLabel}`} />
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5" />}
            text={vaga.location_name}
            sub={vaga.distance_km != null ? `${vaga.distance_km.toFixed(1)} km de você` : undefined}
          />
          <InfoRow
            icon={<Users className="w-3.5 h-3.5" />}
            text={`${vaga.slots_open} vaga${vaga.slots_open > 1 ? 's' : ''} disponíve${vaga.slots_open > 1 ? 'is' : 'l'}`}
          />
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex flex-col gap-2">
        {err && (
          <p className="text-xs text-red-600 font-semibold text-center">{err}</p>
        )}
        <button
          disabled={loading}
          onClick={handle}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Quero esta vaga
        </button>
      </div>
    </motion.div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secs  = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const mm    = Math.floor(secs / 60);
  const ss    = secs % 60;
  const label = secs <= 0 ? 'Oferta expirada' : mm > 0 ? `Aceite em ${mm}:${String(ss).padStart(2,'0')}` : `Aceite em ${ss}s`;
  const urgent = secs > 0 && secs <= 10;

  return (
    <div className={`mx-4 mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 border ${
      urgent ? 'bg-red-100 border-red-300' : 'bg-amber-50 border-amber-100'
    }`}>
      <Clock className={`w-3.5 h-3.5 shrink-0 ${urgent ? 'text-red-600 animate-pulse' : 'text-amber-500'}`} />
      <span className={`text-xs font-semibold ${urgent ? 'text-red-700' : 'text-amber-700'}`}>{label}</span>
    </div>
  );
}
