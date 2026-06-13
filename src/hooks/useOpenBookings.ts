import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface OpenBooking {
  group_key:     string;     // event_id + ':' + function_id
  vaga_id:       string;     // uma vaga aberta do grupo (referência, não usada no aceite)
  event_id:      string;
  function_id:   string;
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
  const channelId = useRef(`open-vagas-${Math.random().toString(36).slice(2)}`);

  const fetch = async () => {
    if (!professionalId) { setBookings([]); setLoading(false); return; }

    setLoading(true);

    // RPC retorna lat/lng já como float (evita problema com PostGIS WKB hex)
    const { data, error } = await supabase
      .rpc('get_open_vagas_for_professional', { p_professional_id: professionalId });

    if (error || !data) { setBookings([]); setLoading(false); return; }

    // Agrupar por evento + função
    const groups = new Map<string, OpenBooking>();

    for (const v of data as any[]) {
      const evLat: number = v.lat;
      const evLng: number = v.lng;

      // Distância (haversine client-side) — só filtra se tiver endereço cadastrado
      let distanceKm: number | null = null;
      if (homeLat && homeLng) {
        distanceKm = haversineKm(homeLat, homeLng, evLat, evLng);
        if (distanceKm > radiusKm) continue;
      }

      // Agrupa por evento (não por evento+função) para evitar pins sobrepostos
      const key = v.event_id;
      const existing = groups.get(key);
      if (existing) {
        existing.slots_open  += 1;
        existing.slots_total += 1;
        // Usa o maior valor de remuneração para mostrar no pin
        if (Number(v.price ?? 0) > existing.amount) {
          existing.amount      = Number(v.price ?? 0);
          existing.function_id = v.function_id;
          existing.category    = v.category ?? '';
        }
      } else {
        groups.set(key, {
          group_key:       key,
          vaga_id:         v.vaga_id,
          event_id:        v.event_id,
          function_id:     v.function_id,
          event_name:      v.event_name,
          location_name:   v.location_name,
          lat:             evLat,
          lng:             evLng,
          starts_at:       v.starts_at,
          ends_at:         v.ends_at,
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
      .channel(channelId.current)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'vagas',
      }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, homeLat, homeLng, radiusKm]);

  // Aceitar a primeira vaga disponível do grupo (event + function).
  // Usa accept_open_vaga que faz FOR UPDATE SKIP LOCKED para evitar race condition.
  const acceptVaga = async (eventId: string, functionId?: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('accept_open_vaga', {
      p_event_id:    eventId,
      p_function_id: functionId ?? null,
    });
    if (error) throw error;
    await fetch();
    return data !== null;
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
