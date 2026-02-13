// frontend/src/pages/owner/OwnerManagerStatus.tsx
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface Bill {
  id: number;
  bill_source: 'utility' | 'manager' | 'expense';
  bill_type: string;
  title: string;
  building_name: string;
  amount: number;
  due_date: string;
  status: 'upcoming' | 'pending' | 'paid' | 'overdue';
  paid_date: string | null;
  paid_amount?: number;
  provider?: string;
  account_number?: string;
  month?: string;
  consumption?: string;
  description?: string;
}

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "pending" | "in-progress" | "resolved";
  apartment: string;
  renterName: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface Payment {
  id: number;
  apartment_number: string;
  renter_name: string;
  payment_status: string;
  confirmation_status: string;
}

export function OwnerManagerStatus() {
  const currentMonth = "January 2025";
  const today = new Date("2025-01-25");
  
  const [currentTab, setCurrentTab] = useState<"pending" | "upcoming" | "summary">("pending");
  const [bills, setBills] = useState<Bill[]>([]);
  const [utilityBills, setUtilityBills] = useState<Bill[]>([]);
  const [managerBills, setManagerBills] = useState<Bill[]>([]);
  const [ownerExpenses, setOwnerExpenses] = useState<Bill[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Fetch all bills from unified endpoint
      const billsResponse = await fetch('http://localhost:5000/api/owner/all-bills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!billsResponse.ok) {
        throw new Error(`HTTP error! status: ${billsResponse.status}`);
      }
      
      const billsResult = await billsResponse.json();
      
      if (billsResult.success) {
        // Filter bills by type
        const utility = billsResult.data.bills.filter((b: Bill) => 
          b.bill_source === 'utility'
        );
        const manager = billsResult.data.bills.filter((b: Bill) => 
          b.bill_source === 'manager'
        );
        const expenses = billsResult.data.bills.filter((b: Bill) => 
          b.bill_source === 'expense'
        );
        
        setBills(billsResult.data.bills);
        setUtilityBills(utility);
        setManagerBills(manager);
        setOwnerExpenses(expenses);
      } else {
        throw new Error(billsResult.message || 'Failed to fetch bills');
      }
      
      // Fetch complaints
      const complaintsResponse = await fetch('http://localhost:5000/api/owner/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (complaintsResponse.ok) {
        const complaintsResult = await complaintsResponse.json();
        if (complaintsResult.success) {
          setComplaints(complaintsResult.data || []);
        }
      }
      
      // Fetch payments
      const paymentsResponse = await fetch('http://localhost:5000/api/owner/payments?month=2025-01-01', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (paymentsResponse.ok) {
        const paymentsResult = await paymentsResponse.json();
        if (paymentsResult.success) {
          setPayments(paymentsResult.apartments || []);
        }
      }
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      
      // Set mock data as fallback
      const mockBills: Bill[] = [
        {
          id: 1,
          bill_source: 'utility',
          bill_type: 'Electricity',
          title: 'Electricity Bill',
          building_name: 'Main Building',
          amount: 15000,
          due_date: '2025-12-05',
          status: 'paid',
          paid_date: '2025-12-01',
          provider: 'National Grid'
        },
        {
          id: 2,
          bill_source: 'utility',
          bill_type: 'Water',
          title: 'Water Bill',
          building_name: 'Main Building',
          amount: 6000,
          due_date: '2025-12-07',
          status: 'paid',
          paid_date: '2025-12-05',
          provider: 'WASA'
        },
        {
          id: 3,
          bill_source: 'utility',
          bill_type: 'Gas',
          title: 'Gas Bill',
          building_name: 'Main Building',
          amount: 4000,
          due_date: '2025-11-30',
          status: 'overdue',
          paid_date: null,
          provider: 'Titas Gas'
        },
        {
          id: 4,
          bill_source: 'manager',
          bill_type: 'Manager Bill',
          title: 'Maintenance Fee',
          building_name: 'All Buildings',
          amount: 10000,
          due_date: '2025-12-10',
          status: 'paid',
          paid_date: '2025-12-08'
        },
        {
          id: 5,
          bill_source: 'expense',
          bill_type: 'property_tax',
          title: 'Property Tax',
          building_name: 'Owner Expense',
          amount: 50000,
          due_date: '2025-01-15',
          status: 'paid',
          paid_date: '2025-01-15'
        }
      ];
      
      setBills(mockBills);
      setUtilityBills(mockBills.filter(b => b.bill_source === 'utility'));
      setManagerBills(mockBills.filter(b => b.bill_source === 'manager'));
      setOwnerExpenses(mockBills.filter(b => b.bill_source === 'expense'));
      
      setComplaints([
        {
          id: 1,
          title: "Leaking Faucet",
          description: "Kitchen faucet is leaking",
          category: "plumbing",
          priority: "medium",
          status: "in-progress",
          apartment: "101",
          renterName: "John Doe",
          createdAt: new Date().toISOString(),
          resolvedAt: null
        }
      ]);
      
      setPayments([
        {
          id: 1,
          apartment_number: "101",
          renter_name: "John Doe",
          payment_status: "paid",
          confirmation_status: "verified"
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-8 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // Calculate statistics
  const totalBills = bills.length;
  const paidBills = bills.filter(b => b.status === "paid" || b.paid_date !== null).length;
  
  const upcomingBills = bills.filter(bill => {
    const dueDate = new Date(bill.due_date);
    return dueDate > today && bill.status !== 'paid';
  });

  const pendingBills = bills.filter(b => b.status === "pending" && !b.paid_date);
  const overdueBills = bills.filter(bill => {
    const dueDate = new Date(bill.due_date);
    return (bill.status === "pending" || bill.status === "overdue") && dueDate < today;
  });

  // Current month bills
  const currentMonthBills = bills.filter(bill => {
    try {
      const billDate = new Date(bill.due_date);
      const billMonth = billDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      return billMonth === currentMonth;
    } catch {
      return false;
    }
  });

  const currentMonthPaidBills = currentMonthBills.filter(bill => bill.status === "paid" || bill.paid_date !== null);
  const currentMonthUnpaidBills = currentMonthBills.filter(bill => bill.status !== "paid" && !bill.paid_date);

  // Complaints status
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;
  const pendingComplaints = complaints.filter(c => c.status === "pending");
  const inProgressComplaints = complaints.filter(c => c.status === "in-progress");

  // Payment verification
  const verifiedPayments = payments.filter(p => 
    p.confirmation_status === 'verified' || p.payment_status === 'paid'
  ).length;
  const totalRenters = payments.length;

  // Performance scores
  const billScore = totalBills > 0 ? (paidBills / totalBills) * 100 : 100;
  const complaintScore = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 100;
  const paymentScore = totalRenters > 0 ? (verifiedPayments / totalRenters) * 100 : 100;
  const overallScore = Math.round((billScore + complaintScore + paymentScore) / 3);

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Performance</h1>
          <p className="text-gray-600 mt-1">Monitor manager's task completion and building operations</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall Performance */}
      <div className="bg-gradient-to-r from-violet-500 to-violet-600 p-6 rounded-xl text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-violet-100">Overall Performance Score</p>
            <p className="text-white mt-2 text-4xl font-bold">{overallScore}%</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Bills Payment</h3>
            <div className={`p-2 rounded-lg ${
              billScore >= 80 ? "bg-green-100" : billScore >= 50 ? "bg-orange-100" : "bg-red-100"
            }`}>
              {billScore >= 80 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : billScore >= 50 ? (
                <Clock className="w-5 h-5 text-orange-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Paid: {paidBills}</span>
              <span>Pending: {pendingBills.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  billScore >= 80 ? "bg-green-600" : billScore >= 50 ? "bg-orange-600" : "bg-red-600"
                }`}
                style={{ width: `${billScore}%` }}
              />
            </div>
            <p className="text-gray-600">{billScore.toFixed(0)}% Completion</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Complaint Resolution</h3>
            <div className={`p-2 rounded-lg ${
              complaintScore >= 80 ? "bg-green-100" : complaintScore >= 50 ? "bg-orange-100" : "bg-red-100"
            }`}>
              {complaintScore >= 80 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : complaintScore >= 50 ? (
                <Clock className="w-5 h-5 text-orange-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Resolved: {resolvedComplaints}</span>
              <span>Active: {pendingComplaints.length + inProgressComplaints.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  complaintScore >= 80 ? "bg-green-600" : complaintScore >= 50 ? "bg-orange-600" : "bg-red-600"
                }`}
                style={{ width: `${complaintScore}%` }}
              />
            </div>
            <p className="text-gray-600">{complaintScore.toFixed(0)}% Resolution Rate</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Payment Verification</h3>
            <div className={`p-2 rounded-lg ${
              paymentScore >= 80 ? "bg-green-100" : paymentScore >= 50 ? "bg-orange-100" : "bg-red-100"
            }`}>
              {paymentScore >= 80 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : paymentScore >= 50 ? (
                <Clock className="w-5 h-5 text-orange-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Verified: {verifiedPayments}</span>
              <span>Total: {totalRenters}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  paymentScore >= 80 ? "bg-green-600" : paymentScore >= 50 ? "bg-orange-600" : "bg-red-600"
                }`}
                style={{ width: `${paymentScore}%` }}
              />
            </div>
            <p className="text-gray-600">{paymentScore.toFixed(0)}% Verified</p>
          </div>
        </div>
      </div>

      {/* Bills Management - Tabbed View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-900 text-xl font-semibold mb-4">Building Bills Management</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCurrentTab("pending")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentTab === "pending"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Pending ({pendingBills.length + overdueBills.length})</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentTab("upcoming")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentTab === "upcoming"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Upcoming ({upcomingBills.length})</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentTab("summary")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentTab === "summary"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Monthly Summary</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Pending/Overdue Bills Tab */}
          {currentTab === "pending" && (
            <div className="space-y-3">
              {[...overdueBills, ...pendingBills.filter(b => !overdueBills.includes(b))].length > 0 ? (
                [...overdueBills, ...pendingBills.filter(b => !overdueBills.includes(b))].map((bill) => {
                  const dueDate = new Date(bill.due_date);
                  const isOverdue = dueDate < today;
                  
                  return (
                    <div 
                      key={bill.id} 
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        isOverdue 
                          ? "bg-red-50 border border-red-200" 
                          : "bg-orange-50 border border-orange-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                            {bill.bill_source}
                          </span>
                          <p className="text-gray-900 capitalize font-medium">{bill.title}</p>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {bill.building_name} • Due: {dueDate.toLocaleDateString()}
                        </p>
                        {bill.provider && (
                          <p className="text-xs text-gray-500 mt-1">{bill.provider}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">৳{bill.amount.toLocaleString()}</p>
                        <p className={isOverdue ? "text-red-600" : "text-orange-600"}>
                          {isOverdue ? "Overdue" : "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">No pending bills! All bills are up to date.</p>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Bills Tab */}
          {currentTab === "upcoming" && (
            <div className="space-y-3">
              {upcomingBills.length > 0 ? (
                upcomingBills.map((bill) => {
                  const isPaid = bill.status === "paid" || bill.paid_date !== null;
                  return (
                    <div
                      key={bill.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        isPaid
                          ? "bg-green-50 border border-green-200"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                            {bill.bill_source}
                          </span>
                          <p className="text-gray-900 capitalize font-medium">{bill.title}</p>
                          {isPaid && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {bill.building_name} • Due: {new Date(bill.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">৳{bill.amount.toLocaleString()}</p>
                        <p className={isPaid ? "text-green-600" : "text-blue-600"}>
                          {isPaid ? "Paid" : "Upcoming"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming bills.</p>
                </div>
              )}
            </div>
          )}

          {/* Monthly Summary Tab */}
          {currentTab === "summary" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                  <p className="text-indigo-700">Total Bills</p>
                  <p className="text-indigo-900 mt-1 text-2xl font-bold">{currentMonthBills.length}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-green-700">Paid Bills</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-green-900 text-2xl font-bold">{currentMonthPaidBills.length}</p>
                    <p className="text-green-700 font-medium">
                      ৳{currentMonthPaidBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <p className="text-orange-700">Unpaid Bills</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-orange-900 text-2xl font-bold">{currentMonthUnpaidBills.length}</p>
                    <p className="text-orange-700 font-medium">
                      ৳{currentMonthUnpaidBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {currentMonthPaidBills.length > 0 && (
                <div>
                  <h3 className="text-gray-900 font-semibold mb-3">✓ Paid Bills ({currentMonthPaidBills.length})</h3>
                  <div className="space-y-2">
                    {currentMonthPaidBills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                              {bill.bill_source}
                            </span>
                            <p className="text-gray-900 capitalize">{bill.title}</p>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{bill.building_name}</p>
                          {bill.paid_date && (
                            <p className="text-gray-600 text-sm">Paid on: {new Date(bill.paid_date).toLocaleDateString()}</p>
                          )}
                        </div>
                        <p className="text-gray-900 font-semibold">৳{bill.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentMonthUnpaidBills.length > 0 && (
                <div>
                  <h3 className="text-gray-900 font-semibold mb-3">⏳ Unpaid Bills ({currentMonthUnpaidBills.length})</h3>
                  <div className="space-y-2">
                    {currentMonthUnpaidBills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                              {bill.bill_source}
                            </span>
                            <p className="text-gray-900 capitalize">{bill.title}</p>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{bill.building_name}</p>
                          <p className="text-gray-600 text-sm">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
                        </div>
                        <p className="text-gray-900 font-semibold">৳{bill.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentMonthBills.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No bills for {currentMonth}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending/In-Progress Complaints */}
      {(pendingComplaints.length > 0 || inProgressComplaints.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900 text-xl font-semibold">Active Complaints</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[...pendingComplaints, ...inProgressComplaints].map((complaint) => (
                <div key={complaint.id} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-gray-900 font-medium">{complaint.title}</p>
                      <p className="text-gray-600">{complaint.renterName} - {complaint.apartment}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      complaint.status === "in-progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {complaint.status === "in-progress" ? "In Progress" : "Pending"}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{complaint.description}</p>
                  <p className="text-gray-500 mt-2">
                    Submitted: {new Date(complaint.createdAt).toLocaleDateString()} | Priority: <span className={
                      complaint.priority === "high" ? "text-red-600" : complaint.priority === "medium" ? "text-yellow-600" : "text-green-600"
                    }>{complaint.priority}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-gray-900 text-xl font-semibold mb-4">Recommendations</h2>
        <div className="space-y-3">
          {pendingBills.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-gray-900 font-medium">Follow up on pending bills</p>
                <p className="text-gray-600">There are {pendingBills.length} bills pending payment</p>
              </div>
            </div>
          )}
          {pendingComplaints.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-gray-900 font-medium">Address pending complaints</p>
                <p className="text-gray-600">{pendingComplaints.length} complaints need immediate attention</p>
              </div>
            </div>
          )}
          {overallScore >= 80 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-gray-900 font-medium">Excellent performance</p>
                <p className="text-gray-600">Manager is maintaining high standards across all areas</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}