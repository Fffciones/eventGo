import React, { useState, useRef } from 'react';
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
  Heart,
  Camera,
  Loader2
} from 'lucide-react';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import { supabase } from '../lib/supabase';
import { ClientEvent, Professional } from '../types';
import type { UserProfile, ProfileEvent, ProfileFavorite } from '../hooks/useProfile';

const CATEGORY_LABELS: Record<string, string> = {
  GARCOM: 'Garçom', DJ: 'DJ', SEGURANCA: 'Segurança',
  FAXINEIRO: 'Limpeza', FOTOGRAFO: 'Fotógrafo',
  MESTRE_CERIMONIAS: 'Mestre de Cerimônias',
  PRODUTOR: 'Produtor', CONTROLADOR_ACESSO: 'Controle de Acesso',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SCHEDULED:  { label: 'Agendado',   color: 'bg-amber-50 text-amber-700' },
  ACTIVE:     { label: 'Ativo',      color: 'bg-emerald-50 text-emerald-700' },
  COMPLETED:  { label: 'Concluído',  color: 'bg-slate-100 text-slate-600' },
  CANCELLED:  { label: 'Cancelado',  color: 'bg-red-50 text-red-600' },
};

interface ProfileViewProps {
  events: ClientEvent[];
  dbEvents?: ProfileEvent[];
  dbFavorites?: ProfileFavorite[];
  avgRating?: number | null;
  onAddEvent: (newEvent: ClientEvent) => void;
  favoritePros: Professional[];
  onToggleFavorite: (id: string) => void;
  onSelectPro: (id: string) => void;
  profile?: UserProfile | null;
  onSignOut?: () => void;
  onCreateEvent?: () => void;
  onAccountUpdated?: () => void;
}

export default function ProfileView({
  events, dbEvents = [], dbFavorites = [], avgRating,
  onAddEvent, favoritePros, onToggleFavorite, onSelectPro,
  profile, onSignOut, onCreateEvent, onAccountUpdated
}: ProfileViewProps) {
  const [newEventModal, setNewEventModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  const [proCount, setProCount] = useState(3);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error: uploadError } = useAvatarUpload(profile?.id);
  
  // Settings detail simulate views
  const [settingModal, setSettingModal] = useState<'payment' | 'account' | 'help' | null>(null);

  // Dados da conta (editáveis)
  const [accName, setAccName]   = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPass, setAccPass]   = useState('');
  const [accWhats, setAccWhats] = useState(false);
  const [accBusy, setAccBusy]   = useState<string | null>(null);
  const [accMsg, setAccMsg]     = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const openAccount = () => {
    setAccName(profile?.full_name ?? '');
    setAccPhone(profile?.phone ?? '');
    setAccEmail(profile?.email ?? '');
    setAccPass('');
    setAccWhats(profile?.whatsapp_opt_in ?? false);
    setAccMsg(null);
    setSettingModal('account');
  };

  const toggleWhatsApp = async () => {
    if (!profile?.id) return;
    const next = !accWhats;
    setAccWhats(next);
    setAccBusy('whatsapp'); setAccMsg(null);
    const { error } = await supabase.from('users')
      .update({ whatsapp_opt_in: next })
      .eq('id', profile.id);
    setAccBusy(null);
    if (error) { setAccWhats(!next); setAccMsg({ kind: 'err', text: error.message }); return; }
    onAccountUpdated?.();
  };

  const saveProfileData = async () => {
    if (!profile?.id) return;
    setAccBusy('profile'); setAccMsg(null);
    const { error } = await supabase.from('users')
      .update({ full_name: accName.trim(), phone: accPhone.trim() || null })
      .eq('id', profile.id);
    setAccBusy(null);
    if (error) { setAccMsg({ kind: 'err', text: error.message }); return; }
    setAccMsg({ kind: 'ok', text: 'Nome e telefone atualizados.' });
    onAccountUpdated?.();
  };

  const saveEmail = async () => {
    setAccBusy('email'); setAccMsg(null);
    const { error } = await supabase.auth.updateUser({ email: accEmail.trim() });
    setAccBusy(null);
    if (error) { setAccMsg({ kind: 'err', text: error.message }); return; }
    setAccMsg({ kind: 'ok', text: 'Enviamos um link de confirmação para o novo e-mail. A troca só vale após confirmar.' });
  };

  const savePassword = async () => {
    if (accPass.length < 6) { setAccMsg({ kind: 'err', text: 'A senha deve ter ao menos 6 caracteres.' }); return; }
    setAccBusy('password'); setAccMsg(null);
    const { error } = await supabase.auth.updateUser({ password: accPass });
    setAccBusy(null);
    if (error) { setAccMsg({ kind: 'err', text: error.message }); return; }
    setAccPass('');
    setAccMsg({ kind: 'ok', text: 'Senha atualizada com sucesso.' });
  };

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
            {/* Avatar */}
            {(localAvatar || profile?.avatar_url) ? (
              <img
                alt={profile?.full_name ?? 'Avatar'}
                className="w-24 h-24 rounded-2xl object-cover border border-outline-variant/20 shadow-inner"
                src={localAvatar ?? profile?.avatar_url ?? ''}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-outline-variant/20 flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-primary">
                  {(profile?.full_name ?? 'U')[0].toUpperCase()}
                </span>
              </div>
            )}

            {/* Botão de câmera */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all border-2 border-white"
              title="Alterar foto"
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Camera className="w-3.5 h-3.5" />
              }
            </button>

            {/* Input oculto — aceita câmera no mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                // preview imediato
                setLocalAvatar(URL.createObjectURL(file));
                const url = await upload(file);
                if (url) setLocalAvatar(url);
                e.target.value = '';
              }}
            />
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="font-display font-extrabold text-2xl text-primary leading-tight">{profile?.full_name ?? '—'}</h1>
            <p className="text-xs font-semibold text-on-surface-variant">{profile?.email}</p>
            {uploadError && (
              <p className="text-xs text-error bg-error-container px-2 py-1 rounded-lg">{uploadError}</p>
            )}
            
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col">
                <span className="font-mono font-bold text-[9px] text-outline uppercase tracking-wide">Rating como Cliente</span>
                {avgRating ? (
                  <div className="flex items-center gap-1">
                    <span className="font-display font-bold text-base text-tertiary">{avgRating}</span>
                    <div className="flex text-amber-500 gap-[2px]">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-on-surface-variant mt-0.5">Sem avaliações ainda</span>
                )}
              </div>
              {profile?.phone && (
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-[9px] text-outline uppercase tracking-wide">Telefone</span>
                  <span className="text-sm font-semibold text-on-surface">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto bg-primary-container/10 p-4 rounded-2xl border border-primary-container/20 text-center shrink-0">
            <span className="font-display text-4xl font-extrabold text-primary block leading-none">{dbEvents.length}</span>
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
            onClick={() => onCreateEvent?.()}
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
            {dbEvents.length === 0 ? (
              <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 text-center">
                <Calendar className="w-8 h-8 text-on-surface-variant mx-auto mb-2" />
                <p className="text-sm font-semibold text-on-surface">Nenhum evento ainda</p>
                <p className="text-xs text-on-surface-variant mt-1">Crie seu primeiro evento!</p>
                <button
                  onClick={() => onCreateEvent?.()}
                  className="mt-3 text-xs text-primary font-semibold hover:underline"
                >
                  + Criar evento
                </button>
              </div>
            ) : (
              dbEvents.map((ev) => {
                const st = STATUS_LABELS[ev.status] ?? { label: ev.status, color: 'bg-slate-100 text-slate-600' };
                return (
                  <div
                    key={ev.id}
                    className="bg-white p-3.5 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 hover:border-primary/40 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="text-left">
                        <h4 className="font-display font-bold text-base text-primary">{ev.name}</h4>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {ev.location_name}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(ev.starts_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
                          {' · '}
                          {new Date(ev.starts_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                          {' – '}
                          {new Date(ev.ends_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Favorites list Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-primary">Meus Favoritos</h2>

          <div className="bg-surface-container-low p-3.5 rounded-2xl space-y-2.5 border border-outline-variant/20">
            {dbFavorites.length === 0 ? (
              <div className="text-center py-4">
                <Heart className="w-7 h-7 text-on-surface-variant mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant">Nenhum favorito ainda.</p>
                <p className="text-xs text-on-surface-variant mt-1">Após eventos, favorite os profissionais que se destacaram.</p>
              </div>
            ) : (
              dbFavorites.slice(0, 4).map((pro) => (
                <div
                  key={pro.professional_id}
                  className="bg-white p-3 rounded-xl flex items-center gap-3 shadow-sm border border-outline-variant/10 hover:border-primary/20 transition-all"
                >
                  {pro.avatar_url ? (
                    <img src={pro.avatar_url} alt={pro.full_name}
                      className="w-11 h-11 rounded-lg object-cover shadow-sm shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">{pro.full_name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[12px] font-bold text-primary truncate">{pro.full_name}</h5>
                    <p className="text-[10px] text-on-surface-variant">{CATEGORY_LABELS[pro.category] ?? pro.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span className="font-mono text-[10px] font-bold">{pro.stars}</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{pro.events_count} eventos</p>
                  </div>
                </div>
              ))
            )}
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

          {/* Card Setting: Dados da conta */}
          <div
            onClick={openAccount}
            className="bg-white p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer shadow-sm text-left"
          >
            <div className="w-11 h-11 bg-primary-container/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase mt-0.5">Dados da conta</h4>
              <p className="text-[11px] text-on-surface-variant">Nome, telefone, e-mail e senha</p>
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

      {/* Modal de criação de evento removido — usar CreateEventScreen via onCreateEvent */}

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

              {settingModal === 'account' && (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="w-5 h-5 text-secondary" />
                    <h3 className="font-display font-extrabold text-base uppercase">Dados da conta</h3>
                  </div>

                  {accMsg && (
                    <p className={`text-xs px-3 py-2 rounded-lg ${accMsg.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-error-container text-error'}`}>
                      {accMsg.text}
                    </p>
                  )}

                  {/* Nome + telefone */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Nome</label>
                    <input value={accName} onChange={e => setAccName(e.target.value)}
                      className="w-full text-sm border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Telefone</label>
                    <input value={accPhone} onChange={e => setAccPhone(e.target.value)} placeholder="(11) 99999-9999"
                      className="w-full text-sm border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={saveProfileData} disabled={accBusy === 'profile'}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                      {accBusy === 'profile' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Salvar nome e telefone
                    </button>
                  </div>

                  {/* E-mail */}
                  <div className="space-y-2 pt-1 border-t border-outline-variant/30">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mt-2">E-mail</label>
                    <input type="email" value={accEmail} onChange={e => setAccEmail(e.target.value)}
                      className="w-full text-sm border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={saveEmail} disabled={accBusy === 'email'}
                      className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                      {accBusy === 'email' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Alterar e-mail
                    </button>
                  </div>

                  {/* Senha */}
                  <div className="space-y-2 pt-1 border-t border-outline-variant/30">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mt-2">Nova senha</label>
                    <input type="password" value={accPass} onChange={e => setAccPass(e.target.value)} placeholder="••••••••"
                      className="w-full text-sm border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={savePassword} disabled={accBusy === 'password'}
                      className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                      {accBusy === 'password' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Definir nova senha
                    </button>
                  </div>

                  {/* Avisos por WhatsApp (Etapa 5A) */}
                  <div className="pt-1 border-t border-outline-variant/30">
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Avisos por WhatsApp</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">Apenas emergências da sua equipe (no-show, substituto, cancelamento).</p>
                      </div>
                      <button
                        onClick={toggleWhatsApp}
                        disabled={accBusy === 'whatsapp'}
                        role="switch"
                        aria-checked={accWhats}
                        className={`shrink-0 w-11 h-6 rounded-full relative transition-colors disabled:opacity-60 ${accWhats ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${accWhats ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
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
