import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle } from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import { useOwnerDashboard } from "../../hooks/useOwnerDashboard";

export function OwnerDashboard() {

  // Default year + month (Professional selector)
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState(
    String(currentDate.getMonth() + 1).padStart(2, "0")
  );

  // Send to backend in YYYY-MM-DD format
  const selectedMonth = `${year}-${month}-01`;
  
  console.log("🔍 Selected Month:", selectedMonth);

  const { data, loading } = useOwnerDashboard(selectedMonth);
  
  // Log the actual data structure
  console.log("🔍 Full data object:", data);
  
  // Map API response to expected property names
  const total_income = data?.totalIncome || 0;
  const total_expense = data?.totalExpenses || 0;
  const occupied_units = data?.occupiedApartments || 0;
  const total_units = data?.totalApartments || 0;

  console.log("🔍 Mapped values:", {
    total_income,
    total_expense,
    occupied_units,
    total_units
  });

  // Safe calculations
  const occupancyRate = total_units === 0 ? 0 : (occupied_units / total_units) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header + Date Selector */}
      <div className="flex justify-between items-center flex-wrap gap-4">

        <div>
          <h1 className="text-slate-900 text-2xl font-semibold">
            Owner Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Overview of your building performance
          </p>
        </div>

        {/* Professional Year + Month Selector */}
        <div className="flex gap-3">

          {/* Year Dropdown */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border p-2 rounded-lg"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border p-2 rounded-lg"
          >
            {[
              "01","02","03","04","05","06",
              "07","08","09","10","11","12"
            ].map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Income */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600"/>
            </div>

            <div>
              <p className="text-slate-600">Total Income</p>
              <p className="text-slate-900 text-xl">
                ৳{total_income.toLocaleString()}
              </p>
              <p className="text-emerald-600 text-sm">This month</p>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-rose-600"/>
            </div>

            <div>
              <p className="text-slate-600">Total Expenses</p>
              <p className="text-slate-900 text-xl">
                ৳{total_expense.toLocaleString()}
              </p>
              <p className="text-slate-600 text-sm">This month</p>
            </div>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-indigo-600"/>
            </div>

            <div>
              <p className="text-slate-600">Net Profit</p>
              <p className="text-slate-900 text-xl">
                ৳{(total_income - total_expense).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Occupancy */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600"/>
            </div>

            <div>
              <p className="text-slate-600">Occupancy Rate</p>
              <p className="text-slate-900 text-xl">
                {occupancyRate.toFixed(0)}%
              </p>

              <p className="text-slate-600 text-sm">
                {occupied_units}/{total_units} units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Income vs Expense */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="mb-6 text-slate-900 font-semibold">
            Income vs Expenses
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: selectedMonth,
                  income: total_income,
                  expense: total_expense
                }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip formatter={(value) => `৳${value.toLocaleString()}`}/>
              <Legend/>
              <Bar dataKey="income" name="Income" fill="#10b981"/>
              <Bar dataKey="expense" name="Expense" fill="#ef4444"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="mb-6 text-slate-900 font-semibold">
            Profit Trend
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                {
                  name: selectedMonth,
                  profit: total_income - total_expense
                }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip formatter={(value) => `৳${value.toLocaleString()}`}/>
              <Legend/>
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#6366f1"
                name="Net Profit"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Alerts - You can add dynamic alerts based on data */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-slate-900 mb-4 font-semibold">
          Alerts
        </h2>

        {data?.pendingPayments > 0 && (
          <div className="flex gap-3 p-4 bg-amber-50 border rounded-lg mb-2">
            <AlertCircle className="text-amber-600 w-5 h-5"/>
            <div>
              <p className="text-slate-900">
                Pending Payments: ৳{data.pendingPayments.toLocaleString()}
              </p>
              <p className="text-slate-600 text-sm">
                {data.pendingPayments} in pending payments
              </p>
            </div>
          </div>
        )}

        {data?.pendingComplaints > 0 && (
          <div className="flex gap-3 p-4 bg-red-50 border rounded-lg">
            <AlertCircle className="text-red-600 w-5 h-5"/>
            <div>
              <p className="text-slate-900">
                Pending Complaints: {data.pendingComplaints}
              </p>
              <p className="text-slate-600 text-sm">
                {data.pendingComplaints} complaints need attention
              </p>
            </div>
          </div>
        )}

        {(!data?.pendingPayments && !data?.pendingComplaints) && (
          <div className="flex gap-3 p-4 bg-green-50 border rounded-lg">
            <AlertCircle className="text-green-600 w-5 h-5"/>
            <div>
              <p className="text-slate-900">
                All Good!
              </p>
              <p className="text-slate-600 text-sm">
                No pending issues
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}