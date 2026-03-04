// frontend/src/pages/owner/OwnerBillsStatus.tsx

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock3,
  CalendarClock,
  RefreshCw,
  ChevronDown,
  ReceiptText,
  TrendingUp,
  BadgeDollarSign,
  Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BillStatus = "paid" | "overdue" | "pending" | "upcoming";
type FilterStatus = BillStatus | "all";

interface Bill {
  id: number;
  title: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  description: string | null;
  status: BillStatus;
  manager_name: string;
}

interface StatusSummaryItem {
  count: number;
  total_amount: number;
}

interface Summary {
  paid: StatusSummaryItem;
  overdue: StatusSummaryItem;
  pending: StatusSummaryItem;
  upcoming: StatusSummaryItem;
  total: StatusSummaryItem;
}

interface MonthOption {
  month_key: string;   // "2025-12"
  month_label: string; // "Dec 2025"
}

// ─── Status Configuration ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  FilterStatus,
  { 
    label: string; 
    color: string; 
    bg: string; 
    border: string; 
    icon: React.ReactNode; 
    pill: string;
  }
> = {
  all: {
    label: "All Bills",
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: <ReceiptText className="w-5 h-5" />,
    pill: "bg-gray-100 text-gray-700",
  },
  paid: {
    label: "Paid",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle2 className="w-5 h-5" />,
    pill: "bg-green-100 text-green-700",
  },
  overdue: {
    label: "Overdue",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <AlertCircle className="w-5 h-5" />,
    pill: "bg-red-100 text-red-700",
  },
  pending: {
    label: "Pending",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: <Clock3 className="w-5 h-5" />,
    pill: "bg-orange-100 text-orange-700",
  },
  upcoming: {
    label: "Upcoming",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <CalendarClock className="w-5 h-5" />,
    pill: "bg-blue-100 text-blue-700",
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────

export function OwnerManagerStatus() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<Summary>({
    paid: { count: 0, total_amount: 0 },
    overdue: { count: 0, total_amount: 0 },
    pending: { count: 0, total_amount: 0 },
    upcoming: { count: 0, total_amount: 0 },
    total: { count: 0, total_amount: 0 },
  });
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Fetch Data ────────────────────────────────────────────────────────────────

  const fetchBills = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (selectedMonth !== "all") params.append('month', selectedMonth);
      if (selectedStatus !== "all") params.append('status', selectedStatus);

      const response = await fetch(
        `http://localhost:5000/api/owner/bills?${params}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success) {
        setBills(result.data.bills);
        setSummary(result.data.summary);
        setAvailableMonths(result.data.available_months);
      } else {
        throw new Error(result.message || 'Failed to fetch bills');
      }

    } catch (err: any) {
      console.error('Error fetching bills:', err);
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedStatus]);

  useEffect(() => {
    setLoading(true);
    fetchBills();
  }, [fetchBills]);

  // ─── Handlers ───────────────────────────────────────────────────────────────────

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };

  const handleStatusChange = (status: FilterStatus) => {
    setSelectedStatus(status);
  };

  // ─── Helper Functions ───────────────────────────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // ─── Render Loading/Error States ────────────────────────────────────────────────

  if (loading) {
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
          <p className="text-red-600 font-medium">Error: {error}</p>
          <button
            onClick={fetchBills}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills Management</h1>
          <p className="text-gray-600 mt-1">Track and monitor all building expenses</p>
        </div>
        <button
          onClick={fetchBills}
          disabled={refreshing}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Month Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Month
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month.month_key} value={month.month_key}>
                    {month.month_label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as FilterStatus[]).map((status) => {
                const config = STATUS_CONFIG[status];
                const isSelected = selectedStatus === status;
                
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      isSelected
                        ? `${config.bg} ${config.color} ${config.border} border`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {config.icon}
                    {config.label}
                    {status !== 'all' && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${config.pill}`}>
                        {summary[status as BillStatus]?.count || 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['paid', 'overdue', 'pending', 'upcoming'] as BillStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const data = summary[status];
          
          return (
            <div
              key={status}
              className={`p-6 rounded-xl shadow-sm border ${config.bg} ${config.border}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={config.color}>
                  {config.icon}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.pill}`}>
                  {config.label}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${config.color}`}>
                  {data.count}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(data.total_amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Bills List
              {selectedMonth !== "all" && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  • {availableMonths.find(m => m.month_key === selectedMonth)?.month_label}
                </span>
              )}
            </h2>
            <div className="text-sm text-gray-500">
              {bills.length} bill{bills.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {bills.length > 0 ? (
            bills.map((bill) => {
              const config = STATUS_CONFIG[bill.status];
              
              return (
                <div key={bill.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{bill.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.pill}`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span>Due: {formatDate(bill.due_date)}</span>
                          {bill.paid_date && (
                            <span>Paid: {formatDate(bill.paid_date)}</span>
                          )}
                        </div>
                        
                        {bill.description && (
                          <p className="text-gray-500">{bill.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(bill.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {bill.manager_name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <ReceiptText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
              <p className="text-gray-600">
                {selectedMonth !== "all" || selectedStatus !== "all" 
                  ? "Try adjusting your filters to see more results."
                  : "No bills have been created yet."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      {summary.total.count > 0 && (
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100">Total Bills</p>
              <p className="text-2xl font-bold">{summary.total.count}</p>
            </div>
            <div className="text-right">
              <p className="text-violet-100">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.total.total_amount)}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
