import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  nome: string;
  email: string;
}

interface AuthContextData {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('@FinanceApp:token');
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Buscar informações do usuário
      api.get('/configuracoes')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('@FinanceApp:token');
          api.defaults.headers.common['Authorization'] = '';
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, senha: string): Promise<void> => {
    const response = await api.post('/auth/login', { email, senha });
    
    const { token, user } = response.data;
    
    localStorage.setItem('@FinanceApp:token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
  };

  const register = async (nome: string, email: string, senha: string): Promise<void> => {
    const response = await api.post('/auth/register', { nome, email, senha });
    
    const { token, user } = response.data;
    
    localStorage.setItem('@FinanceApp:token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
  };

  const logout = (): void => {
    localStorage.removeItem('@FinanceApp:token');
    api.defaults.headers.common['Authorization'] = '';
    setUser(null);
  };

  const updateUser = async (data: Partial<User>): Promise<void> => {
    const response = await api.put('/configuracoes/usuario', data);
    setUser(prevUser => ({
      ...(prevUser as User),
      ...response.data
    }));
  };

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated: !!user, 
        user, 
        loading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}