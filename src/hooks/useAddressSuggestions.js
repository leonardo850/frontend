import { useState, useRef, useEffect } from 'react';

export function useAddressSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchGoogleSuggestions = (query) => new Promise((resolve, reject) => {
    const callbackName = `googleSuggestCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    window[callbackName] = (response) => {
      try {
        const labels = (response && response[1]) || [];
        resolve(labels.map((label) => ({ id: label, label, source: 'google' })));
      } catch (err) {
        reject(err);
      } finally {
        cleanup();
      }
    };

    script.src = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&q=${encodeURIComponent(query)}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('Google suggestions failed'));
    };
    document.body.appendChild(script);
  });

  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      let suggestionsData = [];
      try {
        suggestionsData = await fetchGoogleSuggestions(query);
      } catch {
        suggestionsData = [];
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

      if (isMountedRef.current) {
        setSuggestions(suggestionsData);
        setShowSuggestions(suggestionsData.length > 0);
      }
    } catch {
      if (isMountedRef.current) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
    if (isMountedRef.current) {
      setLoadingSuggestions(false);
    }
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
      isMountedRef.current = false;
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
