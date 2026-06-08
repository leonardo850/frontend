import { useState } from 'react';
import { authAPI } from '../lib/api';

export default function ForgotPasswordPage({ navigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      setMessage('Se o e-mail existir, você receberá instruções para redefinir a senha.');
    } catch (err) {
      setError('Erro ao enviar instruções de recuperação. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{ padding: '40px 20px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="logo-text" style={{ fontSize: 40 }}>LE<span>BUX</span></div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Redefinir senha</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          className="input-field"
          placeholder="E-mail cadastrado"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <div className="error-msg">{error}</div>}
        {message && <div className="success-msg">{message}</div>}

        <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'ENVIANDO...' : 'Enviar instruções'}
        </button>

        <button type="button" className="btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate('login')}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
