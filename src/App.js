import { useState, useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import BarbershopPage from './pages/BarbershopPage';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | barbershop | booking | appointments | login | reset-password
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [activeNav, setActiveNav] = useState('home');
  const [resetToken, setResetToken] = useState('');

  const navigate = (to, data = {}) => {
    setScreen(to);
    if (data.shop) setSelectedShop(data.shop);
    if (data.service) setSelectedService(data.service);
    if (data.token) setResetToken(data.token);
    window.scrollTo(0, 0);
  };

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Início' },
    { id: 'appointments', icon: '📅', label: 'Agendados' },
    { id: 'login', icon: '👤', label: 'Perfil' },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setScreen('reset-password');
    }
  }, []);

  return (
    <AuthProvider>
      <div className="app-shell">
        {screen === 'home' && <HomePage navigate={navigate} />}
        {screen === 'barbershop' && <BarbershopPage shop={selectedShop} navigate={navigate} />}
        {screen === 'booking' && <BookingPage shop={selectedShop} service={selectedService} navigate={navigate} />}
        {screen === 'appointments' && <AppointmentsPage navigate={navigate} />}
        {screen === 'login' && <LoginPage navigate={navigate} />}
        {screen === 'forgot-password' && <ForgotPasswordPage navigate={navigate} />}
        {screen === 'reset-password' && <ResetPasswordPage navigate={navigate} token={resetToken} />}

        <nav className="bottom-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => { setActiveNav(item.id); navigate(item.id); }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </AuthProvider>
  );
}
