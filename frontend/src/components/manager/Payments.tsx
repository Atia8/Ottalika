import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaEye,
  FaDownload,
  FaCalendar,
  FaUser,
  FaHome,
  FaCreditCard
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Payment {
  id: string;
  renterName: string;
  apartment: string;
  type: string;
  amount: number;
  month: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  submittedAt: string;
}

const ManagerPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/payments/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const paymentsData = response.data.data.pendingPayments || [];
        setPayments(paymentsData);
        
        // Calculate stats
        const totalAmount = paymentsData.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
        const totalCount = paymentsData.length;
        const pending = paymentsData.filter(p => p.status === 'pending_verification').length;
        const verified = paymentsData.filter(p => p.status === 'verified').length;
        const rejected = paymentsData.filter(p => p.status === 'rejected').length;
        
        setStats({ totalAmount, totalCount, pending, verified, rejected });
      } else {
        toast.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Error loading payments data');
      
      // Mock data for testing
      const mockPayments: Payment[] = [
        {
          id: '1',
          renterName: 'Bob Johnson',
          apartment: '103',
          type: 'rent',
          amount: 1100,
          month: 'January 2024',
          paymentDate: '2024-01-05',
          paymentMethod: 'bank_transfer',
          reference: 'TRX-123456',
          status: 'pending_verification',
          submittedAt: '2024-01-05T10:30:00Z'
        },
        {
          id: '2',
          renterName: 'Charlie Wilson',
          apartment: '202',
          type: 'rent',
          amount: 1300,
          month: 'December 2023',
          paymentDate: '2024-01-04',
          paymentMethod: 'cash',
          reference: 'CASH-789',
          status: 'pending_verification',
          submittedAt: '2024-01-04T14:45:00Z'
        },
        {
          id: '3',
          renterName: 'John Doe',
          apartment: '101',
          type: 'late_fee',
          amount: 50,
          month: 'January 2024',
          paymentDate: '2024-01-06',
          paymentMethod: 'mobile_banking',
          reference: 'MB-456789',
          status: 'verified',
          submittedAt: '2024-01-06T09:15:00Z'
        },
        {
          id: '4',
          renterName: 'Jane Smith',
          apartment: '102',
          type: 'rent',
          amount: 1200,
          month: 'January 2024',
          paymentDate: '2024-01-05',
          paymentMethod: 'online',
          reference: 'ONL-987654',
          status: 'rejected',
          submittedAt: '2024-01-05T11:20:00Z'
        }
      ];
      
      setPayments(mockPayments);
      setStats({
        totalAmount: mockPayments.reduce((sum, p) => sum + p.amount, 0),
        totalCount: mockPayments.length,
        pending: mockPayments.filter(p => p.status === 'pending_verification').length,
        verified: mockPayments.filter(p => p.status === 'verified').length,
        rejected: mockPayments.filter(p => p.status === 'rejected').length
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    if (window.confirm('Verify this payment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/manager/payments/${paymentId}/verify`, {
          status: 'verified',
          notes: 'Payment verified successfully'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Payment verified successfully!');
        fetchPayments();
      } catch (error) {
        console.error('Failed to verify payment:', error);
        toast.error('Failed to verify payment');
      }
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/manager/payments/${paymentId}/verify`, {
          status: 'rejected',
          notes: reason
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Payment rejected!');
        fetchPayments();
      } catch (error) {
        console.error('Failed to reject payment:', error);
        toast.error('Failed to reject payment');
      }
    }
  };

  const handleExportPayments = () => {
    const csvContent = [
      ['Renter', 'Apartment', 'Type', 'Amount', 'Month', 'Payment Date', 'Method', 'Reference', 'Status'],
      ...payments.map(payment => [
        payment.renterName,
        payment.apartment,
        payment.type,
        `₹${payment.amount}`,
        payment.month,
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.paymentMethod,
        payment.reference,
        payment.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Payments exported successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      case 'pending_verification': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return '🏦';
      case 'cash': return '💵';
      case 'mobile_banking': return '📱';
      case 'online': return '🌐';
      default: return '💳';
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (statusFilter === 'all') return true;
    return payment.status === statusFilter;
  }).filter(payment => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      payment.renterName.toLowerCase().includes(term) ||
      payment.apartment.toLowerCase().includes(term) ||
      payment.reference.toLowerCase().includes(term) ||
      payment.type.toLowerCase().includes(term)
    );
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
          <h1 className="text-2xl font-bold text-slate-900">Payment Verification</h1>
          <p className="text-slate-600">Verify and manage payment transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPayments}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FaDownload />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Pending</p>
              <p className="text-2xl font-bold mt-2">₹{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-600 mt-1">{stats.totalCount} transactions</p>
            </div>
            <FaMoneyBillWave className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Verification</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">{stats.pending}</p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Verified</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.verified}</p>
            </div>
            <FaCheckCircle className="text-2xl text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Rejected</p>
              <p className="text-2xl font-bold mt-2 text-rose-600">{stats.rejected}</p>
            </div>
            <FaTimesCircle className="text-2xl text-rose-500" />
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
                placeholder="Search by renter name, apartment, or reference..."
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
              <option value="pending_verification">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <FaFilter />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Renter & Apartment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Payment Info
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
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">{payment.type}</p>
                        <p className="text-sm text-slate-600">{payment.month}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <FaCalendar />
                          <span>
                            Paid: {new Date(payment.paymentDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <FaUser className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{payment.renterName}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <FaHome className="text-xs" />
                            <span>Apartment {payment.apartment}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-lg text-slate-900">₹{payment.amount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                        <div>
                          <p className="font-medium text-slate-900 capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-slate-600">{payment.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {payment.status === 'pending_verification' && (
                          <>
                            <button
                              onClick={() => handleVerifyPayment(payment.id)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1"
                            >
                              <FaCheck />
                              Verify
                            </button>
                            <button
                              onClick={() => handleRejectPayment(payment.id)}
                              className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm flex items-center gap-1"
                            >
                              <FaTimes />
                              Reject
                            </button>
                          </>
                        )}
                        <button 
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          title="View Details"
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

      {/* Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4">Verification Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Pending Verification</span>
              <span className="font-semibold text-amber-600">{stats.pending} payments</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Total Amount Pending</span>
              <span className="font-semibold text-lg">₹{stats.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Oldest Pending</span>
              <span className="font-semibold">
                {payments.length > 0 
                  ? new Date(Math.min(...payments.map(p => new Date(p.submittedAt).getTime()))).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              <FaCreditCard className="text-violet-600" />
              View All Payment History
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              <FaMoneyBillWave className="text-violet-600" />
              Send Payment Reminders
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              <FaDownload className="text-violet-600" />
              Generate Payment Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPayments;