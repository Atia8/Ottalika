// src/routes/manager/bills.tsx - UPDATED WITH PROPER TAKA FORMATTING
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
  FaFileExport,
  FaBolt,
  FaTint,
  FaShieldAlt,
  FaBroom,
  FaFire,
  FaWifi,
  FaTrash,
  FaEdit,
  FaTools,
  FaTrashAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UtilityBill {
  id: number;
  type: string;
  building_name: string;
  amount: number;
  amount_display?: string;
  due_date: string;
  status: 'upcoming' | 'pending' | 'paid' | 'overdue';
  provider?: string;
  account_number?: string;
  month?: string;
  consumption?: string;
  description?: string;
  paid_date?: string;
  paid_amount?: number;
  building_id: number;
}

const ManagerBills = () => {
  const [utilityBills, setUtilityBills] = useState<UtilityBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<UtilityBill | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  
  const [newBill, setNewBill] = useState({
    type: 'Building Maintenance',
    building_id: '1',
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
    paid_date: '',
    payment_method: 'bank_transfer',
    reference_number: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchUtilityBills();
  }, []);

  const fetchUtilityBills = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/manager/bills/utility`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const billsData = response.data.data.bills || [];
        console.log('Fetched utility bills:', billsData);
        
        setUtilityBills(billsData);
        
        const total = billsData.length;
        const upcoming = billsData.filter(b => b.status === 'upcoming').length;
        const pending = billsData.filter(b => b.status === 'pending').length;
        const paid = billsData.filter(b => b.status === 'paid').length;
        const overdue = billsData.filter(b => b.status === 'overdue').length;
        const totalAmount = billsData.reduce((sum: number, bill: UtilityBill) => 
          sum + (bill.amount || 0), 0);
        
        setStats({ total, upcoming, pending, paid, overdue, totalAmount });
      } else {
        toast.error('Failed to fetch utility bills');
        useMockData();
      }
    } catch (error) {
      console.error('Failed to fetch utility bills:', error);
      toast.error('Error loading utility bills data');
      useMockData();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // Proper Bangladeshi Taka formatting
    const formatted = new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return `৳${formatted}`;
  };

  const useMockData = () => {
    const mockBills: UtilityBill[] = [
      {
        id: 1,
        type: 'Building Maintenance',
        building_name: 'Main Building',
        amount: 2000.00,
        amount_display: '৳2,000.00',
        due_date: '2025-02-10',
        status: 'upcoming',
        provider: 'Building Management',
        description: 'Feb 2025 Maintenance Bill',
        building_id: 1
      },
      {
        id: 2,
        type: 'Gas',
        building_name: 'Main Building',
        amount: 4000.00,
        amount_display: '৳4,000.00',
        due_date: '2025-11-30',
        status: 'upcoming',
        provider: 'Titas Gas',
        description: 'Gas Supply Bill',
        building_id: 1
      },
      {
        id: 3,
        type: 'Electricity',
        building_name: 'Green Valley Apartments',
        amount: 15000.00,
        amount_display: '৳15,000.00',
        due_date: '2025-12-05',
        status: 'paid',
        provider: 'National Grid',
        account_number: 'NG-123456',
        month: 'December 2025',
        consumption: '1200 kWh',
        description: 'Monthly Electricity Bill',
        building_id: 2
      },
      {
        id: 4,
        type: 'Water',
        building_name: 'Main Building',
        amount: 6000.00,
        amount_display: '৳6,000.00',
        due_date: '2025-12-07',
        status: 'paid',
        provider: 'WASA',
        description: 'Water Supply Bill',
        building_id: 1
      },
      {
        id: 5,
        type: 'Maintenance Fee',
        building_name: 'All Buildings',
        amount: 10000.00,
        amount_display: '৳10,000.00',
        due_date: '2025-12-10',
        status: 'paid',
        provider: 'Building Management',
        description: 'Monthly Maintenance Fee',
        building_id: 3
      },
      {
        id: 6,
        type: 'Security',
        building_name: 'All Buildings',
        amount: 8000.00,
        amount_display: '৳8,000.00',
        due_date: '2025-12-15',
        status: 'paid',
        provider: 'SecureGuard Ltd.',
        description: 'Security Service Bill',
        building_id: 3
      },
      {
        id: 7,
        type: 'Internet',
        building_name: 'Main Building',
        amount: 3000.00,
        amount_display: '৳3,000.00',
        due_date: '2026-01-05',
        status: 'upcoming',
        provider: 'Bdcom Online',
        description: 'Monthly Internet Bill',
        building_id: 1
      },
      {
        id: 8,
        type: 'Garbage',
        building_name: 'All Buildings',
        amount: 2500.00,
        amount_display: '৳2,500.00',
        due_date: '2026-01-10',
        status: 'upcoming',
        provider: 'City Corporation',
        description: 'Garbage Collection Bill',
        building_id: 3
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
  };

  const getDisplayAmount = (bill: UtilityBill) => {
    if (bill.amount_display && bill.amount_display.includes('৳')) {
      return bill.amount_display;
    }
    if (bill.amount_display) {
      return `৳${bill.amount_display.replace(/[^0-9.,]/g, '')}`;
    }
    return formatCurrency(bill.amount);
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
      toast.error('Failed to update utility bill');
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (window.confirm('Are you sure you want to delete this utility bill?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/manager/bills/utility/${billId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Utility bill deleted successfully!');
        fetchUtilityBills();
      } catch (error) {
        console.error('Failed to delete utility bill:', error);
        toast.error('Failed to delete utility bill');
      }
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
        building_id: '1',
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
      toast.error('Failed to create utility bill');
    }
  };

  const getBillTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'building maintenance':
      case 'maintenance fee':
        return <FaTools className="text-blue-500" />;
      case 'gas':
        return <FaFire className="text-orange-500" />;
      case 'electricity':
        return <FaBolt className="text-yellow-500" />;
      case 'water':
        return <FaTint className="text-blue-400" />;
      case 'security':
        return <FaShieldAlt className="text-gray-500" />;
      case 'internet':
        return <FaWifi className="text-purple-500" />;
      case 'garbage':
      case 'cleaning':
        return <FaTrashAlt className="text-green-500" />;
      default:
        return <FaFileInvoice className="text-gray-500" />;
    }
  };

  const getBillTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'building maintenance':
      case 'maintenance fee':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'gas':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'electricity':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'water':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'security':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      case 'internet':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'garbage':
      case 'cleaning':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
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
      bill.building_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.provider && bill.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.description && bill.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = statusFilter === 'all' || bill.status === statusFilter;
    
    return searchMatch && statusMatch;
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <p className="text-sm text-slate-600 mt-1">Future bills</p>
            </div>
            <FaCalendar className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">{stats.pending}</p>
              <p className="text-sm text-slate-600 mt-1">Unpaid bills</p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Paid</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.paid}</p>
              <p className="text-sm text-slate-600 mt-1">Settled bills</p>
            </div>
            <FaCheck className="text-2xl text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold mt-2 text-rose-600">{stats.overdue}</p>
              <p className="text-sm text-slate-600 mt-1">Late payments</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-rose-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Collection Rate</p>
              <p className="text-2xl font-bold mt-2 text-indigo-600">
                {stats.total > 0 ? Math.round(((stats.paid + stats.upcoming) / stats.total) * 100) : 0}%
              </p>
              <p className="text-sm text-slate-600 mt-1">Success rate</p>
            </div>
            <FaMoneyBillWave className="text-2xl text-indigo-500" />
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
                placeholder="Search by type, provider, building, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
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
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <FaFilter />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Utility Bills Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Bill Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Building
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaFileInvoice className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">No utility bills found</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Add a utility bill to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-1">
                          {getBillTypeIcon(bill.type)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{bill.type}</p>
                          {bill.description && (
                            <p className="text-sm text-slate-600">{bill.description}</p>
                          )}
                          {bill.month && (
                            <p className="text-xs text-slate-500 mt-1">{bill.month}</p>
                          )}
                          {bill.provider && (
                            <p className="text-xs text-slate-500 mt-1">{bill.provider}</p>
                          )}
                          {bill.consumption && (
                            <p className="text-xs text-slate-500 mt-1">Usage: {bill.consumption}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{bill.building_name}</p>
                          {bill.account_number && (
                            <p className="text-xs text-slate-500 mt-1">Account: {bill.account_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-slate-400" />
                        <div>
                          <p className="font-bold text-lg text-slate-900">
                            {getDisplayAmount(bill)}
                          </p>
                          {bill.paid_amount && (
                            <p className="text-xs text-emerald-600">
                              Paid: {formatCurrency(bill.paid_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(bill.due_date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          {bill.paid_date && (
                            <p className="text-xs text-emerald-600">
                              Paid: {new Date(bill.paid_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                          {bill.status === 'overdue' && (
                            <p className="text-xs text-rose-600 font-medium mt-1">OVERDUE</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(bill.status)}`}>
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {bill.status !== 'paid' && bill.status !== 'upcoming' && (
                          <button
                            onClick={() => handleMarkAsPaid(bill)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1"
                          >
                            <FaCheck />
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
                        <button 
                          onClick={() => {
                            toast('Edit functionality coming soon');
                          }}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <FaEdit />
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

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4">Bill Summary by Type</h3>
          <div className="space-y-3">
            {Array.from(new Set(utilityBills.map(b => b.type))).map(type => {
              const typeBills = utilityBills.filter(b => b.type === type);
              const totalAmount = typeBills.reduce((sum, b) => sum + b.amount, 0);
              const paidAmount = typeBills
                .filter(b => b.status === 'paid')
                .reduce((sum, b) => sum + b.amount, 0);
              
              return (
                <div key={type} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getBillTypeIcon(type)}
                    <span className="font-medium">{type}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatCurrency(totalAmount)}</p>
                    <p className="text-xs text-slate-500">
                      {typeBills.length} bill{typeBills.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4">Payment Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Outstanding</span>
              <span className="font-bold text-lg text-amber-600">
                {formatCurrency(
                  utilityBills
                    .filter(b => b.status === 'pending' || b.status === 'overdue')
                    .reduce((sum, b) => sum + b.amount, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Upcoming Amount</span>
              <span className="font-bold text-lg text-blue-600">
                {formatCurrency(
                  utilityBills
                    .filter(b => b.status === 'upcoming')
                    .reduce((sum, b) => sum + b.amount, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Collected</span>
              <span className="font-bold text-lg text-emerald-600">
                {formatCurrency(
                  utilityBills
                    .filter(b => b.status === 'paid')
                    .reduce((sum, b) => sum + (b.paid_amount || b.amount), 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Overdue Amount</span>
              <span className="font-bold text-lg text-rose-600">
                {formatCurrency(
                  utilityBills
                    .filter(b => b.status === 'overdue')
                    .reduce((sum, b) => sum + b.amount, 0)
                )}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus className="text-violet-600" />
              Add New Utility Bill
            </button>
            <button 
              onClick={fetchUtilityBills}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaSync className="text-blue-600" />
              Refresh Bills List
            </button>
            <button 
              onClick={() => {
                toast('Export functionality coming soon');
              }}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaDownload className="text-emerald-600" />
              Export Bills Report
            </button>
            <button 
              onClick={() => {
                toast('Reminder functionality coming soon');
              }}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaExclamationTriangle className="text-amber-600" />
              Send Payment Reminders
            </button>
          </div>
        </div>
      </div>

      {/* Bill Details Modal */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedBill.type} Bill Details</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBill.status)}`}>
                      {selectedBill.status.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBillTypeColor(selectedBill.type)}`}>
                      {selectedBill.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Bill Information</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600">Amount</p>
                        <p className="font-bold text-2xl text-slate-900 mt-1">
                          {getDisplayAmount(selectedBill)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Due Date</p>
                          <p className="font-medium">
                            {new Date(selectedBill.due_date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {selectedBill.paid_date && (
                          <div>
                            <p className="text-sm text-slate-600">Paid Date</p>
                            <p className="font-medium text-emerald-600">
                              {new Date(selectedBill.paid_date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedBill.month && (
                        <div>
                          <p className="text-sm text-slate-600">Billing Month</p>
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
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Service Provider</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600">Provider</p>
                        <p className="font-medium">{selectedBill.provider || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Building</p>
                        <div className="flex items-center gap-2 mt-1">
                          <FaBuilding className="text-slate-400" />
                          <p className="font-medium">{selectedBill.building_name}</p>
                        </div>
                      </div>
                      {selectedBill.account_number && (
                        <div>
                          <p className="text-sm text-slate-600">Account Number</p>
                          <p className="font-medium font-mono">{selectedBill.account_number}</p>
                        </div>
                      )}
                      {selectedBill.description && (
                        <div>
                          <p className="text-sm text-slate-600">Description</p>
                          <p className="font-medium mt-1 p-3 bg-slate-50 rounded-lg">
                            {selectedBill.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedBill.status !== 'paid' && selectedBill.status !== 'upcoming' && (
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        handleMarkAsPaid(selectedBill);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Mark as Paid
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Add New Utility Bill</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bill Type *
                  </label>
                  <select
                    value={newBill.type}
                    onChange={(e) => setNewBill({...newBill, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Building Maintenance">Building Maintenance</option>
                    <option value="Gas">Gas</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Maintenance Fee">Maintenance Fee</option>
                    <option value="Security">Security</option>
                    <option value="Internet">Internet</option>
                    <option value="Garbage">Garbage Collection</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newBill.due_date}
                    onChange={(e) => setNewBill({...newBill, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Building
                  </label>
                  <select
                    value={newBill.building_id}
                    onChange={(e) => setNewBill({...newBill, building_id: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="1">Main Building</option>
                    <option value="2">Green Valley Apartments</option>
                    <option value="3">All Buildings</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Service Provider
                  </label>
                  <input
                    type="text"
                    value={newBill.provider}
                    onChange={(e) => setNewBill({...newBill, provider: e.target.value})}
                    placeholder="e.g., Titas Gas, WASA, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={newBill.account_number}
                    onChange={(e) => setNewBill({...newBill, account_number: e.target.value})}
                    placeholder="e.g., NG-123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={newBill.description}
                    onChange={(e) => setNewBill({...newBill, description: e.target.value})}
                    placeholder="e.g., February 2025 Maintenance Bill"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Billing Month
                  </label>
                  <input
                    type="text"
                    value={newBill.month}
                    onChange={(e) => setNewBill({...newBill, month: e.target.value})}
                    placeholder="e.g., February 2025"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Consumption/Usage
                  </label>
                  <input
                    type="text"
                    value={newBill.consumption}
                    onChange={(e) => setNewBill({...newBill, consumption: e.target.value})}
                    placeholder="e.g., 1200 kWh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
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
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Mark Bill as Paid</h3>
                  <p className="text-slate-600 mt-1">{selectedBill.type} - {selectedBill.provider}</p>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-600">Bill Amount</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {getDisplayAmount(selectedBill)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Due Date</p>
                      <p className="font-medium">
                        {new Date(selectedBill.due_date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount Paid (৳) *
                  </label>
                  <input
                    type="number"
                    value={payData.paid_amount}
                    onChange={(e) => setPayData({...payData, paid_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={payData.paid_date}
                    onChange={(e) => setPayData({...payData, paid_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payData.payment_method}
                    onChange={(e) => setPayData({...payData, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="online">Online Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={payData.reference_number}
                    onChange={(e) => setPayData({...payData, reference_number: e.target.value})}
                    placeholder="e.g., transaction ID or check number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
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
    </div>
  );
};

export default ManagerBills;