import { useState } from 'react';
import { MapPin, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  onSubmit: (password: string) => Promise<{ error: { message: string } | null }>;
  onDone: () => void;
}

export default function ResetPasswordScreen({ onSubmit, onDone }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    const { error } = await onSubmit(password);
    setLoading(false);
    if (error) { setError(error.message || 'Não foi possível redefinir a senha.'); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary">Senha redefinida!</h2>
          <p className="text-sm text-on-surface-variant">Sua nova senha já está ativa.</p>
          <button
            onClick={onDone}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2 justify-center select-none">
          <MapPin className="text-primary w-6 h-6" />
          <span className="font-display text-2xl font-black text-primary tracking-tight">EventPro</span>
        </div>

        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary">Redefinir senha</h1>
          <p className="text-sm text-on-surface-variant mt-1">Escolha uma nova senha para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
              <input
                type={show ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-on-surface-variant">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
              <input
                type={show ? 'text' : 'password'} required value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-error text-xs bg-error-container px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
