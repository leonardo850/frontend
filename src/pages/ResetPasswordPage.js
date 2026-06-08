import { useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { validatePassword } from '../utils/authValidation';

export default function ResetPasswordPage({ navigate, token }) {
  const [resetToken, setResetToken] = useState(token || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) setResetToken(token);
  }, [token]);

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!resetToken.trim()) {
      setError('Informe o token de redefinição recebido por e-mail.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.ok) {
      setError(pwdCheck.msg);
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token: resetToken.trim(), password });
      setMessage('Senha alterada com sucesso. Você já pode voltar ao login.');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha. Verifique o token e tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{ padding: '40px 20px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="logo-text" style={{ fontSize: 40 }}>LE<span>BUX</span></div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Definir nova senha</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          className="input-field"
          placeholder="Token de redefinição"
          value={resetToken}
          onChange={e => setResetToken(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Nova senha"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Confirmar senha"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <div className="error-msg">{error}</div>}
        {message && <div className="success-msg">{message}</div>}

        <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'SALVANDO...' : 'Redefinir senha'}
        </button>

        <button type="button" className="btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate('login')}>
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
