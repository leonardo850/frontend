export default function CompanyHoursEditor({
  shops,
  hoursShopId,
  onShopChange,
  hours,
  hoursLoading,
  hoursError,
  savingHours,
  onToggleDayOpen,
  onHoursChange,
  onSaveHours,
  dayNames,
}) {
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <select
          style={{ flex: 1, minWidth: 200, padding: '12px 14px', fontSize: 14, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
          value={hoursShopId}
          onChange={e => onShopChange(e.target.value)}
        >
          <option value="">Selecione uma barbearia</option>
          {shops.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button
          className="btn-primary"
          style={{ flex: '0 0 auto', minWidth: 150 }}
          disabled={!hoursShopId || hoursLoading}
          onClick={() => onShopChange(hoursShopId)}
        >
          {hoursLoading ? 'CARREGANDO...' : 'RECARREGAR HORÁRIOS'}
        </button>
      </div>

      {hoursError && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: 'rgba(255, 165, 0, 0.12)', color: 'var(--gold)' }}>
          {hoursError}
        </div>
      )}

      {hoursShopId ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {hours.map((h, i) => (
            <div key={h.day_of_week} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{dayNames[h.day_of_week]}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Defina se a barbearia abre neste dia</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: h.is_open !== false ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={h.is_open !== false} onChange={e => onToggleDayOpen(i, e.target.checked)} />
                  Aberto
                </label>
              </div>

              {h.is_open !== false ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Abertura</label>
                    <input
                      type="time"
                      value={h.open_time || '09:00'}
                      onChange={e => onHoursChange(i, 'open_time', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Fechamento</label>
                    <input
                      type="time"
                      value={h.close_time || '18:00'}
                      onChange={e => onHoursChange(i, 'close_time', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', color: 'var(--muted)', fontSize: 13 }}>
                  Dia fechado
                </div>
              )}
            </div>
          ))}

          <button className="btn-primary" disabled={savingHours} onClick={onSaveHours}
            style={{ padding: '14px', fontSize: 14, marginTop: 6 }}>
            {savingHours ? 'SALVANDO...' : 'SALVAR HORÁRIOS'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 20 }}>Selecione uma barbearia para editar seus horários.</div>
      )}
    </div>
  );
}
