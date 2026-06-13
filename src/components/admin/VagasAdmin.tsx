import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, RefreshCw } from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface VagaRow {
  function_name: string;
  status: string;
  qty: number;
}

interface FunctionStat {
  name: string;
  open: number;
  invited: number;
  accepted: number;
  in_progress: number;
  finished: number;
  cancelled: number;
  total: number;
}

const STATUS_LABEL: Record<string, string> = {
  OPEN:        'Disponível',
  INVITED:     'Convite enviado',
  ACCEPTED:    'Aceita',
  IN_PROGRESS: 'Em andamento',
  FINISHED:    'Concluída',
  CANCELLED:   'Cancelada',
};

const STATUS_COLOR: Record<string, string> = {
  OPEN:        '#6366f1',
  INVITED:     '#f59e0b',
  ACCEPTED:    '#10b981',
  IN_PROGRESS: '#3b82f6',
  FINISHED:    '#059669',
  CANCELLED:   '#ef4444',
};

// ── Hook de dados ─────────────────────────────────────────────────────────────

function useVagasStats() {
  const [rows, setRows]       = useState<VagaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_vagas_by_function_status');
    setRows((data as VagaRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats: FunctionStat[] = (() => {
    const map = new Map<string, FunctionStat>();
    for (const r of rows) {
      if (!map.has(r.function_name)) {
        map.set(r.function_name, { name: r.function_name, open: 0, invited: 0, accepted: 0, in_progress: 0, finished: 0, cancelled: 0, total: 0 });
      }
      const s = map.get(r.function_name)!;
      const qty = Number(r.qty);
      s.total += qty;
      if (r.status === 'OPEN')        s.open        += qty;
      if (r.status === 'INVITED')     s.invited     += qty;
      if (r.status === 'ACCEPTED')    s.accepted    += qty;
      if (r.status === 'IN_PROGRESS') s.in_progress += qty;
      if (r.status === 'FINISHED')    s.finished    += qty;
      if (r.status === 'CANCELLED')   s.cancelled   += qty;
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  })();

  const totals = stats.reduce(
    (acc, s) => ({
      total:       acc.total       + s.total,
      open:        acc.open        + s.open,
      invited:     acc.invited     + s.invited,
      accepted:    acc.accepted    + s.accepted,
      in_progress: acc.in_progress + s.in_progress,
      finished:    acc.finished    + s.finished,
      cancelled:   acc.cancelled   + s.cancelled,
    }),
    { total: 0, open: 0, invited: 0, accepted: 0, in_progress: 0, finished: 0, cancelled: 0 },
  );

  return { stats, totals, loading, refetch: load };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function VagasAdmin() {
  const { stats, totals, loading, refetch } = useVagasStats();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Carregando vagas…</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Vagas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão consolidada por função e status</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Total" value={totals.total}       color="slate"  />
        <SummaryCard label="Disponíveis" value={totals.open}  color="indigo" />
        <SummaryCard label="Convite enviado" value={totals.invited}   color="amber"  />
        <SummaryCard label="Aceitas"  value={totals.accepted}  color="emerald"/>
        <SummaryCard label="Concluídas" value={totals.finished} color="green"  />
        <SummaryCard label="Canceladas" value={totals.cancelled} color="red"   />
      </div>

      {/* Donut geral + legenda */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-5">Distribuição geral</h2>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <DonutChart totals={totals} />
          <Legend totals={totals} />
        </div>
      </div>

      {/* Barra horizontal por função */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-5">Por função</h2>
        <div className="space-y-5">
          {stats.map(s => <FunctionBar key={s.name} stat={s} max={Math.max(...stats.map(x => x.total))} />)}
        </div>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Detalhamento</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase">Função</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Total</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-indigo-400 uppercase">Disponível</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-amber-400 uppercase">Convite</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-emerald-400 uppercase">Aceita</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-blue-400 uppercase">Andamento</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-green-500 uppercase">Concluída</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-red-400 uppercase">Cancelada</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase">Tx. Preench.</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => {
                const filled = s.accepted + s.in_progress + s.finished;
                const rate   = s.total > 0 ? Math.round((filled / s.total) * 100) : 0;
                return (
                  <tr key={s.name} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{s.name}</td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-700">{s.total}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge value={s.open} color="indigo" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge value={s.invited} color="amber" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge value={s.accepted} color="emerald" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge value={s.in_progress} color="blue" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge value={s.finished} color="green" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge value={s.cancelled} color="red" />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <RatePill rate={rate} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-6 py-3.5 font-black text-slate-700 text-xs uppercase">Total</td>
                <td className="px-4 py-3.5 text-right font-black text-slate-800">{totals.total}</td>
                <td className="px-4 py-3.5 text-right font-bold text-indigo-600">{totals.open}</td>
                <td className="px-4 py-3.5 text-right font-bold text-amber-600">{totals.invited}</td>
                <td className="px-4 py-3.5 text-right font-bold text-emerald-600">{totals.accepted}</td>
                <td className="px-4 py-3.5 text-right font-bold text-blue-600">{totals.in_progress}</td>
                <td className="px-4 py-3.5 text-right font-bold text-green-600">{totals.finished}</td>
                <td className="px-4 py-3.5 text-right font-bold text-red-500">{totals.cancelled}</td>
                <td className="px-6 py-3.5 text-right">
                  <RatePill rate={totals.total > 0
                    ? Math.round(((totals.accepted + totals.in_progress + totals.finished) / totals.total) * 100)
                    : 0}
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    slate:   'bg-slate-50  border-slate-200  text-slate-800',
    indigo:  'bg-indigo-50 border-indigo-200 text-indigo-700',
    amber:   'bg-amber-50  border-amber-200  text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    green:   'bg-green-50  border-green-200  text-green-700',
    red:     'bg-red-50    border-red-200    text-red-600',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold mt-0.5 opacity-70">{label}</p>
    </div>
  );
}

function Badge({ value, color }: { value: number; color: string }) {
  if (value === 0) return <span className="text-slate-300 font-medium">—</span>;
  const colors: Record<string, string> = {
    indigo:  'bg-indigo-100 text-indigo-700',
    amber:   'bg-amber-100  text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue:    'bg-blue-100   text-blue-700',
    green:   'bg-green-100  text-green-700',
    red:     'bg-red-100    text-red-600',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${colors[color]}`}>
      {value}
    </span>
  );
}

function RatePill({ rate }: { rate: number }) {
  const color = rate >= 70 ? 'text-green-600' : rate >= 40 ? 'text-amber-600' : 'text-red-500';
  return <span className={`font-bold text-sm ${color}`}>{rate}%</span>;
}

// ── Barra horizontal por função ───────────────────────────────────────────────

function FunctionBar({ stat, max }: { stat: FunctionStat; max: number }) {
  const segments = [
    { key: 'finished',    value: stat.finished,    color: '#059669' },
    { key: 'in_progress', value: stat.in_progress, color: '#3b82f6' },
    { key: 'accepted',    value: stat.accepted,    color: '#10b981' },
    { key: 'invited',     value: stat.invited,     color: '#f59e0b' },
    { key: 'open',        value: stat.open,        color: '#6366f1' },
    { key: 'cancelled',   value: stat.cancelled,   color: '#ef4444' },
  ].filter(s => s.value > 0);

  const widthPct = max > 0 ? (stat.total / max) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="w-36 shrink-0 text-sm font-semibold text-slate-700 truncate">{stat.name}</div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full flex rounded-full overflow-hidden" style={{ width: `${widthPct}%` }}>
            {segments.map(seg => (
              <div
                key={seg.key}
                style={{ width: `${(seg.value / stat.total) * 100}%`, backgroundColor: seg.color }}
                title={`${STATUS_LABEL[seg.key.toUpperCase()] ?? seg.key}: ${seg.value}`}
              />
            ))}
          </div>
        </div>
        <span className="w-8 text-right text-sm font-black text-slate-600">{stat.total}</span>
      </div>
    </div>
  );
}

// ── Donut chart SVG ───────────────────────────────────────────────────────────

function DonutChart({ totals }: { totals: ReturnType<typeof useVagasStats>['totals'] }) {
  const SIZE   = 160;
  const R      = 58;
  const STROKE = 22;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const circumference = 2 * Math.PI * R;

  const segments = [
    { key: 'OPEN',        value: totals.open        },
    { key: 'INVITED',     value: totals.invited     },
    { key: 'ACCEPTED',    value: totals.accepted    },
    { key: 'IN_PROGRESS', value: totals.in_progress },
    { key: 'FINISHED',    value: totals.finished    },
    { key: 'CANCELLED',   value: totals.cancelled   },
  ].filter(s => s.value > 0);

  const total = segments.reduce((a, s) => a + s.value, 0);

  let offset = 0;
  const arcs = segments.map(s => {
    const pct   = total > 0 ? s.value / total : 0;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const arc   = { ...s, dashArray: `${dash} ${gap}`, dashOffset: -offset * circumference };
    offset     += pct;
    return arc;
  });

  return (
    <svg width={SIZE} height={SIZE} className="shrink-0">
      {/* Track */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
      {/* Segments */}
      {arcs.map(arc => (
        <circle
          key={arc.key}
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={STATUS_COLOR[arc.key]}
          strokeWidth={STROKE}
          strokeDasharray={arc.dashArray}
          strokeDashoffset={arc.dashOffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      ))}
      {/* Center text */}
      <text x={CX} y={CY - 6} textAnchor="middle" className="font-black" fontSize={24} fontWeight={900} fill="#0f172a">{total}</text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize={10} fontWeight={600} fill="#94a3b8">vagas</text>
    </svg>
  );
}

function Legend({ totals }: { totals: ReturnType<typeof useVagasStats>['totals'] }) {
  const items = [
    { key: 'OPEN',        label: 'Disponível',       value: totals.open        },
    { key: 'INVITED',     label: 'Convite enviado',  value: totals.invited     },
    { key: 'ACCEPTED',    label: 'Aceita',           value: totals.accepted    },
    { key: 'IN_PROGRESS', label: 'Em andamento',     value: totals.in_progress },
    { key: 'FINISHED',    label: 'Concluída',        value: totals.finished    },
    { key: 'CANCELLED',   label: 'Cancelada',        value: totals.cancelled   },
  ];
  const total = items.reduce((a, i) => a + i.value, 0);
  return (
    <div className="flex flex-col gap-2.5 flex-1">
      {items.map(item => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[item.key] }} />
          <span className="text-sm text-slate-600 flex-1">{item.label}</span>
          <span className="text-sm font-bold text-slate-800">{item.value}</span>
          <span className="text-xs text-slate-400 w-8 text-right">
            {total > 0 ? `${Math.round((item.value / total) * 100)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
