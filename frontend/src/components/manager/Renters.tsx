// src/components/manager/Renters.tsx
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
  FaFileContract,
  FaBuilding,
  FaSync,
  FaPrint,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Renter {
  id: number;
  name: string;
  email: string;
  phone: string;
  nid_number?: string;
  emergency_contact?: string;
  occupation?: string;
  apartment: string;
  apartment_id?: number;
  building: string;
  building_id?: number;
  floor?: number;
  status: 'active' | 'pending' | 'inactive';
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  documents: string[];
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface Building {
  id: number;
  name: string;
  apartments: Apartment[];
}

interface Apartment {
  id: number;
  apartment_number: string;
  floor: string;
  rent_amount: number;
  status: string;
}

interface RenterStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  occupancyRate: number;
  totalMonthlyRent: number;
}

const Renters = () => {
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedRenter, setSelectedRenter] = useState<Renter | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [availableApartments, setAvailableApartments] = useState<Apartment[]>([]);
  const [stats, setStats] = useState<RenterStats>({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    occupancyRate: 0,
    totalMonthlyRent: 0
  });

  const [approveData, setApproveData] = useState({
    apartment: '',
    apartment_id: 0,
    rentAmount: '',
    leaseStart: '',
    leaseEnd: ''
  });

  const [newRenter, setNewRenter] = useState({
    name: '',
    email: '',
    phone: '',
    nid_number: '',
    emergency_contact: '',
    occupation: '',
    building_id: '',
    apartment_id: '',
    rentAmount: '',
    leaseStart: '',
    leaseEnd: ''
  });

  const [editRenter, setEditRenter] = useState({
    name: '',
    email: '',
    phone: '',
    nid_number: '',
    emergency_contact: '',
    occupation: '',
    apartment_id: '',
    rentAmount: '',
    leaseStart: '',
    leaseEnd: ''
  });

  useEffect(() => {
    fetchRenters();
    fetchBuildings();
  }, []);

  const fetchRenters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/renters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const rentersData = (response.data.data.renters || []).map((renter: any) => ({
          ...renter,
          rentAmount: typeof renter.rentAmount === 'string' 
            ? parseFloat(renter.rentAmount) 
            : (renter.rentAmount || 0)
        }));
        
        setRenters(rentersData);
        calculateStats(rentersData);
      } else {
        toast.error('Failed to fetch renters');
      }
    } catch (error) {
      console.error('Failed to fetch renters:', error);
      toast.error('Error loading renters data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/buildings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setBuildings(response.data.data.buildings || []);
      }
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
    }
  };

  const fetchAvailableApartments = async (buildingId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/buildings/${buildingId}/available-apartments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAvailableApartments(response.data.data.apartments || []);
      }
    } catch (error) {
      console.error('Failed to fetch available apartments:', error);
    }
  };

  const calculateStats = (rentersData: Renter[]) => {
    const active = rentersData.filter(r => r.status === 'active').length;
    const pending = rentersData.filter(r => r.status === 'pending').length;
    const inactive = rentersData.filter(r => r.status === 'inactive').length;
    
    const totalMonthlyRent = rentersData
      .filter(r => r.status === 'active')
      .reduce((sum, r) => {
        const amount = typeof r.rentAmount === 'string' ? parseFloat(r.rentAmount) : (r.rentAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const occupancyRate = rentersData.length > 0 
      ? Math.round((active / rentersData.length) * 100) 
      : 0;

    setStats({
      total: rentersData.length,
      active,
      pending,
      inactive,
      occupancyRate,
      totalMonthlyRent
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const buildingOptions = [
    { value: 'all', label: 'All Buildings' },
    ...buildings.map(b => ({ value: b.id.toString(), label: b.name }))
  ];

  const filteredRenters = renters.filter(renter => {
    const matchesSearch = renter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.apartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.phone?.includes(searchTerm) ||
                         renter.building?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
                         renter.status === selectedStatus;
    
    const matchesBuilding = selectedBuilding === 'all' || 
                           renter.building_id?.toString() === selectedBuilding;
    
    return matchesSearch && matchesStatus && matchesBuilding;
  });

  const handleViewDetails = (renter: Renter) => {
    setSelectedRenter(renter);
    setShowDetailsModal(true);
  };

  const handleAddRenter = () => {
    setShowAddModal(true);
  };

  const handleEditRenter = (renter: Renter) => {
    setSelectedRenter(renter);
    setEditRenter({
      name: renter.name,
      email: renter.email,
      phone: renter.phone,
      nid_number: renter.nid_number || '',
      emergency_contact: renter.emergency_contact || '',
      occupation: renter.occupation || '',
      apartment_id: renter.apartment_id?.toString() || '',
      rentAmount: renter.rentAmount.toString(),
      leaseStart: renter.leaseStart,
      leaseEnd: renter.leaseEnd
    });
    setShowEditModal(true);
  };

  const handleApprove = (renter: Renter) => {
    setSelectedRenter(renter);
    setApproveData({
      apartment: renter.apartment,
      apartment_id: renter.apartment_id || 0,
      rentAmount: renter.rentAmount.toString(),
      leaseStart: renter.leaseStart,
      leaseEnd: renter.leaseEnd
    });
    setShowApproveModal(true);
  };

  const handleUpdateStatus = async (renterId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/manager/renters/${renterId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchRenters();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSubmitApproval = async () => {
    if (!selectedRenter) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/manager/renters/${selectedRenter.id}/approve`, 
        {
          apartment: approveData.apartment,
          apartment_id: approveData.apartment_id,
          rentAmount: parseFloat(approveData.rentAmount),
          leaseStart: approveData.leaseStart,
          leaseEnd: approveData.leaseEnd,
          status: 'active'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Renter approved successfully!');
        setShowApproveModal(false);
        fetchRenters();
      }
    } catch (error) {
      console.error('Failed to approve renter:', error);
      toast.error('Failed to approve renter');
    }
  };

  const handleSubmitAddRenter = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/manager/renters`,
        {
          ...newRenter,
          rentAmount: parseFloat(newRenter.rentAmount),
          apartment_id: parseInt(newRenter.apartment_id),
          building_id: parseInt(newRenter.building_id),
          status: 'pending'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Renter added successfully!');
        setShowAddModal(false);
        setNewRenter({
          name: '',
          email: '',
          phone: '',
          nid_number: '',
          emergency_contact: '',
          occupation: '',
          building_id: '',
          apartment_id: '',
          rentAmount: '',
          leaseStart: '',
          leaseEnd: ''
        });
        fetchRenters();
      }
    } catch (error) {
      console.error('Failed to add renter:', error);
      toast.error('Failed to add renter');
    }
  };

  const handleSubmitEditRenter = async () => {
    if (!selectedRenter) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/manager/renters/${selectedRenter.id}`,
        {
          ...editRenter,
          rentAmount: parseFloat(editRenter.rentAmount),
          apartment_id: parseInt(editRenter.apartment_id)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Renter updated successfully!');
        setShowEditModal(false);
        fetchRenters();
      }
    } catch (error) {
      console.error('Failed to update renter:', error);
      toast.error('Failed to update renter');
    }
  };

  const handleDeleteRenter = async (renterId: number) => {
    if (!window.confirm('Are you sure you want to delete this renter?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/manager/renters/${renterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Renter deleted successfully!');
        fetchRenters();
      }
    } catch (error) {
      console.error('Failed to delete renter:', error);
      toast.error('Failed to delete renter');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRenters.map(r => ({
      Name: r.name,
      Email: r.email,
      Phone: r.phone,
      Building: r.building,
      Apartment: r.apartment,
      'Monthly Rent': r.rentAmount,
      Status: r.status,
      'Lease Start': new Date(r.leaseStart).toLocaleDateString(),
      'Lease End': new Date(r.leaseEnd).toLocaleDateString(),
      'NID Number': r.nid_number || 'N/A',
      'Emergency Contact': r.emergency_contact || 'N/A',
      'Occupation': r.occupation || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Renters');
    XLSX.writeFile(wb, `renters-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('Exported to Excel successfully!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Renters Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

    const tableData = filteredRenters.map(r => [
      r.name,
      r.apartment,
      r.building,
      formatCurrency(r.rentAmount),
      r.status
    ]);

    autoTable(doc, {
      head: [['Name', 'Apt', 'Building', 'Monthly Rent', 'Status']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`renters-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Exported to PDF successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'inactive': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheck className="text-emerald-600" />;
      case 'pending': return <FaTimes className="text-amber-600" />;
      default: return <FaTimes className="text-slate-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '৳0';
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
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
          <p className="text-slate-600">Manage all renters and their lease information</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRenters}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <FaSync className="mr-2" />
            Refresh
          </button>
          <button
            onClick={handleAddRenter}
            className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
          >
            <FaUserPlus className="mr-2" />
            Add New Renter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Renters</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <FaUser className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Renters</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.active}</p>
              <p className="text-sm text-emerald-600 mt-2">
                Monthly Rent: {formatCurrency(stats.totalMonthlyRent)}
              </p>
            </div>
            <div className="p-4 bg-emerald-100 rounded-lg">
              <FaCheck className="text-2xl text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Approval</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.pending}</p>
              <p className="text-sm text-amber-600 mt-2">Awaiting review</p>
            </div>
            <div className="p-4 bg-amber-100 rounded-lg">
              <FaTimes className="text-2xl text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Occupancy Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.occupancyRate}%</p>
              <p className="text-sm text-slate-600 mt-2">{stats.active} of {stats.total} units</p>
            </div>
            <div className="p-4 bg-violet-100 rounded-lg">
              <FaBuilding className="text-2xl text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, apartment, email, phone..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-slate-400" />
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[140px]"
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

            <select
              className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[140px]"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              {buildingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                title="Export to Excel"
              >
                <FaDownload />
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                title="Export to PDF"
              >
                <FaPrint />
                PDF
              </button>
            </div>
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
                <th className="text-left p-4 text-sm font-medium text-slate-700 uppercase tracking-wider">Monthly Rent</th>
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
                            {renter.name?.split(' ').map(n => n[0]).join('') || '?'}
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
                          {renter.floor && (
                            <p className="text-xs text-slate-400">Floor {renter.floor}</p>
                          )}
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
                            {renter.leaseStart ? new Date(renter.leaseStart).toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500">to</p>
                          <p className="text-sm text-slate-900">
                            {renter.leaseEnd ? new Date(renter.leaseEnd).toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-slate-400" />
                        <p className="font-medium text-slate-900">{formatCurrency(renter.rentAmount)}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(renter.status)}
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(renter.status)}`}>
                          {renter.status ? (renter.status.charAt(0).toUpperCase() + renter.status.slice(1)) : 'Unknown'}
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
                          <>
                            <button 
                              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
                              onClick={() => handleApprove(renter)}
                              title="Approve Renter"
                            >
                              <FaCheck />
                            </button>
                            <button 
                              className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                              onClick={() => handleUpdateStatus(renter.id, 'active')}
                              title="Set Active"
                            >
                              <FaCheck />
                            </button>
                          </>
                        )}
                        
                        <button 
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                          onClick={() => handleEditRenter(renter)}
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-violet-600" />
            Rent Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Monthly Rent</span>
              <span className="font-bold text-lg text-slate-900">{formatCurrency(stats.totalMonthlyRent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Active Renters</span>
              <span className="font-bold text-lg text-emerald-600">{stats.active}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaBuilding className="text-violet-600" />
            Occupancy Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Occupancy Rate</span>
              <span className="font-bold text-lg text-slate-900">{stats.occupancyRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Active Renters</span>
              <span className="font-bold text-lg text-emerald-600">{stats.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pending Approval</span>
              <span className="font-bold text-lg text-amber-600">{stats.pending}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaFileContract className="text-violet-600" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={handleAddRenter}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaUserPlus className="text-violet-600" />
              Add New Renter
            </button>
            <button 
              onClick={exportToExcel}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
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
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRenter.status)}`}>
                        {selectedRenter.status.charAt(0).toUpperCase() + selectedRenter.status.slice(1)}
                      </span>
                      {selectedRenter.occupation && (
                        <span className="text-sm text-slate-500">{selectedRenter.occupation}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">Phone</label>
                    <p className="font-medium text-slate-900">{selectedRenter.phone}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">Emergency Contact</label>
                    <p className="font-medium text-slate-900">{selectedRenter.emergency_contact || 'Not provided'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">NID Number</label>
                    <p className="font-medium text-slate-900">{selectedRenter.nid_number || 'Not provided'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">Apartment</label>
                    <p className="font-medium text-slate-900">{selectedRenter.apartment} - {selectedRenter.building}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">Monthly Rent</label>
                    <p className="font-medium text-slate-900">{formatCurrency(selectedRenter.rentAmount)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">Lease Start</label>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedRenter.leaseStart).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">Lease End</label>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedRenter.leaseEnd).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h5 className="font-medium text-slate-900 mb-2">Documents</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedRenter.documents?.map((doc, index) => (
                      <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                        {doc.toUpperCase()}
                      </span>
                    )) || <p className="text-slate-500">No documents uploaded</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditRenter(selectedRenter);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Edit
                  </button>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rent Amount (৳)</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={approveData.rentAmount}
                    onChange={(e) => setApproveData({...approveData, rentAmount: e.target.value})}
                  />
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

      {/* Add Renter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Add New Renter</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.name}
                      onChange={(e) => setNewRenter({...newRenter, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.email}
                      onChange={(e) => setNewRenter({...newRenter, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.phone}
                      onChange={(e) => setNewRenter({...newRenter, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">NID Number</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.nid_number}
                      onChange={(e) => setNewRenter({...newRenter, nid_number: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.emergency_contact}
                      onChange={(e) => setNewRenter({...newRenter, emergency_contact: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.occupation}
                      onChange={(e) => setNewRenter({...newRenter, occupation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Building *</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.building_id}
                      onChange={(e) => {
                        setNewRenter({...newRenter, building_id: e.target.value, apartment_id: ''});
                        if (e.target.value) {
                          fetchAvailableApartments(parseInt(e.target.value));
                        }
                      }}
                      required
                    >
                      <option value="">Select Building</option>
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Apartment *</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.apartment_id}
                      onChange={(e) => setNewRenter({...newRenter, apartment_id: e.target.value})}
                      required
                      disabled={!newRenter.building_id}
                    >
                      <option value="">Select Apartment</option>
                      {availableApartments.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.apartment_number} (Floor {a.floor}) - ৳{a.rent_amount}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent (৳) *</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.rentAmount}
                      onChange={(e) => setNewRenter({...newRenter, rentAmount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lease Start *</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={newRenter.leaseStart}
                      onChange={(e) => setNewRenter({...newRenter, leaseStart: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lease End *</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={newRenter.leaseEnd}
                    onChange={(e) => setNewRenter({...newRenter, leaseEnd: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAddRenter}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Add Renter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Renter Modal */}
      {showEditModal && selectedRenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Edit Renter</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.name}
                      onChange={(e) => setEditRenter({...editRenter, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.email}
                      onChange={(e) => setEditRenter({...editRenter, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.phone}
                      onChange={(e) => setEditRenter({...editRenter, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">NID Number</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.nid_number}
                      onChange={(e) => setEditRenter({...editRenter, nid_number: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.emergency_contact}
                      onChange={(e) => setEditRenter({...editRenter, emergency_contact: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.occupation}
                      onChange={(e) => setEditRenter({...editRenter, occupation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Apartment ID</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.apartment_id}
                      onChange={(e) => setEditRenter({...editRenter, apartment_id: e.target.value})}
                      placeholder="Apartment ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent (৳) *</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.rentAmount}
                      onChange={(e) => setEditRenter({...editRenter, rentAmount: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lease Start *</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.leaseStart}
                      onChange={(e) => setEditRenter({...editRenter, leaseStart: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lease End *</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={editRenter.leaseEnd}
                      onChange={(e) => setEditRenter({...editRenter, leaseEnd: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEditRenter}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Update Renter
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