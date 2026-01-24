import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Change from process.env (CRA) to import.meta.env (Vite)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'renter';
  phone?: string;
  buildingId?: string;
  apartmentNumber?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on app load
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { user, token } = response.data.data;
      
      // Store user and token
      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success(`Welcome back, ${user.firstName}!`);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      const { user, token } = response.data.data;
      
      // Store user and token
      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success(`Account created successfully! Welcome, ${user.firstName}!`);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};