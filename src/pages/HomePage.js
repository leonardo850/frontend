import { useState, useEffect, useCallback } from 'react';
import { barbershopsAPI } from '../lib/api';
import ShopCard from '../components/ShopCard';

export default function HomePage({ navigate }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationText, setLocationText] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [category, setCategory] = useState('todos');
  const [toast, setToast] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const json = await res.json();
      setSuggestions(json || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  const geocodeAddress = async (address) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json?.length) return null;
      return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
    } catch {
      return null;
    }
  };

  const buildParams = (searchValue = search, manualLocationValue = manualLocation, coords = null) => {
    const query = [searchValue, manualLocationValue].filter(Boolean).join(' ').trim();
    const params = {};
    if (query) params.search = query;
    if (coords) {
      params.lat = coords.lat;
      params.lng = coords.lng;
      params.radius = 20;
    }
    return params;
  };

  const getDemoShops = (location = '') => {
    const baseShops = [
      { id: '1', name: 'Barber King', address: 'Rua das Flores, 123', city: 'Jaú', is_open: true, rating: 4.9, total_reviews: 124, distance_km: 0.3, services: [{ price: 30 }] },
      { id: '2', name: 'Studio 7', address: 'Av. Central, 456', city: 'Jaú', is_open: true, rating: 4.7, total_reviews: 89, distance_km: 0.8, services: [{ price: 25 }] },
      { id: '3', name: 'Noble Barbers', address: 'Rua Prudente de Moraes, 321', city: 'Jaú', is_open: true, rating: 4.8, total_reviews: 67, distance_km: 1.1, services: [{ price: 45 }] },
    ];
    
    if (location && location.toLowerCase().includes('são paulo')) {
      return [
        { id: '1', name: 'Barber King', address: 'Rua Consolação, 2000', city: 'São Paulo', is_open: true, rating: 4.9, total_reviews: 156, distance_km: 0.5, services: [{ price: 35 }] },
        { id: '2', name: 'Studio 7', address: 'Av. Paulista, 1500', city: 'São Paulo', is_open: true, rating: 4.8, total_reviews: 102, distance_km: 1.2, services: [{ price: 30 }] },
        { id: '3', name: 'Barber Club', address: 'Rua Oscar Freire, 456', city: 'São Paulo', is_open: true, rating: 4.7, total_reviews: 89, distance_km: 1.8, services: [{ price: 40 }] },
      ];
    }
    
    return baseShops;
  };

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const { data } = await barbershopsAPI.getAll(params);
      setShops(data.barbershops || []);
    } catch {
      // Demo fallback com localização do usuário
      setShops(getDemoShops(manualLocation));
    }
    setLoading(false);
  }, [search, manualLocation]);

  const handleApplyLocation = async () => {
    const value = locationText.trim();
    setManualLocation(value);
    setLoading(true);
    try {
      const coords = value ? await geocodeAddress(value) : null;
      const params = buildParams(search, value, coords);
      const { data } = await barbershopsAPI.getAll(params);
      setShops(data.barbershops || []);
      showToast(value ? 'Local aplicado' : 'Endereço limpo');
    } catch {
      // Demo fallback com localização do usuário
      setShops(getDemoShops(value));
    }
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const categories = [
    { id: 'todos', label: 'Todos', icon: '✂️' },
    { id: 'corte', label: 'Corte', icon: '💈' },
    { id: 'barba', label: 'Barba', icon: '🪒' },
    { id: 'pigmento', label: 'Pigmento', icon: '🎨' },
    { id: 'sobrancelha', label: 'Sobrancelha', icon: '👁️' },
  ];

  return (
    <div className="page" style={{ background: 'var(--dark)' }}>
      {toast && <div className="toast-msg">{toast}</div>}

      {/* Header */}
      <div style={{ padding: '5px 5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 50, flex: 1, minWidth: 0 }}>
          <div className="logo-text">LE<span>BUX</span></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Sua localização</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, minHeight: 24 }}>
              {manualLocation ? manualLocation : 'Digite seu endereço abaixo'}
            </div>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate('login')} title="Perfil">👤</button>
      </div>

      <div style={{ margin: '16px 20px 0', position: 'relative' }}>
        <input
          className="input-field"
          placeholder="Digite sua cidade, bairro ou endereço"
          value={locationText}
          onChange={(e) => {
            setLocationText(e.target.value);
            fetchAddressSuggestions(e.target.value);
          }}
          onKeyDown={e => e.key === 'Enter' && handleApplyLocation()}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          style={{ width: '100%', padding: '20px 18px', fontSize: 18, minHeight: 68 }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--dark2)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            maxHeight: 280,
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: -1
          }}>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setLocationText(suggestion.display_name);
                  setManualLocation(suggestion.display_name);
                  setShowSuggestions(false);
                  setLoading(true);
                  geocodeAddress(suggestion.display_name).then(coords => {
                    const params = buildParams(search, suggestion.display_name, coords);
                    barbershopsAPI.getAll(params).then(({ data }) => {
                      setShops(data.barbershops || []);
                      showToast('Local aplicado');
                    }).catch(() => {
                      // Demo fallback com localização do usuário
                      setShops(getDemoShops(suggestion.display_name));
                    }).finally(() => setLoading(false));
                  });
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14,
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--dark3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {suggestion.display_name}
              </button>
            ))}
          </div>
        )}
        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: 12, padding: '16px 18px', fontSize: 16, minHeight: 52 }}
          onClick={handleApplyLocation}
        >
          Aplicar
        </button>
      </div>

      {/* Search */}
      <div style={{ margin: '12px 20px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 16 }}>🔍</span>
          <input
            className="input-field"
            style={{ paddingLeft: 40, paddingRight: 16, minHeight: 52, fontSize: 16 }}
            placeholder="Buscar barbearias, serviços ou endereço..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchShops()}
          />
        </div>
        <button
          className="btn-primary"
          style={{ flexShrink: 0, minWidth: 120, padding: '14px 18px', fontSize: 16, minHeight: 52 }}
          onClick={fetchShops}
        >
          Buscar
        </button>
      </div>

      {/* Promo banner */}
      <div style={{ margin: '16px 20px 0', background: 'linear-gradient(135deg, var(--gold), #6BA8F7)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#0F0F0F', fontSize: 15 }}>Primeira barba grátis!</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Para novos clientes cadastrados</div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 12px', fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, letterSpacing: 2, color: '#0F0F0F', fontWeight: 700 }}>LEBUX1</div>
      </div>

      {/* Categories */}
      <div style={{ margin: '20px 0 0' }}>
        <div style={{ padding: '0 20px', marginBottom: 12 }} className="section-title">Serviços</div>
        <div style={{ display: 'flex', gap: 10, padding: '0 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              style={{
                flexShrink: 0, background: category === c.id ? 'var(--gold)' : 'var(--dark3)',
                border: `1px solid ${category === c.id ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 68
              }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: category === c.id ? 'var(--dark)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shops List */}
      <div style={{ margin: '20px 0 0' }}>
        <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-title">Próximas de você</span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{shops.length} encontradas</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /><span>Buscando barbearias...</span></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
            {shops.map(shop => (
              <ShopCard key={shop.id} shop={shop} onClick={() => navigate('barbershop', { shop })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
