import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import api from '../lib/api';
import AppointmentsList from '../components/AppointmentsList';

export default function ShopDayView({ navigate, shopId: propShopId, date: propDate }) {
  const location = useLocation();
  const params = useParams();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const initialShopId = propShopId || params.shopId || location.state?.shopId || location.state?.shop?.id || '';
  const initialDate = propDate || location.state?.date || todayStr;
  const [shopId, setShopId] = useState(initialShopId || '');
  const [shops, setShops] = useState([]);
  const [date, setDate] = useState(initialDate);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/company/barbershops').then(({ data }) => setShops(data?.barbershops || [])).catch(() => setShops([]));
  }, []);

  useEffect(() => {
    if (!shopId) { setAppointments([]); return; }
    setLoading(true);
    api.get('/api/company/appointments').then(({ data }) => {
      const list = (data?.appointments || []).filter(a => a.barbershop_id === shopId && a.date === date);
      setAppointments(list);
    }).catch(() => setAppointments([])).finally(() => setLoading(false));
  }, [shopId, date]);

  return (
    <div className="page">
      <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Agenda do dia</div>
        <button className="back-btn" onClick={() => navigate('company')}>←</button>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <select value={shopId} onChange={e => setShopId(e.target.value)} style={{ flex: 1, padding: '10px 12px' }}>
            <option value="">Selecione a barbearia</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '10px 12px' }} />
          <button className="btn-primary" onClick={() => { setDate(todayStr); }} style={{ padding: '10px 12px' }}>Hoje</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Carregando...</div>
        ) : (
          <AppointmentsList
            appointments={appointments}
            onSelect={a => {
              const selectedShop = shops.find(s => s.id === (a.barbershop?.id || a.barbershop_id)) || { id: a.barbershop_id || shopId };
              navigate('barbershop', { shop: selectedShop, service: a.service });
            }}
          />
        )}
      </div>
    </div>
  );
}
