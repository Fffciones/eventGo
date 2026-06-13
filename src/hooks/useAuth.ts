import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Garante que public.users e o perfil correspondente existem no banco.
// Chamada após SIGNED_IN para evitar menus inativos no login OAuth.
async function ensureProfile(
  uid: string,
  email: string,
  fullName: string,
  avatarUrl: string | null,
  isOAuth: boolean,
  meta: Record<string, any>,
) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, user_type')
    .eq('id', uid)
    .single();

  if (!existingUser) {
    await supabase.from('users').insert({
      id: uid, email, full_name: fullName, avatar_url: avatarUrl, user_type: 'CLIENT',
    });
    const doc = uid.replace(/-/g, '').slice(0, 11);
    await supabase.from('clients').insert({
      user_id: uid, document: doc, is_company: false, credit_balance: 0, credit_limit: 0,
    });
    return;
  }

  if (isOAuth && (fullName || avatarUrl)) {
    await supabase.from('users').update({
      ...(fullName  ? { full_name:  fullName }  : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    }).eq('id', uid);
  }

  if (existingUser.user_type === 'CLIENT') {
    const { data } = await supabase.from('clients').select('id').eq('user_id', uid).single();
    if (!data) {
      const doc = uid.replace(/-/g, '').slice(0, 11);
      await supabase.from('clients').insert({
        user_id: uid, document: doc, is_company: false, credit_balance: 0, credit_limit: 0,
      });
    }
  }

  if (existingUser.user_type === 'PROFESSIONAL') {
    const { data } = await supabase.from('professionals').select('id').eq('user_id', uid).single();
    if (!data) {
      await supabase.from('professionals').insert({
        user_id: uid, mei_number: meta?.mei_number ?? '', category: meta?.category ?? 'GARCOM',
        status: 'PENDING', stars: 0, events_count: 0, hourly_cache: 0,
        is_available: false, action_radius_km: 10, online_score: 0,
      });
    }
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Fluxo de recuperação de senha: o link do e-mail traz `type=recovery` no hash
  const [recovery, setRecovery] = useState<boolean>(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setRecovery(true);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const meta       = session.user.user_metadata;
        const uid        = session.user.id;
        const isOAuth    = session.user.app_metadata?.provider === 'google';

        // Nome e avatar vindos do Google (ou metadata do cadastro manual)
        const fullName   = meta?.full_name ?? meta?.name ?? '';
        const avatarUrl  = meta?.avatar_url ?? meta?.picture ?? null;

        // Mantém loading até o perfil estar pronto no banco (evita menus inativos)
        setLoading(true);
        ensureProfile(uid, session.user.email ?? '', fullName, avatarUrl, isOAuth, meta)
          .finally(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    userType: 'CLIENT' | 'PROFESSIONAL',
    extra?: { document?: string; mei_number?: string; category?: string }
  ) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, user_type: userType, ...extra },
      },
    });
  };

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
  };

  const signOut = () => supabase.auth.signOut();

  const resetPassword = async (email: string) => {
    // Volta para o mesmo app (contratante/profissional) onde a recuperação foi pedida.
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
  };

  // Define a nova senha durante o fluxo de recuperação (ou para a conta logada)
  const updatePassword = async (password: string) => {
    return supabase.auth.updateUser({ password });
  };

  // Encerra o modo recuperação e limpa o token do hash da URL
  const exitRecovery = () => {
    setRecovery(false);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return {
    session, user, loading, recovery,
    signUp, signIn, signInWithGoogle, signOut,
    resetPassword, updatePassword, exitRecovery,
  };
}
