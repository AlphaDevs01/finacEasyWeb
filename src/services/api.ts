import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000'
});

// Interceptor para tokens
api.interceptors.request.use(config => {
  const token = localStorage.getItem('@FinanceApp:token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado, deslogar usuário
      localStorage.removeItem('@FinanceApp:token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);