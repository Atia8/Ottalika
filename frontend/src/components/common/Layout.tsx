import React from 'react';
import { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

import { 
  FaBars, 
  FaSignOutAlt, 
  FaHome,
  FaUsers,
  FaReceipt,
  FaTools,
  FaCheckCircle,
  FaEnvelope,
  FaCaretRight,
  FaCaretDown,
  FaBell,
  FaUserCircle,
  FaSearch,
  FaCog
} from 'react-icons/fa';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);

  // Sidebar navigation items based on your design
  const navItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: <FaHome />, 
      path: '/dashboard',
      active: true
    },
    { 
      id: 'renters', 
      name: 'Renters', 
      icon: <FaUsers />, 
      path: '/renters',
      active: false
    },
    { 
      id: 'bills', 
      name: 'Bills', 
      icon: <FaReceipt />, 
      path: '/bills',
      active: false
    },
    { 
      id: 'maintenance', 
      name: 'Maintenance', 
      icon: <FaTools />, 
      path: '/maintenance',
      active: false
    },
    { 
      id: 'payments', 
      name: 'Payments', 
      icon: <FaCheckCircle />, 
      path: '/payments',
      active: false
    },
    { 
      id: 'messages', 
      name: 'Messages', 
      icon: <FaEnvelope />, 
      path: '/messages',
      active: false
    },
  ];

  // Check if item is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FaBars className="text-xl text-slate-700" />
          </button>
          
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Ottalika</h1>
              <p className="text-xs text-slate-500">Manager Portal</p>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-slate-100 rounded-full">
              <FaBell className="text-xl text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full">
              <FaUserCircle className="text-2xl text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">O</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Smart Building</h2>
                <p className="text-sm text-slate-500">Manager Portal</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-slate-500">Building Manager</p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-white rounded-lg">
              <FaSignOutAlt className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path) 
                    ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-l-4 border-violet-600 text-violet-700' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-lg ${isActive(item.path) ? 'text-violet-600' : 'text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.active && (
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
          
          {/* Settings */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button className="w-full flex items-center space-x-3 p-3 text-slate-700 hover:bg-slate-50 rounded-lg">
              <FaCog className="text-lg text-slate-500" />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Desktop Sidebar */}
        <div className="w-72 min-h-screen bg-white border-r border-slate-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Smart Building</h2>
                <p className="text-sm text-slate-500">Manager Portal</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xl font-bold">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-slate-500">Building Manager</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <FaSignOutAlt className="text-slate-600 hover:text-rose-600" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                    isActive(item.path) 
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-700 hover:bg-slate-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`text-xl ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-violet-600'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.active && (
                    <div className={`w-3 h-3 rounded-full ${isActive(item.path) ? 'bg-white' : 'bg-violet-600'}`}></div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Search Bar */}
            <div className="mt-8 p-4 bg-slate-50 rounded-xl">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Settings */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <button className="w-full flex items-center space-x-4 p-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                <FaCog className="text-xl text-slate-500" />
                <span className="font-medium">Settings</span>
                <FaCaretRight className="ml-auto text-slate-400" />
              </button>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-slate-200">
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <FaBell className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500 mt-1">3 unread messages</p>
                  <button className="mt-2 text-xs text-violet-600 font-medium hover:text-violet-700">
                    View all →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
              <p className="text-slate-600">Overview of building operations</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-slate-100 rounded-full relative">
                <FaBell className="text-xl text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{user?.firstName?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-slate-500">Manager</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden pt-16 p-4">
        {/* Mobile Top Bar */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Manager Dashboard</h1>
          <p className="text-slate-600 text-sm">Overview of building operations</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Layout; 