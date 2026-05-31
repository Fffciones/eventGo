import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database, ProfessionalCategory, PriceMultiplierType } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingProfessional = Database['public']['Tables']['booking_professionals']['Row'];

export function useBookings(eventId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    fetchBookings();

    // Realtime: atualiza status dos bookings em tempo real
    const channel = supabase
      .channel(`bookings:${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setBookings(prev =>
            prev.map(b => b.id === (payload.new as Booking).id ? payload.new as Booking : b)
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, booking_professionals(*)')
      .eq('event_id', eventId!);

    if (error) setError(error.message);
    else setBookings(data ?? []);
    setLoading(false);
  };

  const createBooking = async (payload: {
    event_id: string;
    category: ProfessionalCategory;
    quantity: number;
    multiplier_type?: PriceMultiplierType;
    total_amount: number;
    search_radius_km?: number;
  }) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert({ commission_pct: 15, ...payload })
      .select()
      .single();

    if (error) throw error;
    setBookings(prev => [data, ...prev]);
    return data;
  };

  const addProfessionalToBooking = async (bookingId: string, professionalId: string, amount: number) => {
    const { data, error } = await supabase
      .from('booking_professionals')
      .insert({ booking_id: bookingId, professional_id: professionalId, amount })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const processPayment = async (bookingId: string) => {
    const { error } = await supabase.rpc('process_booking_payment', {
      p_booking_id: bookingId,
    });
    if (error) throw error;
    await fetchBookings();
  };

  return { bookings, loading, error, createBooking, addProfessionalToBooking, processPayment, refetch: fetchBookings };
}

// Hook para profissional gerenciar seus próprios bookings
export function useProfessionalBookings(professionalId?: string) {
  const [bookings, setBookings] = useState<(BookingProfessional & { booking: Booking })[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!professionalId) return;
    fetchMyBookings();

    // Realtime: convites chegando
    const channel = supabase
      .channel(`bp:${professionalId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_professionals',
        filter: `professional_id=eq.${professionalId}`,
      }, () => fetchMyBookings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [professionalId]);

  const fetchMyBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('booking_professionals')
      .select('*, booking:bookings(*)')
      .eq('professional_id', professionalId!)
      .order('created_at', { ascending: false });

    if (!error) setBookings((data as any) ?? []);
    setLoading(false);
  };

  const activateTransit = async (bookingProfessionalId: string) => {
    const { error } = await supabase.rpc('activate_transit', {
      p_booking_professional_id: bookingProfessionalId,
    });
    if (error) throw error;
    await fetchMyBookings();
  };

  const checkIn = async (bookingProfessionalId: string) => {
    const { error } = await supabase.rpc('professional_checkin', {
      p_booking_professional_id: bookingProfessionalId,
    });
    if (error) throw error;
    await fetchMyBookings();
  };

  const checkOut = async (bookingProfessionalId: string) => {
    const { error } = await supabase
      .from('booking_professionals')
      .update({ status: 'CHECKED_OUT', checkout_at: new Date().toISOString() })
      .eq('id', bookingProfessionalId);

    if (error) throw error;
    await fetchMyBookings();
  };

  return { bookings, loading, activateTransit, checkIn, checkOut, refetch: fetchMyBookings };
}
