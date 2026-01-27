// src/components/manager/AdvancedAnalytics.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaBuilding,
  FaUsers,
  FaMoneyBillWave,
  FaTools,
  FaFilter,
  FaDownload,
  FaCalendar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaCubes,
  FaSitemap,
  FaRegChartBar
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AnalyticsData {
  [key: string]: any;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

const AdvancedAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData>({});
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    months: 12,
    buildingId: ''
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      switch (activeTab) {
        case 'payment-patterns':
          endpoint = '/manager/analytics/payment-patterns';
          break;
        case 'occupancy-trends':
          endpoint = `/manager/analytics/occupancy-trends?months=${filters.months}`;
          break;
        case 'maintenance-analytics':
          endpoint = `/manager/analytics/maintenance-analytics?startDate=${filters.startDate}&endDate=${filters.endDate}`;
          break;
        case 'building-hierarchy':
          endpoint = '/manager/analytics/building-hierarchy';
          break;
        case 'payment-trends':
          endpoint = `/manager/analytics/payment-trends?months=${filters.months}`;
          break;
        case 'predictive-metrics':
          endpoint = '/manager/analytics/predictive-metrics';
          break;
        case 'data-validation':
          endpoint = '/manager/analytics/data-validation';
          break;
        case 'audit-logs':
          endpoint = `/manager/analytics/audit-logs?days=30`;
          break;
        default:
          endpoint = '/manager/analytics/payment-trends';
      }
      
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    // Export functionality
    toast.success('Export feature coming soon!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
    { id: 'payment-patterns', label: 'Payment Patterns', icon: <FaMoneyBillWave /> },
    { id: 'occupancy-trends', label: 'Occupancy Trends', icon: <FaBuilding /> },
    { id: 'maintenance-analytics', label: 'Maintenance Analytics', icon: <FaTools /> },
    { id: 'building-hierarchy', label: 'Building Hierarchy', icon: <FaSitemap /> },
    { id: 'payment-trends', label: 'Payment Trends', icon: <FaRegChartBar /> },
    { id: 'predictive-metrics', label: 'Predictive Metrics', icon: <FaExclamationTriangle /> },
    { id: 'data-validation', label: 'Data Validation', icon: <FaCheckCircle /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <FaClock /> },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Advanced Analytics</p>
              <p className="text-2xl font-bold mt-2 text-violet-600">8+</p>
              <p className="text-xs text-slate-500">Analytics Types</p>
            </div>
            <FaChartLine className="text-2xl text-violet-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Predictive Models</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">3</p>
              <p className="text-xs text-slate-500">Active Predictions</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Data Quality</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">94%</p>
              <p className="text-xs text-slate-500">Valid Records</p>
            </div>
            <FaCheckCircle className="text-2xl text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Real-time Updates</p>
              <p className="text-2xl font-bold mt-2 text-blue-600">Yes</p>
              <p className="text-xs text-slate-500">Triggers Active</p>
            </div>
            <FaClock className="text-2xl text-blue-500" />
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaChartBar className="text-violet-600" />
            Available Analytics
          </h3>
          <div className="space-y-3">
            {tabs.slice(1).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-white rounded-lg border">
                  {tab.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{tab.label}</p>
                  <p className="text-sm text-slate-500">Click to view detailed analytics</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FaCubes className="text-violet-600" />
            Advanced SQL Features
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-900">Window Functions</p>
              <p className="text-sm text-blue-700">Running totals, rankings, and moving averages</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="font-medium text-emerald-900">Recursive CTEs</p>
              <p className="text-sm text-emerald-700">Hierarchical data and dependencies</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-medium text-purple-900">CUBE & ROLLUP</p>
              <p className="text-sm text-purple-700">Multi-dimensional aggregations</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-medium text-amber-900">Triggers & Audits</p>
              <p className="text-sm text-amber-700">Real-time data tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentPatterns = () => {
    if (!data.patterns || data.patterns.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaMoneyBillWave className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Payment Pattern Data</h3>
            <p>Payment pattern data will appear once there are more payments in the system.</p>
          </div>
        </div>
      );
    }
    
    // Prepare pie chart data
    const pieChartData = [
      { 
        name: 'High Risk', 
        value: data.summary?.highRisk || 0,
        color: '#ef4444'
      },
      { 
        name: 'Medium Risk', 
        value: data.patterns.length - (data.summary?.highRisk || 0),
        color: '#f59e0b'
      }
    ];
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Payment Risk Analysis</h3>
              <div className="h-[320px] min-h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                  <BarChart data={data.patterns.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="renter_name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, value === 'late_payment_percentage' ? '%' : '']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="late_payment_percentage" 
                      name="Late Payment %" 
                      fill="#f59e0b" 
                    />
                    <Bar 
                      dataKey="total_payments" 
                      name="Total Payments" 
                      fill="#8b5cf6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Risk Distribution</h3>
            <div className="h-[320px] min-h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                      return `${name}: ${percentage}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-slate-900">Payment Pattern Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Renter</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Apartment</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Total Payments</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Late Payments</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Late %</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Risk Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.patterns.slice(0, 10).map((pattern: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3">{pattern.renter_name}</td>
                    <td className="p-3">{pattern.apartment_number}</td>
                    <td className="p-3">{pattern.total_payments}</td>
                    <td className="p-3">{pattern.late_payments}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pattern.late_payment_percentage > 50 ? 'bg-rose-100 text-rose-700' :
                        pattern.late_payment_percentage > 20 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pattern.late_payment_percentage}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pattern.risk_category === 'High Risk' ? 'bg-rose-100 text-rose-700' :
                        pattern.risk_category === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pattern.risk_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOccupancyTrends = () => {
    if (!data.trends || data.trends.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaBuilding className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Occupancy Data</h3>
            <p>Occupancy trends will appear once there are apartments in the system.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Occupancy Trends Over Time</h3>
          <div className="h-[384px] min-h-[384px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={384}>
              <AreaChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="occupancy_rate" name="Occupancy Rate %" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="moving_avg_3month" name="3-Month Avg" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Current Occupancy Status</h3>
            <div className="space-y-4">
              {data.trends
                .filter((t: any, i: number, arr: any[]) => 
                  arr.findIndex(item => item.building_name === t.building_name) === i
                )
                .map((trend: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{trend.building_name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trend.occupancy_status === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                        trend.occupancy_status === 'Good' ? 'bg-blue-100 text-blue-700' :
                        trend.occupancy_status === 'Fair' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {trend.occupancy_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-slate-600 mb-1">
                          <span>Occupancy Rate</span>
                          <span>{trend.occupancy_rate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-violet-600"
                            style={{ width: `${Math.min(trend.occupancy_rate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Summary Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Average Occupancy Rate</span>
                <span className="font-bold text-xl text-slate-900">{data.summary?.averageOccupancy}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Best Performing Month</span>
                <span className="font-medium text-emerald-600">
                  {data.summary?.bestMonth?.month}: {data.summary?.bestMonth?.occupancy_rate}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Total Apartments Tracked</span>
                <span className="font-medium text-blue-600">{data.trends.reduce((sum: number, t: any) => sum + t.total_units, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMaintenanceAnalytics = () => {
    if (!data.cubeResults || data.cubeResults.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Maintenance Cost Analysis (CUBE Aggregation)</h3>
            <div className="h-64 flex items-center justify-center text-slate-500">
              No maintenance analytics data available
            </div>
          </div>
        </div>
      );
    }
    
    // Prepare pie chart data for categories
    const categoryData = Object.entries(data.processedData?.byCategory || {}).map(([key, value]: [string, any]) => ({
      name: key,
      value: value.totalCost || 0,
      color: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][Object.keys(data.processedData?.byCategory || {}).indexOf(key) % 4]
    }));
    
    // Prepare bar chart data for priorities
    const priorityData = Object.entries(data.processedData?.byPriority || {}).map(([key, value]: [string, any]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: value.requestCount || 0
    }));
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Maintenance Cost Analysis (CUBE Aggregation)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Category</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Priority</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Building</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Requests</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Total Cost</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Avg Cost</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Avg Days</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.cubeResults.map((row: any, index: number) => (
                  <tr key={index} className={`
                    hover:bg-slate-50
                    ${row.category === 'All Categories' || row.priority === 'All Priorities' || row.building_name === 'All Buildings' 
                      ? 'bg-slate-50 font-semibold' 
                      : ''}
                  `}>
                    <td className="p-3">{row.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                        row.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        row.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="p-3">{row.building_name}</td>
                    <td className="p-3">{row.request_count}</td>
                    <td className="p-3 font-medium">₹{parseFloat(row.total_cost || 0).toLocaleString()}</td>
                    <td className="p-3">₹{parseFloat(row.avg_cost || 0).toFixed(2)}</td>
                    <td className="p-3">
                      {row.avg_days_to_resolve ? `${parseFloat(row.avg_days_to_resolve).toFixed(1)} days` : 'N/A'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-emerald-600"
                            style={{ 
                              width: `${Math.min(parseFloat(row.resolution_rate || 0), 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm">
                          {row.resolution_rate ? `${parseFloat(row.resolution_rate).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Cost by Category</h3>
            <div className="h-[256px] min-h-[256px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                      return `${name}: ${percentage}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `₹${parseFloat(value as string).toLocaleString()}`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Requests by Priority</h3>
            <div className="h-[256px] min-h-[256px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Requests']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Cost by Building</h3>
            <div className="space-y-3">
              {Object.entries(data.processedData?.byBuilding || {}).map(([building, value]: [string, any]) => {
                const avgCost = value.requestCount > 0 
                  ? (value.totalCost / value.requestCount) 
                  : 0;
                
                return (
                  <div key={building} className="p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{building}</span>
                      <span className="text-sm font-medium text-slate-900">
                        ₹{parseFloat(value.totalCost).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {value.requestCount} request{value.requestCount !== 1 ? 's' : ''} • 
                      Avg: ₹{avgCost.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBuildingHierarchy = () => {
    if (!data.hierarchy || data.hierarchy.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaSitemap className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Building Hierarchy Data</h3>
            <p>Building hierarchy data will appear once buildings and floors are configured.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Building Hierarchy (Recursive CTE)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Hierarchy Path</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Level</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Apartments</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Occupied</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Vacant</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Occupancy Rate</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Monthly Rent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.hierarchy.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-${item.level * 4} ml-${item.level * 4}`}></div>
                        <span className={`${item.level === 0 ? 'font-bold text-lg' : ''}`}>
                          {item.hierarchy_path}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">
                        Level {item.level}
                      </span>
                    </td>
                    <td className="p-3">{item.apartment_count || 0}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                        {item.occupied_count || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs">
                        {item.vacant_count || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-violet-600"
                            style={{ width: `${Math.min(item.floor_occupancy_rate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{item.floor_occupancy_rate}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium">₹{parseFloat(item.total_monthly_rent || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentTrends = () => {
    if (!data.trends || data.trends.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaRegChartBar className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Payment Trend Data</h3>
            <p>Payment trends will appear once there are payments in the system.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Payment Trends with Window Functions</h3>
          <div className="h-[384px] min-h-[384px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={384}>
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="monthly_total" 
                  name="Monthly Total" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="running_total" 
                  name="Running Total" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Monthly Rankings</h3>
            <div className="space-y-3">
              {data.trends.slice(0, 6).map((trend: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        trend.month_rank === 1 ? 'bg-amber-100 text-amber-700' :
                        trend.month_rank <= 3 ? 'bg-violet-100 text-violet-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        #{trend.month_rank}
                      </div>
                      <span className="font-medium">{trend.month}</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      trend.growth_percentage > 0 ? 'text-emerald-600' :
                      trend.growth_percentage < 0 ? 'text-rose-600' :
                      'text-slate-600'
                    }`}>
                      {trend.growth_percentage > 0 ? '+' : ''}{trend.growth_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Collection:</span>
                    <span className="font-bold">₹{parseFloat(trend.monthly_total).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Trend Analysis</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Total Collected</span>
                <span className="font-bold text-xl text-slate-900">
                  ₹{data.summary?.totalCollected?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-emerald-700">Growth Months</span>
                <span className="font-bold text-emerald-700">{data.summary?.growthMonths}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-200">
                <span className="text-rose-700">Decline Months</span>
                <span className="font-bold text-rose-700">{data.summary?.declineMonths}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Average Monthly</span>
                <span className="font-bold text-xl text-violet-600">
                  ₹{parseFloat(data.summary?.averageMonthly || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPredictiveMetrics = () => {
    if (!data.predictions || data.predictions.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaExclamationTriangle className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Predictive Data</h3>
            <p>Predictive metrics will appear once there is sufficient payment history.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Predictive Risk Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Renter</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Apartment</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Total Payments</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Avg Delay (Days)</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Consistency</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Behavior</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Risk Level</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.predictions.map((prediction: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{prediction.name}</td>
                    <td className="p-3">{prediction.apartment_number}</td>
                    <td className="p-3">{prediction.total_payments}</td>
                    <td className="p-3">{prediction.avg_days_delay}</td>
                    <td className="p-3">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-emerald-600"
                          style={{ 
                            width: `${Math.max(0, 100 - (prediction.delay_consistency * 10))}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.payment_behavior === 'Early Payer' ? 'bg-emerald-100 text-emerald-700' :
                        prediction.payment_behavior === 'On Time' ? 'bg-blue-100 text-blue-700' :
                        prediction.payment_behavior === 'Occasionally Late' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {prediction.payment_behavior}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.risk_level === 'Low Risk' ? 'bg-emerald-100 text-emerald-700' :
                        prediction.risk_level === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {prediction.risk_level}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-600">{prediction.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDataValidation = () => {
    if (!data.validation || data.validation.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaCheckCircle className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Data Validation Available</h3>
            <p>Data validation metrics will appear once data is loaded.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Data Quality Validation (Regex Checks)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.validation.map((table: any, index: number) => (
              <div key={index} className="bg-slate-50 p-4 rounded-lg border">
                <h4 className="font-bold text-slate-900 mb-3 capitalize">{table.table_name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Records:</span>
                    <span className="font-medium">{table.total_records}</span>
                  </div>
                  {table.valid_phones && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Phones:</span>
                      <span className={`font-medium ${
                        (table.valid_phones / table.total_records) > 0.9 ? 'text-emerald-600' :
                        (table.valid_phones / table.total_records) > 0.7 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {table.valid_phones} ({(table.valid_phones / table.total_records * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  {table.valid_emails && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Emails:</span>
                      <span className={`font-medium ${
                        (table.valid_emails / table.total_records) > 0.9 ? 'text-emerald-600' :
                        (table.valid_emails / table.total_records) > 0.7 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {table.valid_emails} ({(table.valid_emails / table.total_records * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  {table.valid_nids && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid NIDs:</span>
                      <span className={`font-medium ${
                        (table.valid_nids / table.total_records) > 0.9 ? 'text-emerald-600' :
                        (table.valid_nids / table.total_records) > 0.7 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {table.valid_nids} ({(table.valid_nids / table.total_records * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  {table.valid_apt_numbers && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Apt Numbers:</span>
                      <span className="font-medium text-emerald-600">
                        {table.valid_apt_numbers} ({(table.valid_apt_numbers / table.total_records * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  {table.valid_transactions && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Transactions:</span>
                      <span className="font-medium text-emerald-600">
                        {table.valid_transactions} ({(table.valid_transactions / table.total_records * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  {table.valid_amounts && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Amounts:</span>
                      <span className="font-medium text-emerald-600">
                        {table.valid_amounts} ({(table.valid_amounts / table.total_records * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAuditLogs = () => {
    if (!data.logs || data.logs.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaClock className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Audit Logs Available</h3>
            <p>Audit logs will appear once system activity occurs.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Audit Logs (Trigger-Based)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Audit Type</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Record</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Old Status</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">New Status</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Changed At</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.logs.map((log: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.audit_type === 'payment' ? 'bg-violet-100 text-violet-700' :
                        log.audit_type === 'renter' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {log.audit_type}
                      </span>
                    </td>
                    <td className="p-3">
                      {log.audit_type === 'payment' ? (
                        <div>
                          <div className="font-medium">{log.renter_name}</div>
                          <div className="text-xs text-slate-500">Apt {log.apartment_number}</div>
                        </div>
                      ) : log.audit_type === 'renter' ? (
                        <div className="font-medium">{log.renter_name}</div>
                      ) : (
                        <div>
                          <div className="font-medium">{log.request_title}</div>
                          <div className="text-xs text-slate-500">Apt {log.apartment_number}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.old_status === 'paid' || log.old_status === 'active' || log.old_status === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-700' :
                          log.old_status === 'pending' 
                          ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                      }`}>
                        {log.old_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.new_status === 'paid' || log.new_status === 'active' || log.new_status === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-700' :
                          log.new_status === 'pending' 
                          ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                      }`}>
                        {log.new_status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-slate-600 max-w-xs truncate">
                      {log.change_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'payment-patterns':
        return renderPaymentPatterns();
      case 'occupancy-trends':
        return renderOccupancyTrends();
      case 'maintenance-analytics':
        return renderMaintenanceAnalytics();
      case 'building-hierarchy':
        return renderBuildingHierarchy();
      case 'payment-trends':
        return renderPaymentTrends();
      case 'predictive-metrics':
        return renderPredictiveMetrics();
      case 'data-validation':
        return renderDataValidation();
      case 'audit-logs':
        return renderAuditLogs();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Advanced Analytics</h1>
          <p className="text-slate-600">Advanced SQL features with window functions, recursive CTEs, CUBE, and triggers</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportData}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FaDownload />
            Export
          </button>
          <button 
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
          >
            <FaSearch />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-600' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;