import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, RefreshCw, Search, UserPlus, Shield, Check, X, Trash2, AlertTriangle } from 'lucide-react';

interface AdminRow {
  id: string;
  user_id: string;
  role: string;
  active: boolean;
  created_at: string;
  users: { full_name: string; email: string } | null;
}

interface UserResult {
  id: string;
  full_name: string;
  email: string;
}

const ROLES = [
  { value: 'operator',  label: 'Operador',   desc: 'Aprova profissionais, gerencia eventos' },
  { value: 'financial', label: 'Financeiro',  desc: 'Acesso a pagamentos e extratos' },
  { value: 'super',     label: 'Super Admin', desc: 'Acesso total ao sistema' },
];

const ROLE_COLOR: Record<string, string> = {
  operator:  'bg-blue-100 text-blue-700',
  financial: 'bg-amber-100 text-amber-700',
  super:     'bg-purple-100 text-purple-700',
};

export default function AdminsAdmin() {
  const [admins, setAdmins]   = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: session }, { data }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('admins').select('*, users(full_name, email)').order('created_at'),
    ]);
    setCurrentUserId(session?.session?.user?.id ?? null);
    setAdmins((data as AdminRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (id: string, role: string) => {
    await supabase.from('admins').update({ role }).eq('id', id);
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, role } : a));
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('admins').update({ active }).eq('id', id);
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, active } : a));
  };

  const removeAdmin = async (id: string) => {
    await supabase.from('admins').delete().eq('id', id);
    setAdmins(prev => prev.filter(a => a.id !== id));
  };

  const onAdded = (admin: AdminRow) => {
    setAdmins(prev => [...prev, admin]);
    setShowAdd(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Administradores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{admins.length} conta{admins.length !== 1 ? 's' : ''} com acesso ao painel</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar admin
          </button>
        </div>
      </div>

      {/* Modal de adicionar */}
      {showAdd && (
        <AddAdminModal onAdded={onAdded} onClose={() => setShowAdd(false)} />
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando…</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Perfil</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map(admin => {
                const isSelf = admin.user_id === currentUserId;
                return (
                  <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm">
                            {(admin.users?.full_name ?? '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {admin.users?.full_name ?? '—'}
                            {isSelf && <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">você</span>}
                          </p>
                          <p className="text-xs text-slate-400">{admin.users?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isSelf ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLOR[admin.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ROLES.find(r => r.value === admin.role)?.label ?? admin.role}
                        </span>
                      ) : (
                        <select
                          value={admin.role}
                          onChange={e => updateRole(admin.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${ROLE_COLOR[admin.role] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isSelf ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500" /> Ativo
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleActive(admin.id, !admin.active)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                            admin.active
                              ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600'
                              : 'bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-700'
                          }`}
                        >
                          {admin.active
                            ? <><Check className="w-3 h-3" />Ativo</>
                            : <><X className="w-3 h-3" />Inativo</>
                          }
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {!isSelf && (
                        <RemoveButton onConfirm={() => removeAdmin(admin.id)} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda de perfis */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Níveis de acesso</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_COLOR[r.value]}`}>{r.label}</span>
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Botão de remover com confirmação inline ───────────────────────────────────

function RemoveButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-500 font-semibold mr-1">Confirmar?</span>
        <button onClick={onConfirm} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setConfirm(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => setConfirm(true)} className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

// ── Modal de adicionar admin ──────────────────────────────────────────────────

function AddAdminModal({ onAdded, onClose }: {
  onAdded: (admin: AdminRow) => void;
  onClose: () => void;
}) {
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [role, setRole]       = useState('operator');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .or(`email.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%`)
      .limit(5);
    setResults((data as UserResult[]) ?? []);
    setSearching(false);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase
      .rpc('add_admin', { p_user_id: selected.id, p_role: role });

    if (err) { setError(err.message); setSaving(false); return; }
    onAdded(data as AdminRow);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Adicionar administrador</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Aviso */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">O usuário precisa já ter conta no EventPro. Busque pelo e-mail ou nome cadastrado.</p>
          </div>

          {/* Busca */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Buscar usuário</label>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="E-mail ou nome…"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={doSearch}
                disabled={searching}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Search className="w-4 h-4 text-slate-500" />}
              </button>
            </div>

            {results.length > 0 && !selected && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {results.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setSelected(u); setResults([]); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-800">{u.full_name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Usuário selecionado */}
          {selected && (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{selected.full_name}</p>
                <p className="text-xs text-slate-500">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Perfil */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nível de acesso</label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    role === r.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_COLOR[r.value]}`}>{r.label}</span>
                    <span className="text-xs text-slate-500">{r.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!selected || saving}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
