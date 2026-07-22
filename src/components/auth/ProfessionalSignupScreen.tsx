import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, User, Eye, EyeOff, Loader2,
  Star, Phone, Mail, FileText,
  CreditCard, MessageCircle, Gift, Briefcase, Receipt
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFunctions } from '../../hooks/useFunctions';

interface ProfessionalSignupScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const PIX_TYPES = [
  { code: 'CPF',    label: 'CPF' },
  { code: 'CNPJ',   label: 'CNPJ (MEI)' },
  { code: 'EMAIL',  label: 'E-mail' },
  { code: 'PHONE',  label: 'Telefone' },
  { code: 'RANDOM', label: 'Chave aleatória' },
];

export default function ProfessionalSignupScreen({ onBack, onSuccess }: ProfessionalSignupScreenProps) {
  const { functions: allFunctions, loading: functionsLoading } = useFunctions();
  const [step, setStep]         = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Step 1 — acesso
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [whatsapp, setWhatsapp]   = useState(true);

  // Step 2 — perfil profissional
  const [professionalType, setProfessionalType] = useState<'MEI' | 'DIARISTA' | ''>('');
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<string[]>([]);
  const [mei, setMei]             = useState('');
  const [cpf, setCpf]             = useState('');
  const [bio, setBio]             = useState('');

  // Step 3 — pagamento
  const [pixType, setPixType]     = useState('CPF');
  const [pixKey, setPixKey]       = useState('');

  const toggleFunction = (id: string) => {
    setSelectedFunctionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // validações
  const step1Valid = name.trim() && email.trim() && phone.trim()
    && password.length >= 8 && password === confirm;
  const step2Valid = !!professionalType && selectedFunctionIds.length > 0 &&
    (professionalType === 'MEI' ? mei.trim() : cpf.trim());
  const step3Valid = pixKey.trim();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Categoria legada = slug da primeira função selecionada
      const firstFunction = allFunctions.find(f => f.id === selectedFunctionIds[0]);
      const legacyCategory = firstFunction?.slug.toUpperCase() ?? 'GARCOM';

      // 1. Criar conta no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name:       name,
            user_type:       'PROFESSIONAL',
            professional_type: professionalType,
            mei_number:      professionalType === 'MEI' ? mei : null,
            category:        legacyCategory,
            phone,
            whatsapp_opt_in: whatsapp,
          },
        },
      });

      if (authError) throw authError;

      // 2. Se sessão imediata (confirmação desligada), criar perfis
      if (data.session) {
        await supabase.from('users').update({
          phone,
          whatsapp_opt_in: whatsapp,
        }).eq('id', data.session.user.id);

        const { data: proData } = await supabase.from('professionals').insert({
          user_id:           data.session.user.id,
          professional_type: professionalType,
          mei_number:        professionalType === 'MEI' ? mei : null,
          category:          legacyCategory,
          status:            'PENDING',
          stars:             0,
          events_count:      0,
          hourly_cache:      0,
          bio:               bio || null,
        }).select('id').single();

        // Salvar funções selecionadas
        if (proData?.id && selectedFunctionIds.length > 0) {
          await supabase.from('professional_functions').insert(
            selectedFunctionIds.map(function_id => ({
              professional_id: proData.id,
              function_id,
            }))
          );
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-outline-variant/30 z-10 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-primary">Cadastro Profissional</h1>
          <p className="text-xs text-on-surface-variant">Passo {step} de 4</p>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 w-7 rounded-full transition-all duration-300 ${
              s < step ? 'bg-primary' : s === step ? 'bg-primary' : 'bg-outline-variant'
            }`} />
          ))}
        </div>
      </div>

      {/* Bônus banner */}
      <div className="bg-primary text-on-primary px-6 py-3 flex items-center gap-3">
        <Gift className="w-5 h-5 shrink-0" />
        <p className="text-xs font-semibold">
          Bônus de boas-vindas: <span className="font-bold">R$ 5,00 via Pix</span> após envio e aprovação da documentação!
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Dados de acesso ── */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Seus dados</h2>
                <p className="text-sm text-on-surface-variant mt-1">Informações pessoais e de acesso.</p>
              </div>

              <Field label="Nome completo">
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo" className={`${IC} pl-9`} />
                </div>
              </Field>

              <Field label="E-mail">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" className={`${IC} pl-9`} />
                </div>
              </Field>

              <Field label="Telefone / WhatsApp">
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999" className={`${IC} pl-9`} />
                </div>
              </Field>

              <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-on-surface">Receber alertas por WhatsApp</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsapp(!whatsapp)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${whatsapp ? 'bg-primary' : 'bg-outline-variant'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${whatsapp ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <Field label="Senha">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                    minLength={8} className={`${IC} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-on-surface-variant">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirmar senha">
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} required value={confirm}
                    onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha"
                    minLength={8} className={`${IC} pr-12`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-on-surface-variant">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-error text-xs mt-1">As senhas não coincidem.</p>
                )}
              </Field>
            </motion.div>
          )}

          {/* ── STEP 2: Perfil profissional ── */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Perfil profissional</h2>
                <p className="text-sm text-on-surface-variant mt-1">Informe como você presta serviços e sua função.</p>
              </div>

              {/* Tipo de profissional */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">
                  Como você presta serviços?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    {
                      type: 'MEI' as const,
                      icon: Briefcase,
                      title: 'Tenho MEI',
                      desc: 'Emito nota fiscal. Recebo via CNPJ.',
                    },
                    {
                      type: 'DIARISTA' as const,
                      icon: Receipt,
                      title: 'Sou Diarista',
                      desc: 'Recebo via recibo. Uso CPF.',
                    },
                  ] as const).map(({ type, icon: Icon, title, desc }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setProfessionalType(type);
                        setPixType(type === 'MEI' ? 'CNPJ' : 'CPF');
                      }}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        professionalType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant bg-white hover:border-primary/40'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${professionalType === type ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <p className={`text-sm font-bold leading-tight ${professionalType === type ? 'text-primary' : 'text-on-surface'}`}>
                        {title}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-tight">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Funções — múltipla seleção */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  Funções que você exerce
                </label>
                <p className="text-[11px] text-on-surface-variant mb-2">Selecione uma ou mais funções.</p>
                {functionsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allFunctions.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFunction(f.id)}
                        className={`px-3 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                          selectedFunctionIds.includes(f.id)
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Documento — condicional por tipo */}
              {professionalType === 'MEI' && (
                <Field label="CNPJ do MEI">
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                    <input type="text" value={mei} onChange={e => setMei(e.target.value)}
                      placeholder="00.000.000/0001-00" className={`${IC} pl-9`} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Usado para emissão de nota fiscal e pagamento.
                  </p>
                </Field>
              )}

              {professionalType === 'DIARISTA' && (
                <Field label="CPF">
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                    <input type="text" value={cpf} onChange={e => setCpf(e.target.value)}
                      placeholder="000.000.000-00" className={`${IC} pl-9`} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Usado para emissão de recibo de pagamento autônomo.
                  </p>
                </Field>
              )}

              <Field label="Bio / Apresentação (opcional)">
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Fale um pouco sobre sua experiência, diferenciais e especialidades..."
                  rows={3}
                  maxLength={300}
                  className={`${IC} resize-none`}
                />
                <p className="text-[11px] text-on-surface-variant mt-1 text-right">{bio.length}/300</p>
              </Field>
            </motion.div>
          )}

          {/* ── STEP 3: Dados de pagamento ── */}
          {step === 3 && (
            <motion.div key="s3"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Dados para pagamento</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Informe sua chave Pix para receber pelos eventos.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  <p className="font-bold text-primary mb-1">Como funciona o pagamento</p>
                  <p>A EventPro processa todos os pagamentos via Pix. Após a conclusão de cada evento, o valor é transferido diretamente para a sua chave cadastrada. A plataforma retém 15% como comissão.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">
                  Tipo de chave Pix
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PIX_TYPES.map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => { setPixType(code); setPixKey(''); }}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                        pixType === code
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label={`Chave Pix — ${PIX_TYPES.find(p => p.code === pixType)?.label}`}>
                <input
                  type={pixType === 'EMAIL' ? 'email' : 'text'}
                  required
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder={
                    pixType === 'CPF'    ? '000.000.000-00' :
                    pixType === 'CNPJ'   ? '00.000.000/0001-00' :
                    pixType === 'EMAIL'  ? 'seu@email.com' :
                    pixType === 'PHONE'  ? '(11) 99999-9999' :
                                          'Cole sua chave aleatória'
                  }
                  className={IC}
                />
              </Field>

              {selectedFunctionIds.length > 0 && (
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-on-surface mb-2">Remuneração estimada por função (8h)</p>
                  <div className="space-y-2">
                    {allFunctions
                      .filter(f => selectedFunctionIds.includes(f.id))
                      .map(f => {
                        const pay = professionalType === 'MEI' ? f.base_pay_mei : f.base_pay_diarista;
                        return (
                          <div key={f.id} className="flex justify-between text-xs">
                            <span className="text-on-surface-variant flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400" /> {f.name}
                            </span>
                            <span className="font-mono font-bold text-primary">
                              R$ {pay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 4: Confirmação ── */}
          {step === 4 && (
            <motion.div key="s4"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">

              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Tudo certo!</h2>
                <p className="text-sm text-on-surface-variant mt-1">Revise seus dados antes de finalizar.</p>
              </div>

              <div className="bg-white border border-outline-variant/30 rounded-2xl divide-y divide-outline-variant/20">
                <Row label="Nome" value={name} />
                <Row label="E-mail" value={email} />
                <Row label="Telefone" value={phone} />
                <Row label="WhatsApp" value={whatsapp ? 'Ativado' : 'Desativado'} />
                <Row label="Tipo" value={professionalType === 'MEI' ? 'MEI (Nota Fiscal)' : 'Diarista (Recibo)'} />
                <Row label="Funções" value={allFunctions.filter(f => selectedFunctionIds.includes(f.id)).map(f => f.name).join(', ') || '—'} />
                {professionalType === 'MEI'
                  ? <Row label="CNPJ MEI" value={mei} />
                  : <Row label="CPF" value={cpf} />
                }
                <Row label="Chave Pix" value={`${PIX_TYPES.find(p => p.code === pixType)?.label}: ${pixKey}`} />
                {bio && <Row label="Bio" value={bio} />}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
                <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-on-surface-variant">
                  <p className="font-bold text-primary mb-1">Próximos passos após o cadastro</p>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Confirme seu e-mail pelo link que enviaremos</li>
                    <li>Nossa equipe analisará sua documentação em até 48h</li>
                    <li>Conta ativada: comece a receber convites de eventos</li>
                    <li>R$ 5,00 de bônus via Pix assim que aprovado</li>
                  </ol>
                </div>
              </div>

              {error && (
                <p className="text-error text-xs bg-error-container px-3 py-2 rounded-lg">{error}</p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-outline-variant/30 px-6 py-4 flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(s => (s - 1) as 1|2|3|4)}
            className="flex-1 py-3.5 border border-outline-variant text-on-surface rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
          >
            Voltar
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => setStep(s => (s + 1) as 1|2|3|4)}
            disabled={
              (step === 1 && !step1Valid) ||
              (step === 2 && !step2Valid) ||
              (step === 3 && !step3Valid)
            }
            className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar minha conta'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
const IC = "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex justify-between items-start gap-4">
      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-on-surface text-right">{value}</span>
    </div>
  );
}
