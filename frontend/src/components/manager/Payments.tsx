// src/components/manager/ManagerPayments.tsx
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
  FaCreditCard,
  FaBuilding,
  FaFileInvoice,
  FaExclamationCircle,
  FaSync,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Payment {
  id: number;
  month: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  display_status: 'pending' | 'overdue' | 'paid';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  transaction_id?: string;
  renter_name: string;
  renter_email: string;
  renter_phone: string;
  apartment_number: string;
  building_name: string;
  confirmation_status?: string;
  verified_at?: string;
}

interface PaymentSummary {
  total_pending: number;
  total_overdue: number;
  total_paid: number;
  amount_pending: number;
  amount_overdue: number;
  amount_paid: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ManagerPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_pending: 0,
    total_overdue: 0,
    total_paid: 0,
    amount_pending: 0,
    amount_overdue: 0,
    amount_paid: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: 'all',
    status: 'all',
    renter_id: 'all'
  });
  const [availableMonths, setAvailableMonths] = useState<{value: string, display_month: string}[]>([]);
  const [availableRenters, setAvailableRenters] = useState<{id: number, name: string}[]>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'month' | 'amount' | 'renter_name'>('month');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchPayments();
    fetchFilters();
  }, [filters, pagination.page, sortField, sortDirection]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.month !== 'all' && { month: filters.month }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.renter_id !== 'all' && { renter_id: filters.renter_id })
      });
      
      const response = await axios.get(`${API_URL}/manager/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPayments(response.data.data.payments || []);
        setSummary(response.data.data.summary || {
          total_pending: 0,
          total_overdue: 0,
          total_paid: 0,
          amount_pending: 0,
          amount_overdue: 0,
          amount_paid: 0
        });
        setPagination(response.data.data.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const monthsResponse = await axios.get(`${API_URL}/manager/payments/months`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (monthsResponse.data.success) {
        setAvailableMonths(monthsResponse.data.months || []);
      }
      
      const rentersResponse = await axios.get(`${API_URL}/manager/renters?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (rentersResponse.data.success) {
        setAvailableRenters(
          rentersResponse.data.data.renters?.map((r: any) => ({
            id: r.id,
            name: r.name
          })) || []
        );
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleVerifyPayment = async (paymentId: number, status: 'verified' | 'rejected') => {
    try {
      setVerifyingId(paymentId);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/manager/payments/${paymentId}/verify`, {
        status,
        notes: verificationNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Payment ${status} successfully!`);
        setShowVerificationModal(false);
        setSelectedPayment(null);
        setVerificationNote('');
        fetchPayments();
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSort = (field: 'month' | 'amount' | 'renter_name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (payment: Payment) => {
    if (payment.display_status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
          <FaExclamationCircle />
          Overdue
        </span>
      );
    }
    if (payment.display_status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
          <FaClock />
          Pending
        </span>
      );
    }
    if (payment.status === 'paid') {
      if (payment.confirmation_status === 'verified') {
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            <FaCheckCircle />
            Verified
          </span>
        );
      }
      if (payment.confirmation_status === 'pending_review') {
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            <FaClock />
            Pending Verification
          </span>
        );
      }
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
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
          <h1 className="text-2xl font-bold text-slate-900">Payments Management</h1>
          <p className="text-slate-600">View and manage all rent payments</p>
        </div>
        <button
          onClick={fetchPayments}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
        >
          <FaSync />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Payments</p>
              <p className="text-2xl font-bold text-amber-600">{summary.total_pending}</p>
              <p className="text-sm text-slate-500 mt-1">
                Amount: {formatCurrency(summary.amount_pending)}
              </p>
            </div>
            <div className="p-4 bg-amber-100 rounded-full">
              <FaClock className="text-2xl text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue Payments</p>
              <p className="text-2xl font-bold text-rose-600">{summary.total_overdue}</p>
              <p className="text-sm text-slate-500 mt-1">
                Amount: {formatCurrency(summary.amount_overdue)}
              </p>
            </div>
            <div className="p-4 bg-rose-100 rounded-full">
              <FaExclamationCircle className="text-2xl text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Collected</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.total_paid}</p>
              <p className="text-sm text-slate-500 mt-1">
                Amount: {formatCurrency(summary.amount_paid)}
              </p>
            </div>
            <div className="p-4 bg-emerald-100 rounded-full">
              <FaMoneyBillWave className="text-2xl text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Months</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.display_month}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending (Current Month)</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Renter</label>
            <select
              value={filters.renter_id}
              onChange={(e) => setFilters({ ...filters, renter_id: e.target.value, page: 1 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Renters</option>
              {availableRenters.map(renter => (
                <option key={renter.id} value={renter.id}>{renter.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th 
                  className="p-4 text-left text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('renter_name')}
                >
                  <div className="flex items-center gap-1">
                    Renter
                    {sortField === 'renter_name' && (
                      sortDirection === 'asc' ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Unit</th>
                <th 
                  className="p-4 text-left text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('month')}
                >
                  <div className="flex items-center gap-1">
                    Month
                    {sortField === 'month' && (
                      sortDirection === 'asc' ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-left text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {sortField === 'amount' && (
                      sortDirection === 'asc' ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Due Date</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <FaExclamationCircle className="text-3xl text-slate-300 mx-auto mb-2" />
                    <p className="text-lg">No payments found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900">{payment.renter_name}</p>
                        <p className="text-sm text-slate-500">{payment.renter_email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{payment.apartment_number}</p>
                      <p className="text-sm text-slate-500">{payment.building_name}</p>
                    </td>
                    <td className="p-4">
                      {new Date(payment.month).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="p-4 font-bold">{formatCurrency(payment.amount)}</td>
                    <td className="p-4">
                      {new Date(payment.due_date).toLocaleDateString()}
                      {payment.paid_at && (
                        <p className="text-xs text-emerald-600">
                          Paid: {new Date(payment.paid_at).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(payment)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {payment.status === 'paid' && payment.confirmation_status === 'pending_review' && (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowVerificationModal(true);
                            }}
                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-slate-100 rounded-lg"
                          title="View Details"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowVerificationModal(true);
                          }}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} payments
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Verify Payment</h3>
              
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-slate-600">Renter: {selectedPayment.renter_name}</p>
                <p className="text-sm text-slate-600">Amount: {formatCurrency(selectedPayment.amount)}</p>
                <p className="text-sm text-slate-600">
                  Month: {new Date(selectedPayment.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                {selectedPayment.transaction_id && (
                  <p className="text-sm text-slate-600">Transaction ID: {selectedPayment.transaction_id}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Notes
                </label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Add any notes about this payment..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    setSelectedPayment(null);
                    setVerificationNote('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifyPayment(selectedPayment.id, 'rejected')}
                  disabled={verifyingId === selectedPayment.id}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleVerifyPayment(selectedPayment.id, 'verified')}
                  disabled={verifyingId === selectedPayment.id}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPayments;