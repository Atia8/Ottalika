// frontend/src/Layout.tsx
import React from 'react';
// Add to imports:
import { FaClipboard, FaExclamationTriangle } from 'react-icons/fa';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  FaBars, FaSignOutAlt, FaHome, FaUsers, FaReceipt, FaTools,
  FaCheckCircle, FaEnvelope, FaCaretRight, FaBell, FaUserCircle,
  FaSearch, FaCog, FaUser
} from 'react-icons/fa';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define Nav Items for Managers
  const managerNav = [
    { id: 'dashboard', name: 'Dashboard', icon: <FaHome />, path: '/manager/dashboard' },
    { id: 'renters', name: 'Renters', icon: <FaUsers />, path: '/manager/renters' },
    { id: 'bills', name: 'Bills', icon: <FaReceipt />, path: '/manager/bills' },
    { id: 'maintenance', name: 'Maintenance', icon: <FaTools />, path: '/manager/maintenance' },
    { id: 'payments', name: 'Payments', icon: <FaCheckCircle />, path: '/manager/payments' },
    { id: 'messages', name: 'Messages', icon: <FaEnvelope />, path: '/manager/messages' },
    { id: 'settings', name: 'Settings', icon: <FaCog />, path: '/manager/settings' },
  ];

  // Define Nav Items for Renters (Matching her pages)
  const renterNav = [
    { id: 'dashboard', name: 'Dashboard', icon: <FaHome />, path: '/renter/dashboard' },
    { id: 'profile', name: 'My Profile', icon: <FaUser />, path: '/renter/profile' },
    { id: 'payments', name: 'Payments', icon: <FaCheckCircle />, path: '/renter/payments' },
    { id: 'complaints', name: 'Complaints', icon: <FaTools />, path: '/renter/complaints' },
    { id: 'messages', name: 'Messages', icon: <FaEnvelope />, path: '/renter/messages' },
  ];

const ownerNav = [
  { id: 'dashboard', name: 'Dashboard', icon: <FaHome />, path: '/owner' },
  { id: 'payments', name: 'Payments', icon: <FaCheckCircle />, path: '/owner/payments' },
  { id: 'requests', name: 'Requests', icon: <FaClipboard />, path: '/owner/requests' },
  { id: 'manager-status', name: 'Manager Status', icon: <FaUsers />, path: '/owner/manager-status' },
  { id: 'complaints', name: 'Complaints', icon: <FaExclamationTriangle />, path: '/owner/complaints' },
];


  // Get nav items based on role
  const getNavItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'renter': return renterNav;
      case 'owner': return ownerNav;
      case 'manager': return managerNav;
      default: return [];
    }
  };

  const getPortalName = () => {
    if (!user) return 'Portal';
    switch (user.role) {
      case 'renter': return 'Renter Portal';
      case 'owner': return 'Owner Portal';
      case 'manager': return 'Manager Portal';
      default: return 'Portal';
    }
  };

  const navItems = getNavItems();
  const portalName = getPortalName();

  const isActive = (path: string) => {
    // Check if current path starts with the nav item path
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get active page title
  const getActivePageTitle = () => {
    const activeItem = navItems.find(item => isActive(item.path));
    if (activeItem) {
      return activeItem.name;
    }
    
    // Fallback titles based on path
    if (location.pathname.includes('/owner')) return 'Owner Portal';
    if (location.pathname.includes('/manager')) return 'Manager Portal';
    if (location.pathname.includes('/renter')) return 'Renter Portal';
    
    return 'Ottalika';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <FaBars className="text-xl text-slate-700" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Ottalika</h1>
              <p className="text-xs text-slate-500">{portalName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <FaBell className="text-xl text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)} 
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex-shrink-0
      `}>
        {/* Logo and User Profile Section */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ottalika</h2>
              <p className="text-sm text-slate-500">{portalName}</p>
            </div>
          </div>
          
          {/* User Profile Card */}
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-md text-white font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-rose-600"
              aria-label="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                navigate(item.path); 
                setSidebarOpen(false); 
              }}
              className={`
                w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 
                group focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                ${isActive(item.path) 
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-700 hover:bg-slate-50 hover:shadow-md'
                }
              `}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <div className="flex items-center space-x-4">
                <span className={`
                  text-xl transition-colors
                  ${isActive(item.path) 
                    ? 'text-white' 
                    : 'text-slate-500 group-hover:text-violet-600'
                  }
                `}>
                  {item.icon}
                </span>
                <span className="font-medium text-left">{item.name}</span>
              </div>
              {isActive(item.path) && (
                <FaCaretRight className="text-white ml-2" />
              )}
            </button>
          ))}
          
          {/* Settings Section */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button 
              onClick={() => { 
                if (user?.role === 'manager') {
                  navigate('/manager/settings');
                } else if (user?.role === 'renter') {
                  navigate('/renter/profile');
                } else if (user?.role === 'owner') {
                  navigate('/owner');
                }
                setSidebarOpen(false); 
              }}
              className={`
                w-full flex items-center space-x-4 p-4 rounded-xl transition-colors
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                ${location.pathname.includes('settings') || location.pathname.includes('profile')
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              <FaCog className={`
                text-xl transition-colors
                ${location.pathname.includes('settings') || location.pathname.includes('profile') 
                  ? 'text-white' 
                  : 'text-slate-500'
                }
              `} />
              <span className="font-medium">
                {user?.role === 'renter' ? 'My Profile' : 'Settings'}
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-10 bg-white border-b border-slate-200 p-6 items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {getActivePageTitle()}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 hover:bg-slate-100 rounded-full relative transition-colors"
              aria-label="Notifications"
            >
              <FaBell className="text-xl text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                {user?.firstName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Render nested routes here */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet /> {/* This renders the nested route components */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;