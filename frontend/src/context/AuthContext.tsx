import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin' | 'superadmin';
  department?: string;
  section?: string;
  subject?: string;
  enrollmentNumber?: string;
  semester?: number;
  isEmailVerified: boolean;
  avatar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, accessKey?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (user: User) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  enrollmentNumber?: string;
  department?: string;
  section?: string;
  subject?: string;
  semester?: number;
  otpToken?: string | null;
  role?: 'student' | 'faculty' | 'admin' | 'superadmin';
  accessKey?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthStorage = () => {
    localStorage.removeItem('cdgi_token');
    localStorage.removeItem('cdgi_refresh_token');
    localStorage.removeItem('cdgi_user');
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const savedToken = localStorage.getItem('cdgi_token');
      const savedUser = localStorage.getItem('cdgi_user');

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem('cdgi_user');
        }
      }

      try {
        const { data } = await api.get('/auth/me');
        const userData = data?.data;
        if (userData) {
          setUser(userData);
          localStorage.setItem('cdgi_user', JSON.stringify(userData));
        } else {
          clearAuthStorage();
          setToken(null);
          setUser(null);
        }
      } catch {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email: string, password: string, accessKey?: string) => {
    const { data } = await api.post('/auth/login', { email, password, accessKey });
    const { token: newToken, refreshToken, user: userData } = data.data;

    localStorage.setItem('cdgi_token', newToken);
    localStorage.setItem('cdgi_refresh_token', refreshToken);
    localStorage.setItem('cdgi_user', JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
  };

  const register = async (regData: RegisterData) => {
    await api.post('/auth/register', regData);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    clearAuthStorage();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cdgi_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
