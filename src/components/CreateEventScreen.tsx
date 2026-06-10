import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Plus, Minus,
  Loader2, CheckCircle, Search, X, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGeocoding } from '../hooks/useGeocoding';
import { useFunctions } from '../hooks/useFunctions';
import type { UserProfile } from '../hooks/useProfile';
import type { GeoResult } from '../hooks/useGeocoding';

interface FunctionRequest {
  function_id: string;
  category: string;   // legado: slug em uppercase para bookings.category
  label: string;
  quantity: number;
}

interface CreateEventScreenProps {
  profile: UserProfile;
  onBack: () => void;
  onCreated: () => void;
}

export default function CreateEventScreen({ profile, onBack, onCreated }: CreateEventScreenProps) {
  const { functions, loading: functionsLoading } = useFunctions();
  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [cardConfirmed, setCardConfirmed] = useState(false);  // autorização de cobrança no cartão (placeholder)

  // Step 1 — dados do evento
  const [name, setName]           = useState('');
  const [locationName, setLocationName] = useState('');
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [date, setDate]           = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime]     = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

  const { geocode, loading: geoLoading, error: geoError } = useGeocoding();

  // Step 2 — funções solicitadas
  const [categories, setCategories] = useState<FunctionRequest[]>([]);

  // Step 3 — briefing
  const [uniformType, setUniformType]         = useState<'provided' | 'own' | 'none'>('none');
  const [uniformDetails, setUniformDetails]   = useState('');
  const [mealType, setMealType]               = useState<'provided' | 'own' | 'none'>('none');
  const [mealDetails, setMealDetails]         = useState('');
  const [hasMeetingPoint, setHasMeetingPoint] = useState(false);
  const [meetingPoint, setMeetingPoint]       = useState('');
  const [hasTransport, setHasTransport]       = useState(false);
  const [transportDetails, setTransportDetails] = useState('');
  const [extraNotes, setExtraNotes]           = useState('');

  // Step 3 — responsáveis no local (doc 1.4.1)
  const [resp1Name, setResp1Name]         = useState('');
  const [resp1Role, setResp1Role]         = useState('');
  const [resp1Whats, setResp1Whats]       = useState('');
  const [resp2Name, setResp2Name]         = useState('');
  const [resp2Role, setResp2Role]         = useState('');
  const [resp2Whats, setResp2Whats]       = useState('');

  const toggleCategory = (functionId: string, slug: string, label: string) => {
    setCategories(prev => {
      const exists = prev.find(c => c.function_id === functionId);
      if (exists) return prev.filter(c => c.function_id !== functionId);
      return [...prev, { function_id: functionId, category: slug.toUpperCase(), label, quantity: 1 }];
    });
  };

  const updateQuantity = (functionId: string, delta: number) => {
    setCategories(prev => prev.map(c =>
      c.function_id === functionId
        ? { ...c, quantity: Math.max(1, c.quantity + delta) }
        : c
    ));
  };

  const totalProfessionals = categories.reduce((s, c) => s + c.quantity, 0);

  // ── Pagamento (doc 2.3.2) ───────────────────────────────────────
  const estimatedTotal = categories.reduce((sum, c) => {
    const fn = functions.find(f => f.id === c.function_id);
    return sum + (fn?.price_mei ?? 0) * c.quantity;
  }, 0);
  const creditLimit     = profile.credit_limit ?? 0;
  const coveredByCredit = estimatedTotal > 0 && creditLimit >= estimatedTotal;
  const paymentMethod: 'CREDIT' | 'CARD' = coveredByCredit ? 'CREDIT' : 'CARD';
  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
      // Se termina antes do início (ex: 22h→04h), o fim é no dia seguinte
      const endDate = crossesMidnight
        ? new Date(new Date(`${date}T${endTime}:00`).getTime() + 24 * 60 * 60 * 1000)
        : new Date(`${date}T${endTime}:00`);
      const endsAt = endDate.toISOString();
      // Chegada da equipe (opcional) — no mesmo dia do evento, antes do início
      const teamArrivalAt = arrivalTime
        ? new Date(`${date}T${arrivalTime}:00`).toISOString()
        : null;

      // Criar evento
      // Geocodificar endereço se ainda não foi feito
      let geo = geoResult;
      if (!geo) {
        geo = await geocode(locationName);
        if (!geo) throw new Error('Não foi possível localizar o endereço. Verifique e tente novamente.');
        setGeoResult(geo);
      }

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          client_id:     clientData.id,
          name,
          location_name: geo.formatted,
          location:      `POINT(${geo.lng} ${geo.lat})`,
          starts_at:     startsAt,
          ends_at:       endsAt,
          team_arrival_at: teamArrivalAt,
          estimated_total: estimatedTotal,
          payment_method:  paymentMethod,
          charge_status:   'PENDING',
          responsible_1_name:     resp1Name.trim() || null,
          responsible_1_role:     resp1Role.trim() || null,
          responsible_1_whatsapp: resp1Whats.trim() || null,
          responsible_2_name:     resp2Name.trim() || null,
          responsible_2_role:     resp2Role.trim() || null,
          responsible_2_whatsapp: resp2Whats.trim() || null,
          status:        'SCHEDULED',
          briefing: {
            uniform:      { type: uniformType, details: uniformDetails || null },
            meal:         { type: mealType,    details: mealDetails    || null },
            meetingPoint: hasMeetingPoint ? { address: meetingPoint }  : null,
            transport:    hasTransport    ? { details: transportDetails } : null,
            notes:        extraNotes      || null,
          },
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Criar uma VAGA individual por posição (doc 1.4.2 — 1 subprocesso por vaga)
      const vagaRows = categories.flatMap(cat => {
        const fn = functions.find(f => f.id === cat.function_id);
        return Array.from({ length: cat.quantity }, () => ({
          event_id:        eventData.id,
          function_id:     cat.function_id,
          category:        cat.category,        // legado (slug em uppercase)
          status:          'OPEN' as const,
          offer_phase:     'DIRECTED' as const, // começa na oferta direcionada (doc 2.3.3)
          price:           fn?.price_mei ?? null,
          base_pay:        fn?.base_pay_mei ?? null,
          multiplier_type: 'NORMAL' as const,
        }));
      });

      if (vagaRows.length > 0) {
        const { error: vagasError } = await supabase.from('vagas').insert(vagaRows);
        if (vagasError) throw vagasError;

        // Dispara a fase de oferta direcionada (matchmaking)
        const { error: mmError } = await supabase.rpc('start_event_matchmaking', {
          p_event_id: eventData.id,
        });
        if (mmError) console.warn('Falha ao iniciar matchmaking:', mmError.message);
      }

      setSuccess(true);
      setTimeout(() => onCreated(), 2000);

    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  // Calcula se o evento termina no dia seguinte (ex: 22h → 04h)
  const crossesMidnight = startTime && endTime && endTime < startTime;

  // Duração em horas (considera virada de meia-noite)
  const eventDurationHours = (() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60; // virada de meia-noite
    return (endMins - startMins) / 60;
  })();

  // Validações por step
  const step1Valid = name.trim() && locationName.trim() && geoResult && date && startTime && endTime
    && eventDurationHours >= 0.5; // mínimo 30 minutos
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
          <p className="text-xs text-on-surface-variant">Passo {step} de 4</p>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(s => (
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

              <Field label="Local do evento">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    value={locationName}
                    onChange={e => { setLocationName(e.target.value); setGeoResult(null); }}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const r = await geocode(locationName);
                        if (r) setGeoResult(r);
                      }
                    }}
                    placeholder="Ex: Rua das Flores, 100 - São Paulo"
                    className={`${inputClass} pl-9 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await geocode(locationName);
                      if (r) setGeoResult(r);
                    }}
                    disabled={!locationName.trim() || geoLoading}
                    className="absolute right-2 top-2 p-1.5 bg-primary text-on-primary rounded-lg disabled:opacity-40 transition-all"
                    title="Buscar endereço"
                  >
                    {geoLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Search className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>

                {/* Resultado do geocoding */}
                {geoResult && (
                  <div className="mt-2 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-800">Endereço confirmado</p>
                      <p className="text-xs text-emerald-700 truncate">{geoResult.formatted}</p>
                      <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
                        {geoResult.lat.toFixed(5)}, {geoResult.lng.toFixed(5)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setGeoResult(null); }}
                      className="text-emerald-500 hover:text-emerald-700 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Erro de geocoding */}
                {geoError && !geoResult && (
                  <p className="mt-1.5 text-xs text-error bg-error-container px-3 py-1.5 rounded-lg">
                    {geoError}
                  </p>
                )}

                <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1">
                  Clique em <Search className="w-3 h-3 inline" /> ou pressione Enter para confirmar o endereço.
                </p>
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

              <Field label="Chegada da equipe (opcional)">
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)}
                    className={`${inputClass} pl-9`} />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Horário em que os profissionais devem chegar ao local (antes do início).
                </p>
              </Field>

              {crossesMidnight && (
                <p className="text-xs text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  🌙 O evento termina no dia seguinte.
                </p>
              )}
              {startTime && endTime && eventDurationHours < 0.5 && !crossesMidnight && (
                <p className="text-error text-xs">Duração mínima de 30 minutos.</p>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: Funções ── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Profissionais</h2>
                <p className="text-sm text-on-surface-variant mt-1">Selecione as funções e quantidades.</p>
              </div>

              {functionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {functions.map(f => {
                    const selected = categories.find(c => c.function_id === f.id);
                    return (
                      <div key={f.id}
                        className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white hover:border-primary/40'
                        }`}
                        onClick={() => toggleCategory(f.id, f.slug, f.name)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg">
                            {f.slug === 'garcom' ? '🍽️' : f.slug === 'dj' ? '🎧' : f.slug === 'seguranca' ? '🛡️' :
                             f.slug === 'faxineiro' ? '✨' : f.slug === 'fotografo' ? '📸' :
                             f.slug === 'mestre_cerimonias' ? '🎤' : f.slug === 'produtor' ? '⚙️' : '🔑'}
                          </span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selected ? 'border-primary bg-primary' : 'border-outline-variant'
                          }`}>
                            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className={`text-xs font-bold ${selected ? 'text-primary' : 'text-on-surface'}`}>{f.name}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          R$ {f.price_mei.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>

                        {selected && (
                          <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => updateQuantity(f.id, -1)}
                              className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono font-bold text-sm text-primary w-4 text-center">{selected.quantity}</span>
                            <button onClick={() => updateQuantity(f.id, +1)}
                              className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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

          {/* ── STEP 3: Briefing ── */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">

              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Briefing do evento</h2>
                <p className="text-sm text-on-surface-variant mt-1">Informações importantes para os profissionais.</p>
              </div>

              {/* Uniforme */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  👔 Vestimenta / Uniforme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'provided', label: 'Fornecido', desc: 'A organização fornece' },
                    { val: 'own',      label: 'Próprio',   desc: 'Profissional usa o seu' },
                    { val: 'none',     label: 'Livre',     desc: 'Sem exigência específica' },
                  ].map(opt => (
                    <button key={opt.val} type="button"
                      onClick={() => setUniformType(opt.val as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        uniformType === opt.val ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/40'
                      }`}>
                      <p className={`text-xs font-bold ${uniformType === opt.val ? 'text-primary' : 'text-on-surface'}`}>{opt.label}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {uniformType !== 'none' && (
                  <textarea value={uniformDetails} onChange={e => setUniformDetails(e.target.value)}
                    placeholder={uniformType === 'provided' ? 'Ex: Camisa branca + calça preta serão entregues na entrada' : 'Ex: Traje social escuro, sapato fechado'}
                    rows={2} className={`${IC} resize-none`} />
                )}
              </div>

              {/* Alimentação */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  🍽️ Alimentação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'provided', label: 'Fornecida', desc: 'Refeição inclusa no evento' },
                    { val: 'own',      label: 'Por conta',  desc: 'Profissional cuida do próprio' },
                    { val: 'none',     label: 'Não definido', desc: 'A combinar' },
                  ].map(opt => (
                    <button key={opt.val} type="button"
                      onClick={() => setMealType(opt.val as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        mealType === opt.val ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/40'
                      }`}>
                      <p className={`text-xs font-bold ${mealType === opt.val ? 'text-primary' : 'text-on-surface'}`}>{opt.label}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {mealType !== 'none' && (
                  <textarea value={mealDetails} onChange={e => setMealDetails(e.target.value)}
                    placeholder={mealType === 'provided' ? 'Ex: Jantar servido às 21h na copa dos funcionários' : 'Ex: Há lanchonetes próximas ao local'}
                    rows={2} className={`${IC} resize-none`} />
                )}
              </div>

              {/* Ponto de encontro */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    📍 Ponto de encontro
                  </label>
                  <button type="button" onClick={() => setHasMeetingPoint(!hasMeetingPoint)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${hasMeetingPoint ? 'bg-primary' : 'bg-outline-variant'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${hasMeetingPoint ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {hasMeetingPoint && (
                  <textarea value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)}
                    placeholder="Ex: Entrada principal do Espaço Villa-Lobos, portão B, das 17h às 18h"
                    rows={2} className={`${IC} resize-none`} />
                )}
              </div>

              {/* Transporte */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    🚌 Transporte disponibilizado
                  </label>
                  <button type="button" onClick={() => setHasTransport(!hasTransport)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${hasTransport ? 'bg-primary' : 'bg-outline-variant'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${hasTransport ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {hasTransport && (
                  <textarea value={transportDetails} onChange={e => setTransportDetails(e.target.value)}
                    placeholder="Ex: Van saindo da Estação Consolação às 18h30. Confirmar presença até 24h antes."
                    rows={2} className={`${IC} resize-none`} />
                )}
              </div>

              {/* Responsáveis no local */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  👤 Responsáveis no local (opcional)
                </label>
                <div className="space-y-2 rounded-xl border border-outline-variant/40 p-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Responsável 1</p>
                  <input type="text" value={resp1Name} onChange={e => setResp1Name(e.target.value)}
                    placeholder="Nome" className={IC} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={resp1Role} onChange={e => setResp1Role(e.target.value)}
                      placeholder="Função (ex: Coordenador)" className={IC} />
                    <input type="tel" value={resp1Whats} onChange={e => setResp1Whats(e.target.value)}
                      placeholder="WhatsApp" className={IC} />
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border border-outline-variant/40 p-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Responsável 2</p>
                  <input type="text" value={resp2Name} onChange={e => setResp2Name(e.target.value)}
                    placeholder="Nome" className={IC} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={resp2Role} onChange={e => setResp2Role(e.target.value)}
                      placeholder="Função" className={IC} />
                    <input type="tel" value={resp2Whats} onChange={e => setResp2Whats(e.target.value)}
                      placeholder="WhatsApp" className={IC} />
                  </div>
                </div>
              </div>

              {/* Observações gerais */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  📝 Observações gerais (opcional)
                </label>
                <textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)}
                  placeholder="Qualquer informação adicional que os profissionais precisem saber..."
                  rows={3} maxLength={500} className={`${IC} resize-none`} />
                <p className="text-[11px] text-on-surface-variant text-right">{extraNotes.length}/500</p>
              </div>

            </motion.div>
          )}

          {/* ── STEP 4: Resumo ── */}
          {step === 4 && (
            <motion.div key="step4"
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
                    <p className="text-sm font-semibold text-on-surface mt-0.5">{geoResult?.formatted ?? locationName}</p>
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
                    <p className="text-sm font-semibold text-on-surface mt-0.5">
                      {startTime} – {endTime}
                      {crossesMidnight && <span className="text-xs text-primary ml-1">(dia seguinte)</span>}
                    </p>
                  </div>
                  {arrivalTime && (
                    <div>
                      <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Chegada</p>
                      <p className="text-sm font-semibold text-on-surface mt-0.5">{arrivalTime}</p>
                    </div>
                  )}
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

                {/* Responsáveis no resumo */}
                {(resp1Name.trim() || resp2Name.trim()) && (
                  <div className="p-4 space-y-1.5">
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Responsáveis</p>
                    {resp1Name.trim() && (
                      <p className="text-xs text-on-surface">
                        👤 {resp1Name}{resp1Role && ` — ${resp1Role}`}{resp1Whats && ` · ${resp1Whats}`}
                      </p>
                    )}
                    {resp2Name.trim() && (
                      <p className="text-xs text-on-surface">
                        👤 {resp2Name}{resp2Role && ` — ${resp2Role}`}{resp2Whats && ` · ${resp2Whats}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Briefing no resumo */}
                {(uniformType !== 'none' || mealType !== 'none' || hasMeetingPoint || hasTransport || extraNotes) && (
                  <div className="p-4 space-y-2">
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Briefing</p>
                    {uniformType !== 'none' && (
                      <div className="flex gap-2 text-xs">
                        <span>👔</span>
                        <span className="text-on-surface">
                          {uniformType === 'provided' ? 'Uniforme fornecido' : 'Roupa própria'}
                          {uniformDetails && ` — ${uniformDetails}`}
                        </span>
                      </div>
                    )}
                    {mealType !== 'none' && (
                      <div className="flex gap-2 text-xs">
                        <span>🍽️</span>
                        <span className="text-on-surface">
                          {mealType === 'provided' ? 'Alimentação fornecida' : 'Alimentação por conta'}
                          {mealDetails && ` — ${mealDetails}`}
                        </span>
                      </div>
                    )}
                    {hasMeetingPoint && meetingPoint && (
                      <div className="flex gap-2 text-xs">
                        <span>📍</span>
                        <span className="text-on-surface">{meetingPoint}</span>
                      </div>
                    )}
                    {hasTransport && transportDetails && (
                      <div className="flex gap-2 text-xs">
                        <span>🚌</span>
                        <span className="text-on-surface">{transportDetails}</span>
                      </div>
                    )}
                    {extraNotes && (
                      <div className="flex gap-2 text-xs">
                        <span>📝</span>
                        <span className="text-on-surface">{extraNotes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pagamento (doc 2.3.2) */}
              <div className="bg-white border border-outline-variant/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wide">Valor total do pedido</p>
                  <span className="font-display text-lg font-bold text-primary">{fmtBRL(estimatedTotal)}</span>
                </div>

                {coveredByCredit ? (
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Coberto pelo seu limite de crédito</p>
                      <p className="text-[11px] text-emerald-700">
                        Limite disponível: {fmtBRL(creditLimit)}. A cobrança ocorre ao final do evento, após a confirmação do serviço.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800">
                        {creditLimit > 0
                          ? <>Seu limite de crédito ({fmtBRL(creditLimit)}) não cobre o total. </>
                          : <>Você ainda não possui limite de crédito pré-aprovado. </>}
                        O pagamento será via <strong>cartão de crédito</strong>, cobrado ao final do evento, após você confirmar o serviço.
                      </p>
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer px-1">
                      <input
                        type="checkbox" checked={cardConfirmed}
                        onChange={e => setCardConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-primary"
                      />
                      <span className="text-xs text-on-surface">
                        Autorizo a cobrança no cartão de crédito ao final do evento.
                        <span className="block text-[10px] text-on-surface-variant">
                          (A captura segura do cartão será feita na etapa de pagamento.)
                        </span>
                      </span>
                    </label>
                  </div>
                )}
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
          <button onClick={() => setStep(s => (s - 1) as 1|2|3|4)}
            className="flex-1 py-3.5 border border-outline-variant text-on-surface rounded-xl font-semibold text-sm">
            Voltar
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => setStep(s => (s + 1) as 1|2|3|4)}
            disabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : false}
            className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all">
            {step === 3 ? 'Revisar' : 'Continuar'}
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading || (!coveredByCredit && !cardConfirmed)}
            className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Evento'}
          </button>
        )}
      </div>
    </div>
  );
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";
const IC = inputClass;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
