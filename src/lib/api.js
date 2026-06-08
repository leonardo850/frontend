import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('lebux_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lebux_token');
      localStorage.removeItem('lebux_user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  forgotPassword: (data) => api.post('/api/auth/forgot', data),
  resetPassword: (data) => api.post('/api/auth/reset', data),
};

// Barbershops
export const barbershopsAPI = {
  getAll: (params) => api.get('/api/barbershops', { params }),
  getById: (id) => api.get(`/api/barbershops/${id}`),
  getAvailability: (id, date, serviceId) =>
    api.get(`/api/barbershops/${id}/availability`, { params: { date, service_id: serviceId } }),
};

// Appointments
export const appointmentsAPI = {
  create: (data) => api.post('/api/appointments', data),
  getMyAppointments: () => api.get('/api/appointments'),
  cancel: (id) => api.patch(`/api/appointments/${id}/cancel`),
};

export default api;
