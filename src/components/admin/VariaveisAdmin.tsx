import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Loader2, Save, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SysVar {
  key: string;
  value: number;
  label: string | null;
  description: string | null;
}

export default function VariaveisAdmin() {
  const [vars, setVars]       = useState<SysVar[]>([]);
  const [edited, setEdited]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('system_variables').select('*').order('key');
    setVars((data as SysVar[]) ?? []);
    setEdited({});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (key: string) => {
    const value = parseFloat(String(edited[key]).replace(',', '.'));
    if (isNaN(value) || value < 0) return;
    setSavingKey(key);
    const { error } = await supabase.from('system_variables').update({ value }).eq('key', key);
    setSavingKey(null);
    if (!error) {
      setVars(prev => prev.map(v => (v.key === key ? { ...v, value } : v)));
      setEdited(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            Variáveis Gerais de Sistema
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Parâmetros operacionais do matchmaking e da plataforma.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando…</div>
      ) : vars.length === 0 ? (
        <div className="p-12 text-center text-slate-400">Nenhuma variável cadastrada.</div>
      ) : (
        <div className="space-y-3">
          {vars.map(v => {
            const dirty = edited[v.key] != null && edited[v.key] !== String(v.value);
            return (
              <div key={v.key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{v.label ?? v.key}</p>
                    {v.description && <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>}
                    <p className="text-[10px] font-mono text-slate-400 mt-1">{v.key}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number" min="0" step="1"
                      value={edited[v.key] ?? String(v.value)}
                      onChange={e => setEdited(prev => ({ ...prev, [v.key]: e.target.value }))}
                      className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => save(v.key)}
                      disabled={!dirty || savingKey === v.key}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition"
                    >
                      {savingKey === v.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
