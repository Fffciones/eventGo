import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Save, X, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Funcao {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  price_mei: number;
  price_diarista: number;
  base_pay_mei: number;
  base_pay_diarista: number;
  display_order: number;
}

const empty: Omit<Funcao, 'id' | 'display_order'> = {
  name: '', slug: '', active: true,
  price_mei: 0, price_diarista: 0,
  base_pay_mei: 0, base_pay_diarista: 0,
};

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function FuncoesAdmin() {
  const [funcoes, setFuncoes]   = useState<Funcao[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Funcao | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('functions')
      .select('*')
      .order('display_order');
    setFuncoes((data as Funcao[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setIsNew(true);
    setEditing({ id: '', display_order: funcoes.length + 1, ...empty });
    setError('');
  }

  function startEdit(f: Funcao) {
    setIsNew(false);
    setEditing({ ...f });
    setError('');
  }

  function cancelEdit() {
    setEditing(null);
    setError('');
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError('');

    const payload = {
      name: editing.name.trim(),
      slug: editing.slug || slugify(editing.name),
      active: editing.active,
      price_mei: editing.price_mei,
      price_diarista: editing.price_diarista,
      base_pay_mei: editing.base_pay_mei,
      base_pay_diarista: editing.base_pay_diarista,
      display_order: editing.display_order,
    };

    if (isNew) {
      const { error } = await supabase.from('functions').insert(payload);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('functions').update(payload).eq('id', editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setEditing(null);
    load();
  }

  async function toggleActive(f: Funcao) {
    await supabase.from('functions').update({ active: !f.active }).eq('id', f.id);
    setFuncoes(prev => prev.map(fn => fn.id === f.id ? { ...fn, active: !fn.active } : fn));
  }

  function field(label: string, key: keyof Funcao, type = 'text') {
    if (!editing) return null;
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
        <input
          type={type}
          value={String(editing[key])}
          onChange={e => setEditing(prev => prev ? {
            ...prev,
            [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
            ...(key === 'name' && isNew ? { slug: slugify(e.target.value) } : {}),
          } : prev)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          step={type === 'number' ? '0.01' : undefined}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Funções</h1>
          <p className="text-slate-500 text-sm mt-0.5">Papéis disponíveis na plataforma</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Função
        </button>
      </div>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                {isNew ? 'Nova Função' : `Editar: ${editing.name}`}
              </h2>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">{field('Nome', 'name')}</div>
              <div className="col-span-2">{field('Slug (identificador)', 'slug')}</div>
              {field('Preço MEI (ao contratante)', 'price_mei', 'number')}
              {field('Preço Diarista (ao contratante)', 'price_diarista', 'number')}
              {field('Remuneração MEI (líquido)', 'base_pay_mei', 'number')}
              {field('Remuneração Diarista (líquido)', 'base_pay_diarista', 'number')}
              {field('Ordem de exibição', 'display_order', 'number')}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ativa</label>
                <button
                  type="button"
                  onClick={() => setEditing(prev => prev ? { ...prev, active: !prev.active } : prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                    editing.active
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {editing.active
                    ? <><ToggleRight className="w-4 h-4" /> Ativa</>
                    : <><ToggleLeft className="w-4 h-4" /> Inativa</>}
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={cancelEdit}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.name.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Carregando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Função</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Preço MEI</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Preço Diarista</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Rem. MEI</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Rem. Diarista</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funcoes.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-300">
                    <GripVertical className="w-4 h-4" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{f.name}</div>
                    <div className="text-slate-400 text-xs font-mono">{f.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">R$ {f.price_mei.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">R$ {f.price_diarista.toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">R$ {f.base_pay_mei.toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">R$ {f.base_pay_diarista.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(f)}
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${
                        f.active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {f.active
                        ? <><ToggleRight className="w-3 h-3" /> Ativa</>
                        : <><ToggleLeft className="w-3 h-3" /> Inativa</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(f)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
