import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  user_type: 'CLIENT' | 'PROFESSIONAL';
  phone: string | null;
  // client fields
  credit_balance?: number;
  credit_limit?: number;
  document?: string;
  is_company?: boolean;
  client_id?: string;
}

export function useProfile(userId?: string) {
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId!)
      .single();

    if (!userData) { setLoading(false); return; }

    if (userData.user_type === 'CLIENT') {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId!)
        .single();

      setProfile({
        ...userData,
        credit_balance: clientData?.credit_balance ?? 0,
        credit_limit:   clientData?.credit_limit ?? 0,
        document:       clientData?.document,
        is_company:     clientData?.is_company,
        client_id:      clientData?.id,
      });
    } else {
      setProfile(userData);
    }

    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>) => {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId!);
    if (error) throw error;
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  return { profile, loading, refetch: fetchProfile, updateProfile };
}
