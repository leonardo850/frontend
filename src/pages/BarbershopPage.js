import { useState, useEffect } from 'react';
import { barbershopsAPI } from '../lib/api';

export default function BarbershopPage({ shop, navigate }) {
  const [fullShop, setFullShop] = useState(shop);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (shop?.id) {
      barbershopsAPI.getById(shop.id)
        .then(({ data }) => setFullShop(data))
        .catch(() => {});
    }
  }, [shop?.id]);

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
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)' }}>
        <button className="back-btn" onClick={() => navigate('home')}>←</button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{fullShop?.name}</span>
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
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>📍 {fullShop?.address}, {fullShop?.city}</div>
        {fullShop?.phone && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>📞 {fullShop.phone}</div>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { val: fullShop?.rating || '4.9', lbl: 'Avaliação' },
            { val: fullShop?.total_reviews || '120', lbl: 'Avaliações' },
            { val: fullShop?.is_open ? 'Aberto' : 'Fechado', lbl: 'Status' },
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
          {services.map(svc => (
            <div key={svc.id}
              onClick={() => setSelectedService(svc)}
              style={{
                background: 'var(--dark3)', borderRadius: 12, padding: '14px', cursor: 'pointer',
                border: `1px solid ${selectedService?.id === svc.id ? 'var(--gold)' : 'transparent'}`,
                transition: 'border-color 0.2s'
              }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{svc.icon || svcIcons[svc.category] || '✂️'}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{svc.name}</div>
              <div style={{ fontSize: 13, color: selectedService?.id === svc.id ? 'var(--gold)' : 'var(--muted)' }}>R$ {svc.price}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{svc.duration_minutes} min</div>
            </div>
          ))}
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
