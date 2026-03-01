// src/components/renter/RenterPayments.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaMoneyBillWave,
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
  FaSync,
  FaArrowRight,
  FaEye
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Payment {
  id: number;
  month: string;
  amount: number;
  status: string;
  display_status: 'due_now' | 'overdue' | 'upcoming' | 'paid';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  transaction_id?: string;
  verification_status?: string;
  can_pay: boolean;
}

interface PaymentSummary {
  total_due: number;
  overdue_count: number;
  due_now_count: number;
  upcoming_count: number;
  paid_count: number;
}

const RenterPayments = () => {
  const [payments, setPayments] = useState<{
    overdue: Payment[];
    due_now: Payment[];
    upcoming: Payment[];
    paid: Payment[];
    summary: PaymentSummary;
    current_month: string;
  }>({
    overdue: [],
    due_now: [],
    upcoming: [],
    paid: [],
    summary: {
      total_due: 0,
      overdue_count: 0,
      due_now_count: 0,
      upcoming_count: 0,
      paid_count: 0
    },
    current_month: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<Payment | null>(null);

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
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Error loading payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!selectedPayment) {
      toast.error('No payment selected');
      return;
    }
    
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // DEBUG: Log the selected payment object
    console.log('🔍 DEBUG - Selected Payment:', {
      id: selectedPayment.id,
      type: typeof selectedPayment.id,
      fullObject: selectedPayment
    });

    // Make sure payment_id is a number
    const paymentId = Number(selectedPayment.id);
    
    if (isNaN(paymentId)) {
      console.error('❌ Invalid payment ID:', selectedPayment.id);
      toast.error('Invalid payment ID');
      return;
    }

    const payload = {
      payment_id: paymentId,  // Ensure it's a number
      payment_method: paymentMethod,
      ...(transactionId && transactionId.trim() ? { transaction_id: transactionId.trim() } : {})
    };

    console.log('📦 DEBUG - Sending payload:', JSON.stringify(payload, null, 2));

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/renter/payments/make`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success('Payment submitted successfully!');
        setShowPaymentModal(false);
        setSelectedPayment(null);
        setPaymentMethod('bkash');
        setTransactionId('');
        fetchPayments();
      }
    } catch (error: any) {
      console.error('❌ Payment error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      const errorMessage = error.response?.data?.message || 'Failed to submit payment';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedDetails(payment);
    setShowDetails(true);
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Payments</h1>
          <p className="text-slate-600">Manage your rent payments</p>
        </div>
        <button
          onClick={fetchPayments}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <FaSync />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Due</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(payments.summary.total_due)}
              </p>
            </div>
            <FaMoneyBillWave className="text-2xl text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold text-rose-600">{payments.summary.overdue_count}</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-rose-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Current Month</p>
              <p className="text-2xl font-bold text-blue-600">{payments.summary.due_now_count}</p>
            </div>
            <FaClock className="text-2xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Paid History</p>
              <p className="text-2xl font-bold text-emerald-600">{payments.summary.paid_count}</p>
            </div>
            <FaCheckCircle className="text-2xl text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Overdue Payments Section */}
      {payments.overdue.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-rose-50 px-6 py-4 border-b border-rose-200">
            <h2 className="text-lg font-bold text-rose-800 flex items-center gap-2">
              <FaExclamationTriangle />
              Overdue Payments - Please Pay Immediately
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {payments.overdue.map(payment => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onPay={() => {
                  setSelectedPayment(payment);
                  setShowPaymentModal(true);
                }}
                onViewDetails={() => handleViewDetails(payment)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current Month Due Section */}
      {payments.due_now.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
            <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2">
              <FaClock />
              Current Month Due
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {payments.due_now.map(payment => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onPay={() => {
                  setSelectedPayment(payment);
                  setShowPaymentModal(true);
                }}
                onViewDetails={() => handleViewDetails(payment)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Payments Section */}
      {payments.upcoming.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaCalendar />
              Upcoming Payments
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              These payments will be available on the 1st of each month
            </p>
          </div>
          <div className="divide-y divide-slate-200">
            {payments.upcoming.map(payment => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onViewDetails={() => handleViewDetails(payment)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paid History Section */}
      {payments.paid.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
            <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
              <FaCheckCircle />
              Payment History
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {payments.paid.map(payment => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onViewDetails={() => handleViewDetails(payment)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Make Payment</h3>
              
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-slate-600">Payment For:</p>
                <p className="font-bold text-lg">{formatDate(selectedPayment.month)}</p>
                <p className="text-2xl font-bold text-violet-600 mt-2">
                  {formatCurrency(selectedPayment.amount)}
                </p>
                {selectedPayment.display_status === 'overdue' && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle />
                    This payment is overdue
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'bkash', label: 'bKash', icon: <FaMobileAlt className="text-pink-600" /> },
                      { value: 'nagad', label: 'Nagad', icon: <FaMobileAlt className="text-orange-600" /> },
                      { value: 'bank_transfer', label: 'Bank', icon: <FaUniversity className="text-blue-600" /> },
                      { value: 'cash', label: 'Cash', icon: <FaMoneyBillWave className="text-green-600" /> }
                    ].map(method => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                          paymentMethod === method.value
                            ? 'border-violet-600 bg-violet-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {method.icon}
                        <span className="capitalize">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID if applicable"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    For cash payments, you can leave this blank
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                    setPaymentMethod('bkash');
                    setTransactionId('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakePayment}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Payment Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-600">Month</p>
                    <p className="font-medium">{formatDate(selectedDetails.month)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-600">Amount</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedDetails.amount)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-600">Due Date</p>
                    <p className="font-medium">{formatDate(selectedDetails.due_date)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-600">Status</p>
                    <p className={`font-medium ${
                      selectedDetails.display_status === 'paid' ? 'text-emerald-600' :
                      selectedDetails.display_status === 'overdue' ? 'text-rose-600' :
                      selectedDetails.display_status === 'due_now' ? 'text-amber-600' :
                      'text-slate-600'
                    }`}>
                      {selectedDetails.display_status.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                {selectedDetails.paid_at && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Payment Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Paid On</p>
                          <p className="font-medium">{formatDate(selectedDetails.paid_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Method</p>
                          <p className="font-medium capitalize">{selectedDetails.payment_method || 'N/A'}</p>
                        </div>
                        {selectedDetails.transaction_id && (
                          <div className="col-span-2">
                            <p className="text-sm text-slate-600">Transaction ID</p>
                            <p className="font-mono text-sm">{selectedDetails.transaction_id}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedDetails.verification_status && (
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <p className="text-sm text-amber-700">
                          Verification Status: {selectedDetails.verification_status.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Payment Row Component - FIXED with proper props interface
interface PaymentRowProps {
  payment: Payment;
  onPay?: () => void;
  onViewDetails: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

const PaymentRow = ({ 
  payment, 
  onPay, 
  onViewDetails, 
  formatCurrency, 
  formatDate 
}: PaymentRowProps) => {
  // Determine status based on payment.display_status
  const isPaid = payment.display_status === 'paid';
  const isUpcoming = payment.display_status === 'upcoming';
  const isOverdue = payment.display_status === 'overdue';
  const isDueNow = payment.display_status === 'due_now';

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-24">
              <p className="font-medium text-slate-900">
                {new Date(payment.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="w-24">
              <p className="font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="w-32">
              <p className="text-sm text-slate-600">Due: {formatDate(payment.due_date)}</p>
            </div>
            <div className="w-32">
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  <FaCheckCircle className="text-xs" />
                  Paid
                </span>
              ) : isUpcoming ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                  <FaCalendar className="text-xs" />
                  Upcoming
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">
                  <FaExclamationTriangle className="text-xs" />
                  Overdue
                </span>
              ) : isDueNow ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  <FaClock className="text-xs" />
                  Due Now
                </span>
              ) : null}
            </div>
            {payment.verification_status === 'pending_review' && (
              <div className="w-32">
                <span className="text-xs text-amber-600">Pending verification</span>
              </div>
            )}
            <div>
              <button
                onClick={onViewDetails}
                className="p-2 hover:bg-slate-100 rounded-lg"
                title="View Details"
              >
                <FaEye className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
        {!isPaid && !isUpcoming && onPay && (
          <button
            onClick={onPay}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm flex items-center gap-2"
          >
            Pay Now
            <FaArrowRight className="text-xs" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RenterPayments;