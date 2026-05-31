import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pin, 
  MapPin, 
  PlusCircle, 
  Star, 
  Navigation, 
  CheckCircle, 
  Sliders, 
  Maximize2,
  X,
  Volume2,
  Shield,
  Utensils,
  Sparkles,
  Users
} from 'lucide-react';
import { BookingTeam, ClientEvent } from '../types';
import { MAP_MINI_PREVIEW } from '../data';

interface BookingsViewProps {
  bookings: BookingTeam[];
  activeEvent: ClientEvent;
  onAddBooking: (newBooking: BookingTeam) => void;
  onSelectPro: (proId: string) => void;
  onNavigate: (tab: 'home' | 'bookings' | 'favorites' | 'profile') => void;
}

export default function BookingsView({ bookings, activeEvent, onAddBooking, onSelectPro, onNavigate }: BookingsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamStatus, setNewTeamStatus] = useState<BookingTeam['status']>('EM SERVIÇO');
  const [newTeamConfirmed, setNewTeamConfirmed] = useState(4);
  const [newTeamReserve, setNewTeamReserve] = useState(1);
  const [selectedMapPreview, setSelectedMapPreview] = useState<string | null>(null);

  const handleAddNewTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newTeam: BookingTeam = {
      id: `team-${Date.now()}`,
      name: newTeamName,
      status: newTeamStatus,
      countConfirmed: newTeamConfirmed,
      countReserve: newTeamReserve,
      rating: 4.9,
      members: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBBatOOGcNmH7uOEaKdULjeu1_1XcIXwkwKNRJFS_5cSHvaPIz02NsuKJHMTVnmiJPSOkWPKvWfeIFBASMM06HbUYroMrimTDDW78L04vy6QSEWuY0ODo0azuka159ioZNsfUHCnRYFJcNS5mPmZ7GM1e3Lhi_xbaSmtuKh4VKbul0HWheixVsqmaUmqYwGpMG8WYd2t8RPFywQCIXhMv7XMwv7_edaHXJNzK5fLArF-Py0Xb_SzC5HnwD72ZvaAopGKnNP4m90ZQ']
    };

    onAddBooking(newTeam);
    setNewTeamName('');
    setModalOpen(false);
  };

  const getStatusBadge = (status: BookingTeam['status']) => {
    switch (status) {
      case 'EM SERVIÇO':
        return (
          <div className="bg-emerald-50 border-l-2 border-emerald-600 px-2.5 py-1 text-right">
            <span className="font-mono text-[10px] font-bold text-emerald-700">EM SERVIÇO</span>
          </div>
        );
      case 'EM TRÂNSITO':
        return (
          <div className="bg-blue-50 border-l-2 border-primary-container px-2.5 py-1 text-right">
            <span className="font-mono text-[10px] font-bold text-primary-container">EM TRÂNSITO</span>
          </div>
        );
      case 'STANDBY':
        return (
          <div className="bg-slate-100 border-l-2 border-outline px-2.5 py-1 text-right">
            <span className="font-mono text-[10px] font-bold text-outline">STANDBY</span>
          </div>
        );
      case 'SETUP':
        return (
          <div className="bg-amber-50 border-l-2 border-amber-600 px-2.5 py-1 text-right">
            <span className="font-mono text-[10px] font-bold text-amber-700">CONFIGURAÇÃO</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="px-margin-mobile mt-6 max-w-5xl mx-auto space-y-6 pb-12 text-left">
      {/* Event Summary Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-secondary mb-1 block">Evento Ativo</span>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-primary leading-tight">{activeEvent.name}</h1>
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
              <MapPin className="text-secondary w-4 h-4" />
              {activeEvent.location}
            </div>
          </div>
          <div className="bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-xl flex items-center gap-4 shadow-sm self-start md:self-auto">
            <div className="text-center">
              <p className="font-mono text-[9px] font-bold tracking-widest text-[#04006d]/70 uppercase">TOTAL</p>
              <p className="font-display text-2xl font-bold text-[#04006d]">{activeEvent.proCount}</p>
            </div>
            <div className="w-px h-8 bg-[#04006d]/20" />
            <p className="text-xs font-semibold leading-tight">Profissionais<br />Confirmados</p>
          </div>
        </div>
      </section>

      {/* Team Management Head Section */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl md:text-2xl text-on-surface">Gestão de Equipes</h2>
          <p className="text-xs text-on-surface-variant">Monitore em tempo real as equipes contratadas no local ou em deslocamento.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold py-2.5 px-4 rounded-full transition-all flex items-center gap-1.5 shadow-md active:scale-95 duration-100 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Adicionar novo grupo</span>
        </button>
      </section>

      {/* Groups Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map((team, idx) => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={team.id}
            className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            {/* Card Header Info */}
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-start gap-2">
              <div className="text-left">
                <h3 className="font-display font-bold text-lg text-primary">{team.name}</h3>
                <p className="text-xs text-on-surface-variant">
                  {team.countConfirmed} confirmados {team.countReserve > 0 ? `• ${team.countReserve} em reserva` : ''}
                </p>
              </div>
              {getStatusBadge(team.status)}
            </div>

            {/* Card Interactive details based on status */}
            <div className="p-4 space-y-4 flex-grow flex flex-col justify-between">
              
              {/* Specialized rendering: If DJ/Waiter has map or profile details */}
              {team.name.includes("Garçom") && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-3 select-none">
                      <img 
                        onClick={() => onSelectPro('ricardo-1')}
                        alt="Staff Ricardo Avatar" 
                        title="Ver Perfil de Ricardo"
                        className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm cursor-pointer hover:scale-105 transition-transform" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBatOOGcNmH7uOEaKdULjeu1_1XcIXwkwKNRJFS_5cSHvaPIz02NsuKJHMTVnmiJPSOkWPKvWfeIFBASMM06HbUYroMrimTDDW78L04vy6QSEWuY0ODo0azuka159ioZNsfUHCnRYFJcNS5mPmZ7GM1e3Lhi_xbaSmtuKh4VKbul0HWheixVsqmaUmqYwGpMG8WYd2t8RPFywQCIXhMv7XMwv7_edaHXJNzK5fLArF-Py0Xb_SzC5HnwD72ZvaAopGKnNP4m90ZQ"
                      />
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold shadow-sm">
                        +4
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-amber-500">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="font-mono text-xs font-bold">{team.rating}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant font-medium">Média da equipe</p>
                    </div>
                  </div>

                  {/* MINI MAP PREVIEW */}
                  <div 
                    onClick={() => setSelectedMapPreview("garcons")}
                    className="relative h-28 rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/30 shadow-inner"
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" 
                      style={{ backgroundImage: `url(${MAP_MINI_PREVIEW})` }} 
                    />
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-200" />
                    <div className="absolute top-2 left-2 glass-panel px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      AO VIVO
                    </div>
                    <div className="absolute bottom-2 right-2 glass-panel px-2 py-0.5 rounded text-[10px] font-bold text-on-surface">
                      ETA: No Local
                    </div>
                  </div>
                </>
              )}

              {team.name.includes("Segurança") && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-on-surface-variant">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Unidade Alpha</p>
                        <p className="text-[11px] text-on-surface-variant">Rádio criptografado</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-semibold text-lg text-primary">{team.distance || '1.2 km'}</p>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase">Distância atual</p>
                    </div>
                  </div>

                  {/* MINI MAP PREVIEW */}
                  <div 
                    onClick={() => setSelectedMapPreview("seguranca")}
                    className="relative h-28 rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/30 shadow-inner"
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" 
                      style={{ backgroundImage: `url(${MAP_MINI_PREVIEW})` }} 
                    />
                    <div className="absolute inset-0 bg-secondary/10 group-hover:bg-transparent transition-colors duration-200" />
                    <div className="absolute bottom-2 right-2 glass-panel px-2.5 py-1 rounded text-[10px] font-mono font-bold text-primary">
                      ETA: {team.eta || '8 min'}
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <MapPin className="text-primary-container w-8 h-8 drop-shadow-md animate-bounce" />
                    </div>
                  </div>
                </>
              )}

              {team.name.includes("Limpeza") && (
                <div className="space-y-3 text-left">
                  <p className="text-xs text-on-surface-variant">Lista de apoio mobilizada de reserva para o Palácio das Artes.</p>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <div 
                      onClick={() => onSelectPro('ricardo-1')}
                      className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high cursor-pointer p-1 pr-3 rounded-full text-[11px] font-semibold transition-all shadow-sm border border-outline-variant/20"
                    >
                      <img className="w-5 h-5 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBatOOGcNmH7uOEaKdULjeu1_1XcIXwkwKNRJFS_5cSHvaPIz02NsuKJHMTVnmiJPSOkWPKvWfeIFBASMM06HbUYroMrimTDDW78L04vy6QSEWuY0ODo0azuka159ioZNsfUHCnRYFJcNS5mPmZ7GM1e3Lhi_xbaSmtuKh4VKbul0HWheixVsqmaUmqYwGpMG8WYd2t8RPFywQCIXhMv7XMwv7_edaHXJNzK5fLArF-Py0Xb_SzC5HnwD72ZvaAopGKnNP4m90ZQ" alt="Ricardo Avatar" />
                      <span>Ricardo M.</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-container p-1 px-3 rounded-full text-[11px] font-semibold text-on-surface-variant border border-outline-variant/20 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Ana Lúcia</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-container p-1 px-3 rounded-full text-[11px] font-semibold text-on-surface-variant border border-outline-variant/20 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Carlos H.</span>
                    </div>
                    <button 
                      onClick={() => onNavigate('favorites')}
                      className="bg-primary-fixed-dim text-on-primary-fixed-variant text-[11px] font-bold px-3 py-1.5 rounded-full hover:brightness-95 transition-all shadow-sm"
                    >
                      Ver todos
                    </button>
                  </div>
                </div>
              )}

              {team.name.includes("Som") && (
                <div className="space-y-4 text-left">
                  <div className="bg-surface-container-high rounded-xl p-3.5 space-y-2 border border-outline-variant/35 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-on-surface-variant">Setup de Cabeamento e Caixas</span>
                      <span className="font-mono text-secondary font-bold">{team.setupPercentage || 85}% Concluído</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all duration-1000" 
                        style={{ width: `${team.setupPercentage || 85}%` }} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Created custom categories generic view fallback */}
              {!['Garçom', 'Segurança', 'Limpeza', 'Som'].some(n => team.name.includes(n)) && (
                <div className="space-y-2 text-left">
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <p className="text-xs text-on-surface-variant">Equipe eventual despachada e em trânsito com prioridade máxima.</p>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2">
                      <span>Confirmação rápida</span>
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle className="w-3.5 h-3.5" /> 100% OK
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        ))}
      </section>

      {/* New Group Modal form */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-2xl border border-outline-variant max-w-md w-full relative"
            >
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-display font-extrabold text-xl text-primary text-left mb-1.5">Criar Nova Equipe</h3>
              <p className="text-xs text-on-surface-variant text-left mb-4">Adicione um novo segmento de staff para as operações no Palácio das Artes.</p>

              <form onSubmit={handleAddNewTeam} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">NOME DA EQUIPE</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Auxiliares de Credenciamento, Recepcionistas..." 
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">QTD CONFIRMADOS</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={newTeamConfirmed}
                      onChange={(e) => setNewTeamConfirmed(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">QTD RESERVA</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={newTeamReserve}
                      onChange={(e) => setNewTeamReserve(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">STATUS INICIAL</label>
                  <select 
                    value={newTeamStatus}
                    onChange={(e) => setNewTeamStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                  >
                    <option value="EM SERVIÇO">EM SERVIÇO</option>
                    <option value="EM TRÂNSITO">EM TRÂNSITO</option>
                    <option value="STANDBY">STANDBY</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 border border-outline-variant text-[#1a1b1e] font-semibold text-xs rounded-xl hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95"
                  >
                    Adicionar Equipe
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Map Expander Overlay */}
      <AnimatePresence>
        {selectedMapPreview && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full p-4 relative"
            >
              <button 
                onClick={() => setSelectedMapPreview(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white text-slate-600 shadow-md z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="font-display font-extrabold text-lg text-primary text-left mb-2">Visualização Tática SP</h3>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant">
                <img src={MAP_MINI_PREVIEW} alt="Full map preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                <div className="absolute top-4 left-4 bg-white/95 px-3 py-1.5 rounded-lg border text-xs font-bold shadow-md">
                  🛰️ Satélite Ao Vivo: Área Metropolitana
                </div>
                {selectedMapPreview === 'seguranca' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <MapPin className="text-rose-500 w-10 h-10 drop-shadow-lg animate-bounce" />
                    <div className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded shadow-md mt-1">
                      Em deslocamento (ETA 8 min)
                    </div>
                  </div>
                )}
                {selectedMapPreview === 'garcons' && (
                  <div className="absolute top-1/3 left-1/3 flex flex-col items-center">
                    <MapPin className="text-emerald-500 w-10 h-10 drop-shadow-lg animate-bounce" />
                    <div className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded shadow-md mt-1">
                      No Local (Gala de Inverno)
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
