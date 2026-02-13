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
  const [activeTab, setActiveTab] = useState('payment-patterns');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData>({});
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    months: 12,
    buildingId: ''
  });

  // Colors for charts
  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab, filters.months]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let params: any = {};
      
      switch (activeTab) {
        case 'payment-patterns':
          endpoint = '/manager/analytics/payment-patterns';
          params = { pattern: 'all' };
          break;
        case 'occupancy-trends':
          endpoint = '/manager/analytics/occupancy-trends';
          params = { months: filters.months };
          break;
        case 'maintenance-analytics':
          endpoint = '/manager/analytics/maintenance-analytics';
          if (filters.startDate) params.startDate = filters.startDate;
          if (filters.endDate) params.endDate = filters.endDate;
          break;
        case 'building-hierarchy':
          endpoint = '/manager/analytics/building-hierarchy';
          break;
        case 'payment-trends':
          endpoint = '/manager/analytics/payment-trends';
          params = { months: filters.months };
          break;
        case 'predictive-metrics':
          endpoint = '/manager/analytics/predictive-metrics';
          break;
        case 'data-validation':
          endpoint = '/manager/analytics/data-validation';
          break;
        case 'audit-logs':
          endpoint = '/manager/analytics/audit-logs';
          params = { days: 30 };
          break;
        default:
          endpoint = '/manager/analytics/payment-trends';
      }
      
      const response = await axios.get(`${API_URL}${endpoint}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(response.data.data || {});
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      if (error.response?.status === 404) {
        toast.error('Analytics endpoint not found. Please check backend routes.');
      } else {
        toast.error('Error loading analytics');
      }
      setData({});
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      const csvData = JSON.stringify(data, null, 2);
      const blob = new Blob([csvData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Analytics data exported!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const tabs = [
    { id: 'payment-patterns', label: 'Payment Patterns', icon: <FaMoneyBillWave /> },
    { id: 'occupancy-trends', label: 'Occupancy Trends', icon: <FaBuilding /> },
    { id: 'maintenance-analytics', label: 'Maintenance Analytics', icon: <FaTools /> },
    { id: 'building-hierarchy', label: 'Building Hierarchy', icon: <FaSitemap /> },
    { id: 'payment-trends', label: 'Payment Trends', icon: <FaRegChartBar /> },
    { id: 'predictive-metrics', label: 'Predictive Metrics', icon: <FaExclamationTriangle /> },
    { id: 'data-validation', label: 'Data Validation', icon: <FaCheckCircle /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <FaClock /> },
  ];

  const renderPaymentPatterns = () => {
    const patterns = data.patterns || [];
    const summary = data.summary || { total: 0, highRisk: 0, mediumRisk: 0, averageLatePercentage: 0 };
    
    if (patterns.length === 0) {
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
      { name: 'High Risk', value: summary.highRisk || 0, color: '#ef4444' },
      { name: 'Medium Risk', value: summary.mediumRisk || 0, color: '#f59e0b' },
      { name: 'Low Risk', value: patterns.length - (summary.highRisk || 0) - (summary.mediumRisk || 0), color: '#10b981' }
    ].filter(item => item.value > 0);
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Total Renters Analyzed</p>
            <p className="text-2xl font-bold mt-2">{summary.total || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">High Risk</p>
            <p className="text-2xl font-bold mt-2 text-rose-600">{summary.highRisk || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Medium Risk</p>
            <p className="text-2xl font-bold mt-2 text-amber-600">{summary.mediumRisk || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Avg Late %</p>
            <p className="text-2xl font-bold mt-2 text-violet-600">{summary.averageLatePercentage || 0}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Payment Risk Analysis</h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patterns.slice(0, 10)} margin={{ bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="renter_name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'late_payment_percentage') return [`${value}%`, 'Late %'];
                        if (name === 'total_payments') return [value, 'Total Payments'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="late_payment_percentage" name="Late Payment %" fill="#f59e0b" />
                    <Bar yAxisId="right" dataKey="total_payments" name="Total Payments" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Risk Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
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
                {patterns.map((pattern: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{pattern.renter_name || 'Unknown'}</td>
                    <td className="p-3">{pattern.apartment_number || 'N/A'}</td>
                    <td className="p-3">{pattern.total_payments || 0}</td>
                    <td className="p-3">{pattern.late_payments || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (pattern.late_payment_percentage || 0) > 50 ? 'bg-rose-100 text-rose-700' :
                        (pattern.late_payment_percentage || 0) > 20 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pattern.late_payment_percentage || 0}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pattern.risk_category === 'High Risk' ? 'bg-rose-100 text-rose-700' :
                        pattern.risk_category === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pattern.risk_category || 'Low Risk'}
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
    const trends = data.trends || [];
    const summary = data.summary || { averageOccupancy: 0, totalUnits: 0, occupiedUnits: 0 };
    
    if (trends.length === 0) {
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Average Occupancy</p>
            <p className="text-2xl font-bold mt-2 text-violet-600">{summary.averageOccupancy || 0}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Total Units</p>
            <p className="text-2xl font-bold mt-2">{summary.totalUnits || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Occupied Units</p>
            <p className="text-2xl font-bold mt-2 text-emerald-600">{summary.occupiedUnits || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Building Occupancy Rates</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="building_name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupancy_rate" name="Occupancy Rate %" fill="#8b5cf6">
                  {trends.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.occupancy_rate > 80 ? '#10b981' : entry.occupancy_rate > 60 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderMaintenanceAnalytics = () => {
    const byCategory = data.processedData?.byCategory || {};
    const byPriority = data.processedData?.byPriority || {};
    const summary = data.summary || { totalRequests: 0, totalCost: 0 };
    
    if (Object.keys(byCategory).length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaTools className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Maintenance Data</h3>
            <p>Maintenance analytics will appear once there are maintenance requests.</p>
          </div>
        </div>
      );
    }
    
    // Prepare category data
    const categoryData = Object.entries(byCategory).map(([key, value]: [string, any], index) => ({
      name: key,
      value: value.totalCost || 0,
      color: COLORS[index % COLORS.length]
    }));
    
    // Prepare priority data
    const priorityData = Object.entries(byPriority).map(([key, value]: [string, any]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: value.requestCount || 0
    }));
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Total Requests</p>
            <p className="text-2xl font-bold mt-2">{summary.totalRequests || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Total Cost</p>
            <p className="text-2xl font-bold mt-2 text-amber-600">{formatCurrency(summary.totalCost || 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Cost by Category</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Requests by Priority</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBuildingHierarchy = () => {
    const hierarchy = data.hierarchy || [];
    
    if (hierarchy.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <div className="text-center text-slate-500">
            <FaSitemap className="text-4xl mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Building Hierarchy Data</h3>
            <p>Building hierarchy data will appear once buildings are configured.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Building Hierarchy</h3>
          <div className="space-y-2">
            {hierarchy.map((item: any, index: number) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  item.level === 0 ? 'bg-violet-50 border border-violet-200' :
                  item.level === 1 ? 'bg-blue-50 border border-blue-200 ml-4' :
                  'bg-slate-50 border border-slate-200 ml-8'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.level === 0 ? <FaBuilding className="text-violet-600" /> : <FaSitemap className="text-blue-600" />}
                    <span className="font-medium">{item.name}</span>
                    {item.level === 0 && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full">
                        {item.apartment_count || 0} apts
                      </span>
                    )}
                  </div>
                  {item.level === 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-emerald-600">
                        {item.occupied_count || 0} occupied
                      </span>
                      <span className="text-sm text-amber-600">
                        {item.vacant_count || 0} vacant
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

  const renderPaymentTrends = () => {
    const trends = data.trends || [];
    const summary = data.summary || { totalCollected: 0, averageMonthly: 0 };
    
    if (trends.length === 0) {
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Total Collected</p>
            <p className="text-2xl font-bold mt-2 text-emerald-600">{formatCurrency(summary.totalCollected || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Average Monthly</p>
            <p className="text-2xl font-bold mt-2 text-violet-600">{formatCurrency(summary.averageMonthly || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Payment Trends</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="monthly_total" 
                  name="Monthly Collection" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="collection_rate" 
                  name="Collection Rate %" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderPredictiveMetrics = () => {
    const predictions = data.predictions || [];
    const summary = data.summary || { totalRentersAnalyzed: 0, highRiskCount: 0, mediumRiskCount: 0 };
    
    if (predictions.length === 0) {
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Renters Analyzed</p>
            <p className="text-2xl font-bold mt-2">{summary.totalRentersAnalyzed || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">High Risk</p>
            <p className="text-2xl font-bold mt-2 text-rose-600">{summary.highRiskCount || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-slate-600">Medium Risk</p>
            <p className="text-2xl font-bold mt-2 text-amber-600">{summary.mediumRiskCount || 0}</p>
          </div>
        </div>

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
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Behavior</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Risk Level</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {predictions.map((prediction: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{prediction.name || 'Unknown'}</td>
                    <td className="p-3">{prediction.apartment_number || 'N/A'}</td>
                    <td className="p-3">{prediction.total_payments || 0}</td>
                    <td className="p-3">{prediction.avg_days_delay?.toFixed(1) || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.payment_behavior === 'Early Payer' ? 'bg-emerald-100 text-emerald-700' :
                        prediction.payment_behavior === 'On Time' ? 'bg-blue-100 text-blue-700' :
                        prediction.payment_behavior === 'Occasionally Late' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {prediction.payment_behavior || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.risk_level === 'Low Risk' ? 'bg-emerald-100 text-emerald-700' :
                        prediction.risk_level === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {prediction.risk_level || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-600">{prediction.recommended_action || 'Monitor'}</td>
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
    const validation = data.validation || [];
    
    if (validation.length === 0) {
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
          <h3 className="font-bold text-slate-900 mb-4">Data Quality Validation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validation.map((table: any, index: number) => (
              <div key={index} className="bg-slate-50 p-4 rounded-lg border">
                <h4 className="font-bold text-slate-900 mb-3 capitalize">{table.table_name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Records:</span>
                    <span className="font-medium">{table.total_records}</span>
                  </div>
                  {table.valid_phones !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Phones:</span>
                      <span className={`font-medium ${
                        table.total_records > 0 && (table.valid_phones / table.total_records) > 0.9 ? 'text-emerald-600' :
                        table.total_records > 0 && (table.valid_phones / table.total_records) > 0.7 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {table.valid_phones} ({table.total_records > 0 ? ((table.valid_phones / table.total_records) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  )}
                  {table.valid_emails !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Emails:</span>
                      <span className={`font-medium ${
                        table.total_records > 0 && (table.valid_emails / table.total_records) > 0.9 ? 'text-emerald-600' :
                        table.total_records > 0 && (table.valid_emails / table.total_records) > 0.7 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {table.valid_emails} ({table.total_records > 0 ? ((table.valid_emails / table.total_records) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  )}
                  {table.valid_nids !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid NIDs:</span>
                      <span className={`font-medium ${
                        table.total_records > 0 && (table.valid_nids / table.total_records) > 0.9 ? 'text-emerald-600' :
                        table.total_records > 0 && (table.valid_nids / table.total_records) > 0.7 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {table.valid_nids} ({table.total_records > 0 ? ((table.valid_nids / table.total_records) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  )}
                  {table.valid_apt_numbers !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valid Apt Numbers:</span>
                      <span className="font-medium text-emerald-600">
                        {table.valid_apt_numbers} ({((table.valid_apt_numbers / table.total_records) * 100).toFixed(1)}%)
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
    const logs = data.logs || [];
    
    if (logs.length === 0) {
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
          <h3 className="font-bold text-slate-900 mb-4">Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Audit Type</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Details</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Old Status</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">New Status</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Changed At</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log: any, index: number) => (
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
                          {log.amount && <div className="text-xs text-slate-500">{formatCurrency(log.amount)}</div>}
                        </div>
                      ) : log.audit_type === 'renter' ? (
                        <div className="font-medium">{log.renter_name}</div>
                      ) : (
                        <div>
                          <div className="font-medium">{log.renter_name}</div>
                          <div className="text-xs text-slate-500">Apt {log.apartment_number}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.old_status === 'paid' || log.old_status === 'active' || log.old_status === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-700' :
                        log.old_status === 'pending' || log.old_status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {log.old_status || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.new_status === 'paid' || log.new_status === 'active' || log.new_status === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-700' :
                        log.new_status === 'pending' || log.new_status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {log.new_status || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {log.changed_at ? new Date(log.changed_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-3 text-sm text-slate-600 max-w-xs truncate">
                      {log.change_reason || 'N/A'}
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
        return renderPaymentPatterns();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Advanced Analytics</h1>
          <p className="text-slate-600">Deep insights into your building's performance</p>
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