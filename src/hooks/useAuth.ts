import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        const meta       = session.user.user_metadata;
        const uid        = session.user.id;
        const isOAuth    = session.user.app_metadata?.provider === 'google';

        // Nome e avatar vindos do Google (ou metadata do cadastro manual)
        const fullName   = meta?.full_name ?? meta?.name ?? '';
        const avatarUrl  = meta?.avatar_url ?? meta?.picture ?? null;

        // 1. Garante registro em public.users com dados atualizados
        supabase.from('users')
          .select('id, user_type')
          .eq('id', uid)
          .single()
          .then(({ data: existingUser }) => {
            if (!existingUser) {
              // Novo usuário OAuth — cria como CLIENT por padrão
              supabase.from('users').insert({
                id:         uid,
                email:      session.user.email ?? '',
                full_name:  fullName,
                avatar_url: avatarUrl,
                user_type:  'CLIENT',
              }).then(() => {
                // Cria perfil de cliente
                const uniqueDoc = uid.replace(/-/g, '').slice(0, 11);
                supabase.from('clients').insert({
                  user_id:        uid,
                  document:       uniqueDoc,
                  is_company:     false,
                  credit_balance: 0,
                  credit_limit:   0,
                });
              });
            } else {
              // Usuário existente — atualiza nome/avatar se veio do Google
              if (isOAuth && (fullName || avatarUrl)) {
                supabase.from('users').update({
                  ...(fullName   ? { full_name:  fullName }  : {}),
                  ...(avatarUrl  ? { avatar_url: avatarUrl } : {}),
                }).eq('id', uid);
              }

              // Garante perfil de cliente se for CLIENT sem registro
              if (existingUser.user_type === 'CLIENT') {
                supabase.from('clients')
                  .select('id').eq('user_id', uid).single()
                  .then(({ data }) => {
                    if (!data) {
                      const uniqueDoc = uid.replace(/-/g, '').slice(0, 11);
                      supabase.from('clients').insert({
                        user_id:        uid,
                        document:       uniqueDoc,
                        is_company:     false,
                        credit_balance: 0,
                        credit_limit:   0,
                      });
                    }
                  });
              }

              // Garante perfil de profissional se for PROFESSIONAL sem registro
              if (existingUser.user_type === 'PROFESSIONAL') {
                supabase.from('professionals')
                  .select('id').eq('user_id', uid).single()
                  .then(({ data }) => {
                    if (!data) {
                      supabase.from('professionals').insert({
                        user_id:      uid,
                        mei_number:   meta?.mei_number ?? '',
                        category:     meta?.category ?? 'GARCOM',
                        status:       'PENDING',
                        stars:        0,
                        events_count: 0,
                        hourly_cache: 0,
                        is_available: false,
                        action_radius_km: 10,
                        online_score: 0,
                      });
                    }
                  });
              }
            }
          });
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
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  return { session, user, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword };
}
