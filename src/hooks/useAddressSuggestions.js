import { useState, useRef, useEffect } from 'react';

export function useAddressSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const timerRef = useRef(null);

  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      );
      let suggestionsData = [];
      if (res.ok) {
        const json = await res.json();
        suggestionsData = (json || []).map((item) => ({
          id: item.place_id || `${item.lat}${item.lon}`,
          label: item.display_name,
          source: 'osm',
        }));
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
