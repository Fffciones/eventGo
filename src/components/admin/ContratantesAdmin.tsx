import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Building2, User, Pencil, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Client {
  id: string;
  user_id: string;
  document: string;
  is_company: boolean;
  credit_balance: number;
  credit_limit: number;
  created_at: string;
  users: { full_name: string; email: string; phone: string | null };
  _event_count?: number;
}

export default function ContratantesAdmin() {
  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterType, setFilter] = useState<'ALL' | 'PF' | 'PJ'>('ALL');
  const [editing, setEditing]   = useState<Client | null>(null);
  const [limitInput, setLimitInput]     = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openEdit = (c: Client) => {
    setEditing(c);
    setLimitInput(String(c.credit_limit ?? 0));
    setBalanceInput(String(c.credit_balance ?? 0));
    setSaveError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const limit = parseFloat(limitInput.replace(',', '.'));
    const balance = parseFloat(balanceInput.replace(',', '.'));
    if (isNaN(limit) || limit < 0 || isNaN(balance) || balance < 0) {
      setSaveError('Informe valores válidos (≥ 0).');
      return;
    }
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from('clients')
      .update({ credit_limit: limit, credit_balance: balance })
      .eq('id', editing.id);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setClients(prev => prev.map(c =>
      c.id === editing.id ? { ...c, credit_limit: limit, credit_balance: balance } : c
    ));
    setEditing(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('id, user_id, document, is_company, credit_balance, credit_limit, created_at, users(full_name, email, phone)')
      .order('created_at', { ascending: false });
    setClients((data as Client[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    const matchSearch =
      c.users?.full_name?.toLowerCase().includes(term) ||
      c.users?.email?.toLowerCase().includes(term) ||
      c.document?.includes(term);
    const matchType =
      filterType === 'ALL' ||
      (filterType === 'PJ' && c.is_company) ||
      (filterType === 'PF' && !c.is_company);
    return matchSearch && matchType;
  });

  const counts = {
    ALL: clients.length,
    PF: clients.filter(c => !c.is_company).length,
    PJ: clients.filter(c => c.is_company).length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratantes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} cadastrados</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        {(['ALL', 'PF', 'PJ'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
              filterType === t
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {t === 'ALL' ? 'Todos' : t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            <span className="ml-1.5 opacity-60">{counts[t]}</span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nome, e-mail ou documento…"
            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary w-72"
          />
        </div>
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
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Tipo</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Documento</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Telefone</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Saldo</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Limite de crédito</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Cadastro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{c.users?.full_name}</div>
                    <div className="text-slate-400 text-xs">{c.users?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.is_company
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.is_company
                        ? <><Building2 className="w-3 h-3" /> PJ</>
                        : <><User className="w-3 h-3" /> PF</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{c.document}</td>
                  <td className="px-4 py-3 text-slate-600">{c.users?.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">
                    R$ {c.credit_balance.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <span className={c.credit_limit > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                      R$ {c.credit_limit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(c)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de edição de crédito */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Editar contratante</h2>
                <p className="text-xs text-slate-500">{editing.users?.full_name}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Limite de crédito (R$)
                </label>
                <input
                  type="number" min="0" step="0.01" value={limitInput}
                  onChange={e => setLimitInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Crédito pré-aprovado para o contratante contratar sem pagar à vista (cobrança ao final do evento).
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Saldo (R$)
                </label>
                <input
                  type="number" min="0" step="0.01" value={balanceInput}
                  onChange={e => setBalanceInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{saveError}</p>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
