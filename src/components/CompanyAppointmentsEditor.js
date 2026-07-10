import React from 'react';

export default function CompanyAppointmentsEditor({
  calendarDate,
  setCalendarDate,
  todayStr,
  calendarDays,
  timeSlots,
  dayAppointments,
  selectedDate,
  setSelectedDate,
  selectedAppt,
  setSelectedAppt,
  apptHours,
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
  handleSlotClick,
  slotFilter,
  setSlotFilter,
  clientFilter,
  setClientFilter,
  filterShopId,
  handleFilterShopChange,
}) {
  const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  return (
    <div style={{ padding: '0 20px' }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select style={{ flex: 1, minWidth: 120, padding: '10px 12px', fontSize: 13, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
          value={filterShopId} onChange={e => handleFilterShopChange(e.target.value)}>
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
          {DAY_NAMES.map(d => <div key={d} style={{ padding: '4px 0' }}>{d}</div>)}
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
      {/* The create form remains in parent to avoid duplicating state/handlers */}
    </div>
  );
}
