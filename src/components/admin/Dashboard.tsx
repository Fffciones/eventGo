import { useEffect, useState } from 'react';
import { Users, CalendarDays, Briefcase, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  professionals: number;
  pendingPros: number;
  clients: number;
  events: number;
  activeEvents: number;
  totalRevenue: number;
}

interface RecentEvent {
  id: string;
  name: string;
  starts_at: string;
  status: string;
  clients: { users: { full_name: string } } | null;
}

export default function Dashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: professionals },
        { count: pendingPros },
        { count: clients },
        { count: events },
        { count: activeEvents },
        { data: revenueData },
        { data: recentEvents },
      ] = await Promise.all([
        supabase.from('professionals').select('*', { count: 'exact', head: true }),
        supabase.from('professionals').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
        supabase.from('bookings').select('total_amount').eq('status', 'COMPLETED'),
        supabase.from('events')
          .select('id, name, starts_at, status, clients(users(full_name))')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const totalRevenue = (revenueData ?? []).reduce(
        (sum, b) => sum + (b.total_amount ?? 0), 0
      );

      setStats({
        professionals: professionals ?? 0,
        pendingPros: pendingPros ?? 0,
        clients: clients ?? 0,
        events: events ?? 0,
        activeEvents: activeEvents ?? 0,
        totalRevenue,
      });
      setRecent((recentEvents as RecentEvent[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const cards = stats ? [
    {
      label: 'Profissionais',
      value: stats.professionals,
      sub: stats.pendingPros > 0 ? `${stats.pendingPros} aguardando aprovação` : 'Todos aprovados',
      icon: <Briefcase className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      alert: stats.pendingPros > 0,
    },
    {
      label: 'Contratantes',
      value: stats.clients,
      sub: 'cadastrados',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600',
      alert: false,
    },
    {
      label: 'Eventos',
      value: stats.events,
      sub: `${stats.activeEvents} em andamento`,
      icon: <CalendarDays className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600',
      alert: false,
    },
    {
      label: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'eventos concluídos',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
      alert: false,
    },
  ] : [];

  const STATUS_COLOR: Record<string, string> = {
    DRAFT:       'bg-slate-100 text-slate-500',
    PUBLISHED:   'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED:   'bg-green-100 text-green-700',
    CANCELLED:   'bg-red-100 text-red-600',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão geral da plataforma</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map(c => (
              <div key={c.label} className={`bg-white border rounded-2xl p-4 shadow-sm ${c.alert ? 'border-orange-300' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500">{c.label}</span>
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}>
                    {c.icon}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900">{c.value}</p>
                <p className={`text-xs mt-0.5 ${c.alert ? 'text-orange-600 font-semibold' : 'text-slate-400'}`}>
                  {c.alert && <Clock className="w-3 h-3 inline mr-1" />}
                  {c.sub}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800 mb-3">Eventos Recentes</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Nenhum evento ainda.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Evento</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Contratante</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Data</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">{e.name}</td>
                        <td className="px-4 py-3 text-slate-600">{e.clients?.users?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(e.starts_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
