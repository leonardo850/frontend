export function validateEmail(email) {
  const norm = String(email || '').trim().toLowerCase();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(norm)) return { ok: false, msg: 'E-mail inválido' };
  if (norm.length > 254) return { ok: false, msg: 'E-mail muito longo' };
  return { ok: true, value: norm };
}

export function validatePassword(pwd) {
  if (typeof pwd !== 'string') return { ok: false, msg: 'Senha inválida' };
  if (pwd.length < 8) return { ok: false, msg: 'Mínimo 8 caracteres' };
  if (pwd.length > 128) return { ok: false, msg: 'Máximo 128 caracteres' };
  return { ok: true };
}

export function passwordStrength(pwd) {
  let score = 0;
  if (!pwd) return 'Muito fraca';
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = ['Muito fraca','Fraca','Média','Forte','Muito forte'];
  return levels[Math.min(score, 4)];
}
