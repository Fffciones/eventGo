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

  // Reverse geocode: lat/lng → endereço formatado
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<GeoResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?` +
        new URLSearchParams({ lat: String(lat), lon: String(lng), format: 'json' });
      const res  = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt', 'User-Agent': 'EventPro/1.0' },
      });
      const data = await res.json();
      if (!data || data.error) { setError('Localização não encontrada.'); return null; }
      return { lat, lng, formatted: data.display_name };
    } catch {
      setError('Sem conexão. Verifique sua internet.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtém posição atual do dispositivo e faz reverse geocode
  const geocodeCurrentPosition = useCallback((): Promise<GeoResult | null> => {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        setError('Geolocalização não suportada neste dispositivo.');
        resolve(null);
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          resolve(result);
        },
        () => {
          setLoading(false);
          setError('Permissão de localização negada.');
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: false },
      );
    });
  }, [reverseGeocode]);

  return { geocode, reverseGeocode, geocodeCurrentPosition, loading, error };
}
