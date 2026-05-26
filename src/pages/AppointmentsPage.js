import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function AppointmentsPage({ navigate }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    appointmentsAPI.getMyAppointments()
      .then(({ data }) => setAppointments(data.appointments || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (id) => {
    try {
      await appointmentsAPI.cancel(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      showToast('Agendamento cancelado');
    } catch { showToast('Erro ao cancelar'); }
  };

  const statusColors = { confirmed: 'var(--green)', pending: 'var(--gold)', completed: 'var(--muted)', cancelled: 'var(--red)' };
  const statusLabels = { confirmed: 'Confirmado', pending: 'Pendente', completed: 'Concluído', cancelled: 'Cancelado' };

  if (!user) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>📅</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Seus agendamentos</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Entre na sua conta para ver seus agendamentos</div>
        <button className="btn-primary" style={{ maxWidth: 280, marginTop: 8 }} onClick={() => navigate('login')}>ENTRAR NA CONTA</button>
      </div>
    );
  }

  return (
    <div className="page">
      {toast && <div className="toast-msg">{toast}</div>}

      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <div className="logo-text" style={{ fontSize: 24 }}>Meus Agendamentos</div>
      </div>

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Carregando...</span></div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✂️</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhum agendamento</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Encontre uma barbearia e agende seu horário!</div>
            <button className="btn-primary" style={{ maxWidth: 260, margin: '0 auto' }} onClick={() => navigate('home')}>BUSCAR BARBEARIAS</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.map(a => (
              <div key={a.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{a.barbershops?.name || 'Barbearia'}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{a.services?.name}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColors[a.status], background: `${statusColors[a.status]}22`, padding: '3px 10px', borderRadius: 20, border: `1px solid ${statusColors[a.status]}44` }}>
                    {statusLabels[a.status]}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                  📅 {new Date(a.date + 'T00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {a.start_time?.slice(0, 5)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--gold)' }}>R$ {a.price}</span>
                  {a.status === 'confirmed' && (
                    <button onClick={() => handleCancel(a.id)}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
