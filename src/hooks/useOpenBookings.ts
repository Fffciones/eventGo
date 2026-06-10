import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface OpenBooking {
  group_key:     string;     // event_id + ':' + function_id
  vaga_id:       string;     // uma vaga aberta do grupo (a próxima a ser aceita)
  event_id:      string;
  event_name:    string;
  location_name: string;
  lat:           number;
  lng:           number;
  starts_at:     string;
  ends_at:       string;
  category:      string;
  amount:        number;     // preço por vaga
  slots_total:   number;     // total de vagas do grupo (abertas — sem rastreio das já preenchidas)
  slots_open:    number;     // vagas ainda em aberto
  distance_km:   number | null;
  already_invited: boolean;  // mantido por compat de UI (sempre false no mural aberto)
}

export function useOpenBookings(
  professionalId: string | undefined,
  functionIds: string[],
  homeLat: number | null,
  homeLng: number | null,
  radiusKm: number,
) {
  const [bookings, setBookings] = useState<OpenBooking[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetch = async () => {
    if (!professionalId || functionIds.length === 0) { setBookings([]); setLoading(false); return; }

    setLoading(true);

    // Vagas em aberto (oferta aberta) para as funções do profissional
    const { data, error } = await supabase
      .from('vagas')
      .select(`
        id, function_id, category, price, status, professional_id,
        events ( id, name, location_name, starts_at, ends_at, location, status )
      `)
      .eq('status', 'OPEN')
      .is('professional_id', null)
      .in('function_id', functionIds);

    if (error || !data) { setBookings([]); setLoading(false); return; }

    const now = new Date();

    // Agrupar por evento + função
    const groups = new Map<string, OpenBooking>();

    for (const v of data as any[]) {
      const ev = v.events;
      if (!ev) continue;
      if (new Date(ev.starts_at) <= now) continue; // só eventos futuros

      // Coordenadas do evento
      let evLat: number | null = null;
      let evLng: number | null = null;
      const loc = ev.location;
      if (loc && typeof loc === 'object' && loc.coordinates) {
        evLng = loc.coordinates[0];
        evLat = loc.coordinates[1];
      }
      if (evLat == null || evLng == null) continue;

      // Distância (haversine client-side)
      let distanceKm: number | null = null;
      if (homeLat && homeLng) {
        distanceKm = haversineKm(homeLat, homeLng, evLat, evLng);
        if (distanceKm > radiusKm) continue;
      }

      const key = `${ev.id}:${v.function_id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.slots_open  += 1;
        existing.slots_total += 1;
      } else {
        groups.set(key, {
          group_key:       key,
          vaga_id:         v.id,
          event_id:        ev.id,
          event_name:      ev.name,
          location_name:   ev.location_name,
          lat:             evLat,
          lng:             evLng,
          starts_at:       ev.starts_at,
          ends_at:         ev.ends_at,
          category:        v.category ?? '',
          amount:          Number(v.price ?? 0),
          slots_total:     1,
          slots_open:      1,
          distance_km:     distanceKm,
          already_invited: false,
        });
      }
    }

    setBookings([...groups.values()]);
    setLoading(false);
  };

  useEffect(() => {
    fetch();

    // Realtime — atualiza quando uma vaga muda (alguém aceitou)
    const channel = supabase
      .channel('open-vagas')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'vagas',
      }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, functionIds.join(','), homeLat, homeLng, radiusKm]);

  // Aceitar a vaga (oferta aberta) — primeiro a clicar fica com ela
  const acceptVaga = async (vagaId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('accept_vaga', { p_vaga_id: vagaId });
    if (error) throw error;
    await fetch();
    return data === true;
  };

  return { bookings, loading, refetch: fetch, acceptVaga };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
