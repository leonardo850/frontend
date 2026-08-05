import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteIds, toggleFavorite } from '../lib/favorites';
import { barbershopsAPI } from '../lib/api';

export default function BarbershopPage({ shop, navigate }) {
  const { user } = useAuth();
  const location = useLocation();
  const locationState = location.state || {};
  const [fullShop, setFullShop] = useState(shop || locationState.shop);
  const [selectedService, setSelectedService] = useState(locationState.service || null);
  const [shopFavorited, setShopFavorited] = useState(() => getFavoriteIds('shop', user?.id).includes((shop || locationState.shop)?.id));
  const [favServices, setFavServices] = useState(() => getFavoriteIds('service', user?.id));

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const handleToggleShopFavorite = () => {
    if (!fullShop?.id) return;
    const nextIds = toggleFavorite('shop', user?.id, fullShop.id);
    setShopFavorited(nextIds.includes(fullShop.id));
  };

  const handleToggleServiceFavorite = (svc) => {
    if (!svc?.id) return;
    const nextIds = toggleFavorite('service', user?.id, svc.id);
    setFavServices(nextIds);
  };

  useEffect(() => {
    setShopFavorited(getFavoriteIds('shop', user?.id).includes(fullShop?.id));
    setFavServices(getFavoriteIds('service', user?.id));
  }, [user, fullShop?.id]);

  useEffect(() => {
    if (!fullShop?.id) {
      navigate('home');
      return;
    }

    barbershopsAPI.getById(fullShop.id)
      .then(({ data }) => setFullShop(data))
      .catch(() => {});
  }, [fullShop?.id, navigate]);

  const services = fullShop?.services || [
    { id: 's1', name: 'Corte Clássico', price: 30, duration_minutes: 30, category: 'corte', icon: '✂️' },
    { id: 's2', name: 'Barba Completa', price: 25, duration_minutes: 25, category: 'barba', icon: '🪒' },
    { id: 's3', name: 'Corte + Barba', price: 50, duration_minutes: 50, category: 'combo', icon: '💈' },
    { id: 's4', name: 'Pigmentação', price: 70, duration_minutes: 60, category: 'pigmento', icon: '🎨' },
  ];

  const svcIcons = { corte: '✂️', barba: '🪒', combo: '💈', pigmento: '🎨', sobrancelha: '👁️', tratamento: '🧴' };
  const initials = fullShop?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#C9A84C', '#27AE60', '#8B6914', '#4A90E2', '#9B59B6'];
  const color = colors[(fullShop?.name?.charCodeAt(0) || 0) % colors.length];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="back-btn" onClick={() => navigate('home')} title="Voltar para a tela inicial">🏠</button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{fullShop?.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('shop-day', { shopId: fullShop?.id, date: todayStr })}>
            Ver agenda do dia
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ height: 180, background: `linear-gradient(135deg, ${color}22, ${color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#0F0F0F' }}>
          {initials}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, color: 'var(--gold)', letterSpacing: 2, marginBottom: 4 }}>
          {fullShop?.name?.toUpperCase()}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>📍 {fullShop?.address}{fullShop?.city ? `, ${fullShop?.city}` : ''}</div>
        {fullShop?.phone && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>📞 {fullShop.phone}</div>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { val: fullShop?.rating || '4.9', lbl: 'Avaliação' },
            { val: fullShop?.total_reviews || '120', lbl: 'Avaliações' },
            { val: fullShop?.is_open === true ? 'Aberto' : fullShop?.is_open === false ? 'Fechado' : '—', lbl: 'Status' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--dark3)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--gold)' }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Services */}
        <div className="section-title" style={{ marginBottom: 14 }}>Escolha o serviço</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {services.map(svc => {
            const favorited = favServices.includes(svc.id);
            return (
              <div key={svc.id}
                style={{
                  position: 'relative',
                  background: 'var(--dark3)', borderRadius: 12, padding: '14px', cursor: 'pointer',
                  border: `1px solid ${selectedService?.id === svc.id ? 'var(--gold)' : 'transparent'}`,
                  transition: 'border-color 0.2s'
                }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleServiceFavorite(svc); }}
                  style={{
                    position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18
                  }}
                  title={favorited ? 'Desfavoritar serviço' : 'Favoritar serviço'}>
                  {favorited ? '❤️' : '🤍'}
                </button>
                <div onClick={() => setSelectedService(svc)}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{svc.icon || svcIcons[svc.category] || '✂️'}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{svc.name}</div>
                  <div style={{ fontSize: 13, color: selectedService?.id === svc.id ? 'var(--gold)' : 'var(--muted)' }}>R$ {svc.price}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{svc.duration_minutes} min</div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-primary"
          disabled={!selectedService}
          onClick={() => navigate('booking', { shop: fullShop, service: selectedService })}>
          {selectedService ? `AGENDAR — R$ ${selectedService.price}` : 'SELECIONE UM SERVIÇO'}
        </button>
      </div>

    </div>
  );
}
