import React, { useState } from 'react';
import { validateEmail, validatePassword, PASSWORD_HINTS } from '../utils/authValidation';

const STANDARD_SERVICES = [
  { id: 'corte_clasico', name: 'Corte Clássico', price: 30, duration: 30, category: 'corte' },
  { id: 'corte_moderno', name: 'Corte Moderno', price: 35, duration: 30, category: 'corte' },
  { id: 'corte_degrade', name: 'Corte Degradê', price: 35, duration: 35, category: 'corte' },
  { id: 'corte_feminino', name: 'Corte Feminino', price: 40, duration: 40, category: 'corte_feminino' },
  { id: 'barba_completa', name: 'Barba Completa', price: 25, duration: 25, category: 'barba' },
  { id: 'barba_tradicional', name: 'Barba Tradicional', price: 22, duration: 25, category: 'barba' },
  { id: 'sobrancelha', name: 'Sobrancelha', price: 15, duration: 15, category: 'sobrancelha' },
  { id: 'pigmentacao', name: 'Pigmentação', price: 70, duration: 60, category: 'pigmento' },
  { id: 'combo', name: 'Corte + Barba', price: 50, duration: 50, category: 'combo' },
];

export default function SignupSteps({ onComplete, onCancel, defaultCompanyType = '' }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    companyType: defaultCompanyType, // 'none', 'barbershop', 'salon'
    cnpj: '',
    zipCode: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    offerServices: null, // null | true | false
    services: [],
  });
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const toggleStandardService = (svc) => {
    setFormData(f => {
      const exists = f.services.find(s => s.name === svc.name);
      if (exists) return { ...f, services: f.services.filter(s => s.name !== svc.name) };
      return { ...f, services: [...f.services, { name: svc.name, price: svc.price, duration_minutes: svc.duration, category: svc.category, description: '' }] };
    });
  };

  const updateServiceField = (name, field, value) => {
    setFormData(f => ({
      ...f,
      services: f.services.map(s => s.name === name ? { ...s, [field]: field === 'price' ? (parseFloat(value) || 0) : value } : s),
    }));
  };

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
      setFormData(f => ({
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

  const handleNextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.name.trim()) {
        setError(formData.companyType && formData.companyType !== 'none' ? 'Razão Social é obrigatória' : 'Nome é obrigatório');
        return;
      }
      const emailCheck = validateEmail(formData.email);
      if (!emailCheck.ok) {
        setError(emailCheck.msg);
        return;
      }
      const pwdCheck = validatePassword(formData.password);
      if (!pwdCheck.ok) {
        setError(pwdCheck.msg);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
      if (!formData.phone.trim()) {
        setError('Celular é obrigatório');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.companyType) {
        setError('Selecione o tipo de cadastro');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (formData.companyType === 'none' && !String(formData.gender || '').trim()) {
        setError('O campo "Sexo" é obrigatório');
        return;
      }
      if (!String(formData.zipCode || '').trim()) {
        setError('O campo "CEP" é obrigatório');
        return;
      }
      if (!String(formData.address || '').trim()) {
        setError('O campo "Endereço" é obrigatório');
        return;
      }
      if (!String(formData.city || '').trim()) {
        setError('O campo "Cidade" é obrigatório');
        return;
      }
      if (!String(formData.state || '').trim()) {
        setError('O campo "Estado" é obrigatório');
        return;
      }
      const isCompany = formData.companyType !== 'none';
      if (isCompany) {
        const cnpjClean = formData.cnpj.replace(/\D/g, '');
        if (cnpjClean.length !== 14) {
          setError('CNPJ deve ter 14 dígitos');
          return;
        }
        if (formData.offerServices === null || typeof formData.offerServices !== 'boolean') {
          setError('Selecione se deseja oferecer serviços');
          return;
        }
        if (formData.offerServices) {
          setStep(4);
        } else {
          onComplete(formData);
        }
      } else {
        onComplete(formData);
      }
    } else if (step === 4) {
      if (formData.services.length === 0) {
        setError('Selecione pelo menos um serviço');
        return;
      }
      onComplete(formData);
    }
  };

  const handlePrevStep = () => {
    if (step === 1) {
      onCancel();
    } else if (step === 3 && formData.companyType === 'none') {
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  const formatCNPJ = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
  };

  const isCompanyFlow = formData.companyType && formData.companyType !== 'none';
  const totalSteps = isCompanyFlow ? (formData.offerServices === true ? 4 : 3) : 3;
  const finalStep = totalSteps;

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--dark2)', borderRadius: 16, border: '1px solid var(--border)', padding: '24px', maxWidth: 500, width: '100%' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div className="logo-text" style={{ fontSize: 20, marginBottom: 8 }}>LE<span>BUX</span></div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cadastro - Etapa {step} de {totalSteps}</div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 4, background: 'var(--dark3)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--gold)',
            width: `${(step / totalSteps) * 100}%`,
            transition: '0.3s'
          }} />
        </div>

        {/* Error */}
        {error && <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>{error}</div>}

        {/* Step 1: Dados Básicos */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Informações Básicas</h3>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{formData.companyType && formData.companyType !== 'none' ? 'Razão Social *' : 'Nome Completo *'}</label>
              <input className="input-field" placeholder={formData.companyType && formData.companyType !== 'none' ? 'Nome da empresa' : 'Seu nome completo'}
                value={formData.name} onChange={e => set('name', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>E-mail *</label>
              <input className="input-field" placeholder="seu@email.com" type="email"
                value={formData.email} onChange={e => set('email', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Senha *</label>
              <input className="input-field" placeholder="Mínimo 8 caracteres com números" type="password"
                value={formData.password} onChange={e => set('password', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{PASSWORD_HINTS}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Confirmar Senha *</label>
              <input className="input-field" placeholder="Digite a senha novamente" type="password"
                value={formData.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Celular *</label>
              <input className="input-field" placeholder="(11) 9 9999-9999"
                value={formData.phone} onChange={e => set('phone', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
            </div>
          </div>
        )}

        {/* Step 2: Tipo de Cadastro */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Tipo de Cadastro</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, marginBottom: 12 }}>Você é uma empresa prestadora de serviços?</p>
            
            {[
              { value: 'none', label: 'Cliente', icon: '👤', desc: 'Agendar serviços' },
              { value: 'barbershop', label: 'Barbearia', icon: '💈', desc: 'Gerenciar agendamentos' },
              { value: 'salon', label: 'Cabeleleira', icon: '💇‍♀️', desc: 'Gerenciar agendamentos' },
            ].map(opt => (
              <button key={opt.value} onClick={() => set('companyType', opt.value)}
                style={{
                  background: formData.companyType === opt.value ? 'var(--gold)' : 'var(--dark3)',
                  border: `2px solid ${formData.companyType === opt.value ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: '0.2s'
                }}>
                <span style={{ fontSize: 24 }}>{opt.icon}</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: formData.companyType === opt.value ? '#0F0F0F' : 'var(--text)' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: formData.companyType === opt.value ? 'rgba(0,0,0,0.6)' : 'var(--muted)' }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Endereço (e CNPJ para empresas) */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formData.companyType !== 'none'
              ? <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Informações da {formData.companyType === 'barbershop' ? 'Barbearia' : 'Cabeleleira'}</h3>
              : <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Seu Endereço</h3>
            }
            
            {formData.companyType !== 'none' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>CNPJ *</label>
                <input className="input-field" placeholder="XX.XXX.XXX/XXXX-XX"
                  value={formatCNPJ(formData.cnpj)} onChange={e => set('cnpj', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
              </div>
            )}

            {formData.companyType !== 'none' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Deseja oferecer serviços? *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => set('offerServices', true)}
                    style={{ flex: 1, background: formData.offerServices === true ? 'var(--gold)' : 'var(--dark3)', border: `1px solid ${formData.offerServices === true ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', color: formData.offerServices === true ? 'var(--dark)' : 'var(--text)', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                    ✅ Sim
                  </button>
                  <button type="button" onClick={() => set('offerServices', false)}
                    style={{ flex: 1, background: formData.offerServices === false ? 'var(--gold)' : 'var(--dark3)', border: `1px solid ${formData.offerServices === false ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', color: formData.offerServices === false ? 'var(--dark)' : 'var(--text)', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                    ❌ Não
                  </button>
                </div>
              </div>
            )}

            {formData.companyType === 'none' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Sexo *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['masculino', 'feminino'].map(g => (
                    <button key={g} type="button" onClick={() => set('gender', g)}
                      style={{ flex: 1, background: formData.gender === g ? 'var(--gold)' : 'var(--dark3)', border: `1px solid ${formData.gender === g ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', color: formData.gender === g ? 'var(--dark)' : 'var(--text)', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                      {g === 'masculino' ? '👨 Masculino' : '👩 Feminino'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>CEP *</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" placeholder="Digite o CEP para preencher o endereço" maxLength="9"
                  value={formData.zipCode} onChange={e => {
                    const v = e.target.value;
                    set('zipCode', v);
                    if (v.replace(/\D/g, '').length === 8) buscarCep(v);
                  }}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
                {cepLoading && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>Buscando...</div>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Endereço *</label>
              <input className="input-field" placeholder="Rua, número, complemento"
                value={formData.address} onChange={e => set('address', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Cidade *</label>
                <input className="input-field" placeholder="São Paulo"
                  value={formData.city} onChange={e => set('city', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Estado *</label>
                <input className="input-field" placeholder="SP" maxLength="2"
                  value={formData.state} onChange={e => set('state', e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Serviços */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Serviços Prestados</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, marginBottom: 8 }}>Selecione pelo menos um serviço padrão. Use a observação para descrever cada serviço.</p>

            {STANDARD_SERVICES.map(svc => {
              const selected = formData.services.find(s => s.name === svc.name);
              return (
                <div key={svc.id} style={{
                  background: 'var(--dark3)',
                  borderRadius: 8,
                  padding: 12,
                  border: selected ? '1px solid var(--gold)' : '1px solid transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                  <button type="button" onClick={() => toggleStandardService(svc)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>
                    <input type="checkbox" readOnly checked={!!selected} style={{ accentColor: 'var(--gold)', width: 18, height: 18, cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{svc.name}</span>
                    <span style={{ color: 'var(--gold)', fontSize: 13 }}>R$ {svc.price.toFixed(2)}</span>
                  </button>
                  {selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Observação (descrição do serviço)</label>
                        <textarea className="input-field" placeholder="Descreva o que inclui este serviço..."
                          value={selected.description || ''} onChange={e => updateServiceField(svc.name, 'description', e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, resize: 'vertical', minHeight: 60 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Valor (R$)</label>
                        <input className="input-field" type="number" step="0.01"
                          value={selected.price} onChange={e => updateServiceField(svc.name, 'price', e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={handlePrevStep}
            style={{ flex: 1, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          <button onClick={handleNextStep}
            style={{ flex: 1, background: 'var(--gold)', border: 'none', borderRadius: 8, padding: '14px', color: '#0F0F0F', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
            {step === (formData.companyType === 'none' ? 3 : 4) ? 'Finalizar Cadastro' : 'Próxima'}
          </button>
        </div>
      </div>
    </div>
  );
}
