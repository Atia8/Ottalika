// src/routes/manager/renters.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaSearch, 
  FaFilter, 
  FaUserPlus, 
  FaDownload, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaCalendar,
  FaCheck,
  FaTimes,
  FaMoneyBillWave,
  FaFileContract
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Renter {
  id: number;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  building: string;
  status: 'active' | 'pending' | 'inactive' | 'overdue';
  rentPaid: boolean;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  documents: string[];
  apartment_id?: number;
  floor?: number;
  payment_status?: string;
  apartment_status?: string;
}

const Renters = () => {
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRenter, setSelectedRenter] = useState<Renter | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveData, setApproveData] = useState({
    apartment: '',
    rentAmount: '',
    leaseStart: '',
    leaseEnd: ''
  });

  useEffect(() => {
    fetchRenters();
  }, []);

  const fetchRenters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/renters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const rentersData = response.data.data.renters || [];
        setRenters(rentersData);
      } else {
        toast.error('Failed to fetch renters');
        // Mock data for testing
        setRenters(getMockRenters());
      }
    } catch (error) {
      console.error('Failed to fetch renters:', error);
      toast.error('Error loading renters data');
      setRenters(getMockRenters());
    } finally {
      setLoading(false);
    }
  };

  const getMockRenters = (): Renter[] => {
    return [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '01712345678',
        apartment: '101',
        building: 'Building A',
        status: 'active',
        rentPaid: true,
        rentAmount: 5000,
        leaseStart: '2024-01-15',
        leaseEnd: '2025-01-14',
        documents: ['nid', 'contract']
      },
      {
        id: 2,
        name: 'Sarah Smith',
        email: 'sarah.smith@example.com',
        phone: '01712345679',
        apartment: '102',
        building: 'Building A',
        status: 'active',
        rentPaid: true,
        rentAmount: 5500,
        leaseStart: '2024-02-01',
        leaseEnd: '2025-01-31',
        documents: ['nid', 'contract']
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        phone: '01712345680',
        apartment: '201',
        building: 'Building B',
        status: 'pending',
        rentPaid: false,
        rentAmount: 6500,
        leaseStart: '2024-02-15',
        leaseEnd: '2025-02-14',
        documents: ['nid']
      },
      {
        id: 4,
        name: 'Emily Wilson',
        email: 'emily.wilson@example.com',
        phone: '01712345681',
        apartment: '202',
        building: 'Building B',
        status: 'overdue',
        rentPaid: false,
        rentAmount: 7000,
        leaseStart: '2024-01-01',
        leaseEnd: '2024-12-31',
        documents: ['nid', 'contract']
      },
      {
        id: 5,
        name: 'David Brown',
        email: 'david.brown@example.com',
        phone: '01712345682',
        apartment: '301',
        building: 'Building C',
        status: 'active',
        rentPaid: true,
        rentAmount: 8000,
        leaseStart: '2024-01-01',
        leaseEnd: '2024-12-31',
        documents: ['nid', 'contract']
      },
    ];
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const filteredRenters = renters.filter(renter => {
    const matchesSearch = renter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.apartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || 
                         renter.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (renter: Renter) => {
    setSelectedRenter(renter);
    setShowDetailsModal(true);
  };

  const handleApprove = (renter: Renter) => {
    setSelectedRenter(renter);
    setApproveData({
      apartment: renter.apartment,
      rentAmount: renter.rentAmount.toString(),
      leaseStart: renter.leaseStart,
      leaseEnd: renter.leaseEnd
    });
    setShowApproveModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedRenter) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/manager/renters/${selectedRenter.id}/approve`, approveData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Renter approved successfully!');
      setShowApproveModal(false);
      fetchRenters();
    } catch (error) {
      console.error('Failed to approve renter:', error);
      toast.error('Failed to approve renter');
    }
  };

  const handleDeleteRenter = async (renterId: number) => {
    if (window.confirm('Are you sure you want to delete this renter?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/manager/renters/${renterId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Renter deleted successfully!');
        fetchRenters();
      } catch (error) {
        console.error('Failed to delete renter:', error);
        toast.error('Failed to delete renter');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'overdue': return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'inactive': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheck className="text-emerald-600" />;
      case 'pending': return <FaTimes className="text-amber-600" />;
      case 'overdue': return <FaTimes className="text-rose-600" />;
      default: return <FaTimes className="text-slate-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const stats = {
    total: renters.length,
    active: renters.filter(r => r.status === 'active').length,
    pending: renters.filter(r => r.status === 'pending').length,
    overdue: renters.filter(r => r.status === 'overdue').length,
    totalRent: renters.reduce((sum, r) => sum + r.rentAmount, 0),
    collectedRent: renters.filter(r => r.rentPaid).reduce((sum, r) => sum + r.rentAmount, 0),
    occupancyRate: Math.round((renters.filter(r => r.status === 'active').length / Math.max(renters.length, 1)) * 100)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Renters Management</h1>
          <p className="text-slate-600">Manage all renters in your buildings</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium">
          <FaUserPlus className="mr-2" />
          Add New Renter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            title: 'Total Renters', 
            value: stats.total.toString(), 
            color: 'bg-blue-50 text-blue-600', 
            trend: '+2 this month',
            icon: <FaUser className="text-2xl text-blue-500" />
          },
          { 
            title: 'Active', 
            value: stats.active.toString(), 
            color: 'bg-emerald-50 text-emerald-600', 
            trend: `${stats.occupancyRate}% occupancy`,
            icon: <FaCheck className="text-2xl text-emerald-500" />
          },
          { 
            title: 'Pending', 
            value: stats.pending.toString(), 
            color: 'bg-amber-50 text-amber-600', 
            trend: 'Needs review',
            icon: <FaTimes className="text-2xl text-amber-500" />
          },
          { 
            title: 'Overdue', 
            value: stats.overdue.toString(), 
            color: 'bg-rose-50 text-rose-600', 
            trend: 'Requires attention',
            icon: <FaMoneyBillWave className="text-2xl text-rose-500" />
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className={`text-xs ${stat.color} mt-2 font-medium`}>{stat.trend}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-100">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search renters by name, apartment, or email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-slate-400" />
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[150px]"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <FaDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Renters Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Renter</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Unit</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Lease Period</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Rent</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRenters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaUser className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">No renters found</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRenters.map(renter => (
                  <tr key={renter.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {renter.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{renter.name}</p>
                          <p className="text-sm text-slate-500">{renter.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FaHome className="text-slate-400" />
                        <div>
                          <span className="font-medium text-slate-900">{renter.apartment}</span>
                          <p className="text-xs text-slate-500">{renter.building}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-slate-400 text-sm" />
                          <p className="text-slate-900">{renter.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-slate-400 text-sm" />
                          <p className="text-sm text-slate-600 truncate max-w-[150px]">{renter.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-900">
                            {new Date(renter.leaseStart).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500">to</p>
                          <p className="text-sm text-slate-900">
                            {new Date(renter.leaseEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{formatCurrency(renter.rentAmount)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${renter.rentPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {renter.rentPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(renter.status)}
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(renter.status)}`}>
                          {renter.status.charAt(0).toUpperCase() + renter.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600"
                          onClick={() => handleViewDetails(renter)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {renter.status === 'pending' && (
                          <button 
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
                            onClick={() => handleApprove(renter)}
                            title="Approve Renter"
                          >
                            <FaCheck />
                          </button>
                        )}
                        <button 
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                          onClick={() => toast('Edit functionality coming soon')}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-600"
                          onClick={() => handleDeleteRenter(renter.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRenters.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">Showing {filteredRenters.length} of {renters.length} renters</p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-3 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                1
              </button>
              <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                2
              </button>
              <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                3
              </button>
              <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Rent Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Expected Rent</span>
              <span className="font-bold text-lg text-slate-900">{formatCurrency(stats.totalRent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Collected Rent</span>
              <span className="font-bold text-lg text-emerald-600">{formatCurrency(stats.collectedRent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Collection Rate</span>
              <span className="font-bold text-lg text-violet-600">
                {Math.round((stats.collectedRent / Math.max(stats.totalRent, 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Occupancy Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Occupancy Rate</span>
              <span className="font-bold text-lg text-slate-900">{stats.occupancyRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Vacant Units</span>
              <span className="font-bold text-lg text-amber-600">2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Under Maintenance</span>
              <span className="font-bold text-lg text-rose-600">1</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors">
              <FaUserPlus className="text-violet-600" />
              Add New Renter
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors">
              <FaFileContract className="text-violet-600" />
              Generate Lease Agreements
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors">
              <FaDownload className="text-violet-600" />
              Export Renter List
            </button>
          </div>
        </div>
      </div>

      {/* Renter Details Modal */}
      {showDetailsModal && selectedRenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Renter Details</h3>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-600" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedRenter.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{selectedRenter.name}</h4>
                    <p className="text-slate-600">{selectedRenter.email}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(selectedRenter.status)}`}>
                      {selectedRenter.status.charAt(0).toUpperCase() + selectedRenter.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Phone</label>
                    <p className="font-medium text-slate-900">{selectedRenter.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Apartment</label>
                    <p className="font-medium text-slate-900">{selectedRenter.apartment} - {selectedRenter.building}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Rent Amount</label>
                    <p className="font-medium text-slate-900">{formatCurrency(selectedRenter.rentAmount)}/month</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Payment Status</label>
                    <p className={`font-medium ${selectedRenter.rentPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedRenter.rentPaid ? 'Paid' : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h5 className="font-medium text-slate-900 mb-2">Documents</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedRenter.documents.map((doc, index) => (
                      <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                        {doc.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Renter Modal */}
      {showApproveModal && selectedRenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Approve Renter</h3>
              <p className="text-slate-600 mb-6">Approve {selectedRenter.name} as a renter</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apartment Number</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={approveData.apartment}
                    onChange={(e) => setApproveData({...approveData, apartment: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rent Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={approveData.rentAmount}
                      onChange={(e) => setApproveData({...approveData, rentAmount: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lease Start</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={approveData.leaseStart}
                      onChange={(e) => setApproveData({...approveData, leaseStart: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lease End</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={approveData.leaseEnd}
                      onChange={(e) => setApproveData({...approveData, leaseEnd: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApproval}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Approve Renter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Renters;