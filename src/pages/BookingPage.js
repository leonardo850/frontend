import { useState, useEffect } from 'react';
import { barbershopsAPI, appointmentsAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function BookingPage({ shop, service, navigate }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      num: d.getDate(),
      value: d.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    if (!selectedDate) { setSelectedDate(dates[0].value); }
  }, []);

  useEffect(() => {
    if (!selectedDate || !shop?.id) return;
    setLoading(true);
    barbershopsAPI.getAvailability(shop.id, selectedDate, service?.id)
      .then(({ data }) => setSlots(data.slots || []))
      .catch(() => {
        // Demo slots
        const demo = [];
        for (let h = 9; h < 18; h++) {
          for (let m = 0; m < 60; m += 30) {
            const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            demo.push({ time: t, available: Math.random() > 0.3 });
          }
        }
        setSlots(demo);
      })
      .finally(() => setLoading(false));
  }, [selectedDate, shop?.id]);

  const handleConfirm = async () => {
    if (!user) { navigate('login'); return; }
    if (!selectedDate || !selectedTime) return;
    setConfirming(true);
    try {
      await appointmentsAPI.create({
        barbershop_id: shop.id,
        service_id: service.id,
        date: selectedDate,
        start_time: selectedTime,
      });
      showToast('✅ Agendamento confirmado!');
      setTimeout(() => navigate('appointments'), 1500);
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao agendar. Tente novamente.');
    }
    setConfirming(false);
  };

  return (
    <div className="page">
      {toast && <div className="toast-msg">{toast}</div>}

      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)' }}>
        <button className="back-btn" onClick={() => navigate('barbershop', { shop })}>←</button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Escolher Horário</span>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Service summary */}
        <div style={{ background: 'var(--dark3)', borderRadius: 12, padding: '14px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{service?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{shop?.name} · {service?.duration_minutes} min</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>R$ {service?.price}</div>
        </div>

        {/* Date picker */}
        <div className="section-title" style={{ marginBottom: 12 }}>Selecione a data</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 24 }}>
          {dates.map(d => (
            <button key={d.value} onClick={() => { setSelectedDate(d.value); setSelectedTime(''); }}
              style={{
                flexShrink: 0, background: selectedDate === d.value ? 'var(--gold)' : 'var(--dark3)',
                border: `1px solid ${selectedDate === d.value ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 10, padding: '8px 14px', cursor: 'pointer', textAlign: 'center', color: selectedDate === d.value ? '#0F0F0F' : 'var(--text)',
              }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{d.label}</div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{d.num}</div>
            </button>
          ))}
        </div>

        {/* Time slots */}
        <div className="section-title" style={{ marginBottom: 12 }}>Horários disponíveis</div>
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Carregando horários...</span></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 24 }}>
            {slots.map(slot => (
              <button key={slot.time}
                disabled={!slot.available}
                onClick={() => slot.available && setSelectedTime(slot.time)}
                style={{
                  background: selectedTime === slot.time ? 'var(--gold)' : slot.available ? 'var(--dark3)' : 'var(--dark2)',
                  border: `1px solid ${selectedTime === slot.time ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '10px 4px', fontSize: 13,
                  cursor: slot.available ? 'pointer' : 'not-allowed',
                  color: selectedTime === slot.time ? '#0F0F0F' : slot.available ? 'var(--text)' : 'var(--muted2)',
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: !slot.available ? 'line-through' : 'none',
                  opacity: !slot.available ? 0.4 : 1,
                  transition: 'background 0.15s',
                }}>
                {slot.time}
              </button>
            ))}
          </div>
        )}

        {/* Summary */}
        {selectedTime && (
          <div style={{ background: 'var(--dark3)', border: '1px solid var(--gold)', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Resumo do agendamento</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{service?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {shop?.name} · {new Date(selectedDate + 'T00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {selectedTime}
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, color: 'var(--gold)' }}>R$ {service?.price}</div>
          </div>
        )}

        <button className="btn-primary"
          disabled={!selectedDate || !selectedTime || confirming}
          onClick={handleConfirm}>
          {confirming ? 'CONFIRMANDO...' : !user ? 'ENTRAR PARA AGENDAR' : 'CONFIRMAR AGENDAMENTO'}
        </button>
      </div>
    </div>
  );
}
