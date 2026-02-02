import axios from 'axios';

const api = axios.create({
  baseURL: 'https://capitune-api.up.railway.app/api'
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('📤 Sending token with request:', config.url);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('⚠️ No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url || '';
    if (status === 401) {
      // Ne pas casser la session pour des appels secondaires
      const critical = reqUrl.includes('/users/me') || reqUrl.includes('/auth/');
      if (critical) {
        console.error('❌ 401 on critical endpoint, redirecting to login:', reqUrl);
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        console.warn('⚠️ 401 on non-critical endpoint, keeping session:', reqUrl);
      }
    } else if (error.response) {
      console.error(`❌ Error ${error.response.status}:`, error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
