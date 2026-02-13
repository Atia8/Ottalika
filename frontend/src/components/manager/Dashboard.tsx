// src/components/manager/ManagerDashboard.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUsers, 
  FaUserCheck, 
  FaExclamationTriangle, 
  FaArrowRight, 
  FaCheck, 
  FaTimes,
  FaBuilding,
  FaMoneyBillWave,
  FaHome,
  FaWrench,
  FaBell,
  FaReceipt,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaTools,
  FaFilter,
  FaDownload,
  FaCalendar,
  FaSitemap,
  FaRegChartBar,
  FaClock
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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

interface DashboardStats {
  totalRenters: number;
  pendingApprovals: number;
  pendingComplaints: number;
  pendingVerifications: number;
  occupancyRate: number;
  monthlyRevenue: number;
}

interface PendingRenter {
  id: number;
  name: string;
  email: string;
  apartment: string;
  rentAmount: number;
  submittedAt: string;
}

interface AnalyticsData {
  [key: string]: any;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('payment-trends');
  const [stats, setStats] = useState<DashboardStats>({
    totalRenters: 0,
    pendingApprovals: 0,
    pendingComplaints: 0,
    pendingVerifications: 0,
    occupancyRate: 0,
    monthlyRevenue: 0
  });
  const [pendingRenters, setPendingRenters] = useState<PendingRenter[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [occupancyRate, setOccupancyRate] = useState('0%');
  const [monthlyRevenue, setMonthlyRevenue] = useState('৳0');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  
  // Colors for charts
  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData('payment-trends');
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/manager/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        setStats(data.stats);
        setOccupancyRate(`${data.stats.occupancyRate}%`);
        setMonthlyRevenue(`৳${data.stats.monthlyRevenue.toLocaleString('en-BD')}`);
        
        if (data.recentActivities) {
          setRecentActivity(data.recentActivities);
        }
      }

      // Fetch pending renters
      const rentersResponse = await axios.get(`${API_URL}/manager/renters`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (rentersResponse.data.success) {
        const pending = rentersResponse.data.data.renters
          .filter((r: any) => r.status === 'pending')
          .slice(0, 3)
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            apartment: r.apartment,
            rentAmount: r.rentAmount,
            submittedAt: '2 days ago'
          }));
        setPendingRenters(pending);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async (tab: string) => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let params: any = {};
      
      switch (tab) {
        case 'payment-trends':
          endpoint = '/manager/analytics/payment-trends';
          params = { months: 6 };
          break;
        case 'payment-patterns':
          endpoint = '/manager/analytics/payment-patterns';
          params = { pattern: 'all' };
          break;
        case 'occupancy-trends':
          endpoint = '/manager/analytics/occupancy-trends';
          params = { months: 6 };
          break;
        case 'maintenance-analytics':
          endpoint = '/manager/analytics/maintenance-analytics';
          break;
        case 'building-hierarchy':
          endpoint = '/manager/analytics/building-hierarchy';
          break;
        default:
          endpoint = '/manager/analytics/payment-trends';
      }
      
      const response = await axios.get(`${API_URL}${endpoint}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAnalyticsData(response.data.data || {});
      }
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      // Don't show error toast for analytics - just log it
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleAnalyticsTabChange = (tab: string) => {
    setActiveAnalyticsTab(tab);
    fetchAnalyticsData(tab);
  };

  const handleApproveRenter = async (renterId: number) => {
    try {
      const token = localStorage.getItem('token');
      const renter = pendingRenters.find(r => r.id === renterId);
      
      await axios.post(`${API_URL}/manager/renters/${renterId}/approve`, {
        apartment: renter?.apartment,
        rentAmount: renter?.rentAmount || 5000,
        leaseStart: new Date().toISOString().split('T')[0],
        leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Renter approved successfully!`);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve renter:', error);
      toast.error('Failed to approve renter');
    }
  };

  const handleRejectRenter = async (renterId: number) => {
    try {
      const token = localStorage.getItem('token');
      const renter = pendingRenters.find(r => r.id === renterId);
      
      await axios.delete(`${API_URL}/manager/renters/${renterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Renter rejected`);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to reject renter:', error);
      toast.error('Failed to reject renter');
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatCompactCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '৳0';
    if (amount >= 1000000) {
      return `৳${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `৳${(amount / 1000).toFixed(1)}K`;
    }
    return `৳${amount}`;
  };

  // Analytics renderers
  const renderPaymentTrends = () => {
    const trends = analyticsData.trends || [];
    const summary = analyticsData.summary || { totalCollected: 0, averageMonthly: 0 };
    
    if (trends.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FaRegChartBar className="text-3xl mx-auto mb-2 text-slate-300" />
          <p>No payment trend data available</p>
        </div>
      );
    }
    
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600">Total Collected (6mo)</p>
            <p className="text-lg font-bold text-emerald-600">{formatCompactCurrency(summary.totalCollected || 0)}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600">Monthly Average</p>
            <p className="text-lg font-bold text-violet-600">{formatCompactCurrency(summary.averageMonthly || 0)}</p>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line 
                type="monotone" 
                dataKey="monthly_total" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPaymentPatterns = () => {
    const patterns = analyticsData.patterns || [];
    const summary = analyticsData.summary || { highRisk: 0, mediumRisk: 0 };
    
    if (patterns.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FaMoneyBillWave className="text-3xl mx-auto mb-2 text-slate-300" />
          <p>No payment pattern data</p>
        </div>
      );
    }
    
    const pieData = [
      { name: 'High Risk', value: summary.highRisk || 0, color: '#ef4444' },
      { name: 'Medium Risk', value: summary.mediumRisk || 0, color: '#f59e0b' },
      { name: 'Low Risk', value: patterns.length - (summary.highRisk || 0) - (summary.mediumRisk || 0), color: '#10b981' }
    ].filter(item => item.value > 0);
    
    return (
      <div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-rose-50 p-2 rounded-lg text-center">
            <p className="text-xs text-rose-600">High Risk</p>
            <p className="text-lg font-bold text-rose-600">{summary.highRisk || 0}</p>
          </div>
          <div className="bg-amber-50 p-2 rounded-lg text-center">
            <p className="text-xs text-amber-600">Medium Risk</p>
            <p className="text-lg font-bold text-amber-600">{summary.mediumRisk || 0}</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg text-center">
            <p className="text-xs text-emerald-600">Low Risk</p>
            <p className="text-lg font-bold text-emerald-600">{patterns.length - (summary.highRisk || 0) - (summary.mediumRisk || 0)}</p>
          </div>
        </div>
        <div className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderOccupancyTrends = () => {
    const trends = analyticsData.trends || [];
    const summary = analyticsData.summary || { averageOccupancy: 0 };
    
    if (trends.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FaBuilding className="text-3xl mx-auto mb-2 text-slate-300" />
          <p>No occupancy data</p>
        </div>
      );
    }
    
    return (
      <div>
        <div className="mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-blue-600">Average Occupancy</p>
            <p className="text-2xl font-bold text-blue-600">{summary.averageOccupancy || 0}%</p>
          </div>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="building_name" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="occupancy_rate" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {trends.slice(0, 5).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.occupancy_rate > 80 ? '#10b981' : entry.occupancy_rate > 60 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMaintenanceAnalytics = () => {
    const byPriority = analyticsData.processedData?.byPriority || {};
    
    const priorityData = Object.entries(byPriority).map(([key, value]: [string, any]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: value.requestCount || 0
    }));
    
    if (priorityData.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FaTools className="text-3xl mx-auto mb-2 text-slate-300" />
          <p>No maintenance data</p>
        </div>
      );
    }
    
    return (
      <div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderBuildingHierarchy = () => {
    const hierarchy = analyticsData.hierarchy || [];
    
    if (hierarchy.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FaSitemap className="text-3xl mx-auto mb-2 text-slate-300" />
          <p>No building hierarchy</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 max-h-[250px] overflow-y-auto">
        {hierarchy.filter((item: any) => item.level === 0).map((building: any, index: number) => (
          <div key={index} className="p-2 bg-violet-50 rounded-lg border border-violet-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBuilding className="text-violet-600 text-xs" />
                <span className="font-medium text-sm">{building.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-600">{building.occupied_count || 0} occ</span>
                <span className="text-amber-600">{building.vacant_count || 0} vac</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const analyticsTabs = [
    { id: 'payment-trends', label: 'Payment Trends', icon: <FaRegChartBar />, render: renderPaymentTrends },
    { id: 'payment-patterns', label: 'Risk Analysis', icon: <FaChartPie />, render: renderPaymentPatterns },
    { id: 'occupancy-trends', label: 'Occupancy', icon: <FaBuilding />, render: renderOccupancyTrends },
    { id: 'maintenance-analytics', label: 'Maintenance', icon: <FaTools />, render: renderMaintenanceAnalytics },
    { id: 'building-hierarchy', label: 'Buildings', icon: <FaSitemap />, render: renderBuildingHierarchy },
  ];

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600">Welcome back! Here's what's happening today.</p>
        </div>
        <button 
          onClick={() => {
            fetchDashboardData();
            fetchAnalyticsData(activeAnalyticsTab);
          }}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          <FaChartLine />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Renters</p>
              <p className="text-3xl font-bold mt-2 text-slate-900">{stats.totalRenters}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/50 text-blue-600">
              <FaUsers className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
              <p className="text-3xl font-bold mt-2 text-slate-900">{stats.pendingApprovals}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/50 text-amber-600">
              <FaUserCheck className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Complaints</p>
              <p className="text-3xl font-bold mt-2 text-slate-900">{stats.pendingComplaints}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/50 text-rose-600">
              <FaExclamationTriangle className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Verifications</p>
              <p className="text-3xl font-bold mt-2 text-slate-900">{stats.pendingVerifications}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/50 text-violet-600">
              <FaReceipt className="text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaChartLine className="text-violet-600" />
            Analytics & Insights
          </h2>
        </div>
        
        {/* Analytics Tabs */}
        <div className="flex overflow-x-auto border-b bg-white">
          {analyticsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleAnalyticsTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeAnalyticsTab === tab.id 
                  ? 'text-violet-700 border-b-2 border-violet-600' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Analytics Content */}
        <div className="p-4">
          {analyticsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
            </div>
          ) : (
            analyticsTabs.find(t => t.id === activeAnalyticsTab)?.render() || renderPaymentTrends()
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Renters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending Renter Requests</h2>
              <p className="text-sm text-slate-500">Awaiting your approval</p>
            </div>
            <button 
              className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center"
              onClick={() => navigateTo('/manager/renters')}
            >
              View All
              <FaArrowRight className="ml-2" />
            </button>
          </div>

          <div className="space-y-4">
            {pendingRenters.length === 0 ? (
              <div className="text-center py-8">
                <FaUsers className="text-4xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No pending renter requests</p>
              </div>
            ) : (
              pendingRenters.map((renter) => (
                <div key={renter.id} className="p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {renter.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{renter.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <FaHome className="text-slate-400 text-xs" />
                            <p className="text-sm text-slate-500">{renter.apartment}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaMoneyBillWave className="text-slate-400 text-xs" />
                            <p className="text-sm text-slate-500">৳{renter.rentAmount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center"
                        onClick={() => handleApproveRenter(renter.id)}
                      >
                        <FaCheck className="mr-1" size={12} />
                        Approve
                      </button>
                      <button 
                        className="px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm flex items-center"
                        onClick={() => handleRejectRenter(renter.id)}
                      >
                        <FaTimes className="mr-1" size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">{renter.email} • {renter.submittedAt}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{occupancyRate}</p>
              <p className="text-sm text-slate-500">Occupancy Rate</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{monthlyRevenue}</p>
              <p className="text-sm text-slate-500">Monthly Revenue</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <FaBell className="text-slate-400" />
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <FaBell className="text-4xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'payment' ? 'bg-emerald-500' :
                    activity.type === 'maintenance' ? 'bg-amber-500' :
                    activity.type === 'renter_approval' ? 'bg-blue-500' : 'bg-violet-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{activity.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigateTo('/manager/payments')}
            className="p-4 rounded-xl border border-slate-200 bg-violet-50 text-violet-600 hover:bg-violet-100 font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaReceipt className="text-xl" />
            <span>Verify Payments ({stats.pendingVerifications})</span>
          </button>
          <button
            onClick={() => navigateTo('/manager/notices')}
            className="p-4 rounded-xl border border-slate-200 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaBell className="text-xl" />
            <span>Send Notice</span>
          </button>
          <button
            onClick={() => navigateTo('/manager/maintenance')}
            className="p-4 rounded-xl border border-slate-200 bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaWrench className="text-xl" />
            <span>Maintenance</span>
          </button>
          <button
            onClick={() => navigateTo('/manager/bills')}
            className="p-4 rounded-xl border border-slate-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaMoneyBillWave className="text-xl" />
            <span>Manage Bills</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;