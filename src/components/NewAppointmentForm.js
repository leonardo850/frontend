import React from 'react';

export default function NewAppointmentForm({
  selectedDate,
  newAppt,
  setNewAppt,
  clientResults,
  handleSearchClient,
  handleSelectClient,
  shops,
  services,
  handleShopChange,
  handleCreateAppointment,
  submitting,
  onClose,
}) {
  return (
    <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Novo Agendamento</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
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
  );
}
