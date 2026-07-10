import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

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
  const [savingHours, setSavingHours] = useState(false);

  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleSlotClick = (date, time) => {
    setSelectedAppt(null);
    setShowCreateForm(true);
    setNewAppt(prev => ({ ...prev, date, start_time: time, barbershop_id: '', service_id: '', user_id: '', client_search: '', notes: '' }));
    setServices([]);
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
    try {
      const { data: res } = await api.get(`/api/company/hours/${shopId}`);
      if (res?.hours?.length) setHours(res.hours);
    } catch { setHours([]); }
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
    else if (tab === 'appointments') { fetchAppointments(); fetchShops(); fetchApptHours(newAppt.barbershop_id); }
    else if (tab === 'hours') { fetchShops(); fetchHours(hoursShopId); }
  }, [tab, fetchReports, fetchClients, fetchAppointments, fetchShops, fetchHours, hoursShopId, fetchApptHours]);

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
        <button className="back-btn" onClick={() => logout() || navigate('login')} title="Sair">🚪</button>
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
                  </CardTag>
                  );
                })}
              </div>
          )}
        </div>
      )}

      {/* Agendamentos */}
      {tab === 'appointments' && (
        <div style={{ padding: '0 20px' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <select style={{ flex: 1, minWidth: 120, padding: '10px 12px', fontSize: 13, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
              value={newAppt.barbershop_id} onChange={e => { setNewAppt(prev => ({ ...prev, barbershop_id: e.target.value, service_id: '' })); handleShopChange(e.target.value); }}>
              <option value="">Todas barbearias</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select style={{ padding: '10px 12px', fontSize: 13, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
              value={slotFilter} onChange={e => setSlotFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="free">Livre</option>
              <option value="occupied">Ocupado</option>
            </select>
          </div>
          <input className="input-field" placeholder="Filtrar por cliente..."
            value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', fontSize: 14, marginBottom: 12 }} />

          {/* Calendário */}
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 18 }}>‹</button>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 18 }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
              {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <div key={d} style={{ padding: '4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const dateStr = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
                const hasAppt = dayAppointments[dateStr]?.length > 0;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                return (
                  <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                    style={{
                      background: isSelected ? 'var(--gold)' : isToday ? 'var(--dark3)' : 'transparent',
                      color: isSelected ? '#0F0F0F' : hasAppt ? 'var(--gold)' : 'var(--text)',
                      border: isToday && !isSelected ? '1px solid var(--gold)' : '1px solid transparent',
                      borderRadius: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13, fontWeight: isSelected ? 700 : 400,
                      opacity: day.month !== calendarDate.getMonth() ? 0.3 : 1,
                      position: 'relative',
                    }}>
                    {day.day}
                    {hasAppt && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)', margin: '2px auto 0' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grade de horários */}
          {selectedDate && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {dayAppointments[selectedDate]?.length || 0} agendamentos
                </span>
              </div>

              {/* Check if day is open */}
              {(() => {
                const dow = new Date(selectedDate + 'T12:00:00').getDay();
                const dayHour = apptHours.find(h => h.day_of_week === dow);
                if (dayHour && dayHour.is_open === false) {
                  return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: 14 }}>🔴 Dia fechado para agendamentos</div>;
                }
                return null;
              })()}
              {(!apptHours.length || apptHours.find(h => h.day_of_week === new Date(selectedDate + 'T12:00:00').getDay())?.is_open !== false) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                {timeSlots.map(slot => {
                  const filteredDayAppts = newAppt.barbershop_id
                    ? (dayAppointments[selectedDate] || []).filter(a => a.barbershop_id === newAppt.barbershop_id)
                    : (dayAppointments[selectedDate] || []);
                  const apt = filteredDayAppts.find(a => a.start_time === slot);
                  const isOccupied = !!apt;
                  if (slotFilter === 'free' && isOccupied) return null;
                  if (slotFilter === 'occupied' && !isOccupied) return null;
                  if (clientFilter && isOccupied && !apt.users?.name?.toLowerCase().includes(clientFilter.toLowerCase())) return null;

                  return (
                    <button key={slot} onClick={() => isOccupied ? setSelectedAppt(apt) : handleSlotClick(selectedDate, slot)}
                      style={{
                        background: isOccupied ? 'rgba(231,76,60,0.15)' : 'rgba(46,204,113,0.1)',
                        border: `1px solid ${isOccupied ? 'rgba(231,76,60,0.3)' : 'rgba(46,204,113,0.3)'}`,
                        borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                        textAlign: 'left', fontFamily: 'DM Sans, sans-serif', width: '100%',
                      }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isOccupied ? 'var(--red)' : '#2ecc71' }}>{slot}</div>
                      {isOccupied ? (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{apt.users?.name}</div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#2ecc71', marginTop: 2 }}>Livre</div>
                      )}
                    </button>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* Detalhes do agendamento selecionado */}
          {selectedAppt && (
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedAppt.users?.name}</div>
                <button onClick={() => setSelectedAppt(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                <div>{selectedAppt.barbershops?.name} — {selectedAppt.services?.name}</div>
                <div>{selectedAppt.date} às {selectedAppt.start_time}</div>
                <div>R$ {selectedAppt.price} | Status: {selectedAppt.status}</div>
                {selectedAppt.notes && <div>Obs: {selectedAppt.notes}</div>}
              </div>
            </div>
          )}

          {/* Novo agendamento (aparece ao clicar em slot livre) */}
          {showCreateForm && (
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Novo Agendamento</div>
                <button onClick={() => setShowCreateForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 4 }}>{selectedDate} às {newAppt.start_time}</div>
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
                <input className="input-field" placeholder="Observações (opcional)" value={newAppt.notes}
                  onChange={e => setNewAppt(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
                <button className="btn-primary" disabled={submitting} onClick={handleCreateAppointment}
                  style={{ padding: '12px', fontSize: 14 }}>
                  {submitting ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de agendamentos do dia */}
          {selectedDate && dayAppointments[selectedDate]?.length > 0 && (
            <div style={{ paddingBottom: 60 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Agendamentos do dia</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayAppointments[selectedDate]
                  .filter(a => !newAppt.barbershop_id || a.barbershop_id === newAppt.barbershop_id)
                  .filter(a => !clientFilter || a.users?.name?.toLowerCase().includes(clientFilter.toLowerCase()))
                  .map(a => (
                  <div key={a.id} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}
                    onClick={() => setSelectedAppt(a)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.users?.name || 'Cliente'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.start_time} — {a.services?.name}</div>
                      </div>
                      <span className={`status-badge status-${a.status}`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Horários de funcionamento */}
      {tab === 'hours' && (
        <div style={{ padding: '0 20px' }}>
          <select style={{ width: '100%', padding: '12px 14px', fontSize: 14, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}
            value={hoursShopId} onChange={e => { setHoursShopId(e.target.value); fetchHours(e.target.value); }}>
            <option value="">Selecione uma barbearia</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {hoursShopId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hours.map((h, i) => (
                <div key={h.day_of_week} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{DAY_NAMES[h.day_of_week]}</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={h.is_open !== false}
                        onChange={e => {
                          const updated = [...hours];
                          updated[i] = { ...updated[i], is_open: e.target.checked };
                          setHours(updated);
                        }} />
                      Aberto
                    </label>
                  </div>
                  {h.is_open !== false && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="time" value={h.open_time || '09:00'}
                        onChange={e => {
                          const updated = [...hours];
                          updated[i] = { ...updated[i], open_time: e.target.value };
                          setHours(updated);
                        }}
                        style={{ flex: 1, padding: '8px 10px', fontSize: 13, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }} />
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>até</span>
                      <input type="time" value={h.close_time || '19:00'}
                        onChange={e => {
                          const updated = [...hours];
                          updated[i] = { ...updated[i], close_time: e.target.value };
                          setHours(updated);
                        }}
                        style={{ flex: 1, padding: '8px 10px', fontSize: 13, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }} />
                    </div>
                  )}
                  </CardTag>
                  );
                })}
              <button className="btn-primary" disabled={savingHours} onClick={handleSaveHours}
                style={{ padding: '12px', fontSize: 14, marginTop: 4 }}>
                {savingHours ? 'SALVANDO...' : 'SALVAR HORÁRIOS'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
