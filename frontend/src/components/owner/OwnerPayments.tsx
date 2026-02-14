// frontend/src/components/owner/OwnerPayments.tsx - FIXED WITH HOOK
import { CheckCircle, XCircle, Search, Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { format } from 'date-fns';
import { useOwnerPayments } from "../../hooks/useOwnerPayments"; // IMPORT THE HOOK

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApartmentPayment {
  id: number;
  apartment_number: string;
  floor: string;
  rent_amount: number;
  renter_id: number | null;
  renter_name: string | null;
  renter_email: string | null;
  renter_phone: string | null;
  payment_id: number | null;
  amount: number | null;
  payment_status: string | null;
  paid_at: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  confirmation_status: string | null;
  verified_at: string | null;
  display_status: string;
}

interface PaymentSummary {
  total_apartments: number;
  verified_count: number;
  pending_review_count: number;
  unpaid_count: number;
  overdue_count: number;
  total_expected: number;
  total_collected: number;
}

interface PaymentData {
  month: string;
  summary: PaymentSummary;
  apartments: ApartmentPayment[];
}

export function OwnerPayments() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, '0')
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [availableMonths, setAvailableMonths] = useState<Array<{display_month: string, value: string}>>([]);

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const monthDate = `${selectedYear}-${selectedMonth}-01`;
  
  // USE THE HOOK HERE - replaces manual fetch calls
  const { data, isLoading, error, refetch } = useOwnerPayments(monthDate);

  // Fetch available months separately (could also be moved to a hook)
  const fetchAvailableMonths = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/owner/payments/months`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableMonths(result.months);
        }
      }
    } catch (err) {
      console.error('Error fetching months:', err);
    }
  };

  // Fetch months on component mount
  useState(() => {
    fetchAvailableMonths();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-50 border-green-200';
      case 'pending_verification': return 'bg-yellow-50 border-yellow-200';
      case 'pending': return 'bg-orange-50 border-orange-200';
      case 'overdue': return 'bg-red-50 border-red-200';
      case 'rejected': return 'bg-gray-50 border-gray-200';
      case 'no_payment': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'pending_verification': return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'pending': return <Clock className="w-6 h-6 text-orange-600" />;
      case 'overdue': return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'rejected': return <XCircle className="w-6 h-6 text-gray-600" />;
      default: return <XCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified ✓';
      case 'pending_verification': return 'Pending Verification';
      case 'pending': return 'Pending Payment';
      case 'overdue': return 'Overdue';
      case 'rejected': return 'Rejected';
      case 'no_payment': return 'No Payment';
      default: return status.replace('_', ' ').toUpperCase();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Error: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredApartments = data?.apartments?.filter(apt => 
    apt.renter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.apartment_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renter Payments</h1>
          <p className="text-gray-600 mt-1">Track payment status and verification across all renters</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.verified_count || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                ৳{(data?.summary?.total_collected || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.apartments?.filter(a => a.display_status === 'pending_verification').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.apartments?.filter(a => a.display_status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.apartments?.filter(a => a.display_status === 'overdue').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Progress */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-gray-900 font-semibold mb-4">Collection Progress for {new Date(monthDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>
              Collected: ৳{(data?.apartments
                ?.filter(a => a.display_status === 'verified')
                .reduce((sum, a) => sum + (a.amount || 0), 0) || 0).toLocaleString()} of 
              ৳{data?.apartments?.reduce((sum, a) => sum + a.rent_amount, 0).toLocaleString() || 0}
            </span>
            <span className="font-medium">
              {data?.apartments?.length ? 
                ((data.apartments.filter(a => a.display_status === 'verified').length / data.apartments.length) * 100).toFixed(1) 
                : '0'}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ 
                width: `${data?.apartments?.length 
                  ? (data.apartments.filter(a => a.display_status === 'verified').length / data.apartments.length) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by renter name or apartment number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Payment Status Grid */}
      {filteredApartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApartments.map((apt) => (
            <div
              key={apt.id}
              className={`p-6 rounded-xl border-2 transition-all hover:shadow-md ${getStatusColor(apt.display_status)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg">{apt.renter_name || 'Vacant'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-600">Apt {apt.apartment_number}</span>
                    {apt.floor && <span className="text-gray-400">•</span>}
                    {apt.floor && <span className="text-gray-600">Floor {apt.floor}</span>}
                  </div>
                </div>
                {getStatusIcon(apt.display_status)}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Rent:</span>
                  <span className="text-gray-900 font-bold text-lg">৳{(apt.rent_amount || 0).toLocaleString()}</span>
                </div>
                
                {apt.payment_id && (
                  <>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Amount:</span>
                        <span className="text-gray-900 font-medium">৳{(apt.amount || 0).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          apt.display_status === 'verified' ? 'text-green-600' :
                          apt.display_status === 'pending_verification' ? 'text-yellow-600' :
                          apt.display_status === 'pending' ? 'text-orange-600' :
                          apt.display_status === 'overdue' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {getStatusText(apt.display_status)}
                        </span>
                      </div>
                      
                      {apt.paid_at && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">Paid Date:</span>
                          <span className="text-gray-900">
                            {format(new Date(apt.paid_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {apt.payment_method && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">Method:</span>
                          <span className="text-gray-900 capitalize">
                            {apt.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      )}

                      {apt.verified_at && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">Verified:</span>
                          <span className="text-gray-900">
                            {format(new Date(apt.verified_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Status-specific messages */}
              {apt.display_status === 'pending_verification' && (
                <div className="mt-4 pt-3 border-t border-yellow-200">
                  <p className="text-yellow-700 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Payment received, awaiting manager verification
                  </p>
                </div>
              )}

              {apt.display_status === 'pending' && (
                <div className="mt-4 pt-3 border-t border-orange-200">
                  <p className="text-orange-700 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Payment expected
                  </p>
                </div>
              )}

              {apt.display_status === 'overdue' && (
                <div className="mt-4 pt-3 border-t border-red-200">
                  <p className="text-red-700 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Payment overdue
                  </p>
                </div>
              )}

              {apt.display_status === 'no_payment' && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">No payment recorded</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No renters found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or month selection</p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Pending Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Pending Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600">No Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}