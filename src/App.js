import { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const navigateRouter = useNavigate();
  const location = useLocation();
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [resetToken, setResetToken] = useState('');

  // generic navigate helper for existing components expecting `navigate(screen, data)`
  const navigate = (to, data = {}) => {
    if (data.shop) setSelectedShop(data.shop);
    if (data.service) setSelectedService(data.service);
    if (data.token) setResetToken(data.token);

    switch (to) {
      case 'home': return navigateRouter('/');
      case 'barbershop': return navigateRouter('/barbershop');
      case 'booking': return navigateRouter('/booking');
      case 'appointments': return navigateRouter('/appointments');
      case 'company': return navigateRouter('/company');
      case 'login': return navigateRouter('/login');
      case 'forgot-password': return navigateRouter('/forgot-password');
      case 'reset-password': return navigateRouter('/reset-password');
      default: return navigateRouter('/');
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
        <Route path="/barbershop" element={<RequireAuth><BarbershopPage shop={selectedShop} navigate={navigate} /></RequireAuth>} />
        <Route path="/booking" element={<RequireAuth><BookingPage shop={selectedShop} service={selectedService} navigate={navigate} /></RequireAuth>} />
        <Route path="/appointments" element={<RequireAuth><AppointmentsPage navigate={navigate} /></RequireAuth>} />
        <Route path="/login" element={<LoginPage navigate={navigate} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage navigate={navigate} />} />
        <Route path="/reset-password" element={<ResetPasswordPage navigate={navigate} token={resetToken} />} />
        <Route path="/company" element={<RequireAuth><CompanyPage navigate={navigate} /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* bottom nav: show different items depending on authentication; hide on auth pages */}
      {(() => {
        const hideOn = ['/login', '/forgot-password', '/reset-password'];
        const hideNav = hideOn.includes(location.pathname);
        if (hideNav) return null;
        return (
          <nav className="bottom-nav">
            {user ? (
              <>
                {user.role === 'company' ? (
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
