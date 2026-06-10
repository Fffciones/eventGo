import { useState } from 'react';
import { Shield, LayoutDashboard, Briefcase, Users, Layers, CalendarDays, SlidersHorizontal, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/Dashboard';
import ProfissionaisAdmin from './components/admin/ProfissionaisAdmin';
import ContratantesAdmin from './components/admin/ContratantesAdmin';
import FuncoesAdmin from './components/admin/FuncoesAdmin';
import EventosAdmin from './components/admin/EventosAdmin';
import VariaveisAdmin from './components/admin/VariaveisAdmin';

type Section = 'dashboard' | 'professionals' | 'clients' | 'functions' | 'events' | 'system';

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'professionals', label: 'Profissionais', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'clients',       label: 'Contratantes',  icon: <Users className="w-4 h-4" /> },
  { id: 'functions',     label: 'Funções',       icon: <Layers className="w-4 h-4" /> },
  { id: 'events',        label: 'Eventos',       icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'system',        label: 'Variáveis',     icon: <SlidersHorizontal className="w-4 h-4" /> },
];

const ROLE_LABEL: Record<string, string> = {
  operator:  'Operador',
  financial: 'Financeiro',
  super:     'Super Admin',
};

export default function AdminApp() {
  const { admin, loading, forbidden, signIn, signOut } = useAdminAuth();
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Shield className="text-primary w-8 h-8 animate-pulse" />
          <span className="text-white text-sm font-semibold">Carregando…</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <AdminLogin
        onSignIn={async (email, password) => {
          const { error } = await signIn(email, password);
          return { error };
        }}
        forbidden={forbidden}
      />
    );
  }

  function navigate(id: Section) {
    setSection(id);
    setSidebarOpen(false);
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'block' : 'hidden md:flex'} flex-col h-full bg-slate-950 text-white`}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-black text-white text-base tracking-tight leading-none">EventPro</p>
          <p className="text-slate-400 text-xs">Admin</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              section === item.id
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            {item.label}
            {section === item.id && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">
              {admin.full_name[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{admin.full_name}</p>
            <p className="text-slate-400 text-xs">{ROLE_LABEL[admin.role]}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar desktop */}
      <div className="w-56 shrink-0 flex flex-col">
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-56 flex flex-col shadow-2xl">
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900">
            {NAV.find(n => n.id === section)?.label}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {section === 'dashboard'     && <Dashboard />}
          {section === 'professionals' && <ProfissionaisAdmin />}
          {section === 'clients'       && <ContratantesAdmin />}
          {section === 'functions'     && <FuncoesAdmin />}
          {section === 'events'        && <EventosAdmin />}
          {section === 'system'        && <VariaveisAdmin />}
        </main>
      </div>
    </div>
  );
}
