import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProfessionalFunctions, type Function as ProfFunction } from './useFunctions';

export type ProfessionalCategory =
  | 'GARCOM' | 'DJ' | 'SEGURANCA' | 'FAXINEIRO'
  | 'FOTOGRAFO' | 'MESTRE_CERIMONIAS' | 'PRODUTOR' | 'CONTROLADOR_ACESSO';

export type ProfessionalStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED';

export interface ProfessionalProfile {
  // auth / users
  user_id:         string;
  email:           string;
  full_name:       string;
  phone:           string | null;
  avatar_url:      string | null;
  whatsapp_opt_in: boolean;
  created_at:      string;
  // professionals
  professional_id:   string;
  mei_number:        string | null;
  professional_type: 'MEI' | 'DIARISTA';
  category:          ProfessionalCategory;
  functions:         ProfFunction[];
  status:            ProfessionalStatus;
  stars:           number;
  events_count:    number;
  hourly_cache:    number;
  bio:             string | null;
  // presença / localização
  home_address:     string | null;
  home_lat:         number | null;
  home_lng:         number | null;
  action_radius_km: number;
  online_score:     number;
  last_seen_at:     string | null;
  is_available:     boolean;
}

export interface PendingInvite {
  bp_id:          string;
  booking_id:     string;
  event_id:       string;
  event_name:     string;
  location_name:  string;
  event_lat:      number | null;
  event_lng:      number | null;
  starts_at:      string;
  ends_at:        string;
  category:       string;
  amount:         number;
  multiplier:     string;
  briefing:       any;
  client_name:    string;
  distance_km:    number | null;
  is_favorite:    boolean;
  expires_at:     string | null;
}

export interface AgendaEvent {
  bp_id:         string;
  booking_id:    string;
  event_id:      string;
  event_name:    string;
  location_name: string;
  starts_at:     string;
  ends_at:       string;
  category:      string;
  amount:        number;
  status:        string;
  briefing:      any;
  gps_active:    boolean;
  checkin_at:    string | null;
  checkout_at:   string | null;
}

export function useProfessionalProfile(userId?: string) {
  const [profile, setProfile]       = useState<ProfessionalProfile | null>(null);
  const [invites, setInvites]       = useState<PendingInvite[]>([]);
  const [agenda, setAgenda]         = useState<AgendaEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchAll();
    updateLastSeen();

    // Realtime — novos convites chegando
    const channel = supabase
      .channel(`pro-invites:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'booking_professionals',
      }, () => fetchInvites())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'booking_professionals',
      }, () => { fetchInvites(); fetchAgenda(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchInvites(), fetchAgenda()]);
    setLoading(false);
  };

  // ── Perfil completo ────────────────────────────────────────────
  const fetchProfile = async () => {
    const { data: u } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId!)
      .single();

    if (!u) { setError('Perfil não encontrado.'); return; }

    const { data: p } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', userId!)
      .single();

    if (!p) { setError('Perfil de profissional não encontrado.'); return; }

    // Extrair lat/lng da coluna geography via ST_X / ST_Y
    let home_lat: number | null = null;
    let home_lng: number | null = null;

    if (p.home_location) {
      const { data: geo } = await supabase
        .rpc('get_professional_home_coords', { p_user_id: userId! });
      if (geo) { home_lat = geo.lat; home_lng = geo.lng; }
    }

    const proFunctions = await getProfessionalFunctions(p.id);

    setProfile({
      user_id:         u.id,
      email:           u.email,
      full_name:       u.full_name,
      phone:           u.phone,
      avatar_url:      u.avatar_url,
      whatsapp_opt_in: u.whatsapp_opt_in,
      created_at:      u.created_at,
      professional_id:   p.id,
      mei_number:        p.mei_number ?? null,
      professional_type: p.professional_type ?? 'MEI',
      category:          p.category,
      functions:         proFunctions,
      status:            p.status,
      stars:           p.stars,
      events_count:    p.events_count,
      hourly_cache:    p.hourly_cache,
      bio:             p.bio,
      home_address:    p.home_address,
      home_lat,
      home_lng,
      action_radius_km: p.action_radius_km ?? 10,
      online_score:    p.online_score ?? 0,
      last_seen_at:    p.last_seen_at,
      is_available:    p.is_available ?? false,
    });
  };

  // ── Convites pendentes ─────────────────────────────────────────
  const fetchInvites = async () => {
    const { data: p } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', userId!)
      .single();

    if (!p) return;

    const { data } = await supabase
      .from('booking_professionals')
      .select(`
        id, booking_id, amount, status,
        bookings (
          id, category, multiplier_type, event_id,
          events (
            id, name, location_name, starts_at, ends_at, briefing,
            clients ( users ( full_name ) )
          )
        )
      `)
      .eq('professional_id', p.id)
      .eq('status', 'INVITED');

    setInvites(
      (data ?? []).map((bp: any) => {
        const b = bp.bookings;
        const e = b?.events;
        return {
          bp_id:         bp.id,
          booking_id:    bp.booking_id,
          event_id:      e?.id,
          event_name:    e?.name ?? '—',
          location_name: e?.location_name ?? '—',
          event_lat:     null,
          event_lng:     null,
          starts_at:     e?.starts_at,
          ends_at:       e?.ends_at,
          category:      b?.category ?? '',
          amount:        bp.amount ?? 0,
          multiplier:    b?.multiplier_type ?? 'NORMAL',
          briefing:      e?.briefing ?? null,
          client_name:   e?.clients?.users?.full_name ?? 'Cliente',
          distance_km:   null,
          is_favorite:   false,
          expires_at:    null,
        };
      })
    );
  };

  // ── Agenda (eventos aceitos) ───────────────────────────────────
  const fetchAgenda = async () => {
    const { data: p } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', userId!)
      .single();

    if (!p) return;

    const { data } = await supabase
      .from('booking_professionals')
      .select(`
        id, booking_id, amount, status, gps_active, checkin_at, checkout_at,
        bookings (
          category,
          events ( id, name, location_name, starts_at, ends_at, briefing )
        )
      `)
      .eq('professional_id', p.id)
      .in('status', ['ACCEPTED','IN_TRANSIT','CHECKED_IN','CHECKED_OUT'])
      .order('created_at', { ascending: false });

    setAgenda(
      (data ?? []).map((bp: any) => {
        const b = bp.bookings;
        const e = b?.events;
        return {
          bp_id:         bp.id,
          booking_id:    bp.booking_id,
          event_id:      e?.id,
          event_name:    e?.name ?? '—',
          location_name: e?.location_name ?? '—',
          starts_at:     e?.starts_at,
          ends_at:       e?.ends_at,
          category:      b?.category ?? '',
          amount:        bp.amount ?? 0,
          status:        bp.status,
          briefing:      e?.briefing ?? null,
          gps_active:    bp.gps_active ?? false,
          checkin_at:    bp.checkin_at,
          checkout_at:   bp.checkout_at,
        };
      })
    );
  };

  // ── Atualizar last_seen_at ─────────────────────────────────────
  const updateLastSeen = async () => {
    await supabase
      .from('professionals')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId!);
  };

  // ── Toggle disponibilidade ────────────────────────────────────
  const toggleAvailability = async () => {
    const newVal = !profile?.is_available;
    await supabase
      .from('professionals')
      .update({ is_available: newVal })
      .eq('user_id', userId!);
    setProfile(prev => prev ? { ...prev, is_available: newVal } : prev);
  };

  // ── Aceitar / recusar convite ─────────────────────────────────
  const respondToInvite = async (bpId: string, accept: boolean) => {
    const newStatus = accept ? 'ACCEPTED' : 'DECLINED';
    const { error } = await supabase
      .from('booking_professionals')
      .update({ status: newStatus })
      .eq('id', bpId);

    if (error) throw error;
    setInvites(prev => prev.filter(i => i.bp_id !== bpId));
    if (accept) await fetchAgenda();
  };

  // ── Atualizar endereço residencial ────────────────────────────
  const updateHomeAddress = async (address: string, lat: number, lng: number) => {
    await supabase
      .from('professionals')
      .update({
        home_address:  address,
        home_location: `POINT(${lng} ${lat})`,
      })
      .eq('user_id', userId!);
    setProfile(prev => prev
      ? { ...prev, home_address: address, home_lat: lat, home_lng: lng }
      : prev
    );
  };

  // ── Atualizar raio de atuação ─────────────────────────────────
  const updateRadius = async (km: number) => {
    await supabase
      .from('professionals')
      .update({ action_radius_km: km })
      .eq('user_id', userId!);
    setProfile(prev => prev ? { ...prev, action_radius_km: km } : prev);
  };

  return {
    profile, invites, agenda, loading, error,
    refetch: fetchAll,
    toggleAvailability,
    respondToInvite,
    updateHomeAddress,
    updateRadius,
  };
}
