import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Loader2, Wallet, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChargeRow {
  id: string;
  name: string;
  estimated_total: number | null;
  payment_method: string | null;
  charge_status: string;
  clients: { users: { full_name: string } | null } | null;
}

interface PayoutRow {
  id: string;
  base_pay: number | null;
  paid_at: string | null;
  category: string | null;
  professionals: { users: { full_name: string } | null } | null;
  events: { name: string } | null;
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinanceiroAdmin() {
  const [charges, setCharges]   = useState<ChargeRow[]>([]);
  const [payouts, setPayouts]   = useState<PayoutRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [marking, setMarking]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase
        .from('events')
        .select('id, name, estimated_total, payment_method, charge_status, clients(users(full_name))')
        .in('charge_status', ['PENDING', 'AUTHORIZED'])
        .gt('estimated_total', 0)
        .order('created_at', { ascending: false }),
      supabase
        .from('vagas')
        .select('id, base_pay, paid_at, category, professionals(users(full_name)), events(name)')
        .eq('status', 'FINISHED')
        .order('paid_at', { ascending: false })
        .limit(100),
    ]);
    setCharges((c as unknown as ChargeRow[]) ?? []);
    setPayouts((p as unknown as PayoutRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markCharged = async (id: string) => {
    setMarking(id);
    const { error } = await supabase.rpc('mark_event_charged', { p_event_id: id });
    setMarking(null);
    if (!error) setCharges(prev => prev.filter(c => c.id !== id));
  };

  const totalOpen = charges.reduce((s, c) => s + (c.estimated_total ?? 0), 0);
  const totalPaid = payouts.reduce((s, p) => s + (p.base_pay ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Financeiro
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Cobranças de contratantes e pagamentos a profissionais.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando…</div>
      ) : (
        <div className="space-y-8">
          {/* Cobranças em aberto */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Cobranças em aberto</h2>
              <span className="text-sm text-slate-500">Total: <strong className="text-slate-800">{fmtBRL(totalOpen)}</strong></span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {charges.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Nenhuma cobrança em aberto.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Evento</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Contratante</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Forma</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                      <th className="text-right px-4 py-3 text-slate-500 font-semibold">Valor</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {charges.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                        <td className="px-4 py-3 text-slate-600">{c.clients?.users?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {c.payment_method === 'CREDIT' ? 'Limite' : c.payment_method === 'CARD' ? 'Cartão' : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            c.charge_status === 'AUTHORIZED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>{c.charge_status}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtBRL(c.estimated_total ?? 0)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => markCharged(c.id)}
                            disabled={marking === c.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-primary/90"
                          >
                            {marking === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Marcar cobrado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Pagamentos a profissionais */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Pagamentos a profissionais</h2>
              <span className="text-sm text-slate-500">Total pago: <strong className="text-slate-800">{fmtBRL(totalPaid)}</strong></span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {payouts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Nenhum pagamento realizado ainda.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Profissional</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Função</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Evento</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Pago em</th>
                      <th className="text-right px-4 py-3 text-slate-500 font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{p.professionals?.users?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{p.category ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{p.events?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {p.paid_at ? new Date(p.paid_at).toLocaleString('pt-BR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtBRL(p.base_pay ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
