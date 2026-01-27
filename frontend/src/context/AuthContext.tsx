import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'owner' | 'manager' | 'renter';
  phone?: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'owner' | 'manager' | 'renter';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          setToken(storedToken);
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    };

    initAuth();
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      
      console.log('Logging in with:', { email, apiUrl: API_URL });
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      console.log('Login response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { user: userData, token: authToken } = response.data.data;
      
      // Validate user data
      if (!userData || !authToken) {
        throw new Error('Invalid response from server');
      }

      // Store user and token
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      toast.success(`Welcome back, ${userData.firstName || userData.email}!`);
      
      return userData;
      
    } catch (error: any) {
      console.error('Login error details:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<User> => {
    try {
      setIsLoading(true);
      
      console.log('Registering user:', { ...userData, password: '***' });
      
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      console.log('Register response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }

      const { user: newUser, token: authToken } = response.data.data; // Fixed: renamed to newUser
      
      if (!newUser || !authToken) {
        throw new Error('Invalid response from server');
      }

      // Store user and token
      setUser(newUser);
      setToken(authToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', authToken);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      toast.success(`Account created successfully! Welcome, ${newUser.firstName || newUser.email}!`);
      
      return newUser;
      
    } catch (error: any) {
      console.error('Registration error details:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
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

  const checkAuth = (): boolean => {
    return !!user && !!token;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading, 
      token,
      checkAuth 
    }}>
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