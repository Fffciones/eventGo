import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Eye, EyeOff, ArrowLeft, User, Briefcase, Loader2, CheckCircle, Mail, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { waLink, PLATFORM_WHATSAPP, hasPlatformWhatsApp } from '../../lib/whatsapp';
import ProfessionalSignupScreen from './ProfessionalSignupScreen';

type AuthMode = 'landing' | 'login' | 'signup-type' | 'signup-client' | 'signup-professional' | 'forgot';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const [mode, setMode]           = useState<AuthMode>('landing');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  // Login form
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotSent,  setForgotSent]    = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await resetPassword(forgotEmail);
    if (error) setError(error.message);
    else setForgotSent(true);
    setLoading(false);
  };

  // Signup form
  const [signupName, setSignupName]       = useState('');
  const [signupEmail, setSignupEmail]     = useState('');
  const [signupPhone, setSignupPhone]     = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDoc, setSignupDoc]         = useState('');
  const [signupMei, setSignupMei]         = useState('');
  const [signupCategory, setSignupCategory] = useState('GARCOM');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) setError('E-mail ou senha incorretos.');
    else onAuthenticated();
    setLoading(false);
  };

  const handleSignupClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await signUp(signupEmail, signupPassword, signupName, 'CLIENT');
    if (error) { setError(error.message); setLoading(false); return; }

    // Se confirmação de e-mail está desligada, sessão já existe
    if (data.session) {
      const { error: profileError } = await supabase.rpc('create_client_profile', {
        p_document:   signupDoc,
        p_is_company: signupDoc.replace(/\D/g, '').length > 11,
      });
      if (profileError) { setError('Conta criada, mas erro ao salvar perfil: ' + profileError.message); setLoading(false); return; }
    }

    setSuccess(true);
    setTimeout(onAuthenticated, 2000);
    setLoading(false);
  };

  const handleSignupProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await signUp(signupEmail, signupPassword, signupName, 'PROFESSIONAL');
    if (error) { setError(error.message); setLoading(false); return; }

    if (data.session) {
      const { error: profileError } = await supabase.rpc('create_professional_profile', {
        p_mei_number: signupMei,
        p_category:   signupCategory,
      });
      if (profileError) { setError('Conta criada, mas erro ao salvar perfil: ' + profileError.message); setLoading(false); return; }
    }

    setSuccess(true);
    setTimeout(onAuthenticated, 2000);
    setLoading(false);
  };

  const categoryLabels: Record<string, string> = {
    GARCOM: 'Garçom', DJ: 'DJ', SEGURANCA: 'Segurança',
    FAXINEIRO: 'Limpeza', FOTOGRAFO: 'Fotógrafo',
    MESTRE_CERIMONIAS: 'Mestre de Cerimônias',
    PRODUTOR: 'Produtor', CONTROLADOR_ACESSO: 'Controle de Acesso',
  };

  // Redireciona para tela dedicada de cadastro profissional
  if (mode === 'signup-professional') {
    return (
      <ProfessionalSignupScreen
        onBack={() => setMode('signup-type')}
        onSuccess={() => { setSuccess(true); setTimeout(onAuthenticated, 2000); }}
      />
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary">Cadastro realizado!</h2>
          <p className="text-on-surface-variant text-sm">Entrando no EventPro...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        {mode !== 'landing' ? (
          <button onClick={() => { setMode('landing'); setError(null); }}
            className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
        ) : <div />}
        <div className="flex items-center gap-2">
          <MapPin className="text-primary w-5 h-5" />
          <span className="font-display text-xl font-black text-primary tracking-tight">EventPro</span>
        </div>
        <div className="w-9" />
      </div>

      <AnimatePresence mode="wait">

        {/* ── LANDING ── */}
        {mode === 'landing' && (
          <motion.div key="landing"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-12 text-center gap-8">

            <div className="space-y-3">
              <h1 className="font-display text-5xl font-bold text-primary leading-tight">
                Gestão inteligente<br />de eventos
              </h1>
              <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
                Conectamos produtores de eventos com os melhores profissionais da área em tempo real.
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <button onClick={() => setMode('login')}
                className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all">
                Entrar
              </button>
              <button onClick={() => setMode('signup-type')}
                className="w-full border border-primary text-primary font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-all hover:bg-primary/5">
                Criar conta
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-outline-variant" />
                <span className="text-xs text-on-surface-variant">ou</span>
                <div className="flex-1 h-px bg-outline-variant" />
              </div>

              <GoogleButton onClick={signInWithGoogle} />
              <WhatsAppSignupButton />
            </div>

            <p className="text-xs text-on-surface-variant">
              Ao continuar, você aceita os <span className="text-primary font-medium">Termos de Uso</span> e a{' '}
              <span className="text-primary font-medium">Política de Privacidade</span>.
            </p>
          </motion.div>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <motion.div key="login"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-6 pt-4 pb-12 max-w-md mx-auto w-full">

            <h2 className="font-display text-4xl font-bold text-primary mb-1">Bem-vindo de volta</h2>
            <p className="text-on-surface-variant text-sm mb-8">Entre com sua conta EventPro</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">E-mail</label>
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-error text-xs bg-error-container px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex justify-end">
                <button type="button" onClick={() => { setMode('forgot'); setError(null); setForgotSent(false); setForgotEmail(loginEmail); }}
                  className="text-xs text-primary font-medium hover:underline">
                  Esqueci minha senha
                </button>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
              </button>
            </form>

            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-xs text-on-surface-variant">ou</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <div className="mt-3">
              <GoogleButton onClick={signInWithGoogle} />
            </div>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              Não tem conta?{' '}
              <button onClick={() => setMode('signup-type')} className="text-primary font-semibold">
                Criar agora
              </button>
            </p>
          </motion.div>
        )}

        {/* ── ESQUECI MINHA SENHA ── */}
        {mode === 'forgot' && (
          <motion.div key="forgot"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-6 pt-4 pb-12 max-w-md mx-auto w-full">

            {forgotSent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-primary mb-2">Verifique seu e-mail</h2>
                  <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
                    Enviamos um link para <strong>{forgotEmail}</strong>. Clique nele para criar uma nova senha.
                  </p>
                </div>
                <button onClick={() => { setMode('login'); setForgotSent(false); }}
                  className="w-full max-w-xs bg-primary text-on-primary font-semibold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all">
                  Voltar para o login
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-4xl font-bold text-primary mb-1">Esqueceu a senha?</h2>
                <p className="text-on-surface-variant text-sm mb-8">
                  Informe seu e-mail e enviaremos um link para criar uma nova senha.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">E-mail</label>
                    <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
                  </div>

                  {error && (
                    <p className="text-error text-xs bg-error-container px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar link de recuperação'}
                  </button>
                </form>

                <p className="text-center text-sm text-on-surface-variant mt-6">
                  Lembrou a senha?{' '}
                  <button onClick={() => { setMode('login'); setError(null); }} className="text-primary font-semibold">
                    Voltar para o login
                  </button>
                </p>
              </>
            )}
          </motion.div>
        )}

        {/* ── ESCOLHER TIPO ── */}
        {mode === 'signup-type' && (
          <motion.div key="signup-type"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col items-center px-6 pt-4 pb-12 max-w-md mx-auto w-full">

            <h2 className="font-display text-4xl font-bold text-primary mb-1 self-start">Criar conta</h2>
            <p className="text-on-surface-variant text-sm mb-10 self-start">Como você vai usar o EventPro?</p>

            <div className="w-full space-y-4">
              <button onClick={() => setMode('signup-client')}
                className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-outline-variant hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98] text-left">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-primary">Sou Cliente</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Produtor ou organizador de eventos</p>
                </div>
              </button>

              <button onClick={() => setMode('signup-professional')}
                className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-outline-variant hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98] text-left">
                <div className="w-14 h-14 rounded-xl bg-secondary-container/30 flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-secondary" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-primary">Sou Profissional</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Garçom, DJ, segurança, fotógrafo e mais</p>
                </div>
              </button>
            </div>

            <div className="w-full mt-4">
              <WhatsAppSignupButton />
            </div>

            <p className="text-center text-sm text-on-surface-variant mt-8">
              Já tem conta?{' '}
              <button onClick={() => setMode('login')} className="text-primary font-semibold">Entrar</button>
            </p>
          </motion.div>
        )}

        {/* ── CADASTRO CLIENTE ── */}
        {mode === 'signup-client' && (
          <motion.div key="signup-client"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-6 pt-2 pb-12 max-w-md mx-auto w-full overflow-y-auto">

            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary leading-tight">Cadastro Cliente</h2>
                <p className="text-xs text-on-surface-variant">Produtor / Organizador de eventos</p>
              </div>
            </div>

            <form onSubmit={handleSignupClient} className="space-y-4">
              <Field label="Nome completo">
                <input type="text" required value={signupName} onChange={e => setSignupName(e.target.value)}
                  placeholder="Seu nome" className={inputClass} />
              </Field>
              <Field label="E-mail">
                <input type="email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                  placeholder="seu@email.com" className={inputClass} />
              </Field>
              <Field label="Telefone / WhatsApp">
                <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)}
                  placeholder="(11) 99999-9999" className={inputClass} />
              </Field>
              <Field label="CPF ou CNPJ">
                <input type="text" required value={signupDoc} onChange={e => setSignupDoc(e.target.value)}
                  placeholder="000.000.000-00" className={inputClass} />
              </Field>
              <Field label="Senha">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)} placeholder="Mín. 8 caracteres"
                    minLength={8} className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {error && <p className="text-error text-xs bg-error-container px-3 py-2 rounded-lg">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar minha conta'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── CADASTRO PROFISSIONAL ── */}
        {mode === 'signup-professional' && (
          <motion.div key="signup-professional"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-6 pt-2 pb-12 max-w-md mx-auto w-full overflow-y-auto">

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/30 flex items-center justify-center">
                <User className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary leading-tight">Cadastro Profissional</h2>
                <p className="text-xs text-on-surface-variant">Ganhe R$ 5,00 no cadastro via Pix!</p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-5 text-xs text-on-surface-variant">
              💡 Após o cadastro, envie sua documentação e MEI para ativar sua conta e receber o bônus de boas-vindas.
            </div>

            <form onSubmit={handleSignupProfessional} className="space-y-4">
              <Field label="Nome completo">
                <input type="text" required value={signupName} onChange={e => setSignupName(e.target.value)}
                  placeholder="Seu nome" className={inputClass} />
              </Field>
              <Field label="E-mail">
                <input type="email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                  placeholder="seu@email.com" className={inputClass} />
              </Field>
              <Field label="Telefone / WhatsApp">
                <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)}
                  placeholder="(11) 99999-9999" className={inputClass} />
              </Field>
              <Field label="Número MEI">
                <input type="text" required value={signupMei} onChange={e => setSignupMei(e.target.value)}
                  placeholder="00.000.000/0001-00" className={inputClass} />
              </Field>
              <Field label="Categoria principal">
                <select value={signupCategory} onChange={e => setSignupCategory(e.target.value)}
                  className={inputClass}>
                  {Object.entries(categoryLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Senha">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)} placeholder="Mín. 8 caracteres"
                    minLength={8} className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {error && <p className="text-error text-xs bg-error-container px-3 py-2 rounded-lg">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Quero me cadastrar'}
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// Helpers
const inputClass = "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-outline-variant bg-white hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm"
    >
      {/* Google SVG logo */}
      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span className="text-sm font-semibold text-slate-700">Continuar com Google</span>
    </button>
  );
}

// Onboarding por clique (Etapa 5A): abre o WhatsApp da plataforma com mensagem pronta.
// Só aparece quando VITE_WHATSAPP_NUMBER está configurado.
function WhatsAppSignupButton() {
  if (!hasPlatformWhatsApp()) return null;
  return (
    <a
      href={waLink(PLATFORM_WHATSAPP, 'Quero me cadastrar como Profissional no EventPro')}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 active:scale-[0.98] transition-all shadow-sm"
    >
      <MessageCircle className="w-[18px] h-[18px] text-[#128C7E]" />
      <span className="text-sm font-semibold text-[#128C7E]">Cadastre-se pelo WhatsApp</span>
    </a>
  );
}
