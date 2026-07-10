import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import CompanyHoursEditor from '../components/CompanyHoursEditor';
import AppointmentsList from '../components/AppointmentsList';
import NewAppointmentForm from '../components/NewAppointmentForm';

export default function CompanyPage({ navigate }) {
  const { user, isCompany, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [shops, setShops] = useState([]);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  // Estado do calendário e filtros
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [calendarDate, setCalendarDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slotFilter, setSlotFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [filterShopId, setFilterShopId] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const calendarDays = [];
  const y = calendarDate.getFullYear();
  const m = calendarDate.getMonth();
  const dim = daysInMonth(y, m);
  const prevDim = daysInMonth(y, m - 1);
  for (let i = firstDayOfMonth(y, m) - 1; i >= 0; i--) {
    calendarDays.push({ day: prevDim - i, month: m - 1, year: i === 0 && m === 0 ? y - 1 : y });
  }
  for (let d = 1; d <= dim; d++) {
    calendarDays.push({ day: d, month: m, year: y });
  }
  while (calendarDays.length < 42) {
    const last = calendarDays[calendarDays.length - 1];
    calendarDays.push({ day: last.day + 1, month: last.month + (last.day >= 28 && last.month === m ? 1 : 0), year: last.month === 11 && last.day >= 28 ? y + 1 : y });
  }

  // Mapear agendamentos por data
  const dayAppointments = {};
  for (const a of appointments) {
    if (!dayAppointments[a.date]) dayAppointments[a.date] = [];
    dayAppointments[a.date].push(a);
  }

  // Gerar slots de 30min (09:00 - 18:00)
  const timeSlots = [];
  for (let h = 9; h < 18; h++) {
    for (let m2 = 0; m2 < 60; m2 += 30) {
      timeSlots.push(`${String(h).padStart(2, '0')}:${String(m2).padStart(2, '0')}`);
    }
  }

  // Form para novo agendamento
  const [newAppt, setNewAppt] = useState({
    user_id: '', client_search: '', barbershop_id: '', service_id: '',
    date: '', start_time: '', notes: '',
  });
  const [clientResults, setClientResults] = useState([]);
  const [services, setServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Estado para horários na aba agendamentos
  const [apptHours, setApptHours] = useState([]);

  // Estado para horários de funcionamento
  const [hours, setHours] = useState([]);
  const [hoursShopId, setHoursShopId] = useState('');
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursError, setHoursError] = useState('');
  const [savingHours, setSavingHours] = useState(false);

  const [companyFabHidden, setCompanyFabHidden] = useState(() => {
    try { return localStorage.getItem('shopday_fab_hidden_company') === '1'; } catch { return false; }
  });

  const toggleCompanyFab = () => {
    const next = !companyFabHidden;
    setCompanyFabHidden(next);
    try { localStorage.setItem('shopday_fab_hidden_company', next ? '1' : '0'); } catch {}
    showToast(next ? 'Atalho da agenda ocultado' : 'Atalho da agenda mostrado');
  };

  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDefaultHours = () => DAY_NAMES.map((_, index) => ({
    day_of_week: index,
    is_open: index < 5,
    open_time: '09:00',
    close_time: '18:00',
  }));

  const handleToggleDayOpen = (index, isOpen) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, is_open: isOpen } : h));
  };

  const handleHoursChange = (index, field, value) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const handleSlotClick = (date, time) => {
    setSelectedAppt(null);
    setShowCreateForm(true);
    setNewAppt(prev => ({
      ...prev,
      date,
      start_time: time,
      barbershop_id: filterShopId || '',
      service_id: '',
      user_id: '',
      client_search: '',
      notes: '',
    }));
    setServices([]);
  };

  const handleFilterShopChange = (shopId) => {
    setFilterShopId(shopId);
    fetchApptHours(shopId);
  };

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

  const fetchHours = useCallback(async (shopId) => {
    if (!shopId) { setHours([]); return; }
    setHoursLoading(true);
    setHoursError('');
    try {
      const { data: res } = await api.get(`/api/company/hours/${shopId}`);
      setHours(res?.hours?.length ? res.hours : getDefaultHours());
    } catch (err) {
      setHours(getDefaultHours());
      setHoursError('Não foi possível carregar horários. Ajuste os horários e tente novamente.');
    }
    setHoursLoading(false);
  }, []);

  const handleSaveHours = async () => {
    if (!hoursShopId) return;
    setSavingHours(true);
    try {
      const { data: res } = await api.put(`/api/company/hours/${hoursShopId}`, { hours });
      showToast(res?.message || 'Horários salvos!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao salvar horários');
    }
    setSavingHours(false);
  };

  const fetchApptHours = useCallback(async (shopId) => {
    if (!shopId) { setApptHours([]); return; }
    try {
      const { data: res } = await api.get(`/api/company/hours/${shopId}`);
      if (res?.hours?.length) setApptHours(res.hours);
    } catch { setApptHours([]); }
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
    else if (tab === 'appointments') { fetchAppointments(); fetchShops(); fetchApptHours(filterShopId); }
    else if (tab === 'hours') { fetchShops(); fetchHours(hoursShopId); }
  }, [tab, fetchReports, fetchClients, fetchAppointments, fetchShops, fetchHours, hoursShopId, fetchApptHours, filterShopId]);

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
    if (!shopId) { setServices([]); setApptHours([]); return; }
    fetchApptHours(shopId);
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
      setShowCreateForm(false);
      setNewAppt({ user_id: '', client_search: '', barbershop_id: '', service_id: '', date: '', start_time: '', notes: '' });
      setServices([]);
      fetchAppointments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao criar');
    }
    setSubmitting(false);
  };

  if (!user || !isCompany) {
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('shop-day', { shopId: hoursShopId || (shops[0] && shops[0].id), date: selectedDate || todayStr })}>
            Ver agenda do dia
          </button>
          <button className="btn-outline" onClick={toggleCompanyFab} title={companyFabHidden ? 'Mostrar atalho' : 'Ocultar atalho'}>
            {companyFabHidden ? 'Mostrar atalho' : 'Ocultar atalho'}
          </button>
          <button className="back-btn" onClick={() => logout() || navigate('login')} title="Sair">🚪</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--dark3)', borderRadius: 10, padding: 4, margin: '12px 20px' }}>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'clients', label: '👥 Clientes' },
          { key: 'appointments', label: '📅 Agendamentos' },
          { key: 'hours', label: '🕐 Horários' },
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
                  { label: 'Agendamentos', value: data.total_appointments, icon: '📅', link: 'appointments' },
                  { label: 'Faturamento', value: `R$ ${data.total_revenue}`, icon: '💰' },
                ].map((item, i) => {
                  const CardTag = item.link ? 'button' : 'div';
                  return (
                  <CardTag key={i} onClick={item.link ? () => setTab(item.link) : undefined}
                    style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center', cursor: item.link ? 'pointer' : 'default', fontFamily: 'DM Sans, sans-serif', width: '100%' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{item.value}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{item.label}</div>
                  </CardTag>
                  );
                })}
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
        <>
          <CompanyAppointmentsEditor
            calendarDate={calendarDate}
            setCalendarDate={setCalendarDate}
            todayStr={todayStr}
            calendarDays={calendarDays}
            timeSlots={timeSlots}
            dayAppointments={dayAppointments}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedAppt={selectedAppt}
            setSelectedAppt={setSelectedAppt}
            apptHours={apptHours}
            newAppt={newAppt}
            setNewAppt={setNewAppt}
            clientResults={clientResults}
            handleSearchClient={handleSearchClient}
            handleSelectClient={handleSelectClient}
            shops={shops}
            services={services}
            handleShopChange={handleShopChange}
            handleCreateAppointment={handleCreateAppointment}
            submitting={submitting}
            handleSlotClick={handleSlotClick}
            slotFilter={slotFilter}
            setSlotFilter={setSlotFilter}
            clientFilter={clientFilter}
            setClientFilter={setClientFilter}
            filterShopId={filterShopId}
            handleFilterShopChange={handleFilterShopChange}
          />

          {/* Novo agendamento (aparece ao clicar em slot livre) */}
          {showCreateForm && (
            <NewAppointmentForm
              selectedDate={selectedDate}
              newAppt={newAppt}
              setNewAppt={setNewAppt}
              clientResults={clientResults}
              handleSearchClient={handleSearchClient}
              handleSelectClient={handleSelectClient}
              shops={shops}
              services={services}
              handleShopChange={handleShopChange}
              handleCreateAppointment={handleCreateAppointment}
              submitting={submitting}
              onClose={() => setShowCreateForm(false)}
            />
          )}

          {/* Lista de agendamentos do dia */}
          {selectedDate && (
            <div style={{ paddingBottom: 60 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Agendamentos do dia</div>
                <div>
                  <button className="btn-secondary" onClick={() => navigate('shop-day', { shopId: filterShopId || hoursShopId || (shops[0] && shops[0].id), date: selectedDate })}>
                    Ver agenda da barbearia
                  </button>
                </div>
              </div>
              <AppointmentsList
                appointments={(dayAppointments[selectedDate] || [])
                  .filter(a => !filterShopId || String(a.barbershop_id || a.barbershop?.id) === String(filterShopId))
                  .filter(a => !clientFilter || a.users?.name?.toLowerCase().includes(clientFilter.toLowerCase()))}
                onSelect={a => setSelectedAppt(a)}
              />
            </div>
          )}
        </>
      )}

      {/* Horários de funcionamento */}
      {tab === 'hours' && (
        <CompanyHoursEditor
          shops={shops}
          hoursShopId={hoursShopId}
          onShopChange={shopId => { setHoursShopId(shopId); fetchHours(shopId); }}
          hours={hours}
          hoursLoading={hoursLoading}
          hoursError={hoursError}
          savingHours={savingHours}
          onToggleDayOpen={handleToggleDayOpen}
          onHoursChange={handleHoursChange}
          onSaveHours={handleSaveHours}
          dayNames={DAY_NAMES}
        />
      )}

      {!companyFabHidden && (
        <button className="shop-day-fab" title="Ver agenda do dia" onClick={() => navigate('shop-day', { shopId: hoursShopId || (shops[0] && shops[0].id), date: selectedDate || todayStr })}>
          📅
        </button>
      )}
    </div>
  );
}
