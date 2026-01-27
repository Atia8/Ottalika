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
  FaRupeeSign,
  FaBolt,
  FaTint,
  FaShieldAlt,
  FaBroom
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RentPayment {
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
  building_name: string;
}

interface UtilityBill {
  id: number;
  type: string;
  building_name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
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
  const [viewType, setViewType] = useState<'rent' | 'utility'>('rent');
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [utilityBills, setUtilityBills] = useState<UtilityBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<{display_month: string, value: string}[]>([]);
  
  // Stats
  const [rentStats, setRentStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  });
  
  const [utilityStats, setUtilityStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchData();
    if (viewType === 'rent') {
      fetchAvailableMonths();
    }
  }, [filterMonth, viewType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (viewType === 'rent') {
        await fetchRentPayments(token);
      } else {
        await fetchUtilityBills(token);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRentPayments = async (token: string | null) => {
    try {
      let url = `${API_URL}/manager/payments`;
      const params: any = {};
      if (filterMonth) {
        params.month = filterMonth;
      }
      if (statusFilter !== 'all' && statusFilter !== 'confirmed' && statusFilter !== 'pending_review') {
        params.status = statusFilter;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        const paymentsData = response.data.data.payments || [];
        setRentPayments(paymentsData);
        
        const total = paymentsData.length;
        const pending = paymentsData.filter(p => p.status === 'pending').length;
        const paid = paymentsData.filter(p => p.status === 'paid').length;
        const overdue = paymentsData.filter(p => p.status === 'overdue').length;
        const totalAmount = paymentsData.reduce((sum: number, payment: RentPayment) => 
          sum + (Number(payment.amount) || 0), 0);
        
        setRentStats({ total, pending, paid, overdue, totalAmount });
      }
    } catch (error) {
      console.error('Failed to fetch rent payments:', error);
      toast.error('Error loading rent payments');
    }
  };

  const fetchUtilityBills = async (token: string | null) => {
    try {
      let url = `${API_URL}/manager/bills/utility`;
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        const billsData = response.data.data.bills || [];
        setUtilityBills(billsData);
        
        const total = billsData.length;
        const pending = billsData.filter(b => b.status === 'pending').length;
        const paid = billsData.filter(b => b.status === 'paid').length;
        const overdue = billsData.filter(b => b.status === 'overdue').length;
        const totalAmount = billsData.reduce((sum: number, bill: UtilityBill) => 
          sum + (bill.amount || 0), 0);
        
        setUtilityStats({ total, pending, paid, overdue, totalAmount });
      }
    } catch (error) {
      console.error('Failed to fetch utility bills:', error);
      toast.error('Error loading utility bills');
    }
  };

  const fetchAvailableMonths = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/payments/months`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAvailableMonths(response.data.months || []);
      }
    } catch (error) {
      console.error('Failed to fetch months:', error);
    }
  };

  const handleMarkRentAsPaid = async (paymentId: number) => {
    if (window.confirm('Mark this rent payment as paid?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/manager/bills/${paymentId}/pay`, {
          paymentMethod: 'bank_transfer',
          transactionId: `TRX-${Date.now()}`
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Rent payment marked as paid!');
        fetchData();
      } catch (error) {
        console.error('Failed to update payment:', error);
        toast.error('Failed to update payment');
      }
    }
  };

  const handleMarkUtilityAsPaid = async (billId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/manager/bills/utility/${billId}/pay`, {
        paid_amount: null,
        paid_date: new Date().toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Utility bill marked as paid!');
      fetchData();
    } catch (error) {
      console.error('Failed to update utility bill:', error);
      toast.error('Failed to update utility bill');
    }
  };

  const handleGenerateRentBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      const monthStr = nextMonth.toISOString().slice(0, 7) + '-01';
      
      await axios.post(`${API_URL}/manager/payments/generate-monthly`, 
        { month: monthStr },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Monthly rent bills generated successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to generate bills:', error);
      toast.error('Failed to generate bills');
    }
  };

  const handleCreateUtilityBill = async () => {
    // Implement utility bill creation modal
    toast('Utility bill creation form would open here');
  };

  // Filter functions
  const filteredRentPayments = rentPayments.filter(payment => {
    const searchMatch = !searchTerm || 
      payment.apartment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.renter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.building_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let statusMatch = true;
    if (statusFilter === 'confirmed') {
      statusMatch = payment.confirmation_status === 'verified';
    } else if (statusFilter === 'pending_review') {
      statusMatch = payment.confirmation_status === 'pending_review' || !payment.confirmation_status;
    } else if (statusFilter !== 'all') {
      statusMatch = payment.status === statusFilter;
    }
    
    return searchMatch && statusMatch;
  });

  const filteredUtilityBills = utilityBills.filter(bill => {
    const searchMatch = !searchTerm || 
      bill.building_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.provider && bill.provider.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
          <h1 className="text-2xl font-bold text-slate-900">Bills Management</h1>
          <p className="text-slate-600">Manage {viewType === 'rent' ? 'rent payments' : 'utility bills'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateUtilityBill}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FaPlus />
            Add Utility Bill
          </button>
          <button 
            onClick={handleGenerateRentBills}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
          >
            <FaReceipt />
            Generate Rent Bills
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white p-1 rounded-lg border inline-flex">
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${viewType === 'rent' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setViewType('rent')}
        >
          Rent Payments
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${viewType === 'utility' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setViewType('utility')}
        >
          Utility Bills
        </button>
      </div>

      {/* Content based on view type */}
      {viewType === 'rent' ? (
        <RentPaymentsView 
          payments={filteredRentPayments}
          stats={rentStats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          availableMonths={availableMonths}
          onMarkPaid={handleMarkRentAsPaid}
          onRefresh={fetchData}
        />
      ) : (
        <UtilityBillsView 
          bills={filteredUtilityBills}
          stats={utilityStats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onMarkPaid={handleMarkUtilityAsPaid}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

// Sub-component for Rent Payments View
const RentPaymentsView = ({ 
  payments, stats, searchTerm, setSearchTerm, statusFilter, setStatusFilter, 
  filterMonth, setFilterMonth, availableMonths, onMarkPaid, onRefresh 
}: any) => {
  return (
    <>
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search apartments, renters or buildings..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Month</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {availableMonths.map((month: any) => (
                <option key={month.value} value={month.value}>
                  {month.display_month}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="confirmed">Verified</option>
              <option value="pending_review">Pending Review</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 h-10"
            >
              <FaSync />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Rent Payments Table */}
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
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaReceipt className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">No rent payments found</p>
                      <p className="text-slate-400 text-sm mt-1">Try generating rent bills or adjust filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
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
                          <p className="text-xs text-slate-500">{payment.building_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaRupeeSign className="text-slate-400" />
                        <p className="font-bold text-slate-900 text-lg">{payment.amount}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {new Date(payment.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
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
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        payment.status === 'overdue' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        payment.confirmation_status === 'verified' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {payment.confirmation_status || 'Pending Review'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {payment.status !== 'paid' && (
                          <button
                            onClick={() => onMarkPaid(payment.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1"
                          >
                            <FaCheck className="text-xs" />
                            Mark Paid
                          </button>
                        )}
                        <button 
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          onClick={() => console.log(`Viewing details for ${payment.renter_name}`)}
                        >
                          <FaEye />
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
    </>
  );
};

// Sub-component for Utility Bills View
const UtilityBillsView = ({ 
  bills, stats, searchTerm, setSearchTerm, statusFilter, setStatusFilter, onMarkPaid, onRefresh 
}: any) => {
  const getBillTypeIcon = (type: string) => {
    switch (type) {
      case 'electricity': return <FaBolt className="text-yellow-500" />;
      case 'water': return <FaTint className="text-blue-500" />;
      case 'gas': return '🔥';
      case 'security': return <FaShieldAlt className="text-gray-500" />;
      case 'cleaning': return <FaBroom className="text-green-500" />;
      default: return <FaFileInvoice className="text-gray-500" />;
    }
  };

  const getBillTypeColor = (type: string) => {
    switch (type) {
      case 'electricity': return 'bg-yellow-50 border-yellow-200';
      case 'water': return 'bg-blue-50 border-blue-200';
      case 'gas': return 'bg-orange-50 border-orange-200';
      case 'security': return 'bg-gray-50 border-gray-200';
      case 'cleaning': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search utility bills..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 h-10"
            >
              <FaSync />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Utility Bills Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Utility Bill Details
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
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaFileInvoice className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">No utility bills found</p>
                      <p className="text-slate-400 text-sm mt-1">Add utility bills to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bills.map((bill: any) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getBillTypeColor(bill.type)}`}>
                          {getBillTypeIcon(bill.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 capitalize">
                            {bill.type}
                          </p>
                          <p className="text-sm text-slate-500">{bill.month || 'Monthly'}</p>
                          {bill.provider && (
                            <p className="text-xs text-slate-500 mt-1">{bill.provider}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-slate-400" />
                        <p className="font-medium text-slate-900">{bill.building_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaRupeeSign className="text-slate-400" />
                        <p className="font-bold text-slate-900 text-lg">{bill.amount.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(bill.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </p>
                          {bill.status === 'overdue' && (
                            <p className="text-xs text-rose-600 font-medium mt-1">Overdue</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        bill.status === 'overdue' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => onMarkPaid(bill.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1"
                          >
                            <FaCheck className="text-xs" />
                            Mark Paid
                          </button>
                        )}
                        <button 
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          onClick={() => console.log(`Viewing details for ${bill.type} bill`)}
                        >
                          <FaEye />
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
    </>
  );
};

export default ManagerBills;