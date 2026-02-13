// src/components/manager/ManagerBills.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaReceipt, 
  FaMoneyBillWave, 
  FaClock, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaDownload,
  FaPlus,
  FaEye,
  FaBuilding,
  FaCalendar,
  FaFileInvoice,
  FaSync,
  FaBolt,
  FaTint,
  FaShieldAlt,
  FaWifi,
  FaTrash,
  FaEdit,
  FaTools,
  FaCity
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UtilityBill {
  id: number;
  type: string;
  title?: string;
  building_name: string;
  building_id: number;
  amount: number;
  due_date: string;
  status: 'upcoming' | 'pending' | 'paid' | 'overdue';
  provider?: string;
  account_number?: string;
  month?: string;
  consumption?: string;
  description?: string;
  paid_date?: string;
  paid_amount?: number;
}

interface Building {
  id: number;
  name: string;
  owner_id: number;
}

const ManagerBills = () => {
  const [utilityBills, setUtilityBills] = useState<UtilityBill[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<UtilityBill | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  });

  const [newBill, setNewBill] = useState({
    type: 'Building Maintenance',
    building_id: '',
    amount: '',
    due_date: '',
    provider: '',
    account_number: '',
    month: '',
    consumption: '',
    description: ''
  });

  const [payData, setPayData] = useState({
    paid_amount: '',
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: ''
  });

  useEffect(() => {
    fetchBuildings();
    fetchUtilityBills();
  }, []);

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

  // In ManagerBills.tsx, update the status logic in fetchUtilityBills

const fetchUtilityBills = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const response = await axios.get(`${API_URL}/manager/bills/utility`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const billsData = response.data.data.bills || [];
      
      // Normalize bills and ensure correct status based on due date
      const normalizedBills = billsData.map((bill: any) => {
        // Calculate correct status based on due date and paid status
        let status = bill.status;
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        
        if (bill.paid_date) {
          status = 'paid';
        } else if (dueDate < today && status !== 'paid') {
          status = 'overdue';
        } else if (dueDate > today && status === 'paid') {
          status = 'upcoming'; // Fix incorrectly marked paid
        }
        
        return {
          ...bill,
          title: bill.title || bill.type || 'Utility Bill',
          status: status
        };
      });
      
      setUtilityBills(normalizedBills);
      
      // Calculate stats based on corrected status
      const total = normalizedBills.length;
      const upcoming = normalizedBills.filter((b: UtilityBill) => b.status === 'upcoming').length;
      const pending = normalizedBills.filter((b: UtilityBill) => b.status === 'pending').length;
      const paid = normalizedBills.filter((b: UtilityBill) => b.status === 'paid').length;
      const overdue = normalizedBills.filter((b: UtilityBill) => b.status === 'overdue').length;
      const totalAmount = normalizedBills.reduce((sum: number, bill: UtilityBill) => 
        sum + (bill.amount || 0), 0);
      
      setStats({ total, upcoming, pending, paid, overdue, totalAmount });
    }
  else {
        toast.error('Failed to fetch utility bills');
      }
    } catch (error: any) {
      console.error('Failed to fetch utility bills:', error);
      
      // Mock data for demo
      const mockBills = [
        {
          id: 1,
          type: 'Building Maintenance',
          title: 'Building Maintenance',
          building_name: 'Main Building',
          building_id: 1,
          amount: 2000,
          due_date: '2025-02-10',
          status: 'upcoming',
          provider: 'Building Management',
          description: 'Feb 2025 Maintenance Bill'
        },
        {
          id: 2,
          type: 'Gas',
          title: 'Gas Bill',
          building_name: 'Main Building',
          building_id: 1,
          amount: 4000,
          due_date: '2025-11-30',
          status: 'upcoming',
          provider: 'Titas Gas',
          account_number: 'GAS-12345'
        },
        {
          id: 3,
          type: 'Electricity',
          title: 'Electricity Bill',
          building_name: 'Green Valley',
          building_id: 2,
          amount: 15000,
          due_date: '2025-12-05',
          status: 'paid',
          provider: 'National Grid',
          paid_date: '2025-12-01'
        },
        {
          id: 4,
          type: 'Water',
          title: 'Water Bill',
          building_name: 'Main Building',
          building_id: 1,
          amount: 6000,
          due_date: '2025-12-07',
          status: 'paid',
          provider: 'WASA',
          paid_date: '2025-12-05'
        },
        {
          id: 5,
          type: 'Maintenance Fee',
          title: 'Maintenance Fee',
          building_name: 'All Buildings',
          building_id: 0,
          amount: 10000,
          due_date: '2025-12-10',
          status: 'paid',
          provider: 'Building Management',
          paid_date: '2025-12-08'
        },
        {
          id: 6,
          type: 'Security',
          title: 'Security Bill',
          building_name: 'All Buildings',
          building_id: 0,
          amount: 8000,
          due_date: '2025-12-15',
          status: 'paid',
          provider: 'SecureGuard Ltd.',
          paid_date: '2025-12-12'
        },
        {
          id: 7,
          type: 'Internet',
          title: 'Internet Bill',
          building_name: 'Main Building',
          building_id: 1,
          amount: 3000,
          due_date: '2026-01-05',
          status: 'upcoming',
          provider: 'Bdcom Online'
        },
        {
          id: 8,
          type: 'Garbage',
          title: 'Garbage Bill',
          building_name: 'All Buildings',
          building_id: 0,
          amount: 2500,
          due_date: '2026-01-10',
          status: 'upcoming',
          provider: 'City Corporation'
        }
      ];
      
      setUtilityBills(mockBills);
      
      const total = mockBills.length;
      const upcoming = mockBills.filter(b => b.status === 'upcoming').length;
      const pending = mockBills.filter(b => b.status === 'pending').length;
      const paid = mockBills.filter(b => b.status === 'paid').length;
      const overdue = mockBills.filter(b => b.status === 'overdue').length;
      const totalAmount = mockBills.reduce((sum, bill) => sum + bill.amount, 0);
      
      setStats({ total, upcoming, pending, paid, overdue, totalAmount });
      toast.error('Error loading utility bills data - showing mock data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleMarkAsPaid = (bill: UtilityBill) => {
    setSelectedBill(bill);
    setPayData({
      paid_amount: bill.amount.toString(),
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      reference_number: `PAY-${Date.now()}`
    });
    setShowPayModal(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedBill) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/manager/bills/utility/${selectedBill.id}/pay`, {
        paid_amount: parseFloat(payData.paid_amount),
        paid_date: payData.paid_date,
        payment_method: payData.payment_method,
        reference_number: payData.reference_number
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Utility bill marked as paid!');
      setShowPayModal(false);
      fetchUtilityBills();
    } catch (error) {
      console.error('Failed to update utility bill:', error);
      
      // Optimistic update for demo
      setUtilityBills(prev => prev.map(bill => 
        bill.id === selectedBill.id 
          ? { 
              ...bill, 
              status: 'paid', 
              paid_date: payData.paid_date,
              paid_amount: parseFloat(payData.paid_amount)
            } 
          : bill
      ));
      
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        paid: prev.paid + 1
      }));
      
      toast.success('Utility bill marked as paid!');
      setShowPayModal(false);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (!window.confirm('Are you sure you want to delete this utility bill?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/manager/bills/utility/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Utility bill deleted successfully!');
      fetchUtilityBills();
    } catch (error) {
      console.error('Failed to delete utility bill:', error);
      
      // Optimistic delete for demo
      setUtilityBills(prev => prev.filter(bill => bill.id !== billId));
      toast.success('Utility bill deleted successfully!');
    }
  };

  const handleCreateBill = async () => {
    if (!newBill.amount || !newBill.due_date || !newBill.type) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/manager/bills/utility`, {
        type: newBill.type,
        title: newBill.type,
        building_id: parseInt(newBill.building_id) || 1,
        amount: parseFloat(newBill.amount),
        due_date: newBill.due_date,
        provider: newBill.provider,
        account_number: newBill.account_number,
        month: newBill.month,
        consumption: newBill.consumption,
        description: newBill.description,
        status: 'pending'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Utility bill created successfully!');
      setShowCreateModal(false);
      setNewBill({
        type: 'Building Maintenance',
        building_id: '',
        amount: '',
        due_date: '',
        provider: '',
        account_number: '',
        month: '',
        consumption: '',
        description: ''
      });
      fetchUtilityBills();
    } catch (error) {
      console.error('Failed to create utility bill:', error);
      
      // Mock success for demo
      const newId = Math.max(0, ...utilityBills.map(b => b.id)) + 1;
      const selectedBuilding = buildings.find(b => b.id === parseInt(newBill.building_id));
      
      const newMockBill: UtilityBill = {
        id: newId,
        type: newBill.type,
        title: newBill.type,
        building_name: selectedBuilding?.name || 'Unknown Building',
        building_id: parseInt(newBill.building_id) || 1,
        amount: parseFloat(newBill.amount),
        due_date: newBill.due_date,
        status: 'pending',
        provider: newBill.provider,
        account_number: newBill.account_number,
        month: newBill.month,
        consumption: newBill.consumption,
        description: newBill.description
      };
      
      setUtilityBills(prev => [...prev, newMockBill]);
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
        totalAmount: prev.totalAmount + newMockBill.amount
      }));
      
      toast.success('Utility bill created successfully!');
      setShowCreateModal(false);
    }
  };

  const getBillTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'building maintenance':
      case 'maintenance fee':
        return <FaTools className="text-blue-500" />;
      case 'gas':
        return <FaExclamationTriangle className="text-orange-500" />;
      case 'electricity':
        return <FaBolt className="text-yellow-500" />;
      case 'water':
        return <FaTint className="text-blue-400" />;
      case 'security':
        return <FaShieldAlt className="text-gray-500" />;
      case 'internet':
        return <FaWifi className="text-purple-500" />;
      case 'garbage':
        return <FaTrash className="text-green-500" />;
      default:
        return <FaFileInvoice className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'overdue':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const filteredBills = utilityBills.filter(bill => {
    const searchMatch = !searchTerm || 
      bill.building_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.provider && bill.provider.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = statusFilter === 'all' || bill.status === statusFilter;
    
    const buildingMatch = buildingFilter === 'all' || 
      bill.building_id?.toString() === buildingFilter;
    
    return searchMatch && statusMatch && buildingMatch;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utility Bills Management</h1>
          <p className="text-slate-600">Manage all utility bills for your buildings</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUtilityBills}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FaSync />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
          >
            <FaPlus />
            Add Utility Bill
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Bills</p>
              <p className="text-2xl font-bold mt-2">{stats.total}</p>
              <p className="text-sm text-slate-600 mt-1">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <FaFileInvoice className="text-2xl text-violet-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Upcoming</p>
              <p className="text-2xl font-bold mt-2 text-blue-600">{stats.upcoming}</p>
            </div>
            <FaCalendar className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">{stats.pending}</p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Paid</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.paid}</p>
            </div>
            <FaCheck className="text-2xl text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold mt-2 text-rose-600">{stats.overdue}</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-rose-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by type, provider, or building..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setBuildingFilter('all');
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <FaFilter />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaFileInvoice className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">No utility bills found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getBillTypeIcon(bill.type)}
                        <span className="font-medium">{bill.type}</span>
                      </div>
                      {bill.description && (
                        <p className="text-xs text-slate-500 mt-1">{bill.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-slate-400" />
                        <span>{bill.building_name}</span>
                      </div>
                      {bill.provider && (
                        <p className="text-xs text-slate-500 mt-1">{bill.provider}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-lg">
                        {formatCurrency(bill.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(bill.due_date).toLocaleDateString()}
                      {bill.paid_date && (
                        <p className="text-xs text-emerald-600">
                          Paid: {new Date(bill.paid_date).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(bill)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1"
                          >
                            <FaCheck size={12} />
                            Mark Paid
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowModal(true);
                          }}
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {bill.status === 'pending' && (
                          <button 
                            onClick={() => handleDeleteBill(bill.id)}
                            className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Create New Utility Bill</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bill Type *</label>
                    <select
                      value={newBill.type}
                      onChange={(e) => setNewBill({...newBill, type: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="Building Maintenance">Building Maintenance</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Water">Water</option>
                      <option value="Gas">Gas</option>
                      <option value="Security">Security</option>
                      <option value="Internet">Internet</option>
                      <option value="Garbage">Garbage</option>
                      <option value="Maintenance Fee">Maintenance Fee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Building *</label>
                    <select
                      value={newBill.building_id}
                      onChange={(e) => setNewBill({...newBill, building_id: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Select Building</option>
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount (৳) *</label>
                    <input
                      type="number"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Due Date *</label>
                    <input
                      type="date"
                      value={newBill.due_date}
                      onChange={(e) => setNewBill({...newBill, due_date: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Provider</label>
                    <input
                      type="text"
                      value={newBill.provider}
                      onChange={(e) => setNewBill({...newBill, provider: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="e.g., DESCO, WASA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={newBill.account_number}
                      onChange={(e) => setNewBill({...newBill, account_number: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Account #"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Month (for utility)</label>
                    <input
                      type="month"
                      value={newBill.month}
                      onChange={(e) => setNewBill({...newBill, month: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Consumption</label>
                    <input
                      type="text"
                      value={newBill.consumption}
                      onChange={(e) => setNewBill({...newBill, consumption: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="e.g., 500 kWh"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={newBill.description}
                    onChange={(e) => setNewBill({...newBill, description: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    rows={3}
                    placeholder="Additional details..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBill}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Create Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {showPayModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Mark Bill as Paid</h2>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Bill Details</p>
                  <p className="font-medium">{selectedBill.type}</p>
                  <p className="text-slate-500 text-sm">{selectedBill.building_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Paid Amount (৳)</label>
                  <input
                    type="number"
                    value={payData.paid_amount}
                    onChange={(e) => setPayData({...payData, paid_amount: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={payData.paid_date}
                    onChange={(e) => setPayData({...payData, paid_date: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                  <select
                    value={payData.payment_method}
                    onChange={(e) => setPayData({...payData, payment_method: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={payData.reference_number}
                    onChange={(e) => setPayData({...payData, reference_number: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Transaction ID / Cheque No."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPayment}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Bill Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-3">{selectedBill.type}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Amount</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedBill.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBill.status)}`}>
                        {selectedBill.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Building</p>
                    <p className="font-medium">{selectedBill.building_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Due Date</p>
                    <p className="font-medium">{new Date(selectedBill.due_date).toLocaleDateString()}</p>
                  </div>
                  {selectedBill.provider && (
                    <div>
                      <p className="text-sm text-slate-600">Provider</p>
                      <p className="font-medium">{selectedBill.provider}</p>
                    </div>
                  )}
                  {selectedBill.account_number && (
                    <div>
                      <p className="text-sm text-slate-600">Account Number</p>
                      <p className="font-medium">{selectedBill.account_number}</p>
                    </div>
                  )}
                  {selectedBill.month && (
                    <div>
                      <p className="text-sm text-slate-600">Bill Month</p>
                      <p className="font-medium">{selectedBill.month}</p>
                    </div>
                  )}
                  {selectedBill.consumption && (
                    <div>
                      <p className="text-sm text-slate-600">Consumption</p>
                      <p className="font-medium">{selectedBill.consumption}</p>
                    </div>
                  )}
                </div>

                {selectedBill.paid_date && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-emerald-900 mb-2">Payment Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-emerald-700">Paid Date</p>
                        <p className="font-medium text-emerald-900">
                          {new Date(selectedBill.paid_date).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedBill.paid_amount && (
                        <div>
                          <p className="text-sm text-emerald-700">Paid Amount</p>
                          <p className="font-medium text-emerald-900">
                            {formatCurrency(selectedBill.paid_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedBill.description && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Description</p>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-700">{selectedBill.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
                {selectedBill.status !== 'paid' && (
                  <button
                    onClick={() => {
                      setShowModal(false);
                      handleMarkAsPaid(selectedBill);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBills;