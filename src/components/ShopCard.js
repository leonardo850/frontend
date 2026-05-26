export default function ShopCard({ shop, onClick }) {
  const initials = shop.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#C9A84C', '#27AE60', '#8B6914', '#4A90E2', '#9B59B6'];
  const color = colors[shop.name.charCodeAt(0) % colors.length];
  const minPrice = shop.services?.length ? Math.min(...shop.services.map(s => s.price)) : null;

  return (
    <div className="card" onClick={onClick}
      style={{ padding: '14px', display: 'flex', gap: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ width: 68, height: 68, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#0F0F0F', flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{shop.name}</div>
          <span className={shop.is_open ? 'badge-open' : 'badge-closed'}>{shop.is_open ? 'Aberto' : 'Fechado'}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📍 {shop.address}, {shop.city}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="stars">★</span>
            <span style={{ fontSize: 13 }}>{shop.rating}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>({shop.total_reviews})</span>
          </div>
          {shop.distance_km != null && (
            <span className="distance-pill">{shop.distance_km < 1 ? `${Math.round(shop.distance_km * 1000)}m` : `${shop.distance_km}km`}</span>
          )}
        </div>
        {minPrice && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            A partir de <span style={{ color: 'var(--gold)', fontWeight: 600 }}>R$ {minPrice}</span>
          </div>
        )}
      </div>
    </div>
  );
}
