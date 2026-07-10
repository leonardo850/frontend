import React from 'react';

function detectProfessional(a) {
  return a.professional?.name || a.professional_name || a.employee?.name || a.employee_name || a.barber?.name || a.barber_name || a.assigned_to?.name || a.assigned_to_name || 'Sem profissional';
}

export default function AppointmentsList({ appointments = [], onSelect }) {
  // Group by professional name
  const groups = {};
  appointments.forEach(a => {
    const name = detectProfessional(a) || 'Sem profissional';
    if (!groups[name]) groups[name] = [];
    groups[name].push(a);
  });

  const professionalNames = Object.keys(groups).sort((a, b) => a.localeCompare(b));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {professionalNames.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>Nenhum agendamento</div>
      )}

      {professionalNames.map(prof => (
        <div key={prof} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>{prof}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{groups[prof].length} agendamentos</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {groups[prof].map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'transparent', border: '1px solid transparent', cursor: onSelect ? 'pointer' : 'default' }} onClick={() => onSelect && onSelect(a)}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.users?.name || 'Cliente'}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{a.start_time} — {a.services?.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--gold)' }}>R$ {a.price}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
