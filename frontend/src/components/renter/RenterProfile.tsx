// src/components/renter/RenterProfile.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaHome,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaFileContract,
  FaEdit,
  FaSave,
  FaTimes,
  FaKey,
  FaBell,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaQrcode,
  FaIdCard,
  FaMapMarkerAlt,
  FaBuilding,
  FaReceipt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RenterProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  emergency_contact: string;
  nid_number: string;
  occupation: string;
  status: string;
  apartment_number: string;
  building_name: string;
  floor: string;
  rent_amount: number;
  lease_start: string;
  lease_end: string;
  amenities: string[];
  created_at: string;
  profile_picture?: string;
}

const RenterProfile = () => {
  const [profile, setProfile] = useState<RenterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    emergency_contact: '',
    occupation: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/renter/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setEditForm({
          name: profileData.name,
          phone: profileData.phone,
          emergency_contact: profileData.emergency_contact,
          occupation: profileData.occupation
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_URL}/renter/profile`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = () => {
    const newPassword = prompt('Enter new password:');
    const confirmPassword = prompt('Confirm new password:');
    
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
      toast.success('Password change request submitted');
    } else {
      toast.error('Passwords do not match');
    }
  };

  const handleDownloadDocuments = (type: string) => {
    toast.success(`Downloading ${type}...`);
  };

  const generateQRCode = () => {
    toast.success('QR Code generated!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No profile data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600">Manage your personal information and apartment details</p>
        </div>
        <div className="flex items-center gap-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
            >
              <FaEdit />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm({
                    name: profile.name,
                    phone: profile.phone,
                    emergency_contact: profile.emergency_contact,
                    occupation: profile.occupation
                  });
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <FaTimes />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <FaSave />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FaUser className="text-violet-600" />
                Personal Information
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {profile.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <p className="font-medium text-lg text-slate-900">{profile.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-slate-400" />
                    <p className="font-medium text-slate-900">{profile.email}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-slate-400" />
                      <p className="font-medium text-slate-900">{profile.phone}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.emergency_contact}
                      onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-slate-400" />
                      <p className="font-medium text-slate-900">{profile.emergency_contact}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.occupation}
                      onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{profile.occupation}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NID Number</label>
                  <div className="flex items-center gap-2">
                    <FaIdCard className="text-slate-400" />
                    <p className="font-medium text-slate-900">{profile.nid_number}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Apartment Information Card */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FaHome className="text-violet-600" />
              Apartment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apartment Number</label>
                  <div className="flex items-center gap-2">
                    <FaBuilding className="text-slate-400" />
                    <p className="font-medium text-lg text-slate-900">{profile.apartment_number}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-slate-400" />
                    <p className="font-medium text-slate-900">{profile.building_name}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <p className="font-medium text-slate-900">Floor {profile.floor}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent</label>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg">₹</span>
                    <p className="text-2xl font-bold text-slate-900">{profile.rent_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lease Period</label>
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(profile.lease_start).toLocaleDateString('en-US', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-slate-500">to</p>
                      <p className="font-medium text-slate-900">
                        {new Date(profile.lease_end).toLocaleDateString('en-US', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {profile.amenities && profile.amenities.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-slate-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions & Documents */}
        <div className="space-y-6">
          {/* Account Actions */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleChangePassword}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-white rounded-lg border">
                  <FaKey className="text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-500">Update your login password</p>
                </div>
              </button>

              <button
                onClick={() => toast.success('Notification settings opened')}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-white rounded-lg border">
                  <FaBell className="text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Notification Settings</p>
                  <p className="text-sm text-slate-500">Manage email and SMS alerts</p>
                </div>
              </button>

              <button
                onClick={generateQRCode}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-white rounded-lg border">
                  <FaQrcode className="text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Generate QR Code</p>
                  <p className="text-sm text-slate-500">Access card for visitors</p>
                </div>
              </button>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FaFileContract className="text-violet-600" />
              Documents
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleDownloadDocuments('Lease Agreement')}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <FaFileContract className="text-slate-400" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Lease Agreement</p>
                  <p className="text-xs text-slate-500">PDF • 2.5 MB</p>
                </div>
                <FaCheckCircle className="text-emerald-600" />
              </button>

              <button
                onClick={() => handleDownloadDocuments('NID Copy')}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <FaIdCard className="text-slate-400" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">NID Copy</p>
                  <p className="text-xs text-slate-500">PDF • 1.2 MB</p>
                </div>
                <FaCheckCircle className="text-emerald-600" />
              </button>

              <button
                onClick={() => handleDownloadDocuments('Rent Receipts')}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <FaReceipt className="text-slate-400" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Rent Receipts</p>
                  <p className="text-xs text-slate-500">ZIP • 5.8 MB</p>
                </div>
                <FaExclamationCircle className="text-amber-600" />
              </button>
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Account Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Member Since</span>
                <span className="font-medium text-slate-900">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { 
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Documents Uploaded</span>
                <span className="font-medium text-slate-900">3/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Profile Completion</span>
                <span className="font-medium text-emerald-600">85%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <FaLock className="text-blue-600 mt-1" />
          <div>
            <p className="font-medium text-blue-900">Security Notice</p>
            <p className="text-sm text-blue-700 mt-2">
              Your personal information is protected. Only authorized building managers can view your details. 
              Never share your login credentials with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterProfile;