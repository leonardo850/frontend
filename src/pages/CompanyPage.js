import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

export default function CompanyPage({ navigate }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [shops, setShops] = useState([]);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  // Form para novo agendamento
  const [newAppt, setNewAppt] = useState({
    user_id: '', client_search: '', barbershop_id: '', service_id: '',
    date: '', start_time: '', notes: '',
  });
  const [clientResults, setClientResults] = useState([]);
  const [services, setServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/api/company/reports');
      setData(res);
    } catch { setData(null); }
    setLoading(false);
  }, []);

  const fetchClients = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/api/company/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setClients(res?.clients || []);
    } catch { setClients([]); }
    setLoading(false);
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/api/company/appointments');
      setAppointments(res?.appointments || []);
    } catch { setAppointments([]); }
    setLoading(false);
  }, []);

  const fetchShops = useCallback(async () => {
    try {
      const { data: res } = await api.get('/api/company/barbershops');
      setShops(res?.barbershops || []);
    } catch { setShops([]); }
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') fetchReports();
    else if (tab === 'clients') fetchClients();
    else if (tab === 'appointments') { fetchAppointments(); fetchShops(); }
  }, [tab, fetchReports, fetchClients, fetchAppointments, fetchShops]);

  const handleSearchClient = async () => {
    if (!newAppt.client_search) return;
    setLoading(true);
    try {
      const { data: res } = await api.get(`/api/company/clients?search=${encodeURIComponent(newAppt.client_search)}`);
      setClientResults(res?.clients || []);
    } catch { setClientResults([]); }
    setLoading(false);
  };

  const handleSelectClient = (client) => {
    setNewAppt(prev => ({ ...prev, user_id: client.id, client_search: `${client.name} (${client.email})` }));
    setClientResults([]);
  };

  const handleShopChange = async (shopId) => {
    setNewAppt(prev => ({ ...prev, barbershop_id: shopId, service_id: '' }));
    if (!shopId) { setServices([]); return; }
    try {
      const { data: shopData } = await api.get(`/api/barbershops/${shopId}`);
      setServices(shopData?.services || []);
    } catch { setServices([]); }
  };

  const handleCreateAppointment = async () => {
    if (!newAppt.user_id || !newAppt.barbershop_id || !newAppt.service_id || !newAppt.date || !newAppt.start_time) {
      showToast('Preencha todos os campos');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/company/appointments', {
        user_id: newAppt.user_id,
        barbershop_id: newAppt.barbershop_id,
        service_id: newAppt.service_id,
        date: newAppt.date,
        start_time: newAppt.start_time,
        notes: newAppt.notes,
      });
      showToast('Agendamento criado!');
      setNewAppt({ user_id: '', client_search: '', barbershop_id: '', service_id: '', date: '', start_time: '', notes: '' });
      fetchAppointments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao criar');
    }
    setSubmitting(false);
  };

  if (!user || user.role !== 'company') {
    return (
      <div className="page" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--muted)', marginBottom: 16 }}>Acesso restrito a empresas</div>
        <button className="btn-primary" onClick={() => navigate('login')}>Fazer login</button>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: 'var(--dark)' }}>
      {toast && <div className="toast-msg">{toast}</div>}

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="logo-text" style={{ fontSize: 20 }}>LE<span>BUX</span></div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Painel da Empresa</div>
        </div>
        <button className="back-btn" onClick={() => logout() || navigate('login')} title="Sair">🚪</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--dark3)', borderRadius: 10, padding: 4, margin: '12px 20px' }}>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'clients', label: '👥 Clientes' },
          { key: 'appointments', label: '📅 Agendamentos' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, background: tab === t.key ? 'var(--surface)' : 'transparent', border: 'none', borderRadius: 8, padding: '10px 6px', color: tab === t.key ? 'var(--text)' : 'var(--muted)', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: '.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div style={{ padding: '0 20px' }}>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : data ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Barbearias', value: data.total_barbershops, icon: '💈' },
                  { label: 'Clientes', value: data.total_clients, icon: '👥' },
                  { label: 'Agendamentos', value: data.total_appointments, icon: '📅' },
                  { label: 'Faturamento', value: `R$ ${data.total_revenue}`, icon: '💰' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{item.value}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>Agendamentos hoje</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>{data.appointments_today}</div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Nenhum dado disponível</div>
          )}
        </div>
      )}

      {/* Clientes */}
      {tab === 'clients' && (
        <div style={{ padding: '0 20px' }}>
          <input className="input-field" placeholder="Buscar cliente por nome ou email..."
            onChange={e => fetchClients(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', fontSize: 14, marginBottom: 16 }} />
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Nenhum cliente encontrado</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clients.map(c => (
                <div key={c.id} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{c.email} {c.phone ? `| ${c.phone}` : ''}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: 'var(--gold)' }}>
                    <span>{c.total_appointments} agendamentos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agendamentos */}
      {tab === 'appointments' && (
        <div style={{ padding: '0 20px' }}>
          {/* Novo agendamento */}
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Novo Agendamento para Cliente</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <input className="input-field" placeholder="Buscar cliente por nome ou email..."
                  value={newAppt.client_search}
                  onChange={e => setNewAppt(prev => ({ ...prev, client_search: e.target.value, user_id: '' }))}
                  onKeyDown={e => e.key === 'Enter' && handleSearchClient()}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
                {clientResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', zIndex: 10, maxHeight: 160, overflowY: 'auto' }}>
                    {clientResults.map(c => (
                      <button key={c.id} onClick={() => handleSelectClient(c)}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text)', textAlign: 'left', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                        {c.name} — {c.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select className="input-field" style={{ padding: '12px 14px', fontSize: 14 }}
                  value={newAppt.barbershop_id} onChange={e => handleShopChange(e.target.value)}>
                  <option value="">Barbearia</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="input-field" style={{ padding: '12px 14px', fontSize: 14 }}
                  value={newAppt.service_id} onChange={e => setNewAppt(prev => ({ ...prev, service_id: e.target.value }))}>
                  <option value="">Serviço</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} — R${s.price}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="input-field" type="date" value={newAppt.date}
                  onChange={e => setNewAppt(prev => ({ ...prev, date: e.target.value }))}
                  style={{ padding: '12px 14px', fontSize: 14 }} />
                <input className="input-field" type="time" value={newAppt.start_time}
                  onChange={e => setNewAppt(prev => ({ ...prev, start_time: e.target.value }))}
                  style={{ padding: '12px 14px', fontSize: 14 }} />
              </div>
              <input className="input-field" placeholder="Observações (opcional)" value={newAppt.notes}
                onChange={e => setNewAppt(prev => ({ ...prev, notes: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
              <button className="btn-primary" disabled={submitting} onClick={handleCreateAppointment}
                style={{ padding: '12px', fontSize: 14 }}>
                {submitting ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
              </button>
            </div>
          </div>

          {/* Lista de agendamentos */}
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Todos os Agendamentos</div>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Nenhum agendamento</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 80 }}>
              {appointments.map(a => (
                <div key={a.id} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.users?.name || 'Cliente'}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{a.barbershops?.name} — {a.services?.name}</div>
                    </div>
                    <span className={`status-badge status-${a.status}`}>{a.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
                    {a.date} às {a.start_time} | R$ {a.price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
