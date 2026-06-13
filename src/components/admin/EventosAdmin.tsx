import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, ChevronRight, X, MessageCircle, Edit3, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { waLink } from '../../lib/whatsapp';

interface Vaga {
  id: string;
  category: string;
  function_id: string | null;
  status: string;
  worker_status: string | null;
  base_pay: number | null;
  professional_id: string | null;
  professionals: { users: { full_name: string } } | null;
}

interface Event {
  id: string;
  name: string;
  location_name: string;
  starts_at: string;
  ends_at: string;
  team_arrival_at: string | null;
  responsible_1_name: string | null;
  responsible_1_role: string | null;
  responsible_1_whatsapp: string | null;
  responsible_2_name: string | null;
  responsible_2_role: string | null;
  responsible_2_whatsapp: string | null;
  estimated_total: number | null;
  payment_method: string | null;
  charge_status: string | null;
  status: string;
  clients: { users: { full_name: string } } | null;
  vagas: Vaga[];
}

const EVENT_STATUSES = ['DRAFT','PUBLISHED','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'];
const CHARGE_STATUSES = ['PENDING','CHARGED','PAID','OVERDUE','REFUNDED'];
const PAYMENT_METHODS = [
  { value: 'CREDIT',  label: 'Limite de crédito' },
  { value: 'CARD',    label: 'Cartão de crédito' },
  { value: 'PIX',     label: 'Pix' },
  { value: 'INVOICE', label: 'Boleto / Fatura' },
];

const EVENT_STATUS_COLOR: Record<string, string> = {
  DRAFT:       'bg-slate-100 text-slate-600',
  PUBLISHED:   'bg-blue-100 text-blue-700',
  SCHEDULED:   'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED:   'bg-green-100 text-green-700',
  CANCELLED:   'bg-red-100 text-red-700',
};

// Converte ISO → datetime-local input (yyyy-MM-ddTHH:mm)
function toLocal(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventosAdmin() {
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Event | null>(null);
  const [editing, setEditing]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select(`
        id, name, location_name, starts_at, ends_at, status,
        team_arrival_at,
        responsible_1_name, responsible_1_role, responsible_1_whatsapp,
        responsible_2_name, responsible_2_role, responsible_2_whatsapp,
        estimated_total, payment_method, charge_status,
        clients(users(full_name)),
        vagas(id, category, function_id, status, worker_status, base_pay, professional_id,
          professionals(users(full_name))
        )
      `)
      .order('starts_at', { ascending: true })
      .limit(200);
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = events.filter(e => {
    const term = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.location_name.toLowerCase().includes(term) ||
      (e.clients?.users?.full_name ?? '').toLowerCase().includes(term)
    );
  });

  function openDrawer(e: Event) {
    setSelected(e);
    setEditing(false);
  }

  function closeDrawer() {
    setSelected(null);
    setEditing(false);
  }

  function onSaved(updated: Event) {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
    setSelected(updated);
    setEditing(false);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Eventos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{events.length} registrados</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar evento ou contratante…"
          className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary w-full"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Nenhum resultado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Evento</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Contratante</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Início</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Vagas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openDrawer(e)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{e.name}</div>
                    <div className="text-slate-400 text-xs">{e.location_name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.clients?.users?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{formatDate(e.starts_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${EVENT_STATUS_COLOR[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.vagas?.length ?? 0} vaga{(e.vagas?.length ?? 0) !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={closeDrawer}>
          <div
            className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-slate-900 truncate pr-2">{selected.name}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
                <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {editing
                ? <EditForm event={selected} onSaved={onSaved} onCancel={() => setEditing(false)} />
                : <DetailView event={selected} />
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vista de detalhes ─────────────────────────────────────────────────────────

function DetailView({ event: ev }: { event: Event }) {
  return (
    <div className="p-5 space-y-6">
      {/* Info geral */}
      <Section title="Informações gerais">
        <Grid2>
          <Info label="Nome"     value={ev.name} />
          <Info label="Status">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${EVENT_STATUS_COLOR[ev.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {ev.status}
            </span>
          </Info>
          <Info label="Local"     value={ev.location_name} />
          <Info label="Contratante" value={ev.clients?.users?.full_name ?? '—'} />
          <Info label="Início"    value={formatDate(ev.starts_at)} />
          <Info label="Fim"       value={formatDate(ev.ends_at)} />
          {ev.team_arrival_at && (
            <Info label="Chegada equipe" value={formatDate(ev.team_arrival_at)} />
          )}
        </Grid2>
      </Section>

      {/* Financeiro */}
      <Section title="Financeiro">
        <Grid2>
          <Info label="Valor estimado" value={(ev.estimated_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Info label="Forma de pagamento" value={
            PAYMENT_METHODS.find(p => p.value === ev.payment_method)?.label ?? ev.payment_method ?? '—'
          } />
          <Info label="Status de cobrança" value={ev.charge_status ?? 'PENDING'} />
        </Grid2>
      </Section>

      {/* Responsáveis */}
      {(ev.responsible_1_name || ev.responsible_2_name) && (
        <Section title="Responsáveis no local">
          <div className="space-y-2">
            {[
              { name: ev.responsible_1_name, role: ev.responsible_1_role, whats: ev.responsible_1_whatsapp },
              { name: ev.responsible_2_name, role: ev.responsible_2_role, whats: ev.responsible_2_whatsapp },
            ].filter(r => r.name).map((r, i) => (
              <div key={i} className="border border-slate-100 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{r.name}{r.role && <span className="font-normal text-slate-500"> — {r.role}</span>}</p>
                  {r.whats && <p className="text-xs text-slate-500 mt-0.5">📱 {r.whats}</p>}
                </div>
                {r.whats && (
                  <a
                    href={waLink(r.whats, `Olá ${(r.name ?? '').split(' ')[0]}, aqui é da equipe EventPro sobre o evento "${ev.name}".`)}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 w-8 h-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[#128C7E]" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Vagas */}
      <Section title="Vagas">
        <div className="space-y-3">
          {groupVagas(ev.vagas ?? []).map(g => {
            const confirmed = g.vagas.filter(v =>
              v.worker_status && ['ACCEPTED','IN_TRANSIT','CHECKED_IN','CHECKED_OUT'].includes(v.worker_status)
            ).length;
            const assigned = g.vagas.filter(v => v.professional_id);
            return (
              <div key={g.key} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">{g.category}</span>
                  <span className="text-xs text-slate-500">{confirmed}/{g.vagas.length} confirmados</span>
                </div>
                {assigned.length > 0 && (
                  <div className="space-y-1">
                    {assigned.map(v => (
                      <div key={v.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{v.professionals?.users?.full_name ?? '—'}</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          v.worker_status === 'CHECKED_OUT' ? 'bg-green-100 text-green-700' :
                          v.worker_status === 'ACCEPTED'    ? 'bg-blue-100 text-blue-700' :
                          v.worker_status === 'DECLINED'    ? 'bg-red-100 text-red-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {v.worker_status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ── Formulário de edição ──────────────────────────────────────────────────────

function EditForm({ event: ev, onSaved, onCancel }: {
  event: Event;
  onSaved: (updated: Event) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Campos
  const [name,            setName]           = useState(ev.name);
  const [locationName,    setLocationName]   = useState(ev.location_name);
  const [status,          setStatus]         = useState(ev.status);
  const [startsAt,        setStartsAt]       = useState(toLocal(ev.starts_at));
  const [endsAt,          setEndsAt]         = useState(toLocal(ev.ends_at));
  const [teamArrivalAt,   setTeamArrivalAt]  = useState(toLocal(ev.team_arrival_at));
  const [estimatedTotal,  setEstimatedTotal] = useState(String(ev.estimated_total ?? ''));
  const [paymentMethod,   setPaymentMethod]  = useState(ev.payment_method ?? '');
  const [chargeStatus,    setChargeStatus]   = useState(ev.charge_status ?? 'PENDING');
  const [r1Name,          setR1Name]         = useState(ev.responsible_1_name ?? '');
  const [r1Role,          setR1Role]         = useState(ev.responsible_1_role ?? '');
  const [r1Whats,         setR1Whats]        = useState(ev.responsible_1_whatsapp ?? '');
  const [r2Name,          setR2Name]         = useState(ev.responsible_2_name ?? '');
  const [r2Role,          setR2Role]         = useState(ev.responsible_2_role ?? '');
  const [r2Whats,         setR2Whats]        = useState(ev.responsible_2_whatsapp ?? '');

  const save = async () => {
    setSaving(true);
    setError(null);

    const patch = {
      name:                   name.trim(),
      location_name:          locationName.trim(),
      status,
      starts_at:              startsAt   ? new Date(startsAt).toISOString()   : ev.starts_at,
      ends_at:                endsAt     ? new Date(endsAt).toISOString()     : ev.ends_at,
      team_arrival_at:        teamArrivalAt ? new Date(teamArrivalAt).toISOString() : null,
      estimated_total:        estimatedTotal ? Number(estimatedTotal) : null,
      payment_method:         paymentMethod  || null,
      charge_status:          chargeStatus   || null,
      responsible_1_name:     r1Name.trim()  || null,
      responsible_1_role:     r1Role.trim()  || null,
      responsible_1_whatsapp: r1Whats.trim() || null,
      responsible_2_name:     r2Name.trim()  || null,
      responsible_2_role:     r2Role.trim()  || null,
      responsible_2_whatsapp: r2Whats.trim() || null,
    };

    const { error: err } = await supabase.from('events').update(patch).eq('id', ev.id);
    if (err) { setError(err.message); setSaving(false); return; }

    onSaved({ ...ev, ...patch });
    setSaving(false);
  };

  return (
    <div className="p-5 space-y-6">
      {/* Informações gerais */}
      <Section title="Informações gerais">
        <div className="space-y-3">
          <Field label="Nome do evento">
            <input value={name} onChange={e => setName(e.target.value)} className={IC} />
          </Field>
          <Field label="Local">
            <input value={locationName} onChange={e => setLocationName(e.target.value)} className={IC} />
          </Field>
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value)} className={IC}>
              {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={IC} />
            </Field>
            <Field label="Fim">
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={IC} />
            </Field>
          </div>
          <Field label="Chegada da equipe (opcional)">
            <input type="datetime-local" value={teamArrivalAt} onChange={e => setTeamArrivalAt(e.target.value)} className={IC} />
          </Field>
        </div>
      </Section>

      {/* Financeiro */}
      <Section title="Financeiro">
        <div className="space-y-3">
          <Field label="Valor estimado (R$)">
            <input type="number" min="0" step="0.01" value={estimatedTotal}
              onChange={e => setEstimatedTotal(e.target.value)} className={IC} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Forma de pagamento">
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={IC}>
                <option value="">—</option>
                {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Status de cobrança">
              <select value={chargeStatus} onChange={e => setChargeStatus(e.target.value)} className={IC}>
                {CHARGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* Responsável 1 */}
      <Section title="Responsável no local #1">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome"><input value={r1Name}  onChange={e => setR1Name(e.target.value)}  className={IC} /></Field>
            <Field label="Cargo"><input value={r1Role} onChange={e => setR1Role(e.target.value)}  className={IC} /></Field>
          </div>
          <Field label="WhatsApp">
            <input value={r1Whats} onChange={e => setR1Whats(e.target.value)} placeholder="+55 11 99999-9999" className={IC} />
          </Field>
        </div>
      </Section>

      {/* Responsável 2 */}
      <Section title="Responsável no local #2 (opcional)">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome"><input value={r2Name}  onChange={e => setR2Name(e.target.value)}  className={IC} /></Field>
            <Field label="Cargo"><input value={r2Role} onChange={e => setR2Role(e.target.value)}  className={IC} /></Field>
          </div>
          <Field label="WhatsApp">
            <input value={r2Whats} onChange={e => setR2Whats(e.target.value)} placeholder="+55 11 99999-9999" className={IC} />
          </Field>
        </div>
      </Section>

      {error && (
        <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pb-4">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
          <X className="w-3.5 h-3.5 inline mr-1" />Cancelar
        </button>
        <button onClick={save} disabled={saving}
          className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Salvar alterações
        </button>
      </div>
    </div>
  );
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">{children}</div>;
}

function Info({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-400 text-xs font-semibold uppercase">{label}</p>
      {children ?? <p className="text-slate-800 mt-0.5">{value ?? '—'}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

const IC = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-slate-800';

// Agrupa vagas por função/categoria para exibição
function groupVagas(vagas: Vaga[]): { key: string; category: string; vagas: Vaga[] }[] {
  const map = new Map<string, { key: string; category: string; vagas: Vaga[] }>();
  for (const v of vagas) {
    const key = v.function_id ?? v.category ?? 'outros';
    const g = map.get(key);
    if (g) g.vagas.push(v);
    else map.set(key, { key, category: v.category ?? '—', vagas: [v] });
  }
  return [...map.values()];
}
