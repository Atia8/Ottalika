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
  FaCreditCard,
  FaHistory,
  FaSync,
  FaPrint,
  FaEnvelopeOpenText,
  FaBell,
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
  status: 'active' | 'pending' | 'inactive' | 'overdue';
  rentPaid: boolean;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  documents: string[];
  payment_status?: string;
  apartment_status?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  payment_history?: PaymentHistory[];
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface PaymentHistory {
  id: number;
  month: string;
  amount: number;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
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
  overdue: number;
  inactive: number;
  totalRent: number;
  collectedRent: number;
  pendingRent: number;
  overdueRent: number;
  occupancyRate: number;
  collectionRate: number;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [availableApartments, setAvailableApartments] = useState<Apartment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [stats, setStats] = useState<RenterStats>({
    total: 0,
    active: 0,
    pending: 0,
    overdue: 0,
    inactive: 0,
    totalRent: 0,
    collectedRent: 0,
    pendingRent: 0,
    overdueRent: 0,
    occupancyRate: 0,
    collectionRate: 0
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
            : (renter.rentAmount || 0),
          last_payment_amount: typeof renter.last_payment_amount === 'string'
            ? parseFloat(renter.last_payment_amount)
            : (renter.last_payment_amount || 0)
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

  const fetchRenterPaymentHistory = async (renterId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/renters/${renterId}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSelectedRenter(prev => prev ? {
          ...prev,
          payment_history: response.data.data.payments
        } : null);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      toast.error('Failed to load payment history');
    }
  };

  const calculateStats = (rentersData: Renter[]) => {
    const active = rentersData.filter(r => r.status === 'active').length;
    const pending = rentersData.filter(r => r.status === 'pending').length;
    const overdue = rentersData.filter(r => r.status === 'overdue').length;
    const inactive = rentersData.filter(r => r.status === 'inactive').length;
    
    const totalRent = rentersData.reduce((sum, r) => {
      const amount = typeof r.rentAmount === 'string' ? parseFloat(r.rentAmount) : (r.rentAmount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const collectedRent = rentersData
      .filter(r => r.rentPaid)
      .reduce((sum, r) => {
        const amount = typeof r.rentAmount === 'string' ? parseFloat(r.rentAmount) : (r.rentAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
    const pendingRent = rentersData
      .filter(r => !r.rentPaid && r.status === 'active')
      .reduce((sum, r) => {
        const amount = typeof r.rentAmount === 'string' ? parseFloat(r.rentAmount) : (r.rentAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
    const overdueRent = rentersData
      .filter(r => r.status === 'overdue')
      .reduce((sum, r) => {
        const amount = typeof r.rentAmount === 'string' ? parseFloat(r.rentAmount) : (r.rentAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const occupancyRate = rentersData.length > 0 
      ? Math.round((active / rentersData.length) * 100) 
      : 0;
    const collectionRate = totalRent > 0 
      ? Math.round((collectedRent / totalRent) * 100) 
      : 0;

    setStats({
      total: rentersData.length,
      active,
      pending,
      overdue,
      inactive,
      totalRent,
      collectedRent,
      pendingRent,
      overdueRent,
      occupancyRate,
      collectionRate
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
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

  const handleViewPaymentHistory = (renter: Renter) => {
    fetchRenterPaymentHistory(renter.id);
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

  const handleRecordPayment = (renter: Renter) => {
    console.log('Recording payment for renter:', renter);
    setSelectedRenter(renter);
    setPaymentAmount(renter.rentAmount);
    setPaymentMonth(new Date().toISOString().slice(0, 7) + '-01');
    setShowPaymentModal(true);
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
          leaseEnd: approveData.leaseEnd
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
          building_id: parseInt(newRenter.building_id)
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

  const handleSubmitPayment = async () => {
    if (!selectedRenter) return;

    console.log('Submitting payment with data:', {
      renter_id: selectedRenter.id,
      apartment_id: selectedRenter.apartment_id,
      amount: paymentAmount,
      month: paymentMonth,
      payment_method: paymentMethod
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/manager/payments`,
        {
          renter_id: selectedRenter.id,
          apartment_id: selectedRenter.apartment_id,
          amount: paymentAmount,
          month: paymentMonth,
          payment_method: paymentMethod,
          transaction_id: `PAY-${Date.now()}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Payment recorded successfully!');
        setShowPaymentModal(false);
        fetchRenters();
      }
    } catch (error: any) {
      console.error('Failed to record payment:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to record payment');
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

  const handleSendReminder = async (renter: Renter) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/manager/renters/${renter.id}/send-reminder`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success(`Payment reminder sent to ${renter.name}`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRenters.map(r => ({
      Name: r.name,
      Email: r.email,
      Phone: r.phone,
      Building: r.building,
      Apartment: r.apartment,
      'Rent Amount': r.rentAmount,
      Status: r.status,
      'Rent Paid': r.rentPaid ? 'Yes' : 'No',
      'Lease Start': new Date(r.leaseStart).toLocaleDateString(),
      'Lease End': new Date(r.leaseEnd).toLocaleDateString()
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
      r.status,
      r.rentPaid ? 'Yes' : 'No'
    ]);

    autoTable(doc, {
      head: [['Name', 'Apt', 'Building', 'Rent', 'Status', 'Paid']],
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
    if (!amount && amount !== 0) return '৳0';
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatCompactCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '৳0';
    if (amount >= 1000000) {
      return `৳${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `৳${(amount / 1000).toFixed(1)}K`;
    }
    return `৳${amount}`;
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
              <p className="text-sm text-emerald-600 mt-2">Active: {stats.active}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <FaUser className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Monthly Rent</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(stats.totalRent)}</p>
              <p className="text-sm text-emerald-600 mt-2">Collected: {formatCurrency(stats.collectedRent)}</p>
            </div>
            <div className="p-4 bg-emerald-100 rounded-lg">
              <FaMoneyBillWave className="text-2xl text-emerald-600" />
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
              <p className="text-sm text-slate-600">Overdue Payments</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.overdue}</p>
              <p className="text-sm text-rose-600 mt-2">{formatCurrency(stats.overdueRent)}</p>
            </div>
            <div className="p-4 bg-rose-100 rounded-lg">
              <FaExclamationTriangle className="text-2xl text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-medium text-slate-900 mb-3">Collection Rate</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatCompactCurrency(stats.collectedRent)} of {formatCompactCurrency(stats.totalRent)}</span>
              <span className="font-medium">{stats.collectionRate}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-medium text-slate-900 mb-3">Occupancy Rate</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.active} of {stats.total} units</span>
              <span className="font-medium">{stats.occupancyRate}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-medium text-slate-900 mb-3">Pending Payments</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pending: {formatCompactCurrency(stats.pendingRent)}</span>
              <span className="font-medium text-amber-600">Overdue: {formatCompactCurrency(stats.overdueRent)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.totalRent > 0 ? (stats.pendingRent / stats.totalRent) * 100 : 0}%` }}
              />
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
                        <div>
                          <p className="font-medium text-slate-900">{formatCurrency(renter.rentAmount)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            renter.rentPaid 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {renter.rentPaid ? 'Paid' : 'Pending'}
                          </span>
                          {renter.last_payment_date && (
                            <p className="text-xs text-slate-500 mt-1">
                              Last: {new Date(renter.last_payment_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(renter.status)}
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(renter.status)}`}>
                            {renter.status ? (renter.status.charAt(0).toUpperCase() + renter.status.slice(1)) : 'Unknown'}
                          </span>
                        </div>
                        {renter.status === 'overdue' && renter.last_payment_date && (
                          <span className="text-xs text-rose-600 font-medium">
                            {Math.ceil((new Date().getTime() - new Date(renter.last_payment_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                          </span>
                        )}
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
                          onClick={() => handleEditRenter(renter)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        
                        <button 
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          onClick={() => handleViewPaymentHistory(renter)}
                          title="Payment History"
                        >
                          <FaHistory />
                        </button>
                        
                        {!renter.rentPaid && renter.status === 'active' && (
                          <button 
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
                            onClick={() => handleRecordPayment(renter)}
                            title="Record Payment"
                          >
                            <FaCreditCard />
                          </button>
                        )}
                        
                        {renter.status === 'overdue' && (
                          <button 
                            className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                            onClick={() => handleSendReminder(renter)}
                            title="Send Reminder"
                          >
                            <FaBell />
                          </button>
                        )}
                        
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
            <p className="text-sm text-slate-500">
              Showing {filteredRenters.length} of {renters.length} renters
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-violet-600" />
            Rent Summary
          </h3>
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
              <span className="text-slate-600">Pending Rent</span>
              <span className="font-bold text-lg text-amber-600">{formatCurrency(stats.pendingRent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Overdue Rent</span>
              <span className="font-bold text-lg text-rose-600">{formatCurrency(stats.overdueRent)}</span>
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
              <span className="text-slate-600">Vacant Units</span>
              <span className="font-bold text-lg text-amber-600">{Math.max(0, stats.total - stats.active)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Under Maintenance</span>
              <span className="font-bold text-lg text-rose-600">1</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaEnvelopeOpenText className="text-violet-600" />
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
              onClick={() => window.location.href = '/manager/leases'}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaFileContract className="text-violet-600" />
              Generate Lease Agreements
            </button>
            <button 
              onClick={exportToExcel}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaDownload className="text-violet-600" />
              Export Renter List
            </button>
            <button 
              onClick={() => window.location.href = '/manager/payments'}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaCreditCard className="text-violet-600" />
              Process Bulk Payments
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
                    <label className="text-xs font-medium text-slate-500">Rent Amount</label>
                    <p className="font-medium text-slate-900">{formatCurrency(selectedRenter.rentAmount)}/month</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-medium text-slate-500">Payment Status</label>
                    <p className={`font-medium ${selectedRenter.rentPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedRenter.rentPaid ? 'Paid' : 'Pending'}
                    </p>
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

                {selectedRenter.last_payment_date && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">Last Payment</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Date</p>
                        <p className="font-medium">
                          {new Date(selectedRenter.last_payment_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Amount</p>
                        <p className="font-medium">{formatCurrency(selectedRenter.last_payment_amount || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}

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
                  {!selectedRenter.rentPaid && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleRecordPayment(selectedRenter);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Record Payment
                    </button>
                  )}
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

      {/* Add Renter Modal - FIXED */}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Rent Amount (৳) *</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rent Amount (৳) *</label>
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

      {/* Payment Modal */}
      {showPaymentModal && selectedRenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Record Payment</h3>
              <p className="text-slate-600 mb-6">
                Record payment for {selectedRenter.name} - {selectedRenter.apartment}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Month</label>
                  <input
                    type="month"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={paymentMonth.slice(0, 7)}
                    onChange={(e) => setPaymentMonth(e.target.value + '-01')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPayment}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedRenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Payment History - {selectedRenter.name}
                </h3>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedRenter.payment_history?.length === 0 ? (
                  <div className="text-center py-8">
                    <FaHistory className="text-4xl text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No payment history found</p>
                  </div>
                ) : (
                  selectedRenter.payment_history?.map((payment, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(payment.month).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-slate-500">
                            Amount: {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : payment.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {payment.status.toUpperCase()}
                          </span>
                          {payment.paid_at && (
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date(payment.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {payment.payment_method && (
                        <p className="text-xs text-slate-400 mt-2">
                          Method: {payment.payment_method.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Renters;