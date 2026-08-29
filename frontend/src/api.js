import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach X-User-Email and X-User-Id
api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('placement_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.email) config.headers['X-User-Email'] = user.email;
      if (user.id) config.headers['X-User-Id'] = user.id;
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
