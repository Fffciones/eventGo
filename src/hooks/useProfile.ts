import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  user_type: 'CLIENT' | 'PROFESSIONAL';
  phone: string | null;
  whatsapp_opt_in: boolean;
  created_at: string;
  // client fields
  credit_balance?: number;
  credit_limit?: number;
  document?: string;
  is_company?: boolean;
  client_id?: string;
}

export interface ProfileEvent {
  id: string;
  name: string;
  location_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
}

export interface ProfileFavorite {
  professional_id: string;
  full_name: string;
  avatar_url: string | null;
  category: string;
  stars: number;
  events_count: number;
  hourly_cache: number;
}

export function useProfile(userId?: string) {
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [events, setEvents]       = useState<ProfileEvent[]>([]);
  const [favorites, setFavorites] = useState<ProfileFavorite[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchAll();
  }, [userId]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchEvents(), fetchFavorites(), fetchRating()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId!)
      .single();

    if (!userData) return;

    // Sempre tenta carregar perfil de cliente — um profissional pode também criar eventos
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
  };

  const fetchEvents = async () => {
    // busca via client_id
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId!)
      .single();

    if (!clientData) return;

    const { data } = await supabase
      .from('events')
      .select('id, name, location_name, starts_at, ends_at, status')
      .eq('client_id', clientData.id)
      .order('starts_at', { ascending: false });

    setEvents(data ?? []);
  };

  const fetchFavorites = async () => {
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId!)
      .single();

    if (!clientData) return;

    const { data } = await supabase
      .from('client_favorites')
      .select(`
        professional_id,
        professionals (
          stars, events_count, hourly_cache, category,
          users ( full_name, avatar_url )
        )
      `)
      .eq('client_id', clientData.id);

    setFavorites(
      (data ?? []).map((f: any) => ({
        professional_id: f.professional_id,
        full_name:       f.professionals?.users?.full_name ?? '—',
        avatar_url:      f.professionals?.users?.avatar_url ?? null,
        category:        f.professionals?.category ?? '—',
        stars:           f.professionals?.stars ?? 0,
        events_count:    f.professionals?.events_count ?? 0,
        hourly_cache:    f.professionals?.hourly_cache ?? 0,
      }))
    );
  };

  const fetchRating = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId!);

    if (!data || data.length === 0) { setAvgRating(null); return; }
    const avg = data.reduce((s, r) => s + Number(r.rating), 0) / data.length;
    setAvgRating(Math.round(avg * 10) / 10);
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>) => {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId!);
    if (error) throw error;
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  const toggleFavorite = async (professionalId: string, clientId: string, isFav: boolean) => {
    if (isFav) {
      await supabase.from('client_favorites')
        .delete().eq('client_id', clientId).eq('professional_id', professionalId);
    } else {
      await supabase.from('client_favorites')
        .insert({ client_id: clientId, professional_id: professionalId });
    }
    await fetchFavorites();
  };

  return {
    profile, events, favorites, avgRating, loading,
    refetch: fetchAll, updateProfile, toggleFavorite,
  };
}
