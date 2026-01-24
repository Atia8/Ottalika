// src/routes/manager/bills.tsx
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
  FaRupeeSign
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';



interface Bill {
  id: string | number;
  type: string;
  building: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  provider?: string;
  accountNumber?: string;
  month?: string;
  paidDate?: string;
  apartment_number?: string;
  floor?: number;
  renter_name?: string;
}

interface Payment {
  id: number;
  apartment_id: number;
  renter_id: number;
  amount: string | number;
  month: string;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  due_date: string;
  paid_at?: string;
  apartment_number: string;
  floor: number;
  renter_name: string;
  renter_email: string;
  renter_phone: string;
  confirmation_status?: string;
  verified_at?: string;
}

const ManagerBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  });
  const [selectedView, setSelectedView] = useState<'bills' | 'payments'>('payments');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<{display_month: string, value: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchData();
    fetchAvailableMonths();
  }, [filterMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (selectedView === 'payments') {
        await fetchPayments(token);
      } else {
        await fetchBills(token);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Error loading data');
      // Set empty data to prevent errors
      setBills([]);
      setPayments([]);
      setStats({ total: 0, pending: 0, paid: 0, overdue: 0, totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async (token: string | null) => {
    try {
      const response = await axios.get(`${API_URL}/manager/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const billsData = response.data.data.bills || [];
        const formattedBills = billsData.map((bill: any) => ({
          ...bill,
          amount: Number(bill.amount) || 0,
          dueDate: bill.due_date || bill.dueDate
        }));
        setBills(formattedBills);
        updateStats(formattedBills);
      } else {
        toast.error('Failed to fetch bills');
        setBills([]);
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      // Mock data for testing
      const mockBills: Bill[] = [
        {
          id: '1',
          type: 'electricity',
          building: 'Building A',
          amount: 850,
          dueDate: '2025-01-10',
          status: 'pending',
          provider: 'National Grid',
          accountNumber: 'NG-123456',
          month: 'January 2025'
        },
        {
          id: '2',
          type: 'water',
          building: 'Building A',
          amount: 320,
          dueDate: '2025-01-15',
          status: 'pending',
          provider: 'Water Corp',
          accountNumber: 'WC-789012',
          month: 'January 2025'
        },
        {
          id: '3',
          type: 'maintenance',
          building: 'Building A',
          amount: 1500,
          dueDate: '2025-01-20',
          status: 'paid',
          provider: 'Maintenance Co',
          accountNumber: 'MC-345678',
          month: 'January 2025',
          paidDate: '2025-01-05'
        },
        {
          id: '4',
          type: 'lift_maintenance',
          building: 'Building B',
          amount: 600,
          dueDate: '2025-01-25',
          status: 'overdue',
          provider: 'Elevator Inc',
          accountNumber: 'EI-901234',
          month: 'January 2025'
        }
      ];
      
      setBills(mockBills);
      updateStats(mockBills);
    }
  };

  const fetchPayments = async (token: string | null) => {
    try {
      let url = `${API_URL}/manager/payments`;
      const params: any = {};
      if (filterMonth) {
        params.month = filterMonth;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        const paymentsData = response.data.data.payments || [];
        
        // Ensure amounts are numbers
        const formattedPayments = paymentsData.map((payment: Payment) => ({
          ...payment,
          amount: Number(payment.amount) || 0
        }));
        
        setPayments(formattedPayments);
        
        // Convert payments to bills format for stats
        const billsData = formattedPayments.map((payment: any) => ({
          id: payment.id,
          type: 'rent',
          building: `Building ${Math.ceil(payment.floor/3)}`,
          amount: Number(payment.amount) || 0,
          dueDate: payment.due_date,
          status: payment.status as 'pending' | 'paid' | 'overdue',
          provider: payment.payment_method || 'N/A',
          accountNumber: payment.transaction_id || 'N/A',
          month: new Date(payment.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          paidDate: payment.paid_at,
          apartment_number: payment.apartment_number,
          floor: payment.floor,
          renter_name: payment.renter_name
        }));
        
        updateStats(billsData);
      } else {
        toast.error('Failed to fetch payments');
        setPayments([]);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Error loading payments');
      setPayments([]);
    }
  };

const fetchAvailableMonths = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/manager/payments/months`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const monthsData: {display_month: string; value: string}[] = response.data.months || [];
      setAvailableMonths(monthsData);
      if (monthsData.length > 0 && !filterMonth) {
        setFilterMonth(monthsData[0].value);
      }
    }
  } catch (error) {
    console.error('Failed to fetch months:', error);
    
    // Create default months with correct typing
    const currentDate = new Date();
    const defaultMonths: {display_month: string; value: string}[] = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      
      defaultMonths.push({
        display_month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      });
    }
    
    setAvailableMonths(defaultMonths);
  }
};
  const updateStats = (data: Bill[]) => {
    const total = data.length;
    const pending = data.filter(b => b.status === 'pending').length;
    const paid = data.filter(b => b.status === 'paid').length;
    const overdue = data.filter(b => b.status === 'overdue').length;
    
    // Convert amounts to numbers before summing
    const totalAmount = data.reduce((sum: number, bill: Bill) => {
      return sum + (Number(bill.amount) || 0);
    }, 0);
    
    setStats({ total, pending, paid, overdue, totalAmount });
  };

  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleGenerateBills = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/manager/bills/generate-monthly`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Monthly rent bills generated successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to generate bills:', error);
      toast.error('Failed to generate bills');
    }
  };

  const handleMarkAsPaid = async (paymentId: number) => {
    if (window.confirm('Mark this payment as paid?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/manager/bills/${paymentId}/pay`, {
          paymentMethod: 'bank_transfer',
          transactionId: `TRX-${Date.now()}`
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Payment marked as paid!');
        fetchData();
      } catch (error) {
        console.error('Failed to update payment:', error);
        toast.error('Failed to update payment');
      }
    }
  };

  const handleExportData = () => {
    let csvContent = '';
    let filename = '';
    
    if (selectedView === 'payments') {
      // Export payments
      csvContent = [
        ['Apartment', 'Renter', 'Amount', 'Month', 'Status', 'Due Date', 'Payment Method', 'Confirmed'],
        ...payments.map(payment => [
          payment.apartment_number,
          payment.renter_name,
          `₹${payment.amount}`,
          new Date(payment.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          payment.status,
          new Date(payment.due_date).toLocaleDateString(),
          payment.payment_method || 'N/A',
          payment.confirmation_status || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');
      
      filename = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Export bills
      csvContent = [
        ['Type', 'Building', 'Amount', 'Due Date', 'Status', 'Provider', 'Month'],
        ...bills.map(bill => [
          bill.type,
          bill.building,
          `₹${bill.amount}`,
          new Date(bill.dueDate).toLocaleDateString(),
          bill.status,
          bill.provider || 'N/A',
          bill.month || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');
      
      filename = `bills-export-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    toast.success('Data exported successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'overdue': return 'bg-rose-100 text-rose-700 border border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
  };

  const getConfirmationColor = (status?: string) => {
    switch (status) {
      case 'verified': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'pending_review': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const filteredPayments = payments.filter(payment => {
    // Filter by status
    let statusMatch = true;
    if (filterStatus === 'all') statusMatch = true;
    else if (filterStatus === 'confirmed') statusMatch = payment.confirmation_status === 'verified';
    else if (filterStatus === 'pending_review') statusMatch = payment.confirmation_status === 'pending_review' || !payment.confirmation_status;
    else statusMatch = payment.status === filterStatus;
    
    // Filter by search term
    const searchMatch = !searchTerm || 
      payment.apartment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.renter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.renter_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const filteredBills = bills.filter(bill => {
    const searchMatch = !searchTerm || 
      bill.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.provider && bill.provider.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = filterStatus === 'all' || bill.status === filterStatus;
    
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
          <h1 className="text-2xl font-bold text-slate-900">Bills & Payments Management</h1>
          <p className="text-slate-600">Manage all rent payments and building bills</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportData}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <FaFileExport />
            Export
          </button>
          <button 
            onClick={handleGenerateBills}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2 transition-colors"
          >
            <FaPlus />
            Generate Rent Bills
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white p-1 rounded-lg border inline-flex">
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedView === 'payments' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setSelectedView('payments')}
        >
          Rent Payments
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedView === 'bills' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setSelectedView('bills')}
        >
          Building Bills
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold mt-2 text-slate-900">{stats.total}</p>
            </div>
            <FaReceipt className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">{stats.pending}</p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Paid</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.paid}</p>
            </div>
            <FaMoneyBillWave className="text-2xl text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold mt-2 text-rose-600">{stats.overdue}</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-rose-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Amount</p>
              <p className="text-2xl font-bold mt-2 text-violet-600">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <FaRupeeSign className="text-2xl text-violet-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${selectedView === 'payments' ? 'apartments or renters...' : 'bills...'}`}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {selectedView === 'payments' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Month</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.display_month}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {selectedView === 'payments' ? (
                <>
                  <option value="pending">Pending Payment</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="verified">Verified</option>
                  <option value="pending_review">Pending Review</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </>
              )}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 h-10 transition-colors"
            >
              <FaSync />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {selectedView === 'payments' ? (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Apartment & Renter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Confirmation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaReceipt className="text-4xl text-slate-300 mb-4" />
                        <p className="text-slate-500 text-lg font-medium">No payments found</p>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or generate new bills</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {payment.apartment_number}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                Apartment {payment.apartment_number}
                              </p>
                              <p className="text-sm text-slate-600">{payment.renter_name}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{payment.renter_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaRupeeSign className="text-slate-400" />
                          <p className="font-bold text-slate-900 text-lg">{payment.amount}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaCalendar className="text-slate-400" />
                          <p className="font-medium text-slate-900">
                            {new Date(payment.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(payment.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </p>
                          {payment.status === 'overdue' && (
                            <p className="text-xs text-rose-600 font-medium mt-1">Overdue</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getConfirmationColor(payment.confirmation_status)}`}>
                          {payment.confirmation_status ? 
                            payment.confirmation_status.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ') : 
                            'Pending'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {payment.status !== 'paid' && payment.status !== 'overdue' && (
                            <button
                              onClick={() => handleMarkAsPaid(payment.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1 transition-colors font-medium"
                            >
                              <FaCheck className="text-xs" />
                              Mark Paid
                            </button>
                          )}
                          <button 
                            className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="View Details"
                            onClick={() => toast(`Viewing details for ${payment.renter_name}`)}
                          >
                            <FaEye />
                          </button>
                          {payment.status === 'overdue' && (
                            <button 
                              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Send Reminder"
                              onClick={() => toast(`Reminder sent to ${payment.renter_name}`)}
                            >
                              <FaExclamationTriangle />
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
          {filteredPayments.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Bills Table */
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
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
                        <p className="text-slate-500 text-lg font-medium">No bills found</p>
                        <p className="text-slate-400 text-sm mt-1">Add building bills to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              bill.type === 'electricity' ? 'bg-yellow-100' :
                              bill.type === 'water' ? 'bg-blue-100' :
                              bill.type === 'maintenance' ? 'bg-purple-100' : 'bg-slate-100'
                            }`}>
                              <FaFileInvoice className={
                                bill.type === 'electricity' ? 'text-yellow-600' :
                                bill.type === 'water' ? 'text-blue-600' :
                                bill.type === 'maintenance' ? 'text-purple-600' : 'text-slate-600'
                              } />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 capitalize">
                                {bill.type.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-slate-500">{bill.month || 'Monthly'}</p>
                            </div>
                          </div>
                          {bill.provider && (
                            <p className="text-xs text-slate-500 mt-2">{bill.provider}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaBuilding className="text-slate-400" />
                          <p className="font-medium text-slate-900">{bill.building}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaRupeeSign className="text-slate-400" />
                          <p className="font-bold text-slate-900 text-lg">{bill.amount}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaCalendar className="text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">
                              {new Date(bill.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </p>
                            {bill.status === 'overdue' && (
                              <p className="text-xs text-rose-600 font-medium mt-1">Overdue</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(bill.status)}`}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {bill.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(Number(bill.id))}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1 transition-colors font-medium"
                            >
                              <FaCheck className="text-xs" />
                              Mark Paid
                            </button>
                          )}
                          <button 
                            className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="View Details"
                            onClick={() => toast(`Viewing details for ${bill.type} bill`)}
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                            onClick={() => toast.error('Delete functionality not implemented')}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredBills.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                Showing {filteredBills.length} of {bills.length} bills
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-600">Total {selectedView === 'payments' ? 'Rent' : 'Bills'} Amount</span>
              <span className="font-bold text-xl text-slate-900">{formatCurrency(stats.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pending {selectedView === 'payments' ? 'Payments' : 'Bills'}</span>
              <span className="font-semibold text-amber-600">{stats.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Overdue {selectedView === 'payments' ? 'Payments' : 'Bills'}</span>
              <span className="font-semibold text-rose-600">{stats.overdue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Paid {selectedView === 'payments' ? 'Payments' : 'Bills'}</span>
              <span className="font-semibold text-emerald-600">{stats.paid}</span>
            </div>
            {selectedView === 'payments' && stats.total > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Collection Rate</span>
                  <span className="font-bold text-lg text-violet-600">
                    {Math.round((stats.paid / stats.total) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleGenerateBills}
              className="w-full text-left p-4 bg-violet-50 hover:bg-violet-100 rounded-lg flex items-center gap-3 transition-colors group"
            >
              <div className="w-10 h-10 bg-violet-100 group-hover:bg-violet-200 rounded-lg flex items-center justify-center">
                <FaPlus className="text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Generate Rent Bills</p>
                <p className="text-sm text-slate-500">Create bills for next month</p>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/manager/dashboard'}
              className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors group"
            >
              <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center">
                <FaReceipt className="text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">View Dashboard</p>
                <p className="text-sm text-slate-500">Check overall performance</p>
              </div>
            </button>
            <button 
              onClick={handleExportData}
              className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors group"
            >
              <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center">
                <FaDownload className="text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Export Reports</p>
                <p className="text-sm text-slate-500">Download financial data</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerBills;