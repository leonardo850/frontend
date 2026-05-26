import { useState } from 'react';
import { AuthProvider } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import BarbershopPage from './pages/BarbershopPage';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LoginPage from './pages/LoginPage';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | barbershop | booking | appointments | login
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [activeNav, setActiveNav] = useState('home');

  const navigate = (to, data = {}) => {
    setScreen(to);
    if (data.shop) setSelectedShop(data.shop);
    if (data.service) setSelectedService(data.service);
    window.scrollTo(0, 0);
  };

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Início' },
    { id: 'appointments', icon: '📅', label: 'Agendados' },
    { id: 'login', icon: '👤', label: 'Perfil' },
  ];

  return (
    <AuthProvider>
      <div className="app-shell">
        {screen === 'home' && <HomePage navigate={navigate} />}
        {screen === 'barbershop' && <BarbershopPage shop={selectedShop} navigate={navigate} />}
        {screen === 'booking' && <BookingPage shop={selectedShop} service={selectedService} navigate={navigate} />}
        {screen === 'appointments' && <AppointmentsPage navigate={navigate} />}
        {screen === 'login' && <LoginPage navigate={navigate} />}

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
