import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude });
        setLoading(false);
      },
      (err) => {
        // Fallback para Jaú, SP
        setLocation({ lat: -22.2964, lng: -48.5589 });
        setError('Usando localização padrão: Jaú, SP');
        setLoading(false);
      }
    );
  }, []);

  return { location, error, loading };
}
