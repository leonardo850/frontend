import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteIds, toggleFavorite } from '../lib/favorites';
import { barbershopsAPI } from '../lib/api';
import ShopCard from '../components/ShopCard';
import { useAddressSuggestions } from '../hooks/useAddressSuggestions';

const DEMO = [
  { id: 'd1', name: 'Barbearia do Correa', address: 'Rua Sebastião Humel, 123', city: 'São José dos Campos', state: 'SP', phone: '(12) 3921-1001', latitude: -23.1885, longitude: -45.8835, is_open: true, rating: 4.8, total_reviews: 156, distance_km: null, services: [{ id: 'ds1', name: 'Corte Clássico', price: 30, duration_minutes: 30, category: 'corte' }, { id: 'ds2', name: 'Barba Completa', price: 25, duration_minutes: 25, category: 'barba' }, { id: 'ds3', name: 'Corte + Barba', price: 50, duration_minutes: 50, category: 'combo' }, { id: 'ds10', name: 'Corte Feminino', price: 40, duration_minutes: 40, category: 'corte_feminino' }] },
  { id: 'd2', name: 'Old King Barbershop', address: 'Av. São João, 789', city: 'São José dos Campos', state: 'SP', phone: '(12) 3922-2002', latitude: -23.1960, longitude: -45.8770, is_open: true, rating: 4.9, total_reviews: 203, distance_km: null, services: [{ id: 'ds4', name: 'Corte Degradê', price: 35, duration_minutes: 35, category: 'corte' }, { id: 'ds5', name: 'Barba Completa', price: 25, duration_minutes: 25, category: 'barba' }, { id: 'ds6', name: 'Corte + Barba', price: 50, duration_minutes: 50, category: 'combo' }] },
  { id: 'd3', name: 'Barbearia São Benedito', address: 'Rua XV de Novembro, 456', city: 'São José dos Campos', state: 'SP', phone: '(12) 3923-3003', latitude: -23.1895, longitude: -45.8840, is_open: true, rating: 4.7, total_reviews: 189, distance_km: null, services: [{ id: 'ds7', name: 'Corte Tradicional', price: 28, duration_minutes: 30, category: 'corte' }, { id: 'ds8', name: 'Barba Tradicional', price: 22, duration_minutes: 25, category: 'barba' }, { id: 'ds9', name: 'Corte + Barba', price: 45, duration_minutes: 50, category: 'combo' }] },
];

export default function HomePage({ navigate }) {
  const { user } = useAuth();
  const [shops, setShops] = useState(DEMO);
  const [apiStatus, setApiStatus] = useState('carregando');
  const [search, setSearch] = useState('');
  const [locationText, setLocationText] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [category, setCategory] = useState('todos');
  const [toast, setToast] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationApplied, setLocationApplied] = useState(false);
  const [favShops, setFavShops] = useState(() => getFavoriteIds('shop', user?.id));
  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const { suggestions, showSuggestions, setShowSuggestions, scheduleAddressSuggestions } = useAddressSuggestions();

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

  const fetchFromAPI = async (searchValue, manualLocationValue, coords) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const params = {};
      const query = [searchValue, manualLocationValue].filter(Boolean).join(' ').trim();
      if (query) params.search = query;
      if (coords) { params.lat = coords.lat; params.lng = coords.lng; params.radius = 10; }

      const { data } = await barbershopsAPI.getAll(params, controller.signal);
      clearTimeout(timeoutId);

      if (mountedRef.current) {
        const apiShops = data?.barbershops || [];
        if (apiShops.length > 0) {
          setShops(apiShops);
          setApiStatus('ok');
        } else {
          setApiStatus('vazio');
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        if (mountedRef.current) setApiStatus('timeout');
        return;
      }
      if (mountedRef.current) setApiStatus('erro');
    }
  };

  // Auto-carregar endereço do usuário logado (só para exibição)
  useEffect(() => {
    if (!user?.address || !user?.city) return;
    const fullAddress = `${user.address}, ${user.city}${user.state ? ` - ${user.state}` : ''}`;
    setManualLocation(fullAddress);
    setLocationText(fullAddress);
    setLocationApplied(false);
    fetchFromAPI('', '', null);
  }, [user?.id]);

  useEffect(() => {
    if (user?.address && user?.city) return;
    fetchFromAPI('', '', null);
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    setFavShops(getFavoriteIds('shop', user?.id));
  }, [user]);

  const handleApplyLocation = async () => {
    const v = locationText.trim();
    setManualLocation(v);
    if (v) { const c = await geocodeAddress(v); setLocationCoords(c); setLocationApplied(true); fetchFromAPI('', v, c); }
    else { setLocationCoords(null); setLocationApplied(false); fetchFromAPI('', '', null); }
    setShowLocationInput(false);
    showToast(v ? 'Local aplicado' : 'Limpo');
  };

  const handleClearLocation = () => {
    setLocationText(''); setManualLocation(''); setLocationCoords(null); setLocationApplied(false);
    setShowLocationInput(false); fetchFromAPI('', '', null);
    showToast('Localização limpa');
  };

  const handleSearch = () => fetchFromAPI(search, '', locationApplied ? locationCoords : null);

  const handleToggleShopFavorite = (shop) => {
    const next = toggleFavorite('shop', user?.id, shop.id);
    setFavShops(next);
    showToast(next.includes(shop.id) ? 'Favoritada' : 'Removida');
  };

  const filteredShops = category === 'todos'
    ? shops : shops.filter(s => s.services?.some(svc => svc.category === category));

  const isFemale = user?.gender === 'feminino';

  const categories = [
    { id: 'todos', label: 'Todos', icon: '✂️' },
    ...(isFemale ? [{ id: 'corte_feminino', label: 'Corte Feminino', icon: '💇‍♀️' }] : []),
    { id: 'corte', label: 'Corte', icon: '💈' },
    ...(isFemale ? [] : [{ id: 'barba', label: 'Barba', icon: '🪒' }]),
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
            <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.4, minHeight: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
              {manualLocation ? (
                <span style={{ flex: 1, minWidth: 0 }}>{manualLocation}</span>
              ) : user?.address ? (
                <span style={{ flex: 1, minWidth: 0 }}>{user.address}{user.city ? `, ${user.city}` : ''}{user.state ? ` - ${user.state}` : ''}</span>
              ) : (
                <span style={{ flex: 1, minWidth: 0, cursor: 'pointer', opacity: 0.6 }} onClick={() => setShowLocationInput(true)}>Toque para definir localização</span>
              )}
              <button onClick={() => setShowLocationInput(s => !s)} title="Alterar localização"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--gold)', padding: 4, flexShrink: 0 }}>🔍</button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user?.name && (
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
          )}
          <button className="back-btn" onClick={() => navigate('login')} title="Perfil">👤</button>
        </div>
      </div>

      {/* Location Input */}
      {showLocationInput && (
        <div style={{ margin: '16px 20px 0', position: 'relative' }}>
          <input className="input-field" placeholder="Digite sua cidade, bairro ou endereço"
            value={locationText} onChange={e => { setLocationText(e.target.value); scheduleAddressSuggestions(e.target.value); }}
            onKeyDown={e => e.key === 'Enter' && handleApplyLocation()}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            style={{ width: '100%', padding: '20px 18px', fontSize: 18, minHeight: 68 }} />
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--dark2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', maxHeight: 280, overflowY: 'auto', zIndex: 1000, marginTop: -1 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={async () => {
                  setLocationText(s.label); setShowSuggestions(false);
                  const c = await geocodeAddress(s.label);
                  setManualLocation(s.label); setLocationCoords(c); setLocationApplied(true); fetchFromAPI('', s.label, c);
                  showToast('Local aplicado');
                }} style={{ display: 'block', width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', textAlign: 'left', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid var(--border)' }}>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-primary" style={{ flex: 1, minHeight: 52 }} onClick={handleApplyLocation}>Aplicar</button>
            {manualLocation && <button className="btn-secondary" style={{ minHeight: 52 }} onClick={handleClearLocation}>Limpar</button>}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ margin: '12px 20px 0', display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
          <input className="input-field" style={{ paddingLeft: 40, minHeight: 52, fontSize: 16 }}
            placeholder="Buscar barbearias..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <button className="btn-primary" style={{ width: 'auto', minWidth: 100, minHeight: 52 }} onClick={handleSearch}>Buscar</button>
      </div>

      {/* Promo */}
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
              style={{ flexShrink: 0, background: category === c.id ? 'var(--gold)' : 'var(--dark3)', border: `1px solid ${category === c.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 68 }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: category === c.id ? 'var(--dark)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shops List */}
      <div style={{ margin: '20px 0 40px' }}>
        {(apiStatus === 'timeout' || apiStatus === 'erro') && (
          <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 10, color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>
              {apiStatus === 'timeout' ? 'Servidor demorou a responder.' : 'API indisponível.'}
              {' '}Exibindo dados locais.
            </span>
            <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}
              onClick={() => fetchFromAPI(search, locationApplied ? manualLocation : '', locationApplied ? locationCoords : null)}>Tentar</button>
          </div>
        )}
        {apiStatus === 'carregando' && (
          <div style={{ margin: '0 20px 12px', padding: '8px 14px', background: 'rgba(74,144,226,0.1)', border: '1px solid rgba(74,144,226,0.3)', borderRadius: 10, color: 'var(--gold)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="spinner" style={{ width: 14, height: 14, margin: 0 }} />
            <span>Carregando dados do servidor...</span>
          </div>
        )}
        <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div className="section-title">{locationApplied ? 'Barbearias próximas' : 'Barbearias disponíveis'}</div>
            {manualLocation && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>📍 {manualLocation}</div>}
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{filteredShops.length} {filteredShops.length === 1 ? 'encontrada' : 'encontradas'}</span>
        </div>

        {filteredShops.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💈</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nenhuma barbearia encontrada</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Tente buscar por outro termo ou defina sua localização</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
            {filteredShops.map(shop => (
              <ShopCard key={shop.id} shop={shop}
                onClick={() => navigate('barbershop', { shop })}
                favorited={favShops.includes(shop.id)}
                onToggleFavorite={() => handleToggleShopFavorite(shop)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
