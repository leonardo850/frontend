import React, { useState } from 'react';
import { validateEmail, validatePassword } from '../utils/authValidation';

export default function SignupSteps({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    companyType: '', // 'none', 'barbershop', 'salon'
    cnpj: '',
    zipCode: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    services: [],
  });
  const [error, setError] = useState('');
  const [serviceForm, setServiceForm] = useState({ name: '', price: '' });
  const [cepLoading, setCepLoading] = useState(false);

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const handleAddService = () => {
    if (!serviceForm.name || !serviceForm.price) {
      setError('Preencha nome e preço do serviço');
      return;
    }
    setFormData(f => ({
      ...f,
      services: [...f.services, { ...serviceForm, price: parseFloat(serviceForm.price) }],
    }));
    setServiceForm({ name: '', price: '' });
    setError('');
  };

  const handleRemoveService = (index) => {
    setFormData(f => ({
      ...f,
      services: f.services.filter((_, i) => i !== index),
    }));
  };

  const handleNextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Nome é obrigatório');
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
      if (formData.companyType === 'none' && !formData.gender) {
        setError('Selecione o sexo');
        return;
      }
      if (!formData.zipCode.trim()) {
        setError('CEP é obrigatório');
        return;
      }
      if (!formData.address.trim()) {
        setError('Endereço é obrigatório');
        return;
      }
      if (!formData.city.trim() || !formData.state.trim()) {
        setError('Cidade e estado são obrigatórios');
        return;
      }
      const isCompany = formData.companyType !== 'none';
      if (isCompany) {
        const cnpjClean = formData.cnpj.replace(/\D/g, '');
        if (cnpjClean.length !== 14) {
          setError('CNPJ deve ter 14 dígitos');
          return;
        }
        setStep(4);
      } else {
        onComplete(formData);
      }
    } else if (step === 4) {
      if (formData.services.length === 0) {
        setError('Adicione pelo menos um serviço');
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

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--dark2)', borderRadius: 16, border: '1px solid var(--border)', padding: '24px', maxWidth: 500, width: '100%' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div className="logo-text" style={{ fontSize: 20, marginBottom: 8 }}>LE<span>BUX</span></div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cadastro - Etapa {step} de {formData.companyType === 'none' ? 3 : 4}</div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 4, background: 'var(--dark3)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--gold)',
            width: `${formData.companyType === 'none' ? (step / 3) * 100 : (step / 4) * 100}%`,
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
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Mínimo 8 caracteres, números e letras</div>
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

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>CEP *</label>
              <input className="input-field" placeholder="12345-678"
                value={formData.zipCode} onChange={e => set('zipCode', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
            </div>
          </div>
        )}

        {/* Step 4: Serviços */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Serviços Prestados</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, marginBottom: 8 }}>Adicione pelo menos um serviço</p>

            {/* Serviços adicionados */}
            {formData.services.length > 0 && (
              <div style={{ background: 'var(--dark3)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                {formData.services.map((svc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < formData.services.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{svc.name}</div>
                      <div style={{ color: 'var(--gold)', fontSize: 12 }}>R$ {svc.price.toFixed(2)}</div>
                    </div>
                    <button onClick={() => handleRemoveService(i)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar novo serviço */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--dark3)', borderRadius: 8, padding: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Serviço</label>
                <input className="input-field" placeholder="Ex: Corte de Cabelo"
                  value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Valor (R$)</label>
                  <input className="input-field" placeholder="40,00" type="number" step="0.01"
                    value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
                </div>
                <button onClick={handleAddService}
                  style={{ background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '10px 16px', color: '#0F0F0F', fontWeight: 600, cursor: 'pointer', fontSize: 12, alignSelf: 'flex-end', marginTop: 20 }}>
                  Adicionar
                </button>
              </div>
            </div>
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
