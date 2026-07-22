export default function ShopCard({ shop, onClick, favorited = false, onToggleFavorite }) {
  const initials = shop.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#4A90E2', '#2F80ED', '#56CCF2', '#9B59B6', '#27AE60'];
  const color = colors[shop.name.charCodeAt(0) % colors.length];
  const minPrice = shop.services?.length ? Math.min(...shop.services.map(s => s.price)) : null;
  const serviceCount = shop.services?.length || 0;

  return (
    <div className="card" onClick={onClick}
      style={{
        position: 'relative', padding: '16px', display: 'flex', gap: 14,
        cursor: 'pointer', transition: 'all 0.2s ease',
        border: '1px solid var(--border)', borderRadius: 14,
        background: 'var(--dark2)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--gold)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {typeof onToggleFavorite === 'function' && (
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(shop); }}
          style={{
            position: 'absolute', right: 14, top: 14, zIndex: 50,
            background: 'var(--dark3)', border: 'none', cursor: 'pointer',
            fontSize: 16, borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--dark3)'}
        >
          {favorited ? '❤️' : '🤍'}
        </button>
      )}
      <div style={{
        width: 72, height: 72, borderRadius: 14, background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#0F0F0F', flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
            {shop.name}
          </div>
          <span className={shop.is_open === true ? 'badge-open' : 'badge-closed'}>
            {shop.is_open === true ? 'Aberto' : shop.is_open === false ? 'Fechado' : '—'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📍 {shop.address}{shop.city ? `, ${shop.city}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="stars" style={{ color: '#F5C518' }}>★</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{shop.rating}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>({shop.total_reviews})</span>
          </div>
          {serviceCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--dark3)', padding: '2px 8px', borderRadius: 6 }}>
              {serviceCount} {serviceCount === 1 ? 'serviço' : 'serviços'}
            </span>
          )}
          {shop.distance_km != null && (
            <span className="distance-pill">
              {shop.distance_km < 1 ? `${Math.round(shop.distance_km * 1000)}m` : `${shop.distance_km}km`}
            </span>
          )}
        </div>
        {minPrice && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            A partir de <span style={{ color: 'var(--gold)', fontWeight: 600 }}>R$ {minPrice.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute', right: 16, bottom: 16,
        fontSize: 11, color: 'var(--gold)', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8,
      }}>
        Selecionar →
      </div>
    </div>
  );
}
