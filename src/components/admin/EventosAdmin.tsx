import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

const EVENT_STATUS_COLOR: Record<string, string> = {
  DRAFT:      'bg-slate-100 text-slate-600',
  PUBLISHED:  'bg-blue-100 text-blue-700',
  IN_PROGRESS:'bg-yellow-100 text-yellow-700',
  COMPLETED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

export default function EventosAdmin() {
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Event | null>(null);

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
      .order('starts_at', { ascending: false })
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

  function formatDate(d: string) {
    return new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
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
                <tr key={e.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelected(e)}>
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

      {/* Drawer de detalhes */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Local</p>
                  <p className="text-slate-800 mt-0.5">{selected.location_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Contratante</p>
                  <p className="text-slate-800 mt-0.5">{selected.clients?.users?.full_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Início</p>
                  <p className="text-slate-800 mt-0.5">{formatDate(selected.starts_at)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Fim</p>
                  <p className="text-slate-800 mt-0.5">{formatDate(selected.ends_at)}</p>
                </div>
                {selected.team_arrival_at && (
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase">Chegada da equipe</p>
                    <p className="text-slate-800 mt-0.5">{formatDate(selected.team_arrival_at)}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Status</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${EVENT_STATUS_COLOR[selected.status] ?? ''}`}>
                    {selected.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Valor total</p>
                  <p className="text-slate-800 mt-0.5">
                    {(selected.estimated_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Pagamento</p>
                  <p className="text-slate-800 mt-0.5">
                    {selected.payment_method === 'CREDIT' ? 'Limite de crédito'
                      : selected.payment_method === 'CARD' ? 'Cartão de crédito'
                      : '—'}
                    <span className="text-xs text-slate-400"> · {selected.charge_status ?? 'PENDING'}</span>
                  </p>
                </div>
              </div>

              {(selected.responsible_1_name || selected.responsible_2_name) && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Responsáveis no local</h3>
                  <div className="space-y-2">
                    {[
                      { name: selected.responsible_1_name, role: selected.responsible_1_role, whats: selected.responsible_1_whatsapp },
                      { name: selected.responsible_2_name, role: selected.responsible_2_role, whats: selected.responsible_2_whatsapp },
                    ].filter(r => r.name).map((r, i) => (
                      <div key={i} className="border border-slate-100 rounded-xl px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-800">{r.name}{r.role && <span className="font-normal text-slate-500"> — {r.role}</span>}</p>
                        {r.whats && <p className="text-xs text-slate-500 mt-0.5">📱 {r.whats}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Vagas</h3>
                <div className="space-y-3">
                  {groupVagas(selected.vagas ?? []).map(g => {
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
                          <div className="mt-2 space-y-1">
                            {assigned.map(v => (
                              <div key={v.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-700">{v.professionals?.users?.full_name ?? '—'}</span>
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                  v.worker_status === 'CHECKED_OUT' ? 'bg-green-100 text-green-700' :
                                  v.worker_status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                  v.worker_status === 'DECLINED' ? 'bg-red-100 text-red-600' :
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
