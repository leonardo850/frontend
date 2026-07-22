import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteIds, toggleFavorite } from '../lib/favorites';
import { barbershopsAPI } from '../lib/api';
import ShopCard from '../components/ShopCard';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAddressSuggestions } from '../hooks/useAddressSuggestions';

export default function HomePage({ navigate }) {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationText, setLocationText] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [category, setCategory] = useState('todos');
  const [toast, setToast] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [favShops, setFavShops] = useState(() => getFavoriteIds('shop', user?.id));
  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const { suggestions, showSuggestions, setShowSuggestions, scheduleAddressSuggestions } = useAddressSuggestions();
  const { location: deviceLocation } = useGeolocation();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
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

  const reverseGeocode = async ({ lat, lng }) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json?.display_name || null;
    } catch {
      return null;
    }
  };

  const loadShops = async (searchValue, manualLocationValue, coords) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = {};
      const query = [searchValue, manualLocationValue].filter(Boolean).join(' ').trim();
      if (query) params.search = query;
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
        params.radius = 10;
      }

      const { data } = await barbershopsAPI.getAll(params, controller.signal);
      if (mountedRef.current) {
        setShops(data?.barbershops || []);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('Erro ao buscar barbearias:', err);
      if (mountedRef.current) setShops([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadShops('', '', null);
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!deviceLocation) return;
    setLocationCoords(deviceLocation);
    loadShops(search, manualLocation, deviceLocation);
    (async () => {
      const address = await reverseGeocode(deviceLocation);
      if (mountedRef.current && address) {
        setManualLocation(address);
        setLocationText(address);
      }
    })();
  }, [deviceLocation]);

  useEffect(() => {
    setFavShops(getFavoriteIds('shop', user?.id));
  }, [user]);

  const handleApplyLocation = async () => {
    const value = locationText.trim();
    setManualLocation(value);
    if (value) {
      const coords = await geocodeAddress(value);
      setLocationCoords(coords);
      loadShops(search, value, coords);
    } else {
      setLocationCoords(null);
      loadShops(search, '', null);
    }
    setShowLocationInput(false);
    showToast(value ? 'Local aplicado' : 'Endereço limpo');
  };

  const handleClearLocation = () => {
    setLocationText('');
    setManualLocation('');
    setLocationCoords(null);
    setShowLocationInput(false);
    loadShops(search, '', null);
    showToast('Localização limpa');
  };

  const handleSearch = () => {
    loadShops(search, manualLocation, locationCoords);
  };

  const handleToggleShopFavorite = (shop) => {
    const next = toggleFavorite('shop', user?.id, shop.id);
    setFavShops(next);
    showToast(next.includes(shop.id) ? 'Barbearia favoritada' : 'Removida dos favoritos');
  };

  const filteredShops = category === 'todos'
    ? shops
    : shops.filter(s => s.services?.some(svc => svc.category === category));

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
            <div style={{ fontSize: 16, fontWeight: 18, color: 'var(--text)', lineHeight: 1.4, minHeight: 24 }}>
              {manualLocation ? manualLocation : (
                <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setShowLocationInput(true)}>
                  Toque para definir localização
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate('login')} title="Perfil">👤</button>
      </div>

      {/* Location Input */}
      {(showLocationInput || !manualLocation) && (
        <div style={{ margin: '16px 20px 0', position: 'relative' }}>
          <input
            className="input-field"
            placeholder="Digite sua cidade, bairro ou endereço"
            value={locationText}
            onChange={(e) => {
              setLocationText(e.target.value);
              scheduleAddressSuggestions(e.target.value);
            }}
            onKeyDown={e => e.key === 'Enter' && handleApplyLocation()}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            style={{ width: '100%', padding: '20px 18px', fontSize: 18, minHeight: 68 }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--dark2)', border: '1px solid var(--border)', borderTop: 'none',
              borderRadius: '0 0 12px 12px', maxHeight: 280, overflowY: 'auto', zIndex: 1000, marginTop: -1
            }}>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    setLocationText(suggestion.label);
                    setShowSuggestions(false);
                    const coords = await geocodeAddress(suggestion.label);
                    setManualLocation(suggestion.label);
                    setLocationCoords(coords);
                    loadShops(search, suggestion.label, coords);
                    showToast('Local aplicado');
                  }}
                  style={{
                    display: 'block', width: '100%', padding: '14px 16px',
                    background: 'transparent', border: 'none', color: 'var(--text)',
                    textAlign: 'left', cursor: 'pointer', fontSize: 14,
                    borderBottom: '1px solid var(--border)', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--dark3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{suggestion.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      {suggestion.source === 'google' ? 'Google' : 'OSM'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-primary" style={{ flex: 1, padding: '16px 18px', fontSize: 16, minHeight: 52 }} onClick={handleApplyLocation}>
              Aplicar
            </button>
            {manualLocation && (
              <button className="btn-secondary" style={{ padding: '16px 18px', fontSize: 14, minHeight: 52 }} onClick={handleClearLocation}>
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ margin: '12px 20px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 16 }}>🔍</span>
          <input
            className="input-field"
            style={{ paddingLeft: 40, paddingRight: 16, minHeight: 52, fontSize: 16 }}
            placeholder="Buscar barbearias ou serviços..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button className="btn-primary" style={{ flexShrink: 0, minWidth: 120, padding: '14px 18px', fontSize: 16, minHeight: 52 }} onClick={handleSearch}>
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
      <div style={{ margin: '20px 0 40px' }}>
        <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div className="section-title">
              {manualLocation ? 'Barbearias próximas' : 'Barbearias disponíveis'}
            </div>
            {manualLocation && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                📍 {manualLocation}
              </div>
            )}
          </div>
          {!loading && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{filteredShops.length} {filteredShops.length === 1 ? 'encontrada' : 'encontradas'}</span>}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /><span>Carregando barbearias...</span></div>
        ) : filteredShops.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💈</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nenhuma barbearia encontrada</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Tente buscar por outro termo ou defina sua localização</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
            {filteredShops.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onClick={() => navigate('barbershop', { shop })}
                favorited={favShops.includes(shop.id)}
                onToggleFavorite={() => handleToggleShopFavorite(shop)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
