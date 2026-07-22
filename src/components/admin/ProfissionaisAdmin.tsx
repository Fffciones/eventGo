import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Search, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ProfessionalStatus } from '../../lib/database.types';

interface Professional {
  id: string;
  user_id: string;
  category: string;
  status: ProfessionalStatus;
  stars: number;
  events_count: number;
  mei_number: string | null;
  professional_type: string;
  created_at: string;
  users: { full_name: string; email: string; phone: string | null };
  professional_functions: { functions: { name: string } | null }[];
}

const STATUS_LABEL: Record<ProfessionalStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  BLOCKED: 'Bloqueado',
};
const STATUS_COLOR: Record<ProfessionalStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

export default function ProfissionaisAdmin() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState<ProfessionalStatus | 'ALL'>('ALL');
  const [updating, setUpdating]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('professionals')
      .select(`
        id, user_id, category, status, stars, events_count,
        mei_number, professional_type, created_at,
        users(full_name, email, phone),
        professional_functions(functions(name))
      `)
      .order('created_at', { ascending: false });
    setProfessionals((data as unknown as Professional[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: ProfessionalStatus) {
    setUpdating(id);
    await supabase.from('professionals').update({ status }).eq('id', id);
    setProfessionals(prev =>
      prev.map(p => p.id === id ? { ...p, status } : p)
    );
    setUpdating(null);
  }

  const filtered = professionals.filter(p => {
    const term = search.toLowerCase();
    const matchSearch =
      p.users?.full_name?.toLowerCase().includes(term) ||
      p.users?.email?.toLowerCase().includes(term);
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: professionals.length,
    PENDING: professionals.filter(p => p.status === 'PENDING').length,
    ACTIVE:  professionals.filter(p => p.status === 'ACTIVE').length,
    BLOCKED: professionals.filter(p => p.status === 'BLOCKED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profissionais</h1>
          <p className="text-slate-500 text-sm mt-0.5">{professionals.length} cadastrados</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        {(['ALL', 'PENDING', 'ACTIVE', 'BLOCKED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
              filterStatus === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]}
            <span className="ml-1.5 opacity-60">{counts[s]}</span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nome ou e-mail…"
            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary w-64"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Nenhum resultado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Funções</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Tipo</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Estrelas</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Eventos</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => {
                const funcs = p.professional_functions
                  ?.map(pf => pf.functions?.name)
                  .filter(Boolean)
                  .join(', ') || p.category;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{p.users?.full_name}</div>
                      <div className="text-slate-400 text-xs">{p.users?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{funcs}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.professional_type === 'MEI'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {p.professional_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {'★'.repeat(p.stars)}{'☆'.repeat(Math.max(0, 5 - p.stars))}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.events_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.status !== 'ACTIVE' && (
                          <button
                            disabled={updating === p.id}
                            onClick={() => updateStatus(p.id, 'ACTIVE')}
                            title="Aprovar"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition disabled:opacity-40"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.status !== 'BLOCKED' && (
                          <button
                            disabled={updating === p.id}
                            onClick={() => updateStatus(p.id, 'BLOCKED')}
                            title="Bloquear"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.status === 'BLOCKED' && (
                          <button
                            disabled={updating === p.id}
                            onClick={() => updateStatus(p.id, 'PENDING')}
                            title="Reativar para revisão"
                            className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition disabled:opacity-40"
                          >
                            <ChevronDown className="w-4 h-4 rotate-180" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
