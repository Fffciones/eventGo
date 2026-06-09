import { useState } from 'react';
import { Shield, Eye, EyeOff, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onSignIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  forbidden?: boolean;
}

export default function AdminLogin({ onSignIn, forbidden }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const [showForgot,   setShowForgot]   = useState(false);
  const [forgotEmail,  setForgotEmail]  = useState('');
  const [forgotSent,   setForgotSent]   = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError,  setForgotError]  = useState('');

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (error) setForgotError(error.message);
    else setForgotSent(true);
    setForgotLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await onSignIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">EventPro</h1>
            <p className="text-slate-400 text-sm font-medium mt-0.5">Painel de Administração</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

          {/* ── Tela de recuperação ── */}
          {showForgot && (
            forgotSent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-white font-semibold">Verifique seu e-mail</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Link enviado para <strong>{forgotEmail}</strong>.
                  </p>
                </div>
                <button onClick={() => { setShowForgot(false); setForgotSent(false); }}
                  className="text-primary text-sm font-semibold hover:underline">
                  Voltar para o login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                <p className="text-slate-300 text-sm">Informe seu e-mail para receber o link de recuperação.</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-xs font-semibold uppercase tracking-wide">E-mail</label>
                  <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="admin@eventpro.com.br"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
                </div>
                {forgotError && <p className="text-red-400 text-sm text-center">{forgotError}</p>}
                <button type="submit" disabled={forgotLoading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition active:scale-95">
                  {forgotLoading ? 'Enviando…' : 'Enviar link'}
                </button>
                <button type="button" onClick={() => setShowForgot(false)}
                  className="text-slate-400 text-xs hover:underline text-center">
                  Voltar
                </button>
              </form>
            )
          )}

          {/* ── Formulário de login ── */}
          {!showForgot && (
            <>
              {forbidden && (
                <div className="mb-4 p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm text-center">
                  Conta sem permissão de administrador.
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-xs font-semibold uppercase tracking-wide">E-mail</label>
                  <input
                    type="email" autoComplete="email" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    placeholder="admin@eventpro.com.br"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Senha</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} autoComplete="current-password"
                      value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div className="flex justify-end -mt-1">
                  <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotError(''); }}
                    className="text-xs text-primary hover:underline font-medium">
                    Esqueci minha senha
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className="mt-1 w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition active:scale-95">
                  {loading ? 'Entrando…' : 'Entrar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
