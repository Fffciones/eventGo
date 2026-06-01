import { useState, useCallback } from 'react';

export interface GeoResult {
  lat: number;
  lng: number;
  formatted: string;
}

// Usa OpenStreetMap Nominatim — gratuito, sem chave, sem faturamento
export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const geocode = useCallback(async (address: string): Promise<GeoResult | null> => {
    if (!address.trim()) return null;
    setLoading(true);
    setError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q:              address,
          format:         'json',
          addressdetails: '1',
          limit:          '1',
          countrycodes:   'br',   // prioriza Brasil
        });

      const res  = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt', 'User-Agent': 'EventPro/1.0' },
      });
      const data = await res.json();

      if (!data || data.length === 0) {
        setError('Endereço não encontrado. Tente ser mais específico.');
        return null;
      }

      const r = data[0];
      return {
        lat:       parseFloat(r.lat),
        lng:       parseFloat(r.lon),
        formatted: r.display_name,
      };
    } catch {
      setError('Sem conexão. Verifique sua internet.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { geocode, loading, error };
}
