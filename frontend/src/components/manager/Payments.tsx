// src/components/manager/ManagerPayments.tsx (COMPLETE FIXED VERSION)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaSync,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaUser,
  FaBuilding,
  FaFilter,
  FaSearch,
  FaTimes,
  FaPrint,
  FaDownload,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Payment {
  id: number;
  month: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  display_status: 'pending' | 'overdue' | 'paid' | 'upcoming';
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
  year?: number;
  month_display?: string;
}

interface PaymentSummary {
  total_pending: number;
  total_overdue: number;
  total_paid: number;
  total_upcoming: number;
  amount_pending: number;
  amount_overdue: number;
  amount_paid: number;
  amount_upcoming: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterOptions {
  years: number[];
  renters: { id: number; name: string; }[];
  statuses: string[];
}

interface MonthOption {
  value: string;
  display_month: string;
  full_date: string;
}

const ManagerPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_pending: 0,
    total_overdue: 0,
    total_paid: 0,
    total_upcoming: 0,
    amount_pending: 0,
    amount_overdue: 0,
    amount_paid: 0,
    amount_upcoming: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: 'all',
    month: 'all',
    status: 'all',
    renter_id: 'all'
  });
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    years: [],
    renters: [],
    statuses: ['all', 'paid', 'pending', 'overdue', 'upcoming']
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'month' | 'amount' | 'renter_name'>('month');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.page, sortField, sortDirection]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    // When year changes, fetch months for that year
    if (filters.year !== 'all') {
      fetchMonthsForYear(parseInt(filters.year as string));
    } else {
      fetchMonthsForYear(new Date().getFullYear());
    }
  }, [filters.year]);

  const fetchMonthsForYear = async (year: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/payments/months?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAvailableMonths(response.data.months || []);
      }
    } catch (error) {
      console.error('Error fetching months:', error);
      // Fallback months
      const fallbackMonths = [];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      for (let i = 1; i <= 12; i++) {
        fallbackMonths.push({
          value: i.toString().padStart(2, '0'),
          display_month: monthNames[i-1],
          full_date: `${year}-${i.toString().padStart(2, '0')}-01`
        });
      }
      setAvailableMonths(fallbackMonths);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build params
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.year !== 'all' && { year: filters.year }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.renter_id !== 'all' && { renter_id: filters.renter_id })
      });
      
      // If month is selected and it's a full date, send it
      if (filters.month !== 'all') {
        // Find the selected month option
        const selectedMonthOption = availableMonths.find(m => m.value === filters.month);
        if (selectedMonthOption?.full_date) {
          params.append('month', selectedMonthOption.full_date);
        } else {
          params.append('month', filters.month);
        }
      }
      
      console.log('📡 Fetching payments with params:', params.toString());
      
      const response = await axios.get(`${API_URL}/manager/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        let fetchedPayments = response.data.data.payments || [];
        
        // Apply client-side search if needed
        if (searchTerm) {
          fetchedPayments = fetchedPayments.filter((p: Payment) => 
            p.renter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.apartment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.building_name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        // Apply sorting
        fetchedPayments.sort((a: Payment, b: Payment) => {
          let comparison = 0;
          if (sortField === 'month') {
            comparison = new Date(a.month).getTime() - new Date(b.month).getTime();
          } else if (sortField === 'amount') {
            comparison = a.amount - b.amount;
          } else if (sortField === 'renter_name') {
            comparison = a.renter_name.localeCompare(b.renter_name);
          }
          return sortDirection === 'asc' ? comparison : -comparison;
        });
        
        setPayments(fetchedPayments);
        
        // Update summary from backend or calculate locally
        if (response.data.data.summary) {
          setSummary(response.data.data.summary);
        } else {
          // Calculate summary locally if not provided
          const newSummary = {
            total_pending: fetchedPayments.filter((p: Payment) => p.display_status === 'pending').length,
            total_overdue: fetchedPayments.filter((p: Payment) => p.display_status === 'overdue').length,
            total_upcoming: fetchedPayments.filter((p: Payment) => p.display_status === 'upcoming').length,
            total_paid: fetchedPayments.filter((p: Payment) => p.status === 'paid').length,
            amount_pending: fetchedPayments
              .filter((p: Payment) => p.display_status === 'pending')
              .reduce((sum, p) => sum + p.amount, 0),
            amount_overdue: fetchedPayments
              .filter((p: Payment) => p.display_status === 'overdue')
              .reduce((sum, p) => sum + p.amount, 0),
            amount_upcoming: fetchedPayments
              .filter((p: Payment) => p.display_status === 'upcoming')
              .reduce((sum, p) => sum + p.amount, 0),
            amount_paid: fetchedPayments
              .filter((p: Payment) => p.status === 'paid')
              .reduce((sum, p) => sum + p.amount, 0)
          };
          setSummary(newSummary);
        }
        
        setPagination(response.data.data.pagination || {
          total: fetchedPayments.length,
          page: 1,
          limit: 20,
          totalPages: Math.ceil(fetchedPayments.length / 20)
        });
      }
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch available years
      const yearsResponse = await axios.get(`${API_URL}/manager/payments/years`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (yearsResponse.data.success) {
        setFilterOptions(prev => ({
          ...prev,
          years: yearsResponse.data.years || []
        }));
        
        // If we have years, fetch months for the first year
        if (yearsResponse.data.years && yearsResponse.data.years.length > 0) {
          const firstYear = yearsResponse.data.years[0];
          setSelectedYear(firstYear);
          await fetchMonthsForYear(firstYear);
        }
      }
      
      // Fetch renters for filter
      const rentersResponse = await axios.get(`${API_URL}/manager/renters?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (rentersResponse.data.success) {
        setFilterOptions(prev => ({
          ...prev,
          renters: rentersResponse.data.data.renters?.map((r: any) => ({
            id: r.id,
            name: r.name
          })) || []
        }));
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      // Fallback months for current year
      const currentYear = new Date().getFullYear();
      const fallbackMonths = [];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      for (let i = 1; i <= 12; i++) {
        fallbackMonths.push({
          value: i.toString().padStart(2, '0'),
          display_month: monthNames[i-1],
          full_date: `${currentYear}-${i.toString().padStart(2, '0')}-01`
        });
      }
      setAvailableMonths(fallbackMonths);
      
      // Fallback years
      setFilterOptions(prev => ({
        ...prev,
        years: [currentYear, currentYear - 1, currentYear - 2]
      }));
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

  const clearFilters = () => {
    setFilters({
      year: 'all',
      month: 'all',
      status: 'all',
      renter_id: 'all'
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
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
    if (payment.display_status === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
          <FaCalendarAlt className="text-xs" />
          Upcoming
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
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
          <FaCheckCircle />
          Paid
        </span>
      );
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  const formatMonthDisplay = (monthValue: string) => {
    if (!monthValue || monthValue === 'all') return 'All Months';
    const selectedMonth = availableMonths.find(m => m.value === monthValue);
    return selectedMonth ? selectedMonth.display_month : monthValue;
  };

  const exportToCSV = () => {
    const headers = ['Renter', 'Apartment', 'Building', 'Month', 'Amount', 'Status', 'Due Date', 'Paid Date', 'Payment Method'];
    const data = payments.map(p => [
      p.renter_name,
      p.apartment_number,
      p.building_name,
      new Date(p.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      p.amount,
      p.display_status || p.status,
      new Date(p.due_date).toLocaleDateString(),
      p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-',
      p.payment_method || '-'
    ]);
    
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments Management</h1>
          <p className="text-slate-600">View and manage all rent payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FaDownload />
            Export
          </button>
          <button
            onClick={fetchPayments}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FaSync />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending (Current Month)</p>
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

        <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
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

        <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Upcoming</p>
              <p className="text-2xl font-bold text-slate-600">{summary.total_upcoming}</p>
              <p className="text-sm text-slate-500 mt-1">
                Amount: {formatCurrency(summary.amount_upcoming)}
              </p>
            </div>
            <div className="p-4 bg-slate-100 rounded-full">
              <FaCalendarAlt className="text-2xl text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Search and Filters Toggle */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by renter, apartment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <FaFilter />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">Filter Payments</span>
              <button
                onClick={clearFilters}
                className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
              >
                <FaTimes />
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value, month: 'all', page: 1 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">All Years</option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">All Months</option>
                  {availableMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.display_month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending (Current Month)</option>
                  <option value="overdue">Overdue</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Renter Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Renter</label>
                <select
                  value={filters.renter_id}
                  onChange={(e) => setFilters({ ...filters, renter_id: e.target.value, page: 1 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">All Renters</option>
                  {filterOptions.renters.map(renter => (
                    <option key={renter.id} value={renter.id}>{renter.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Active filters display */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500">Active filters:</span>
              <span className="px-2 py-1 bg-white border rounded">
                Year: {filters.year === 'all' ? 'All' : filters.year}
              </span>
              <span className="px-2 py-1 bg-white border rounded">
                Month: {filters.month === 'all' ? 'All' : formatMonthDisplay(filters.month)}
              </span>
              <span className="px-2 py-1 bg-white border rounded">
                Status: {filters.status === 'all' ? 'All' : filters.status}
              </span>
              <span className="px-2 py-1 bg-white border rounded">
                Renter: {filters.renter_id === 'all' ? 'All' : filterOptions.renters.find(r => r.id.toString() === filters.renter_id)?.name || 'Selected'}
              </span>
            </div>
          </div>
        )}
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
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-slate-400 text-sm" />
                        <div>
                          <p className="font-medium">
                            {new Date(payment.month).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                          {payment.year && (
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                              Year: {payment.year}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold">{formatCurrency(payment.amount)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-slate-400 text-sm" />
                        <div>
                          <p className="text-sm">{new Date(payment.due_date).toLocaleDateString()}</p>
                          {payment.paid_at && (
                            <p className="text-xs text-emerald-600">
                              Paid: {new Date(payment.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
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
                          className="p-2 hover:bg-slate-100 rounded-lg text-blue-600"
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
          <div className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} payments
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-slate-50 flex items-center gap-1"
              >
                <FaChevronLeft className="text-xs" />
                Previous
              </button>
              <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-lg">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-slate-50 flex items-center gap-1"
              >
                Next
                <FaChevronRight className="text-xs" />
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
              
              <div className="bg-slate-50 p-4 rounded-lg mb-4 space-y-2">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Renter:</span> {selectedPayment.renter_name}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Apartment:</span> {selectedPayment.apartment_number} - {selectedPayment.building_name}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Amount:</span> {formatCurrency(selectedPayment.amount)}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Month:</span> {new Date(selectedPayment.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                {selectedPayment.transaction_id && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Transaction ID:</span> {selectedPayment.transaction_id}
                  </p>
                )}
                {selectedPayment.payment_method && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Payment Method:</span> {selectedPayment.payment_method}
                  </p>
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
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
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