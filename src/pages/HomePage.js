import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { barbershopsAPI } from '../lib/api';
import ShopCard from '../components/ShopCard';

export default function HomePage({ navigate }) {
  const { location } = useGeolocation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search };
      if (location) { params.lat = location.lat; params.lng = location.lng; params.radius = 20; }
      const { data } = await barbershopsAPI.getAll(params);
      setShops(data.barbershops || []);
    } catch {
      // Demo fallback
      setShops([
        { id: '1', name: 'Barber King', address: 'Rua das Flores, 123', city: 'Jaú', is_open: true, rating: 4.9, total_reviews: 124, distance_km: 0.3, services: [{ price: 30 }] },
        { id: '2', name: 'Studio 7', address: 'Av. Central, 456', city: 'Jaú', is_open: true, rating: 4.7, total_reviews: 89, distance_km: 0.8, services: [{ price: 25 }] },
        { id: '3', name: 'Noble Barbers', address: 'Rua Prudente de Moraes, 321', city: 'Jaú', is_open: true, rating: 4.8, total_reviews: 67, distance_km: 1.1, services: [{ price: 45 }] },
      ]);
    }
    setLoading(false);
  }, [location, search]);

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
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo-text">LE<span>BUX</span></div>
        <button className="back-btn" onClick={() => navigate('login')} title="Perfil">👤</button>
      </div>

      {/* Location */}
      <div style={{ margin: '16px 20px 0', background: 'var(--dark3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => showToast('📍 Detectando localização...')}>
        <span style={{ fontSize: 18 }}>📍</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Sua localização</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Jaú, São Paulo</div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>Trocar →</span>
      </div>

      {/* Search */}
      <div style={{ margin: '12px 20px 0', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 16 }}>🔍</span>
        <input
          className="input-field"
          style={{ paddingLeft: 40 }}
          placeholder="Buscar barbearias ou serviços..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchShops()}
        />
      </div>

      {/* Promo banner */}
      <div style={{ margin: '16px 20px 0', background: 'linear-gradient(135deg, var(--gold), #8B6914)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
