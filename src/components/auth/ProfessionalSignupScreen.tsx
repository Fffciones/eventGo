import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, User, Utensils, Headphones, Shield, Sparkles,
  Camera, Mic, Settings, UserCheck, Eye, EyeOff, Loader2,
  CheckCircle, Star, MapPin, Phone, Mail, FileText,
  CreditCard, MessageCircle, Gift
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfessionalSignupScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { code: 'GARCOM',             label: 'Garçom / Barman',      icon: Utensils,   desc: 'Serviço de mesa, buffet, coquetel' },
  { code: 'DJ',                 label: 'DJ',                   icon: Headphones, desc: 'Sonorização e animação musical' },
  { code: 'SEGURANCA',          label: 'Segurança',            icon: Shield,     desc: 'Vigilância e controle de acesso' },
  { code: 'FAXINEIRO',          label: 'Limpeza',              icon: Sparkles,   desc: 'Limpeza e manutenção do espaço' },
  { code: 'FOTOGRAFO',          label: 'Fotógrafo',            icon: Camera,     desc: 'Fotografia e videografia de eventos' },
  { code: 'MESTRE_CERIMONIAS',  label: 'Mestre de Cerimônias', icon: Mic,        desc: 'Apresentação e condução do evento' },
  { code: 'PRODUTOR',           label: 'Produtor de Eventos',  icon: Settings,   desc: 'Gestão e produção completa' },
  { code: 'CONTROLADOR_ACESSO', label: 'Controle de Acesso',   icon: UserCheck,  desc: 'Credenciamento e portaria' },
];

const PIX_TYPES = [
  { code: 'CPF',    label: 'CPF' },
  { code: 'CNPJ',   label: 'CNPJ (MEI)' },
  { code: 'EMAIL',  label: 'E-mail' },
  { code: 'PHONE',  label: 'Telefone' },
  { code: 'RANDOM', label: 'Chave aleatória' },
];

export default function ProfessionalSignupScreen({ onBack, onSuccess }: ProfessionalSignupScreenProps) {
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
  const [category, setCategory]   = useState('');
  const [mei, setMei]             = useState('');
  const [bio, setBio]             = useState('');

  // Step 3 — pagamento
  const [pixType, setPixType]     = useState('CNPJ');
  const [pixKey, setPixKey]       = useState('');

  // validações
  const step1Valid = name.trim() && email.trim() && phone.trim()
    && password.length >= 8 && password === confirm;
  const step2Valid = category && mei.trim();
  const step3Valid = pixKey.trim();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Criar conta no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name:    name,
            user_type:    'PROFESSIONAL',
            mei_number:   mei,
            category,
            phone,
            whatsapp_opt_in: whatsapp,
          },
        },
      });

      if (authError) throw authError;

      // 2. Se sessão imediata (confirmação desligada), criar perfis
      if (data.session) {
        // public.users já criado pelo trigger
        // Atualizar phone e whatsapp_opt_in
        await supabase.from('users').update({
          phone,
          whatsapp_opt_in: whatsapp,
        }).eq('id', data.session.user.id);

        // Criar professionals
        await supabase.from('professionals').insert({
          user_id:      data.session.user.id,
          mei_number:   mei,
          category,
          status:       'PENDING',
          stars:        0,
          events_count: 0,
          hourly_cache: 0,
          bio:          bio || null,
        });
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
                <p className="text-sm text-on-surface-variant mt-1">Selecione sua categoria e informe o MEI.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">
                  Categoria principal
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map(({ code, label, icon: Icon, desc }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCategory(code)}
                      className={`text-left p-3.5 rounded-2xl border-2 transition-all ${
                        category === code
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant bg-white hover:border-primary/40'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${category === code ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <p className={`text-xs font-bold leading-tight ${category === code ? 'text-primary' : 'text-on-surface'}`}>
                        {label}
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Número do MEI (CNPJ)">
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                  <input type="text" required value={mei} onChange={e => setMei(e.target.value)}
                    placeholder="00.000.000/0001-00" className={`${IC} pl-9`} />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  MEI ativo é obrigatório para emissão de nota fiscal e recebimento de pagamentos.
                </p>
              </Field>

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

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-on-surface mb-2">Resumo de ganhos estimados (8h)</p>
                <div className="space-y-1">
                  {category ? (() => {
                    const prices: Record<string, number[]> = {
                      GARCOM: [280, 378, 490], DJ: [800, 1080, 1400],
                      SEGURANCA: [320, 432, 560], FAXINEIRO: [200, 270, 350],
                      FOTOGRAFO: [1200, 1620, 2100], MESTRE_CERIMONIAS: [600, 810, 1050],
                      PRODUTOR: [1500, 2025, 2625], CONTROLADOR_ACESSO: [240, 324, 420],
                    };
                    const p = prices[category] || [0,0,0];
                    return (
                      <>
                        {[['Nível base (0 estrelas)', p[0]], ['3 estrelas', p[1]], ['5 estrelas', p[2]]].map(([label, val]) => (
                          <div key={label as string} className="flex justify-between text-xs">
                            <span className="text-on-surface-variant flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400" /> {label}
                            </span>
                            <span className="font-mono font-bold text-primary">
                              R$ {Number(val).toLocaleString('pt-BR')} <span className="font-normal text-on-surface-variant">(líquido: R$ {(Number(val) * 0.85).toLocaleString('pt-BR', {maximumFractionDigits:0})})</span>
                            </span>
                          </div>
                        ))}
                      </>
                    );
                  })() : (
                    <p className="text-xs text-on-surface-variant">Selecione uma categoria no passo anterior para ver os ganhos estimados.</p>
                  )}
                </div>
              </div>
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
                <Row label="Categoria" value={CATEGORIES.find(c => c.code === category)?.label ?? '—'} />
                <Row label="MEI" value={mei} />
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
