import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../lib/api';
import { validateEmail, validatePassword, passwordStrength, PASSWORD_HINTS } from '../utils/authValidation';
import SignupSteps from '../components/SignupSteps';

export default function LoginPage({ navigate }) {
  const { user, isCompany, login, register, logout } = useAuth();
  const [tab, setTab] = useState('login');
  const [useNewSignup, setUseNewSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', zipCode: '', gender: '', address: '', city: '', state: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [emailValid, setEmailValid] = useState(null);
  const [pwdStrength, setPwdStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buscarCep = async (cep) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setCepLoading(true);
    setError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      if (!res.ok) throw new Error('Falha na busca');
      const data = await res.json();
      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }
      setForm(f => ({
        ...f,
        address: data.logradouro || f.address,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch {
      setError('Erro ao buscar o CEP');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (tab === 'login') {
        const result = await login(form.email.trim(), form.password);
        const nextIsCompany = result?.user?.isCompany ?? isCompany;
        showToast('✅ Bem-vindo!');
        setTimeout(() => navigate(nextIsCompany ? 'company' : 'home'), 1000);
      } else {
        if (!String(form.name || '').trim()) { setError('O campo "Nome" é obrigatório'); setLoading(false); return; }
        if (!String(form.email || '').trim()) { setError('O campo "E-mail" é obrigatório'); setLoading(false); return; }
        const emailCheck = validateEmail(form.email);
        if (!emailCheck.ok) { setError(emailCheck.msg); setLoading(false); return; }
        if (!String(form.password || '').trim()) { setError('O campo "Senha" é obrigatória'); setLoading(false); return; }
        const pwdCheck = validatePassword(form.password);
        if (!pwdCheck.ok) { setError(pwdCheck.msg); setLoading(false); return; }
        if (!String(form.confirmPassword || '').trim()) { setError('O campo "Confirmar senha" é obrigatório'); setLoading(false); return; }
        if (form.password !== form.confirmPassword) { setError('As senhas não coincidem'); setLoading(false); return; }
        if (!String(form.phone || '').trim()) { setError('O campo "Celular" é obrigatório'); setLoading(false); return; }
        if (!String(form.gender || '').trim()) { setError('O campo "Sexo" é obrigatório'); setLoading(false); return; }
        if (!String(form.zipCode || '').trim()) { setError('O campo "CEP" é obrigatório'); setLoading(false); return; }
        if (!String(form.address || '').trim()) { setError('O campo "Endereço" é obrigatório'); setLoading(false); return; }
        if (!String(form.city || '').trim()) { setError('O campo "Cidade" é obrigatório'); setLoading(false); return; }
        if (!String(form.state || '').trim()) { setError('O campo "Estado" é obrigatório'); setLoading(false); return; }
        const extraData = { address: form.address, city: form.city, state: form.state, zip_code: form.zipCode, gender: form.gender };
        await register(form.name, emailCheck.value, form.password, form.phone, extraData);
        showToast('✅ Bem-vindo à Lebux!');
        setTimeout(() => navigate('home'), 1000);
      }
    } catch (err) {
      setError(tab === 'login' ? 'E-mail, CNPJ ou senha incorretos' : (err.response?.data?.error || 'Erro ao criar conta. Tente novamente.'));
    }
    setLoading(false);
  };

  const handleSignupComplete = async (signupData) => {
    setLoading(true);
    setError('');
    try {
      const registerData = {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        phone: signupData.phone,
        companyType: signupData.companyType,
        address: signupData.address,
        city: signupData.city,
        state: signupData.state,
        zip_code: signupData.zipCode,
        gender: signupData.gender,
      };

      // Se for empresa, adicionar dados da empresa
      if (signupData.companyType !== 'none') {
        registerData.cnpj = signupData.cnpj.replace(/\D/g, '');
        registerData.services = signupData.services;
      }

      await register(signupData.name, signupData.email, signupData.password, signupData.phone, registerData);
      showToast('✅ Bem-vindo à Lebux!');
      setTimeout(() => navigate(signupData.companyType !== 'none' ? 'company' : 'home'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
    }
    setLoading(false);
  };

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState('dados');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    gender: user?.gender || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileCepLoading, setProfileCepLoading] = useState(false);

  const buscarCepProfile = async (cep) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setProfileCepLoading(true);
    setProfileError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      if (!res.ok) throw new Error('Falha na busca');
      const data = await res.json();
      if (data.erro) {
        setProfileError('CEP não encontrado');
        return;
      }
      setProfileForm(f => ({
        ...f,
        address: data.logradouro || f.address,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch {
      setProfileError('Erro ao buscar o CEP');
    } finally {
      setProfileCepLoading(false);
    }
  };

  if (useNewSignup) {
    return <SignupSteps onComplete={handleSignupComplete} onCancel={() => setUseNewSignup(false)} defaultCompanyType="barbershop" />;
  }

  if (user) {
    if (isCompany) {
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

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { id: 'dados', label: 'Meus dados' },
            { id: 'agenda', label: 'Agendamentos' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveProfileTab(tab.id)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1px solid ${activeProfileTab === tab.id ? 'var(--gold)' : 'var(--border)'}`, background: activeProfileTab === tab.id ? 'var(--gold)' : 'var(--dark2)', color: activeProfileTab === tab.id ? '#0F0F0F' : 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeProfileTab === 'dados' ? (
          <div style={{ background: 'var(--dark3)', borderRadius: 12, padding: 16, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input-field" placeholder="Nome" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
            <input className="input-field" placeholder="E-mail" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
            <input className="input-field" placeholder="Celular" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
            <div style={{ position: 'relative' }}>
              <input className="input-field" placeholder="CEP" value={profileForm.zip_code} onChange={e => {
                const next = e.target.value;
                setProfileForm(f => ({ ...f, zip_code: next }));
                if (next.replace(/\D/g, '').length === 8) buscarCepProfile(next);
              }} style={{ flex: 1 }} />
              {profileCepLoading && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>Buscando...</div>}
            </div>
            <input className="input-field" placeholder="Endereço" value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input-field" placeholder="Cidade" value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} style={{ flex: 1 }} />
              <input className="input-field" placeholder="Estado" value={profileForm.state} onChange={e => setProfileForm(f => ({ ...f, state: e.target.value.toUpperCase() }))} style={{ flex: '0 0 100px' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['masculino', 'feminino'].map(g => (
                <button key={g} type="button" onClick={() => setProfileForm(f => ({ ...f, gender: g }))}
                  style={{ flex: 1, background: profileForm.gender === g ? 'var(--gold)' : 'var(--dark2)', border: `1px solid ${profileForm.gender === g ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', color: profileForm.gender === g ? '#0F0F0F' : 'var(--text)', fontWeight: 600 }}>
                  {g === 'masculino' ? '👨 Masculino' : '👩 Feminino'}
                </button>
              ))}
            </div>
            {profileError && <div className="error-msg" style={{ margin: 0 }}>{profileError}</div>}
            <button className="btn-primary" disabled={profileLoading} onClick={async () => {
              setProfileError('');
              if (!String(profileForm.name || '').trim()) { setProfileError('O campo "Nome" é obrigatório'); return; }
              if (!String(profileForm.email || '').trim()) { setProfileError('O campo "E-mail" é obrigatório'); return; }
              if (!String(profileForm.phone || '').trim()) { setProfileError('O campo "Celular" é obrigatório'); return; }
              if (!String(profileForm.zip_code || '').trim()) { setProfileError('O campo "CEP" é obrigatório'); return; }
              if (!String(profileForm.address || '').trim()) { setProfileError('O campo "Endereço" é obrigatório'); return; }
              if (!String(profileForm.city || '').trim()) { setProfileError('O campo "Cidade" é obrigatório'); return; }
              if (!String(profileForm.state || '').trim()) { setProfileError('O campo "Estado" é obrigatório'); return; }
              if (!String(profileForm.gender || '').trim()) { setProfileError('O campo "Sexo" é obrigatório'); return; }
              setProfileLoading(true);
              try {
                const { data } = await authAPI.updateProfile({
                  name: profileForm.name,
                  email: profileForm.email,
                  phone: profileForm.phone,
                  address: profileForm.address,
                  city: profileForm.city,
                  state: profileForm.state,
                  zip_code: profileForm.zip_code,
                  gender: profileForm.gender,
                });
                const updatedUser = { ...user, ...data.user };
                localStorage.setItem('lebux_user', JSON.stringify(updatedUser));
                window.location.reload();
              } catch (err) {
                setProfileError(err.response?.data?.error || 'Erro ao atualizar dados');
              }
              setProfileLoading(false);
            }}>{profileLoading ? 'SALVANDO...' : 'SALVAR DADOS'}</button>
          </div>
        ) : (
          [
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
          ))
        )}

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
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: -4, lineHeight: 1.5 }}>{PASSWORD_HINTS}</div>
        )}
        {tab === 'register' && (
          <input className="input-field" placeholder="Confirmar senha" type={showPassword ? 'text' : 'password'} value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)} />
        )}
        {tab === 'register' && (
          <input className="input-field" placeholder="Celular" type="tel" value={form.phone}
            onChange={e => set('phone', e.target.value)} />
        )}
        {tab === 'register' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {['masculino', 'feminino'].map(g => (
              <button key={g} type="button" onClick={() => set('gender', g)}
                style={{ flex: 1, background: form.gender === g ? 'var(--gold)' : 'var(--dark3)', border: `1px solid ${form.gender === g ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', color: form.gender === g ? 'var(--dark)' : 'var(--text)', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                {g === 'masculino' ? '👨 Masculino' : '👩 Feminino'}
              </button>
            ))}
          </div>
        )}
        {tab === 'register' && (
          <>
            <div style={{ position: 'relative' }}>
              <input className="input-field" placeholder="CEP" maxLength={9} value={form.zipCode}
                onChange={e => { set('zipCode', e.target.value); if (e.target.value.replace(/\D/g, '').length === 8) buscarCep(e.target.value); }} />
              {cepLoading && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>Buscando...</div>}
            </div>
            <input className="input-field" placeholder="Endereço" value={form.address}
              onChange={e => set('address', e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input-field" placeholder="Cidade" value={form.city}
                onChange={e => set('city', e.target.value)} style={{ flex: 1 }} />
              <input className="input-field" placeholder="Estado" value={form.state} maxLength={2}
                onChange={e => set('state', e.target.value.toUpperCase())} style={{ flex: '0 0 100px' }} />
            </div>
          </>
        )}

        {error && <div className="error-msg">{error}</div>}

        <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'AGUARDE...' : tab === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
        </button>

        {tab === 'register' && (
          <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setUseNewSignup(true)}>
            Cadastro com CNPJ (Empresas)
          </button>
        )}
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
