import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lebux_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (typeof parsed.isCompany === 'undefined') {
      const legacyIsCompany = localStorage.getItem('lebux_is_company') === 'true';
      return { ...parsed, isCompany: legacyIsCompany };
    }
    return parsed;
  });

  const persistUser = (userData) => {
    const normalizedUser = {
      ...userData,
      isCompany: Boolean(userData?.isCompany),
    };
    localStorage.setItem('lebux_user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('lebux_token', data.token);
    const normalizedUser = persistUser({ ...data.user, isCompany: data.user?.isCompany ?? data.isCompany });
    return { ...data, user: normalizedUser };
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    const { data } = await authAPI.register({ name, email, password, phone });
    localStorage.setItem('lebux_token', data.token);
    const normalizedUser = persistUser({ ...data.user, isCompany: data.user?.isCompany ?? data.isCompany });
    return { ...data, user: normalizedUser };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lebux_token');
    localStorage.removeItem('lebux_user');
    localStorage.removeItem('lebux_is_company');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isCompany: Boolean(user?.isCompany), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
