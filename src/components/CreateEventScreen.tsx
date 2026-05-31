import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Plus, Minus,
  Utensils, Headphones, Shield, Sparkles, Camera, Mic,
  Settings, UserCheck, Loader2, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../hooks/useProfile';

interface CategoryRequest {
  category: string;
  label: string;
  quantity: number;
}

interface CreateEventScreenProps {
  profile: UserProfile;
  onBack: () => void;
  onCreated: () => void;
}

const CATEGORIES = [
  { code: 'GARCOM',             label: 'Garçom',               icon: Utensils },
  { code: 'DJ',                 label: 'DJ',                   icon: Headphones },
  { code: 'SEGURANCA',          label: 'Segurança',            icon: Shield },
  { code: 'FAXINEIRO',          label: 'Limpeza',              icon: Sparkles },
  { code: 'FOTOGRAFO',          label: 'Fotógrafo',            icon: Camera },
  { code: 'MESTRE_CERIMONIAS',  label: 'Mestre de Cerimônias', icon: Mic },
  { code: 'PRODUTOR',           label: 'Produtor',             icon: Settings },
  { code: 'CONTROLADOR_ACESSO', label: 'Controle de Acesso',   icon: UserCheck },
];

export default function CreateEventScreen({ profile, onBack, onCreated }: CreateEventScreenProps) {
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  // Step 1 — dados do evento
  const [name, setName]           = useState('');
  const [locationName, setLocationName] = useState('');
  const [date, setDate]           = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime]     = useState('');

  // Step 2 — categorias
  const [categories, setCategories] = useState<CategoryRequest[]>([]);

  const toggleCategory = (code: string, label: string) => {
    setCategories(prev => {
      const exists = prev.find(c => c.category === code);
      if (exists) return prev.filter(c => c.category !== code);
      return [...prev, { category: code, label, quantity: 1 }];
    });
  };

  const updateQuantity = (code: string, delta: number) => {
    setCategories(prev => prev.map(c =>
      c.category === code
        ? { ...c, quantity: Math.max(1, c.quantity + delta) }
        : c
    ));
  };

  const totalProfessionals = categories.reduce((s, c) => s + c.quantity, 0);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar client_id
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!clientData) throw new Error('Perfil de cliente não encontrado.');

      const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
      const endsAt   = new Date(`${date}T${endTime}:00`).toISOString();

      // Criar evento
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          client_id:     clientData.id,
          name,
          location_name: locationName,
          location:      `POINT(-46.6388 -23.5489)`, // padrão SP — geolocalização real na próxima versão
          starts_at:     startsAt,
          ends_at:       endsAt,
          status:        'SCHEDULED',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Criar bookings por categoria (sem disparar convites ainda)
      for (const cat of categories) {
        await supabase.from('bookings').insert({
          event_id:       eventData.id,
          category:       cat.category,
          quantity:       cat.quantity,
          multiplier_type: 'NORMAL',
          total_amount:   0, // calculado quando profissionais aceitarem
          commission_pct: 15,
          status:         'PENDING',
          search_radius_km: 5,
        });
      }

      setSuccess(true);
      setTimeout(() => onCreated(), 2000);

    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  // Validações por step
  const step1Valid = name.trim() && locationName.trim() && date && startTime && endTime && endTime > startTime;
  const step2Valid = categories.length > 0;

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary">Evento criado!</h2>
          <p className="text-on-surface-variant text-sm">Os profissionais serão notificados em breve.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-outline-variant/30 z-10 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-primary">Novo Evento</h1>
          <p className="text-xs text-on-surface-variant">Passo {step} de 3</p>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-outline-variant'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Dados do evento ── */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Sobre o evento</h2>
                <p className="text-sm text-on-surface-variant mt-1">Preencha as informações básicas.</p>
              </div>

              <Field label="Nome do evento">
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Casamento Silva & Costa" className={inputClass} />
              </Field>

              <Field label="Local">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input type="text" value={locationName} onChange={e => setLocationName(e.target.value)}
                    placeholder="Nome do espaço ou endereço" className={`${inputClass} pl-9`} />
                </div>
              </Field>

              <Field label="Data">
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`${inputClass} pl-9`} />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Início">
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                      className={`${inputClass} pl-9`} />
                  </div>
                </Field>
                <Field label="Término">
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                      className={`${inputClass} pl-9`} />
                  </div>
                </Field>
              </div>

              {startTime && endTime && endTime <= startTime && (
                <p className="text-error text-xs">O horário de término deve ser após o início.</p>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: Categorias ── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Profissionais</h2>
                <p className="text-sm text-on-surface-variant mt-1">Selecione as categorias e quantidades.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(({ code, label, icon: Icon }) => {
                  const selected = categories.find(c => c.category === code);
                  return (
                    <div key={code}
                      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                        selected ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white hover:border-primary/40'
                      }`}
                      onClick={() => toggleCategory(code, label)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-on-surface-variant'}`} />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selected ? 'border-primary bg-primary' : 'border-outline-variant'
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className={`text-xs font-bold ${selected ? 'text-primary' : 'text-on-surface'}`}>{label}</p>

                      {selected && (
                        <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => updateQuantity(code, -1)}
                            className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-sm text-primary w-4 text-center">{selected.quantity}</span>
                          <button onClick={() => updateQuantity(code, +1)}
                            className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {categories.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Total de profissionais</span>
                  </div>
                  <span className="font-mono font-bold text-primary">{totalProfessionals}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: Resumo ── */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Resumo</h2>
                <p className="text-sm text-on-surface-variant mt-1">Confirme os detalhes antes de criar.</p>
              </div>

              <div className="bg-white border border-outline-variant/30 rounded-2xl divide-y divide-outline-variant/20">
                <div className="p-4 space-y-1">
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Evento</p>
                  <p className="font-display text-lg font-bold text-primary">{name}</p>
                </div>
                <div className="p-4 flex gap-6">
                  <div>
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Local</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">{locationName}</p>
                  </div>
                </div>
                <div className="p-4 flex gap-6">
                  <div>
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Data</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">
                      {new Date(`${date}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Horário</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">{startTime} – {endTime}</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Equipe solicitada</p>
                  {categories.map(c => (
                    <div key={c.category} className="flex items-center justify-between">
                      <span className="text-sm text-on-surface">{c.label}</span>
                      <span className="font-mono text-sm font-bold text-primary">{c.quantity}x</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                    <span className="text-sm font-bold text-on-surface">Total</span>
                    <span className="font-mono text-sm font-bold text-primary">{totalProfessionals} profissionais</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-error text-xs bg-error-container px-3 py-2 rounded-lg">{error}</p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer buttons */}
      <div className="sticky bottom-0 bg-white border-t border-outline-variant/30 px-6 py-4 flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
            className="flex-1 py-3.5 border border-outline-variant text-on-surface rounded-xl font-semibold text-sm">
            Voltar
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
            disabled={step === 1 ? !step1Valid : !step2Valid}
            className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all">
            Continuar
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Evento'}
          </button>
        )}
      </div>
    </div>
  );
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
