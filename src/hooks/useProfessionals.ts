import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProfessionalCategory } from '../lib/database.types';

export interface AvailableProfessional {
  professional_id: string;
  user_id: string;
  full_name: string;
  stars: number;
  events_count: number;
  hourly_cache: number;
  distance_m: number;
  is_favorite: boolean;
}

export function useProfessionals() {
  const [results, setResults]   = useState<AvailableProfessional[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const search = async (params: {
    category: ProfessionalCategory;
    starts_at: string;
    ends_at: string;
    latitude: number;
    longitude: number;
    radius_km?: number;
  }) => {
    setLoading(true);
    setError(null);

    // PostGIS espera POINT(lng lat)
    const location = `POINT(${params.longitude} ${params.latitude})`;

    const { data, error } = await supabase.rpc('find_available_professionals', {
      p_category:   params.category,
      p_starts_at:  params.starts_at,
      p_ends_at:    params.ends_at,
      p_location:   location,
      p_radius_km:  params.radius_km ?? 5,
    });

    if (error) setError(error.message);
    else setResults(data ?? []);
    setLoading(false);
    return data ?? [];
  };

  const toggleFavorite = async (clientId: string, professionalId: string, isFavorite: boolean) => {
    if (isFavorite) {
      await supabase.from('client_favorites').delete()
        .eq('client_id', clientId).eq('professional_id', professionalId);
    } else {
      await supabase.from('client_favorites').insert({ client_id: clientId, professional_id: professionalId });
    }
    // Atualiza flag localmente
    setResults(prev => prev.map(p =>
      p.professional_id === professionalId ? { ...p, is_favorite: !isFavorite } : p
    ));
  };

  const calculatePrice = async (params: {
    category: ProfessionalCategory;
    star_level: number;
    starts_at: string;
    ends_at: string;
    multiplier_type?: 'NORMAL' | 'EMERGENCY' | 'AFTER_HOURS';
  }) => {
    const { data, error } = await supabase.rpc('calculate_booking_price', {
      p_category:       params.category,
      p_star_level:     params.star_level,
      p_starts_at:      params.starts_at,
      p_ends_at:        params.ends_at,
      p_multiplier_type: params.multiplier_type ?? 'NORMAL',
    });
    if (error) throw error;
    return data as number;
  };

  return { results, loading, error, search, toggleFavorite, calculatePrice };
}
