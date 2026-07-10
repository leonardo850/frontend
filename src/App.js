import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BarbershopPage from './pages/BarbershopPage';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CompanyPage from './pages/CompanyPage';
import './App.css';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, isCompany } = useAuth();
  const navigateRouter = useNavigate();
  const location = useLocation();
  const [resetToken, setResetToken] = useState('');

  const navigate = (to, data = {}) => {
    const state = {
      shop: data.shop,
      service: data.service,
      token: data.token,
    };

    switch (to) {
      case 'home': return navigateRouter('/', { state });
      case 'barbershop': return navigateRouter('/barbershop', { state });
      case 'booking': return navigateRouter('/booking', { state });
      case 'appointments': return navigateRouter('/appointments', { state });
      case 'company': return navigateRouter('/company', { state });
      case 'login': return navigateRouter('/login', { state });
      case 'forgot-password': return navigateRouter('/forgot-password', { state });
      case 'reset-password': return navigateRouter('/reset-password', { state });
      default: return navigateRouter('/', { state });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      navigateRouter('/reset-password');
    }
  }, [navigateRouter]);

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<RequireAuth><HomePage navigate={navigate} /></RequireAuth>} />
        <Route path="/barbershop" element={<RequireAuth><BarbershopPage navigate={navigate} /></RequireAuth>} />
        <Route path="/booking" element={<RequireAuth><BookingPage navigate={navigate} /></RequireAuth>} />
        <Route path="/appointments" element={<RequireAuth><AppointmentsPage navigate={navigate} /></RequireAuth>} />
        <Route path="/login" element={<LoginPage navigate={navigate} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage navigate={navigate} />} />
        <Route path="/reset-password" element={<ResetPasswordPage navigate={navigate} token={resetToken} />} />
        <Route path="/company" element={<RequireAuth><CompanyPage navigate={navigate} /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {(() => {
        const hideOn = ['/login', '/forgot-password', '/reset-password'];
        const hideNav = hideOn.includes(location.pathname);
        if (hideNav) return null;
        return (
          <nav className="bottom-nav">
            {user ? (
              <>
                {isCompany ? (
                  <button className={`nav-btn`} onClick={() => navigate('company')}>
                    <span className="nav-icon">💼</span>
                    <span className="nav-label">Empresa</span>
                  </button>
                ) : (
                  <button className={`nav-btn`} onClick={() => navigate('home')}>
                    <span className="nav-icon">🏠</span>
                    <span className="nav-label">Início</span>
                  </button>
                )}
                <button className={`nav-btn`} onClick={() => navigate('appointments')}>
                  <span className="nav-icon">📅</span>
                  <span className="nav-label">Agendados</span>
                </button>
                <button className={`nav-btn`} onClick={() => navigate('login')}>
                  <span className="nav-icon">👤</span>
                  <span className="nav-label">Perfil</span>
                </button>
              </>
            ) : (
              <button className={`nav-btn`} onClick={() => navigate('login')}>
                <span className="nav-icon">👤</span>
                <span className="nav-label">Entrar</span>
              </button>
            )}
          </nav>
        );
      })()}
    </div>
  );
}
