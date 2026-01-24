import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUser,
  FaBuilding,
  FaShieldAlt,
  FaBell,
  FaPalette,
  FaSave,
  FaLock,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUsers,
  FaWifi,
  FaParking,
  FaSwimmingPool,
  FaDumbbell
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ManagerSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [buildingData, setBuildingData] = useState({
    name: '',
    address: '',
    totalFloors: '',
    totalUnits: '',
    amenities: [] as string[]
  });
  
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    rentReminders: true,
    maintenanceUpdates: true,
    paymentAlerts: true
  });
  
  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    fontSize: 'medium',
    compactMode: false
  });

  const [loading, setLoading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    fetchProfileData();
    fetchBuildingData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const user = response.data.data.user;
        setProfileData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          address: ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Mock data for testing
      setProfileData({
        firstName: 'John',
        lastName: 'Manager',
        email: 'john.manager@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, Country'
      });
    }
  };

  const fetchBuildingData = async () => {
    try {
      // Mock building data
      setBuildingData({
        name: 'Sunrise Apartments',
        address: '123 Luxury Lane, Downtown, City 10001',
        totalFloors: '15',
        totalUnits: '120',
        amenities: ['Swimming Pool', 'Gym', 'Parking', 'WiFi', 'Security', 'Garden']
      });
    } catch (error) {
      console.error('Failed to fetch building data:', error);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (securityData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Password changed successfully!');
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !buildingData.amenities.includes(amenityInput.trim())) {
      setBuildingData({
        ...buildingData,
        amenities: [...buildingData.amenities, amenityInput.trim()]
      });
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setBuildingData({
      ...buildingData,
      amenities: buildingData.amenities.filter(a => a !== amenity)
    });
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage for now
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
    toast.success('Settings saved successfully!');
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'swimming pool': return <FaSwimmingPool />;
      case 'gym': return <FaDumbbell />;
      case 'parking': return <FaParking />;
      case 'wifi': return <FaWifi />;
      default: return <FaUsers />;
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'building', label: 'Building', icon: <FaBuilding /> },
    { id: 'security', label: 'Security', icon: <FaLock /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'appearance', label: 'Appearance', icon: <FaPalette /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-slate-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-slate-400" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-slate-400" />
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );

      case 'building':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Building Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Building Name
                  </label>
                  <input
                    type="text"
                    value={buildingData.name}
                    onChange={(e) => setBuildingData({...buildingData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    value={buildingData.totalFloors}
                    onChange={(e) => setBuildingData({...buildingData, totalFloors: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Building Address
                  </label>
                  <textarea
                    value={buildingData.address}
                    onChange={(e) => setBuildingData({...buildingData, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Units
                  </label>
                  <input
                    type="number"
                    value={buildingData.totalUnits}
                    onChange={(e) => setBuildingData({...buildingData, totalUnits: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="Add an amenity..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()}
                />
                <button
                  onClick={handleAddAmenity}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Add
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {buildingData.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-violet-600">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="font-medium">{amenity}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveAmenity(amenity)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2">
                <FaSave />
                Update Building Info
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <FaShieldAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FaShieldAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <FaLock />
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Security Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Session Management</p>
                    <p className="text-sm text-slate-600">View and manage active sessions</p>
                  </div>
                  <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {key.includes('email') ? 'Receive email notifications' :
                         key.includes('sms') ? 'Receive SMS notifications' :
                         key.includes('rent') ? 'Get rent payment reminders' :
                         key.includes('maintenance') ? 'Get maintenance updates' :
                         'Get payment alerts'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          [key]: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Email Notifications</h4>
                  <p className="text-sm text-slate-600 mb-3">Receive notifications via email</p>
                  <input
                    type="email"
                    defaultValue={profileData.email}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">SMS Notifications</h4>
                  <p className="text-sm text-slate-600 mb-3">Receive notifications via SMS</p>
                  <input
                    type="tel"
                    defaultValue={profileData.phone}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <FaSave />
                Save Notification Settings
              </button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Theme Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {['light', 'dark', 'auto'].map((theme) => (
                  <div
                    key={theme}
                    onClick={() => setThemeSettings({...themeSettings, theme})}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      themeSettings.theme === theme
                        ? 'border-violet-600 bg-violet-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-6 h-6 rounded-full border ${
                        theme === 'light' ? 'bg-white border-slate-300' :
                        theme === 'dark' ? 'bg-slate-800 border-slate-700' :
                        'bg-gradient-to-r from-white to-slate-800 border-slate-300'
                      }`} />
                      <span className="font-medium capitalize">{theme}</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {theme === 'light' ? 'Light theme' :
                       theme === 'dark' ? 'Dark theme' :
                       'Auto (system preference)'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Font Size
                  </label>
                  <div className="flex gap-4">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setThemeSettings({...themeSettings, fontSize: size})}
                        className={`px-4 py-2 rounded-lg capitalize ${
                          themeSettings.fontSize === size
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Compact Mode</p>
                    <p className="text-sm text-slate-600">Reduce spacing for more content on screen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={themeSettings.compactMode}
                      onChange={(e) => setThemeSettings({
                        ...themeSettings,
                        compactMode: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <FaSave />
                Save Appearance Settings
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and building settings</p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-violet-600 text-violet-600 font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 text-left border rounded-lg hover:bg-slate-50">
            <FaBuilding className="text-xl text-violet-600 mb-2" />
            <p className="font-medium text-slate-900">Building Rules</p>
            <p className="text-sm text-slate-600">Manage building rules and policies</p>
          </button>
          <button className="p-4 text-left border rounded-lg hover:bg-slate-50">
            <FaUsers className="text-xl text-violet-600 mb-2" />
            <p className="font-medium text-slate-900">Staff Management</p>
            <p className="text-sm text-slate-600">Manage building staff and roles</p>
          </button>
          <button className="p-4 text-left border rounded-lg hover:bg-slate-50">
            <FaShieldAlt className="text-xl text-violet-600 mb-2" />
            <p className="font-medium text-slate-900">Privacy Settings</p>
            <p className="text-sm text-slate-600">Configure privacy preferences</p>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-rose-100 p-6">
        <h3 className="text-lg font-semibold text-rose-900 mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <button className="px-4 py-2 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50">
            Export All Data
          </button>
          <button className="px-4 py-2 border border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50">
            Deactivate Account
          </button>
          <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerSettings;