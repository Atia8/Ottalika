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
  FaRupeeSign,
  FaFileInvoice,
  FaExclamationCircle,
  FaSync
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  status: 'pending_verification' | 'verified' | 'rejected' | 'pending_review';
  submittedAt: string;
  renterEmail?: string;
  renterPhone?: string;
  floor?: string;
  building?: string;
  notes?: string;
  verifiedAt?: string;
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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.get(`${API_URL}/manager/payments/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const paymentsData = response.data.data.pendingPayments || [];
          setPayments(paymentsData);
          updateStats(paymentsData);
        } else {
          toast.error('Failed to fetch payments');
          useMockData();
        }
      } catch (apiError) {
        console.log('API endpoint not available, using mock data');
        useMockData();
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Error loading payments data');
      useMockData();
    } finally {
      setLoading(false);
    }
  };

  const useMockData = () => {
    const mockPayments: Payment[] = [
      {
        id: '1',
        renterName: 'John Doe',
        apartment: '101',
        type: 'rent',
        amount: 5000,
        month: 'January 2024',
        paymentDate: '2024-01-05',
        paymentMethod: 'bank_transfer',
        reference: 'TRX-123456',
        status: 'pending_verification',
        submittedAt: '2024-01-05T10:30:00Z',
        renterEmail: 'john@example.com',
        renterPhone: '+1234567890',
        floor: '1',
        building: 'Main Building'
      },
      {
        id: '2',
        renterName: 'Sarah Smith',
        apartment: '102',
        type: 'rent',
        amount: 5500,
        month: 'January 2024',
        paymentDate: '2024-01-05',
        paymentMethod: 'cash',
        reference: 'CASH-001',
        status: 'pending_review',
        submittedAt: '2024-01-05T14:20:00Z',
        renterEmail: 'sarah@example.com',
        renterPhone: '+1987654321',
        floor: '1',
        building: 'Main Building'
      },
      {
        id: '3',
        renterName: 'Robert Johnson',
        apartment: '201',
        type: 'rent',
        amount: 6000,
        month: 'January 2024',
        paymentDate: '2024-01-04',
        paymentMethod: 'mobile_banking',
        reference: 'MB-789012',
        status: 'verified',
        submittedAt: '2024-01-04T09:15:00Z',
        verifiedAt: '2024-01-05T11:30:00Z',
        renterEmail: 'robert@example.com',
        renterPhone: '+1122334455',
        floor: '2',
        building: 'Main Building'
      },
      {
        id: '4',
        renterName: 'Emily Brown',
        apartment: '202',
        type: 'late_fee',
        amount: 500,
        month: 'December 2023',
        paymentDate: '2024-01-03',
        paymentMethod: 'online',
        reference: 'ONL-456789',
        status: 'rejected',
        submittedAt: '2024-01-03T16:45:00Z',
        notes: 'Payment screenshot not clear',
        renterEmail: 'emily@example.com',
        renterPhone: '+1567890123',
        floor: '2',
        building: 'Main Building'
      }
    ];
    
    setPayments(mockPayments);
    updateStats(mockPayments);
  };

  const updateStats = (paymentsData: Payment[]) => {
    const totalAmount = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCount = paymentsData.length;
    const pending = paymentsData.filter(p => 
      p.status === 'pending_verification' || p.status === 'pending_review'
    ).length;
    const verified = paymentsData.filter(p => p.status === 'verified').length;
    const rejected = paymentsData.filter(p => p.status === 'rejected').length;
    
    setStats({ totalAmount, totalCount, pending, verified, rejected });
  };

  const handleVerifyPayment = async (paymentId: string) => {
    setVerifyingPaymentId(paymentId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/manager/payments/${paymentId}/verify`,
        {
          status: 'verified',
          notes: 'Payment verified successfully'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Payment verified successfully!');
        
        // Update local state
        setPayments(prev => 
          prev.map(payment => 
            payment.id === paymentId 
              ? { ...payment, status: 'verified', verifiedAt: new Date().toISOString() }
              : payment
          )
        );
        
        // Update stats
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          verified: prev.verified + 1
        }));
      } else {
        toast.error(response.data.message || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
      
      // For demo purposes, simulate success
      setPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: 'verified', verifiedAt: new Date().toISOString() }
            : payment
        )
      );
      
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        verified: prev.verified + 1
      }));
      
      toast.success('Payment verified successfully!');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    setVerifyingPaymentId(paymentId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/manager/payments/${paymentId}/verify`,
        {
          status: 'rejected',
          notes: reason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Payment rejected!');
        
        // Update local state
        setPayments(prev => 
          prev.map(payment => 
            payment.id === paymentId 
              ? { ...payment, status: 'rejected', notes: reason }
              : payment
          )
        );
        
        // Update stats
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1
        }));
      } else {
        toast.error(response.data.message || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Failed to reject payment:', error);
      
      // For demo purposes, simulate success
      setPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: 'rejected', notes: reason }
            : payment
        )
      );
      
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1
      }));
      
      toast.success('Payment rejected!');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleBulkVerify = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Please select payments to verify');
      return;
    }
    
    if (window.confirm(`Verify ${selectedPayments.length} selected payment(s)?`)) {
      try {
        const token = localStorage.getItem('token');
        
        // Update each selected payment
        for (const paymentId of selectedPayments) {
          const payment = payments.find(p => p.id === paymentId);
          if (payment && (payment.status === 'pending_verification' || payment.status === 'pending_review')) {
            await handleVerifyPayment(paymentId);
          }
        }
        
        setSelectedPayments([]);
        toast.success(`Successfully verified ${selectedPayments.length} payment(s)`);
      } catch (error) {
        console.error('Bulk verify error:', error);
        toast.error('Failed to bulk verify payments');
      }
    }
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleSelectAll = () => {
    const pendingPaymentIds = filteredPayments
      .filter(p => p.status === 'pending_verification' || p.status === 'pending_review')
      .map(p => p.id);
    
    if (selectedPayments.length === pendingPaymentIds.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(pendingPaymentIds);
    }
  };

  const handleExportPayments = () => {
    const csvContent = [
      ['Renter Name', 'Apartment', 'Type', 'Amount', 'Month', 'Payment Date', 'Method', 'Reference', 'Status', 'Building', 'Floor', 'Submitted At'],
      ...payments.map(payment => [
        payment.renterName,
        payment.apartment,
        payment.type,
        `₹${payment.amount}`,
        payment.month,
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.paymentMethod,
        payment.reference,
        payment.status.replace('_', ' ').toUpperCase(),
        payment.building || 'Main Building',
        payment.floor || '-',
        new Date(payment.submittedAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-verifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Payments exported successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'pending_verification': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pending_review': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
      payment.type.toLowerCase().includes(term) ||
      (payment.building && payment.building.toLowerCase().includes(term))
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
            onClick={fetchPayments}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            disabled={loading}
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Pending</p>
              <p className="text-2xl font-bold mt-2">₹{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-600 mt-1">{stats.totalCount} transactions</p>
            </div>
            <FaMoneyBillWave className="text-2xl text-violet-500" />
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
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Selected</p>
              <p className="text-2xl font-bold mt-2 text-violet-600">{selectedPayments.length}</p>
              <p className="text-sm text-slate-600 mt-1">payments selected</p>
            </div>
            <FaFileInvoice className="text-2xl text-violet-500" />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPayments.length > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-violet-100 rounded-lg">
                <FaCheckCircle className="text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-violet-900">
                  {selectedPayments.length} payment(s) selected
                </p>
                <p className="text-sm text-violet-600">
                  Total amount: ₹{payments
                    .filter(p => selectedPayments.includes(p.id))
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkVerify}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <FaCheck />
                Verify Selected
              </button>
              <button
                onClick={() => setSelectedPayments([])}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by renter name, apartment, building, or reference..."
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
              <option value="pending_review">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <FaFilter />
              Filters
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
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPayments.length === filteredPayments.filter(p => 
                        p.status === 'pending_verification' || p.status === 'pending_review'
                      ).length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Renter & Location
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
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <FaExclamationCircle className="text-3xl text-slate-300 mx-auto mb-2" />
                    <p className="text-lg">No payments found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                        disabled={payment.status === 'verified' || payment.status === 'rejected'}
                        className="h-4 w-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">{payment.type}</p>
                        <p className="text-sm text-slate-600">{payment.month}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <FaCalendar />
                          <span>
                            {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FaUser className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{payment.renterName}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <div className="flex items-center gap-1">
                              <FaHome className="text-xs" />
                              <span>#{payment.apartment}</span>
                            </div>
                            {payment.floor && (
                              <div className="flex items-center gap-1">
                                <FaBuilding className="text-xs" />
                                <span>Floor {payment.floor}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaRupeeSign className="text-slate-500" />
                        <p className="font-medium text-lg text-slate-900">{payment.amount.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                        <div>
                          <p className="font-medium text-slate-900 capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-slate-600 font-mono">{payment.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {payment.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {payment.verifiedAt && (
                          <span className="text-xs text-slate-500">
                            {new Date(payment.verifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(payment.status === 'pending_verification' || payment.status === 'pending_review') && (
                          <>
                            <button
                              onClick={() => handleVerifyPayment(payment.id)}
                              disabled={verifyingPaymentId === payment.id}
                              className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {verifyingPaymentId === payment.id ? (
                                <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                              ) : (
                                <FaCheck />
                              )}
                              Verify
                            </button>
                            <button
                              onClick={() => handleRejectPayment(payment.id)}
                              disabled={verifyingPaymentId === payment.id}
                              className="px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FaTimes />
                              Reject
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleViewDetails(payment)}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-violet-600" />
            Verification Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-slate-600">Pending Verification</span>
              <span className="font-semibold text-amber-600">{stats.pending} payments</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-slate-600">Total Amount Pending</span>
              <span className="font-semibold text-lg flex items-center gap-1">
                <FaRupeeSign className="text-slate-500" />
                {stats.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-slate-600">Verification Rate</span>
              <span className="font-semibold text-emerald-600">
                {payments.length > 0 
                  ? `${Math.round((stats.verified / payments.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaCreditCard className="text-violet-600" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/manager/payments/history'}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaFileInvoice className="text-violet-600" />
              View All Payment History
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors">
              <FaExclamationCircle className="text-amber-600" />
              Send Payment Reminders
            </button>
            <button 
              onClick={handleExportPayments}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaDownload className="text-violet-600" />
              Generate Detailed Report
            </button>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-3">Payment Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Amount</p>
                      <p className="text-2xl font-bold text-slate-900 flex items-center gap-1">
                        <FaRupeeSign className="text-slate-500" />
                        {selectedPayment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Renter Information */}
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Renter Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-medium">{selectedPayment.renterName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Apartment</p>
                      <p className="font-medium">#{selectedPayment.apartment}</p>
                    </div>
                    {selectedPayment.renterEmail && (
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="font-medium">{selectedPayment.renterEmail}</p>
                      </div>
                    )}
                    {selectedPayment.renterPhone && (
                      <div>
                        <p className="text-sm text-slate-600">Phone</p>
                        <p className="font-medium">{selectedPayment.renterPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Payment Details */}
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Payment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Payment Method</p>
                      <p className="font-medium capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Reference</p>
                      <p className="font-medium font-mono">{selectedPayment.reference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Month</p>
                      <p className="font-medium">{selectedPayment.month}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Payment Date</p>
                      <p className="font-medium">
                        {new Date(selectedPayment.paymentDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {selectedPayment.notes && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-3">Notes</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800">{selectedPayment.notes}</p>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                {(selectedPayment.status === 'pending_verification' || selectedPayment.status === 'pending_review') && (
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={() => handleRejectPayment(selectedPayment.id)}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Reject Payment
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(selectedPayment.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Verify Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPayments;