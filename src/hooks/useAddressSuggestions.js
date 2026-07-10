import { useState, useRef, useEffect } from 'react';

export function useAddressSuggestions(googleMapsKey) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const timerRef = useRef(null);

  const fetchGooglePlaceSuggestions = async (query) => {
    if (!googleMapsKey) return [];
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=geocode&language=pt-BR&key=${googleMapsKey}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      if (json.status !== 'OK' || !json.predictions?.length) return [];
      return json.predictions.map((prediction) => ({
        id: prediction.place_id,
        label: prediction.description,
        place_id: prediction.place_id,
        source: 'google',
      }));
    } catch {
      return [];
    }
  };

  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      let suggestionsData = [];
      if (googleMapsKey) {
        suggestionsData = await fetchGooglePlaceSuggestions(query);
      }
      if (!suggestionsData.length) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const json = await res.json();
          suggestionsData = (json || []).map((item) => ({
            id: item.place_id || `${item.lat}${item.lon}`,
            label: item.display_name,
            source: 'osm',
          }));
        }
      }
      setSuggestions(suggestionsData);
      setShowSuggestions(suggestionsData.length > 0);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setLoadingSuggestions(false);
  };

  const scheduleAddressSuggestions = (query) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      fetchAddressSuggestions(query);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    showSuggestions,
    loadingSuggestions,
    setShowSuggestions,
    scheduleAddressSuggestions,
    fetchAddressSuggestions,
  };
}
