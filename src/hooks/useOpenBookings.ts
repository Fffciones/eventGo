import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ProfessionalCategory } from './useProfessionalProfile';

export interface OpenBooking {
  booking_id:    string;
  event_id:      string;
  event_name:    string;
  location_name: string;
  lat:           number;
  lng:           number;
  starts_at:     string;
  ends_at:       string;
  category:      string;
  amount:        number;
  slots_total:   number;
  slots_filled:  number;
  slots_open:    number;
  distance_km:   number | null;
  // já tem convite pendente para este profissional?
  already_invited: boolean;
}

export function useOpenBookings(
  professionalId: string | undefined,
  category: ProfessionalCategory | undefined,
  homeLat: number | null,
  homeLng: number | null,
  radiusKm: number,
) {
  const [bookings, setBookings] = useState<OpenBooking[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetch = async () => {
    if (!professionalId || !category) { setLoading(false); return; }

    setLoading(true);

    // Busca bookings da categoria do profissional com vagas abertas
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        category,
        quantity,
        total_amount,
        events (
          id, name, location_name, starts_at, ends_at, location,
          status
        ),
        booking_professionals (
          id, status, professional_id
        )
      `)
      .eq('category', category)
      .eq('events.status', 'PUBLISHED');

    if (error || !data) { setLoading(false); return; }

    const now = new Date();

    const result: OpenBooking[] = [];

    for (const b of data) {
      const ev = (b as any).events;
      if (!ev) continue;

      // Só eventos futuros
      if (new Date(ev.starts_at) <= now) continue;

      const bps: any[] = (b as any).booking_professionals ?? [];
      const slotsFilled = bps.filter((bp: any) =>
        ['ACCEPTED','IN_TRANSIT','CHECKED_IN','CHECKED_OUT'].includes(bp.status)
      ).length;
      const slotsOpen = (b as any).quantity - slotsFilled;
      if (slotsOpen <= 0) continue;

      // Já foi convidado?
      const alreadyInvited = bps.some((bp: any) =>
        bp.professional_id === professionalId && bp.status === 'INVITED'
      );

      // Calcular distância (simplificado — haversine client-side)
      let distanceKm: number | null = null;
      const loc = ev.location; // geography vem como GeoJSON string ou null
      let evLat: number | null = null;
      let evLng: number | null = null;

      if (loc && typeof loc === 'object' && loc.coordinates) {
        evLng = loc.coordinates[0];
        evLat = loc.coordinates[1];
      }

      if (homeLat && homeLng && evLat && evLng) {
        distanceKm = haversineKm(homeLat, homeLng, evLat, evLng);
        if (distanceKm > radiusKm) continue; // fora do raio
      }

      if (!evLat || !evLng) continue; // sem coordenadas, pular

      const hourlyCache = (b as any).total_amount / Math.max(
        1,
        (new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / 3_600_000
      );

      result.push({
        booking_id:      b.id,
        event_id:        ev.id,
        event_name:      ev.name,
        location_name:   ev.location_name,
        lat:             evLat,
        lng:             evLng,
        starts_at:       ev.starts_at,
        ends_at:         ev.ends_at,
        category:        (b as any).category,
        amount:          (b as any).total_amount ?? 0,
        slots_total:     (b as any).quantity,
        slots_filled:    slotsFilled,
        slots_open:      slotsOpen,
        distance_km:     distanceKm,
        already_invited: alreadyInvited,
      });
    }

    setBookings(result);
    setLoading(false);
  };

  useEffect(() => {
    fetch();

    // Realtime — atualiza quando alguém aceita uma vaga
    const channel = supabase
      .channel('open-bookings')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'booking_professionals',
      }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [professionalId, category, homeLat, homeLng, radiusKm]);

  return { bookings, loading, refetch: fetch };
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
