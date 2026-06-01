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

      // Ao confirmar e-mail, garante que o perfil de cliente/profissional existe
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata;
        const uid  = session.user.id;

        // fallback: se não tiver user_type no metadata, assume CLIENT
        const userType = meta?.user_type ?? 'CLIENT';

        if (userType === 'CLIENT') {
          supabase.from('clients')
            .select('id').eq('user_id', uid).single()
            .then(({ data }) => {
              if (!data) {
                // documento único por usuário usando parte do UUID
                const uniqueDoc = uid.replace(/-/g, '').slice(0, 11);
                supabase.from('clients').insert({
                  user_id: uid,
                  document: uniqueDoc,
                  is_company: false,
                  credit_balance: 0,
                  credit_limit: 0,
                });
              }
            });
        } else if (meta?.user_type === 'PROFESSIONAL' && meta?.mei_number) {
          supabase.from('professionals')
            .select('id').eq('user_id', uid).single()
            .then(({ data }) => {
              if (!data) {
                supabase.from('professionals').insert({
                  user_id:      uid,
                  mei_number:   meta.mei_number,
                  category:     meta.category ?? 'GARCOM',
                  status:       'PENDING',
                  stars:        0,
                  events_count: 0,
                  hourly_cache: 0,
                });
              }
            });
        }
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

  const signOut = () => supabase.auth.signOut();

  return { session, user, loading, signUp, signIn, signOut };
}
