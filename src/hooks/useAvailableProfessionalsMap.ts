import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ProfessionalCategory } from '../lib/database.types';

export interface ProfessionalPin {
  professional_id: string;
  full_name:        string;
  category:         ProfessionalCategory;
  stars:            number;
  events_count:     number;
  hourly_cache:     number;
  lat:              number;
  lng:              number;
  avatar_url:       string | null;
}

/**
 * Busca profissionais disponíveis (is_available = true, status = ACTIVE)
 * que possuem coordenadas cadastradas, para exibir no mapa do contratante.
 * Filtragem por categoria é opcional.
 */
export function useAvailableProfessionalsMap(categoryFilter?: ProfessionalCategory | null) {
  const [pins, setPins]       = useState<ProfessionalPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // Busca profissionais disponíveis com localização
      let query = supabase
        .from('professionals')
        .select(`
          id,
          category,
          stars,
          events_count,
          hourly_cache,
          home_location,
          users ( full_name, avatar_url )
        `)
        .eq('is_available', true)
        .eq('status', 'ACTIVE')
        .not('home_location', 'is', null);

      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      const { data, error: err } = await query.limit(100);

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const result: ProfessionalPin[] = [];

      for (const row of data ?? []) {
        // home_location é geography POINT(lng lat) — Supabase retorna como GeoJSON
        const geo = row.home_location as { type: string; coordinates: [number, number] } | null;
        if (!geo?.coordinates) continue;

        const [lng, lat] = geo.coordinates;
        const u = row.users as { full_name: string; avatar_url: string | null } | null;

        result.push({
          professional_id: row.id,
          full_name:        u?.full_name ?? 'Profissional',
          category:         row.category as ProfessionalCategory,
          stars:            row.stars ?? 0,
          events_count:     row.events_count ?? 0,
          hourly_cache:     row.hourly_cache ?? 0,
          lat,
          lng,
          avatar_url:       u?.avatar_url ?? null,
        });
      }

      setPins(result);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [categoryFilter]);

  return { pins, loading, error };
}
