import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight, 
  Rocket, 
  PlusCircle, 
  Star, 
  X,
  Plus,
  Trash2,
  Lock,
  Heart
} from 'lucide-react';
import { ClientEvent, Professional } from '../types';
import { CLIENT_AVATARS, RICARDO_PROFILE } from '../data';
import type { UserProfile } from '../hooks/useProfile';

interface ProfileViewProps {
  events: ClientEvent[];
  onAddEvent: (newEvent: ClientEvent) => void;
  favoritePros: Professional[];
  onToggleFavorite: (id: string) => void;
  onSelectPro: (id: string) => void;
  profile?: UserProfile | null;
  onSignOut?: () => void;
}

export default function ProfileView({ events, onAddEvent, favoritePros, onToggleFavorite, onSelectPro, profile, onSignOut }: ProfileViewProps) {
  const [newEventModal, setNewEventModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  const [proCount, setProCount] = useState(3);
  
  // Settings detail simulate views
  const [settingModal, setSettingModal] = useState<'payment' | 'verify' | 'help' | null>(null);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate.trim() || !eventLoc.trim()) return;

    const newEv: ClientEvent = {
      id: `ev-${Date.now()}`,
      name: eventName,
      date: eventDate,
      location: eventLoc,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzrhg17DelbqsZukhm2XDnXFtYhXUxOiYyM4ycQ4je0E9cvjZJOVBCQ64UQndwqeC35B_PX5ESueQWFdSaGXiFsa-Cis1gXPXVqXz1H0G9uKbBnTVKmigD1R_VOvl9KQ2MC9QFWGOG3JXoaqUrKDDS0ic3XBkfMcjVrIug2IdsjExs5sFnc64s189kNOuL8lZLXrcOf_QlllV6-bXChYLrfiMXNgloikrzyah0WZvUq7Juk6Xbu5S46aM8TgqCwh68fJr0gGcOzA", // generic high fidelity placeholder
      proCount: proCount,
      status: 'CONCLUÍDO'
    };

    onAddEvent(newEv);
    setEventName('');
    setEventDate('');
    setEventLoc('');
    setNewEventModal(false);
  };

  return (
    <main className="max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-6 space-y-6 pb-12 text-left">
      
      {/* Profile Overview Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card Info */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row gap-5 items-start md:items-center shadow-sm">
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                alt={profile.full_name}
                className="w-24 h-24 rounded-2xl object-cover border border-outline-variant/20 shadow-inner"
                src={profile.avatar_url}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-outline-variant/20 flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-primary">
                  {(profile?.full_name ?? 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 fill-on-primary text-primary" />
              <span className="font-mono font-bold text-[9px] tracking-wider uppercase">Verificado</span>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="font-display font-extrabold text-2xl text-primary leading-tight">{profile?.full_name ?? '—'}</h1>
            <p className="text-xs font-semibold text-on-surface-variant">{profile?.email}</p>
            
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col">
                <span className="font-mono font-bold text-[9px] text-outline uppercase tracking-wide">Rating como Cliente</span>
                <div className="flex items-center gap-1">
                  <span className="font-display font-bold text-base text-tertiary">4.9</span>
                  <div className="flex text-amber-500 gap-[2px]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto bg-primary-container/10 p-4 rounded-2xl border border-primary-container/20 text-center shrink-0">
            <span className="font-display text-4xl font-extrabold text-primary block leading-none">{events.length + 22}</span>
            <span className="font-mono text-[9px] font-bold text-primary-container uppercase tracking-wide block mt-1">Eventos Organizados</span>
          </div>
        </div>

        {/* Quick Action / Status Badge banner */}
        <div className="bg-primary text-on-primary p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-5 -top-5 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <Rocket className="w-28 h-28" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg mb-1 leading-tight">Pronto para o próximo?</h3>
            <p className="text-xs opacity-80 leading-normal">Encontre os melhores profissionais para sua festa ou evento corporativo hoje.</p>
          </div>
          <button 
            onClick={() => setNewEventModal(true)}
            className="mt-4 w-full py-3 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 active:scale-95 text-xs shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Novo Evento</span>
          </button>
        </div>
      </section>

      {/* Bento Grid: History & Favorites split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* History of Client Events Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-lg md:text-xl text-primary">Histórico de Eventos</h2>
            <button 
              onClick={() => alert("Histórico extendido arquivado com segurança de criptografia ponta a ponta. Solicite backup completo se necessário no Suporte Técnico.")}
              className="text-primary font-semibold text-xs hover:underline"
            >
              Ver tudo
            </button>
          </div>
          
          <div className="space-y-3">
            {events.map((ev) => (
              <div 
                key={ev.id}
                className="bg-white p-3.5 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row gap-4 hover:border-primary/40 transition-colors cursor-pointer group shadow-sm"
              >
                <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 border">
                  <img 
                    src={ev.image} 
                    alt={ev.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none" 
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4 text-left">
                    <div>
                      <h4 className="font-display font-bold text-base text-tertiary">{ev.name}</h4>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{ev.date} • {ev.location}</span>
                      </p>
                    </div>
                    <div className="bg-secondary-container/20 text-on-secondary-container font-mono text-[9px] font-bold px-2 py-0.5 rounded border-l-2 border-secondary uppercase shrink-0">
                      {ev.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      🛠️ {ev.proCount} Profissionais contratados sob demanda
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Favorites list Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-primary">Meus Favoritos</h2>
          
          <div className="bg-surface-container-low p-3.5 rounded-2xl space-y-2.5 border border-outline-variant/20">
            {favoritePros.slice(0, 3).map((pro) => (
              <div 
                key={pro.id} 
                className="bg-white p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm border border-outline-variant/10 hover:border-primary/20 transition-all text-left"
              >
                <img 
                  onClick={() => onSelectPro(pro.id)}
                  src={pro.image} 
                  alt={pro.name} 
                  className="w-11 h-11 rounded-lg object-cover cursor-pointer hover:brightness-95 transition-all shadow-sm"
                />
                <div className="flex-1 min-w-0" onClick={() => onSelectPro(pro.id)}>
                  <h5 className="text-[12px] font-bold text-tertiary truncate cursor-pointer hover:underline">{pro.name}</h5>
                  <p className="text-[10px] text-on-surface-variant font-medium truncate">{pro.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 text-amber-500 mb-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="font-mono text-[10px] font-bold">{pro.rating}</span>
                  </div>
                  <button 
                    onClick={() => onToggleFavorite(pro.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={() => onSelectPro(RICARDO_PROFILE.id)}
              className="w-full py-2.5 bg-white text-primary font-bold text-xs hover:bg-slate-50 rounded-xl transition-all border border-dashed border-primary/20 shadow-sm"
            >
              Ver Lista Completa
            </button>
          </div>
        </div>

      </section>

      {/* Settings & Help grid tiles */}
      <section className="space-y-4">
        <h2 className="font-display font-extrabold text-lg text-primary">Configurações e Ajuda</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card Setting: Payments */}
          <div 
            onClick={() => setSettingModal('payment')}
            className="bg-white p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer shadow-sm text-left"
          >
            <div className="w-11 h-11 bg-primary-container/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase mt-0.5">Métodos de Pagamento</h4>
              <p className="text-[11px] text-on-surface-variant">Cartão final 4432 (Principal)</p>
            </div>
            <ChevronRight className="w-4 h-4 text-outline" />
          </div>

          {/* Card Setting: Identity Validation */}
          <div 
            onClick={() => setSettingModal('verify')}
            className="bg-white p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer shadow-sm text-left"
          >
            <div className="w-11 h-11 bg-primary-container/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase mt-0.5">Verificação de Conta</h4>
              <p className="text-[11px] text-on-surface-variant">Identidade verificada em 2023</p>
            </div>
            <ChevronRight className="w-4 h-4 text-outline" />
          </div>

          {/* Card Setting: Support Central */}
          <div 
            onClick={() => setSettingModal('help')}
            className="bg-white p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer shadow-sm text-left"
          >
            <div className="w-11 h-11 bg-primary-container/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase mt-0.5">Central de Ajuda</h4>
              <p className="text-[11px] text-on-surface-variant">Suporte 24/7 disponível</p>
            </div>
            <ChevronRight className="w-4 h-4 text-outline" />
          </div>

        </div>

        {/* Saldo de créditos + Sair */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {profile?.credit_balance !== undefined && (
            <div className="flex-1 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Saldo de Créditos</p>
                <p className="font-display text-2xl font-bold text-primary mt-0.5">
                  R$ {Number(profile.credit_balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-primary/30" />
            </div>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-error/30 text-error hover:bg-error/5 transition-all text-sm font-semibold"
            >
              Sair da conta
            </button>
          )}
        </div>
      </section>

      {/* CREATE EVENT MODAL */}
      <AnimatePresence>
        {newEventModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-2xl border border-outline-variant max-w-md w-full relative"
            >
              <button 
                onClick={() => setNewEventModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-display font-extrabold text-xl text-primary text-left mb-1.5">Criar Novo Evento</h3>
              <p className="text-xs text-on-surface-variant text-left mb-4">Adicione um novo registro no seu histórico para planejar as contratações táticas.</p>

              <form onSubmit={handleCreateEvent} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">NOME DO EVENTO</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cerimônia de Casamento Luxo, Festa de 30 Anos..." 
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">DATA</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 15 de Outembro" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">LOCAL</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Mansão Jardim América, SP" 
                      value={eventLoc}
                      onChange={(e) => setEventLoc(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ESTIMATIVA DE STAFF REQUERIDO</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={proCount}
                    onChange={(e) => setProCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setNewEventModal(false)}
                    className="flex-1 py-3 border border-outline-variant text-[#1a1b1e] font-semibold text-xs rounded-xl hover:bg-slate-50"
                  >
                    Mudar de Ideia
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95"
                  >
                    Simular Evento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS DETAILS MODALS */}
      <AnimatePresence>
        {settingModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-2xl border border-outline-variant max-w-sm w-full relative space-y-4 text-left"
            >
              <button 
                onClick={() => setSettingModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              {settingModal === 'payment' && (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <CreditCard className="w-5 h-5 text-secondary" />
                    <h3 className="font-display font-extrabold text-base uppercase">Metódos de Pagamento</h3>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border space-y-2.5">
                    <p className="text-xs font-bold text-slate-800">Cartão de Crédito Cadastrado:</p>
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border text-xs">
                      <span>💳 Visa final 4432</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded">PRINCIPAL</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border text-xs text-slate-400">
                      <span>💳 MasterCard final 8821</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert("Simulação de Gateway de Pagamento Seguro Stripe/Adyen ativada.")}
                    className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg"
                  >
                    Adicionar Novo Cartão
                  </button>
                </>
              )}

              {settingModal === 'verify' && (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="w-5 h-5 text-secondary" />
                    <h3 className="font-display font-extrabold text-base uppercase">Verificação Cadastral</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                    Sua conta está no nível máximo de confiança: <strong>NÍVEL Ouro VIP</strong>. Verificado através de biometria facial, CPF e antecedentes criminais auditados em Dezembro de 2023.
                  </div>
                </>
              )}

              {settingModal === 'help' && (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <HelpCircle className="w-5 h-5 text-secondary" />
                    <h3 className="font-display font-extrabold text-base uppercase">Central de Ajuda</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant">Seus pedidos são garantidos pela apólice de segurança EventGo. Tem dúvidas? Converse com um concierge:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a href="tel:0800" className="p-2.5 bg-slate-50 border text-center rounded-lg font-semibold hover:bg-slate-100 block">📞 Telefone 0800</a>
                    <button onClick={() => alert("Iniciando chat ao vivo com suporte tático...")} className="p-2.5 bg-primary text-white text-center rounded-lg font-bold">💬 Chat Online</button>
                  </div>
                </>
              )}

              <button 
                onClick={() => setSettingModal(null)}
                className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Voltar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
