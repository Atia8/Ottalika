import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBuilding, FaUser, FaLock, FaEnvelope, FaPhone } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'manager' | 'owner' | 'renter'>('renter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const user = await login(email, password);
        console.log('Login successful, user:', user);
        
        // Navigate based on user role
        switch (user.role) {
          case 'owner':
            navigate('/owner');
            break;
          case 'manager':
            navigate('/manager/dashboard');
            break;
          case 'renter':
            navigate('/renter/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        // Register
        const user = await register({
          email,
          password,
          firstName,
          lastName,
          phone,
          role,
        });
        
        console.log('Registration successful, user:', user);
        
        // Navigate based on user role
        switch (user.role) {
          case 'owner':
            navigate('/owner');
            break;
          case 'manager':
            navigate('/manager/dashboard');
            break;
          case 'renter':
            navigate('/renter/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error: any) {
      console.error('Authentication failed:', error.message);
      // Error is already shown via toast in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPassword: string = 'demo123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    // Auto-submit after a short delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl mb-4">
            <FaBuilding className="text-2xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Ottalika</h1>
          <p className="text-slate-600">Smart Building Management System</p>
        </div>

        {/* Toggle between Login/Register */}
        <div className="flex mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              isLogin
                ? 'bg-violet-500 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              !isLogin
                ? 'bg-violet-500 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="John"
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Doe"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="+880 1712345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required={!isLogin}
                  >
                    <option value="renter">Renter</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors bg-violet-500 hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading
                ? (isLogin ? 'Signing in...' : 'Creating account...')
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          {/* Demo Login Buttons - Only show on login screen */}
          {isLogin && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3 text-center">Quick demo login:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDemoLogin('manager@ottalika.com')}
                  className="py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  Manager
                </button>
                <button
                  onClick={() => handleDemoLogin('owner@ottalika.com')}
                  className="py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                >
                  Owner
                </button>
                <button
                  onClick={() => handleDemoLogin('renter@ottalika.com')}
                  className="py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all"
                >
                  Renter
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Password for all demo accounts: <code>demo123</code>
              </p>
            </div>
          )}

          {/* API Test Link */}
          <div className="mt-6 text-center">
            <a 
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/test`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-violet-600 hover:text-violet-700 hover:underline"
            >
              Test API Connection
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Ottalika. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;