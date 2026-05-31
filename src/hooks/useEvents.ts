import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];

export function useEvents(clientId?: string) {
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    fetchEvents();
  }, [clientId]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('client_id', clientId!)
      .order('starts_at', { ascending: false });

    if (error) setError(error.message);
    else setEvents(data ?? []);
    setLoading(false);
  };

  const createEvent = async (payload: Omit<EventInsert, 'client_id'> & { client_id: string }) => {
    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    setEvents(prev => [data, ...prev]);
    return data;
  };

  const updateEventStatus = async (eventId: string, status: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', eventId);

    if (error) throw error;
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e));
  };

  return { events, loading, error, createEvent, updateEventStatus, refetch: fetchEvents };
}
