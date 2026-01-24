// frontend/src/components/owner/OwnerDashboard.tsx
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle } from "lucide-react";
import { mockAnalytics, mockRenters, mockComplaints } from "../../lib/mockData";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function OwnerDashboard() {
  const occupiedApartments = mockRenters.filter(r => r.status === "approved").length;
  const totalApartments = 10;
  const occupancyRate = (occupiedApartments / totalApartments) * 100;

  const pendingComplaints = mockComplaints.filter(c => c.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900">Owner Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your building's performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-600">Total Income</p>
              <p className="text-slate-900">৳{mockAnalytics.totalIncome.toLocaleString()}</p>
              <p className="text-emerald-600">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-slate-600">Total Expenses</p>
              <p className="text-slate-900">৳{mockAnalytics.totalExpenses.toLocaleString()}</p>
              <p className="text-slate-600">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-slate-600">Net Profit</p>
              <p className="text-slate-900">৳{mockAnalytics.totalProfit.toLocaleString()}</p>
              <p className="text-indigo-600">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-600">Occupancy Rate</p>
              <p className="text-slate-900">{occupancyRate.toFixed(0)}%</p>
              <p className="text-slate-600">{occupiedApartments}/{totalApartments} units</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
        <h2 className="text-slate-900 mb-6">Income vs Expenses</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockAnalytics.monthlyIncome}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Trend */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
        <h2 className="text-slate-900 mb-6">Profit Trend (6 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockAnalytics.monthlyIncome}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={3} name="Net Profit" dot={{ fill: '#6366f1', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
          <h2 className="text-slate-900 mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            {mockAnalytics.pendingPayments > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-slate-900">{mockAnalytics.pendingPayments} Pending Payments</p>
                  <p className="text-slate-600">Some renters haven't paid this month's rent</p>
                </div>
              </div>
            )}
            {pendingComplaints > 0 && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                <div>
                  <p className="text-slate-900">{pendingComplaints} Unresolved Complaints</p>
                  <p className="text-slate-600">Maintenance issues need attention</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-slate-900">High Occupancy Rate</p>
                <p className="text-slate-600">{occupancyRate.toFixed(0)}% of units are occupied</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
          <h2 className="text-slate-900 mb-4">Quick Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-slate-700">Total Renters</span>
              <span className="text-slate-900">{occupiedApartments}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-slate-700">Average Rent</span>
              <span className="text-slate-900">
                ৳{Math.round(mockRenters.reduce((sum, r) => sum + r.rentAmount, 0) / mockRenters.length).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-slate-700">Payment Collection Rate</span>
              <span className="text-emerald-600">
                {((occupiedApartments - mockAnalytics.pendingPayments) / occupiedApartments * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-slate-700">Active Complaints</span>
              <span className="text-amber-600">{pendingComplaints}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}