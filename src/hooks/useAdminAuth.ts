import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type AdminRole = 'operator' | 'financial' | 'super';

export interface AdminProfile {
  id: string;
  user_id: string;
  role: AdminRole;
  full_name: string;
  email: string;
}

export function useAdminAuth() {
  const [user, setUser]         = useState<User | null>(null);
  const [admin, setAdmin]       = useState<AdminProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [forbidden, setForbidden] = useState(false);

  async function loadAdmin(uid: string) {
    const { data } = await supabase
      .from('admins')
      .select('id, user_id, role, users(full_name, email)')
      .eq('user_id', uid)
      .eq('active', true)
      .single();

    if (data) {
      const u = data.users as unknown as { full_name: string; email: string } | null;
      setAdmin({
        id: data.id,
        user_id: data.user_id,
        role: data.role as AdminRole,
        full_name: u?.full_name ?? '',
        email: u?.email ?? '',
      });
      setForbidden(false);
    } else {
      setAdmin(null);
      setForbidden(true);
    }
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        const u = data.session?.user ?? null;
        setUser(u);
        if (u) {
          loadAdmin(u.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        // Token de sessão corrompido/expirado no localStorage — evita travar no splash
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setAdmin(null);
        setForbidden(true);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadAdmin(u.id);
      } else {
        setAdmin(null);
        setForbidden(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  return { user, admin, loading, forbidden, signIn, signOut };
}
