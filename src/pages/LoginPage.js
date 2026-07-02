import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../lib/api';
import { validateEmail, validatePassword, passwordStrength } from '../utils/authValidation';

export default function LoginPage({ navigate }) {
  const { user, login, register, logout } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [emailValid, setEmailValid] = useState(null);
  const [pwdStrength, setPwdStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email.trim(), form.password);
        const savedUser = JSON.parse(localStorage.getItem('lebux_user') || '{}');
        showToast('✅ Bem-vindo!');
        setTimeout(() => navigate(savedUser.role === 'company' ? 'company' : 'home'), 1000);
      } else {
        if (!form.name) { setError('Nome é obrigatório'); setLoading(false); return; }
        const emailCheck = validateEmail(form.email);
        if (!emailCheck.ok) { setError(emailCheck.msg); setLoading(false); return; }
        const pwdCheck = validatePassword(form.password);
        if (!pwdCheck.ok) { setError(pwdCheck.msg); setLoading(false); return; }
        await register(form.name, emailCheck.value, form.password, form.phone);
        showToast('✅ Bem-vindo à Lebux!');
        setTimeout(() => navigate('home'), 1000);
      }
    } catch (err) {
      setError(tab === 'login' ? 'E-mail, CNPJ ou senha incorretos' : (err.response?.data?.error || 'Erro ao criar conta. Tente novamente.'));
    }
    setLoading(false);
  };

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  if (user) {
    if (user.role === 'company') {
      return (
        <div className="page" style={{ padding: '20px' }}>
          <div style={{ padding: '0 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            <div className="logo-text" style={{ fontSize: 24 }}>{user.name}</div>
          </div>
          <div style={{ background: 'var(--dark3)', borderRadius: 16, padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#0F0F0F' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{user.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>CNPJ: {user.cnpj}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user.email}</div>
            </div>
          </div>

          <button onClick={() => navigate('company')}
            style={{ width: '100%', background: 'var(--gold)', border: 'none', borderRadius: 12, padding: '16px', color: '#0F0F0F', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 15, marginBottom: 12 }}>
            Acessar Painel da Empresa →
          </button>

          <button className="btn-outline" style={{ marginTop: 12, color: 'var(--red)', borderColor: 'rgba(231,76,60,0.3)', width: '100%' }} onClick={() => { logout(); navigate('home'); }}>
            Sair da conta
          </button>
        </div>
      );
    }

    return (
      <div className="page" style={{ padding: '20px' }}>
        <div style={{ padding: '0 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          <div className="logo-text" style={{ fontSize: 24 }}>Meu Perfil</div>
        </div>
        <div style={{ background: 'var(--dark3)', borderRadius: 16, padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#0F0F0F' }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{user.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user.email}</div>
            {user.phone && <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user.phone}</div>}
          </div>
        </div>

        {[
          { icon: '📅', label: 'Meus Agendamentos', action: () => navigate('appointments') },
          { icon: '⭐', label: 'Minhas Avaliações', action: () => {} },
          { icon: '🎁', label: 'Meus Cupons', action: () => {} },
          { icon: '🔔', label: 'Notificações', action: () => {} },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            style={{ width: '100%', background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, marginBottom: 8, textAlign: 'left' }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ color: 'var(--muted)' }}>›</span>
          </button>
        ))}

        <button onClick={() => { setShowChangePwd(s => !s); setPwdError(''); }}
          style={{ width: '100%', background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, marginBottom: 8, textAlign: 'left' }}>
          <span style={{ fontSize: 18 }}>🔑</span>
          <span style={{ flex: 1 }}>Alterar senha</span>
          <span style={{ color: 'var(--muted)' }}>{showChangePwd ? '▲' : '▼'}</span>
        </button>
        {showChangePwd && (
          <div style={{ background: 'var(--dark3)', borderRadius: 12, padding: 16, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input-field" placeholder="Senha atual" type="password" value={pwdForm.current}
              onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))} />
            <input className="input-field" placeholder="Nova senha (mín. 8 caracteres)" type="password" value={pwdForm.newPwd}
              onChange={e => setPwdForm(f => ({ ...f, newPwd: e.target.value }))} />
            {pwdError && <div className="error-msg" style={{ margin: 0 }}>{pwdError}</div>}
            <button className="btn-primary" disabled={pwdLoading} onClick={async () => {
              setPwdError('');
              if (!pwdForm.current || !pwdForm.newPwd) { setPwdError('Preencha ambos os campos'); return; }
              if (pwdForm.newPwd.length < 8) { setPwdError('Mínimo 8 caracteres'); return; }
              setPwdLoading(true);
              try {
                await authAPI.changePassword({ current_password: pwdForm.current, new_password: pwdForm.newPwd });
                showToast('✅ Senha alterada!');
                setPwdForm({ current: '', newPwd: '' });
                setShowChangePwd(false);
              } catch (err) {
                setPwdError(err.response?.data?.error || 'Erro ao alterar senha');
              }
              setPwdLoading(false);
            }}>{pwdLoading ? 'ALTERANDO...' : 'SALVAR'}</button>
          </div>
        )}

        <button className="btn-outline" style={{ marginTop: 12, color: 'var(--red)', borderColor: 'rgba(231,76,60,0.3)' }} onClick={() => { logout(); navigate('home'); }}>
          Sair da conta
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '40px 20px 20px' }}>
      {toast && <div className="toast-msg">{toast}</div>}

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="logo-text" style={{ fontSize: 40 }}>LE<span>BUX</span></div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>A barbearia mais próxima de você</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--dark3)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
        {['login', 'register'].map(t => (
          <button key={t} onClick={() => { setTab(t); setError(''); }}
            style={{ flex: 1, background: tab === t ? 'var(--surface)' : 'transparent', border: 'none', borderRadius: 8, padding: '10px', color: tab === t ? 'var(--text)' : 'var(--muted)', fontSize: 14, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: '.2s' }}>
            {t === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'register' && (
          <input className="input-field" placeholder="Nome completo" value={form.name}
            onChange={e => set('name', e.target.value)} />
        )}

        <div style={{ position: 'relative' }}>
          <input className="input-field"
            placeholder={tab === 'login' ? 'Email ou CNPJ' : 'Email'}
            type="text"
            value={form.email}
            onChange={e => {
              const raw = e.target.value;
              const norm = raw.trim();
              set('email', tab === 'login' ? norm : norm);
              if (tab === 'register') {
                const res = validateEmail(norm.toLowerCase());
                setEmailValid(res.ok ? true : res.msg);
              }
            }} />
          {tab === 'register' && emailValid && emailValid === true && <div style={{ position: 'absolute', right: 12, top: 14, color: 'var(--muted)' }}>✓</div>}
        </div>

        <div style={{ position: 'relative' }}>
          <input className="input-field" placeholder="Senha" type={showPassword ? 'text' : 'password'} value={form.password}
            onChange={e => {
              const v = e.target.value;
              set('password', v);
              if (tab === 'register') setPwdStrength(passwordStrength(v));
            }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {tab === 'register' && pwdStrength && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: -6 }}>{pwdStrength}</div>}
        {tab === 'register' && (
          <input className="input-field" placeholder="Telefone (opcional)" type="tel" value={form.phone}
            onChange={e => set('phone', e.target.value)} />
        )}

        {error && <div className="error-msg">{error}</div>}

        <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'AGUARDE...' : tab === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 13, flexWrap: 'wrap', gap: 10 }}>
        <span>Ao continuar, você concorda com os Termos de Uso da Lebux</span>
        {tab === 'login' && (
          <button type="button" className="btn-link" style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('forgot-password')}>
            Esqueci minha senha
          </button>
        )}
      </div>
    </div>
  );
}
