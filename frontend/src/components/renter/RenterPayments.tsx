// src/components/renter/RenterPayments.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaMoneyBillWave,
  FaHistory,
  FaReceipt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCalendar,
  FaDownload,
  FaPrint,
  FaShare,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaSearch,
  FaFilter,
  FaSync
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Payment {
  id: number;
  month: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  transaction_id?: string;
  verification_status?: string;
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  nextPayment: number;
  nextDueDate: string;
}

const RenterPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    nextPayment: 0,
    nextDueDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/renter/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const paymentsData = response.data.data.payments || [];
        
        // Convert amount strings to numbers and clean data
        const cleanedPayments = paymentsData.map((payment: any) => ({
          ...payment,
          amount: cleanAndConvertAmount(payment.amount)
        }));
        
        setPayments(cleanedPayments);
        
        // Calculate stats
        const totalPaid = cleanedPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const totalPending = cleanedPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const totalOverdue = cleanedPayments
          .filter(p => p.status === 'overdue')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const nextPayment = cleanedPayments
          .find(p => p.status === 'pending')?.amount || 0;
        
        const nextDueDate = cleanedPayments
          .find(p => p.status === 'pending')?.due_date || '';
        
        setStats({
          totalPaid,
          totalPending,
          totalOverdue,
          nextPayment,
          nextDueDate
        });
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Error loading payment data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to clean and convert amount
  const cleanAndConvertAmount = (amount: any): number => {
    if (amount === null || amount === undefined) {
      return 0;
    }
    
    // If it's already a number, return it
    if (typeof amount === 'number') {
      return amount;
    }
    
    // If it's a string, clean it
    if (typeof amount === 'string') {
      // Remove all non-numeric characters except decimal point
      const cleaned = amount.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    
    // For any other type, try to convert
    const num = Number(amount);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to format amount for display
  const formatAmountForDisplay = (amount: any): string => {
    const numAmount = cleanAndConvertAmount(amount);
    
    // Format without decimals for whole numbers
    if (numAmount % 1 === 0) {
      return numAmount.toLocaleString('en-BD');
    } else {
      return numAmount.toLocaleString('en-BD', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  };

  const handleMakePayment = async () => {
    if (!selectedMonth || !paymentAmount || !paymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/renter/payments/make`, {
        month: selectedMonth,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_id: transactionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Payment submitted successfully!');
        setShowPaymentModal(false);
        resetPaymentForm();
        fetchPayments();
      }
    } catch (error) {
      console.error('Failed to submit payment:', error);
      toast.error('Failed to submit payment');
    }
  };

  const resetPaymentForm = () => {
    setSelectedMonth('');
    setPaymentAmount('');
    setPaymentMethod('bkash');
    setTransactionId('');
  };

  const handleDownloadReceipt = (paymentId: number) => {
    // Simulate receipt download
    toast.success('Receipt downloaded successfully!');
  };

  const handleShareReceipt = (paymentId: number) => {
    // Simulate sharing
    toast.success('Receipt shared!');
  };

  const handlePrintReceipt = (paymentId: number) => {
    // Simulate printing
    window.print();
    toast.success('Receipt sent to printer!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <FaCheckCircle className="text-emerald-600" />;
      case 'overdue': return <FaExclamationTriangle className="text-rose-600" />;
      default: return <FaClock className="text-amber-600" />;
    }
  };

  const getVerificationColor = (status?: string) => {
    switch (status) {
      case 'verified': return 'bg-emerald-100 text-emerald-700';
      case 'pending_review': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
    if (searchTerm && !payment.month.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const upcomingMonths = [
    { value: '2025-01-01', label: 'January 2025' },
    { value: '2025-02-01', label: 'February 2025' },
    { value: '2025-03-01', label: 'March 2025' },
    { value: '2025-04-01', label: 'April 2025' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Payments</h1>
          <p className="text-slate-600">Manage your rent payments and history</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
        >
          <FaMoneyBillWave />
          Make Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                ৳{formatAmountForDisplay(stats.totalPaid)}
              </p>
            </div>
            <FaCheckCircle className="text-2xl text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">
                ৳{formatAmountForDisplay(stats.totalPending)}
              </p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold text-rose-600 mt-2">
                ৳{formatAmountForDisplay(stats.totalOverdue)}
              </p>
            </div>
            <FaExclamationTriangle className="text-2xl text-rose-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Next Due</p>
              <p className="text-lg font-bold text-slate-900 mt-2">
                {stats.nextDueDate ? new Date(stats.nextDueDate).toLocaleDateString('en-US', { 
                  day: 'numeric',
                  month: 'short'
                }) : 'N/A'}
              </p>
              <p className="text-xs text-slate-500">৳{formatAmountForDisplay(stats.nextPayment)}</p>
            </div>
            <FaCalendar className="text-2xl text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              onClick={fetchPayments}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FaSync />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Methods Quick Select */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Quick Payment Methods</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaMobileAlt className="text-xl text-green-600" />
              <span className="font-medium">bKash</span>
              <span className="text-sm text-slate-500">016XXXXXXXX</span>
            </div>
          </button>
          <button className="p-4 border rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaMobileAlt className="text-xl text-red-600" />
              <span className="font-medium">Nagad</span>
              <span className="text-sm text-slate-500">017XXXXXXXX</span>
            </div>
          </button>
          <button className="p-4 border rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaUniversity className="text-xl text-blue-600" />
              <span className="font-medium">Bank Transfer</span>
              <span className="text-sm text-slate-500">DBBL XXXXXXX</span>
            </div>
          </button>
          <button className="p-4 border rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaCreditCard className="text-xl text-purple-600" />
              <span className="font-medium">Card Payment</span>
              <span className="text-sm text-slate-500">Visa/Mastercard</span>
            </div>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Month</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Amount</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Due Date</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Verification</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaReceipt className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">No payments found</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-lg">
                          <FaCalendar className="text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium">{payment.month}</p>
                          {payment.paid_at && (
                            <p className="text-xs text-slate-500">
                              Paid: {new Date(payment.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg">৳</span>
                        <p className="text-xl font-bold text-slate-900">
                          {formatAmountForDisplay(payment.amount)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-slate-400" />
                        <span>{new Date(payment.due_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {payment.verification_status ? (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getVerificationColor(payment.verification_status)}`}>
                          {payment.verification_status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          Not submitted
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {payment.status === 'paid' && (
                          <>
                            <button
                              onClick={() => handleDownloadReceipt(payment.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Download Receipt"
                            >
                              <FaDownload />
                            </button>
                            <button
                              onClick={() => handlePrintReceipt(payment.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Print Receipt"
                            >
                              <FaPrint />
                            </button>
                            <button
                              onClick={() => handleShareReceipt(payment.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Share Receipt"
                            >
                              <FaShare />
                            </button>
                          </>
                        )}
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedMonth(payment.month);
                              setPaymentAmount(payment.amount.toString());
                              setShowPaymentModal(true);
                            }}
                            className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
                          >
                            Pay Now
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

      {/* Payment History Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaHistory className="text-violet-600" />
            Payment History Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Total Payments Made</span>
              <span className="font-bold text-slate-900">{payments.filter(p => p.status === 'paid').length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-700">On-time Payments</span>
              <span className="font-bold text-emerald-700">
                {payments.filter(p => 
                  p.status === 'paid' && 
                  p.paid_at && 
                  new Date(p.paid_at) <= new Date(p.due_date)
                ).length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-200">
              <span className="text-rose-700">Late Payments</span>
              <span className="font-bold text-rose-700">
                {payments.filter(p => 
                  p.status === 'paid' && 
                  p.paid_at && 
                  new Date(p.paid_at) > new Date(p.due_date)
                ).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Quick Tips</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-emerald-600 mt-1" />
              <span className="text-slate-700">Pay before due date to avoid late fees</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-emerald-600 mt-1" />
              <span className="text-slate-700">Keep transaction IDs for future reference</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-emerald-600 mt-1" />
              <span className="text-slate-700">Download receipts for tax purposes</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-emerald-600 mt-1" />
              <span className="text-slate-700">Contact manager for payment issues</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Make Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select Month</option>
                    {upcomingMonths.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount (৳)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['bkash', 'nagad', 'bank_transfer', 'cash'].map(method => (
                      <label
                        key={method}
                        className={`p-3 border rounded-lg cursor-pointer flex items-center justify-center gap-2 ${
                          paymentMethod === method 
                            ? 'border-violet-600 bg-violet-50' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="hidden"
                        />
                        <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transaction ID / Reference
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakePayment}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenterPayments;