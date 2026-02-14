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
  FaClock,
  FaSync,
  FaEye,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFileInvoice,
  FaCreditCard,
  FaUserPlus,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
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
  Area,
  ComposedChart,
  Scatter
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  totalRenters: number;
  pendingApprovals: number;
  pendingComplaints: number;
  pendingVerifications: number;
  pendingBills: number;
  totalTasks: number;
  completedTasks: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

interface PendingRenter {
  id: number;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  building?: string;
  rentAmount: number;
  submittedAt: string;
  status: string;
}

interface RecentActivity {
  id: number;
  type: 'payment' | 'maintenance' | 'renter_approval' | 'complaint' | 'bill';
  title: string;
  time: string;
  status: string;
  amount?: number;
  amount_display?: string;
  priority?: string;
}

interface PaymentTrend {
  month: string;
  monthly_total: number;
  total_payments: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  collection_rate: number;
  running_total?: number;
  growth_percentage?: number;
}

interface PaymentPattern {
  renter_id: number;
  name: string;
  apartment_number: string;
  total_payments: number;
  late_payments: number;
  avg_days_delay: number;
  late_payment_percentage: number;
  risk_category: string;
  payment_behavior: string;
}

interface OccupancyData {
  building_name: string;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  maintenance_units: number;
  occupancy_rate: number;
  monthly_revenue: number;
}

interface MaintenanceData {
  priority: string;
  requestCount: number;
  totalCost: number;
  avgCost: number;
  avgDaysToResolve: number;
}

interface BuildingData {
  id: number;
  name: string;
  level: number;
  apartment_count: number;
  occupied_count: number;
  vacant_count: number;
  maintenance_count: number;
}

interface AnalyticsData {
  trends?: PaymentTrend[];
  patterns?: PaymentPattern[];
  occupancy?: OccupancyData[];
  maintenance?: Record<string, MaintenanceData>;
  hierarchy?: BuildingData[];
  summary?: any;
  processedData?: any;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('payment-trends');
  const [stats, setStats] = useState<DashboardStats>({
    totalRenters: 0,
    pendingApprovals: 0,
    pendingComplaints: 0,
    pendingVerifications: 0,
    pendingBills: 0,
    totalTasks: 0,
    completedTasks: 0,
    monthlyRevenue: 0,
    occupancyRate: 0
  });
  const [pendingRenters, setPendingRenters] = useState<PendingRenter[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [dateRange, setDateRange] = useState('6');
  
  // Colors for charts
  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData(activeAnalyticsTab);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/manager/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        setStats(data.stats);
        
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
            phone: r.phone || 'N/A',
            apartment: r.apartment || 'Not assigned',
            building: r.building || 'Main Building',
            rentAmount: r.rentAmount || 5000,
            submittedAt: '2 days ago',
            status: r.status
          }));
        setPendingRenters(pending);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Error loading dashboard data');
      
      // Fallback data
      setStats({
        totalRenters: 7,
        pendingApprovals: 3,
        pendingComplaints: 5,
        pendingVerifications: 4,
        pendingBills: 2,
        totalTasks: 38,
        completedTasks: 15,
        monthlyRevenue: 25000,
        occupancyRate: 85
      });
      
      setRecentActivity([
        {
          id: 1,
          type: 'payment',
          title: 'Rent payment received from Apartment 101',
          time: '2 hours ago',
          status: 'completed',
          amount: 5000,
          amount_display: '৳5,000'
        },
        {
          id: 2,
          type: 'renter_approval',
          title: 'New renter application for Apartment 103',
          time: '4 hours ago',
          status: 'pending',
          priority: 'medium'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
          params = { months: dateRange };
          break;
        case 'payment-patterns':
          endpoint = '/manager/analytics/payment-patterns';
          params = { pattern: 'all' };
          break;
        case 'occupancy-trends':
          endpoint = '/manager/analytics/occupancy-trends';
          params = { months: dateRange };
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
      // Set mock data based on tab
      setMockAnalyticsData(tab);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const setMockAnalyticsData = (tab: string) => {
    switch (tab) {
      case 'payment-trends':
        setAnalyticsData({
          trends: [
            { month: 'Jan 2024', monthly_total: 25000, total_payments: 8, paid_count: 7, pending_count: 1, overdue_count: 0, collection_rate: 87.5 },
            { month: 'Feb 2024', monthly_total: 27000, total_payments: 8, paid_count: 8, pending_count: 0, overdue_count: 0, collection_rate: 100 },
            { month: 'Mar 2024', monthly_total: 26000, total_payments: 8, paid_count: 7, pending_count: 0, overdue_count: 1, collection_rate: 87.5 },
            { month: 'Apr 2024', monthly_total: 28000, total_payments: 9, paid_count: 8, pending_count: 1, overdue_count: 0, collection_rate: 88.9 },
            { month: 'May 2024', monthly_total: 30000, total_payments: 9, paid_count: 9, pending_count: 0, overdue_count: 0, collection_rate: 100 },
            { month: 'Jun 2024', monthly_total: 29000, total_payments: 9, paid_count: 8, pending_count: 1, overdue_count: 0, collection_rate: 88.9 }
          ],
          summary: {
            totalCollected: 165000,
            averageMonthly: 27500
          }
        });
        break;
      case 'payment-patterns':
        setAnalyticsData({
          patterns: [
            { renter_id: 1, name: 'John Doe', apartment_number: '101', total_payments: 12, late_payments: 2, avg_days_delay: 3.5, late_payment_percentage: 16.67, risk_category: 'Low Risk', payment_behavior: 'Occasionally Late' },
            { renter_id: 2, name: 'Sarah Smith', apartment_number: '102', total_payments: 10, late_payments: 5, avg_days_delay: 8.2, late_payment_percentage: 50, risk_category: 'Medium Risk', payment_behavior: 'Frequently Late' },
            { renter_id: 3, name: 'Robert Johnson', apartment_number: '201', total_payments: 8, late_payments: 6, avg_days_delay: 12.5, late_payment_percentage: 75, risk_category: 'High Risk', payment_behavior: 'Frequently Late' }
          ],
          summary: {
            total: 3,
            highRisk: 1,
            mediumRisk: 1,
            lowRisk: 1,
            averageLatePercentage: '47.22'
          }
        });
        break;
      case 'occupancy-trends':
        setAnalyticsData({
          trends: [
            { building_name: 'Main Building', total_units: 20, occupied_units: 18, vacant_units: 2, maintenance_units: 0, occupancy_rate: 90, monthly_revenue: 180000 },
            { building_name: 'Green Valley', total_units: 15, occupied_units: 12, vacant_units: 2, maintenance_units: 1, occupancy_rate: 80, monthly_revenue: 120000 },
            { building_name: 'Sunset Apartments', total_units: 12, occupied_units: 10, vacant_units: 1, maintenance_units: 1, occupancy_rate: 83.33, monthly_revenue: 100000 }
          ],
          summary: {
            averageOccupancy: 84.44,
            totalBuildings: 3,
            totalUnits: 47,
            occupiedUnits: 40
          }
        });
        break;
      case 'maintenance-analytics':
        setAnalyticsData({
          processedData: {
            byPriority: {
              urgent: { requestCount: 3, totalCost: 15000, avgCost: 5000, avgDaysToResolve: 1.5 },
              high: { requestCount: 5, totalCost: 20000, avgCost: 4000, avgDaysToResolve: 2.8 },
              medium: { requestCount: 8, totalCost: 25000, avgCost: 3125, avgDaysToResolve: 4.2 },
              low: { requestCount: 4, totalCost: 8000, avgCost: 2000, avgDaysToResolve: 6.0 }
            }
          }
        });
        break;
      case 'building-hierarchy':
        setAnalyticsData({
          hierarchy: [
            { id: 1, name: 'Main Building', level: 0, apartment_count: 20, occupied_count: 18, vacant_count: 2, maintenance_count: 0 },
            { id: 2, name: 'Green Valley', level: 0, apartment_count: 15, occupied_count: 12, vacant_count: 2, maintenance_count: 1 },
            { id: 3, name: 'Sunset Apartments', level: 0, apartment_count: 12, occupied_count: 10, vacant_count: 1, maintenance_count: 1 }
          ],
          summary: {
            totalBuildings: 3,
            totalApartments: 47,
            totalOccupied: 40,
            totalVacant: 5,
            totalMaintenance: 2
          }
        });
        break;
    }
  };

  const handleAnalyticsTabChange = (tab: string) => {
    setActiveAnalyticsTab(tab);
    fetchAnalyticsData(tab);
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    if (activeAnalyticsTab === 'payment-trends' || activeAnalyticsTab === 'occupancy-trends') {
      fetchAnalyticsData(activeAnalyticsTab);
    }
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
      
      toast.success(`${renter?.name} approved successfully!`);
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
      
      toast.success(`${renter?.name} rejected`);
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
    
    // Format data for chart
    const chartData = trends.map((t: any) => ({
      month: t.month,
      amount: t.monthly_total || 0,
      payments: t.total_payments || 0,
      collectionRate: t.collection_rate || 0
    }));
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600">Total Collected (6mo)</p>
              <p className="text-lg font-bold text-emerald-600">{formatCompactCurrency(summary.totalCollected || 0)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600">Monthly Average</p>
              <p className="text-lg font-bold text-violet-600">{formatCompactCurrency(summary.averageMonthly || 0)}</p>
            </div>
          </div>
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="ml-4 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </select>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'amount') return [formatCurrency(value), 'Amount'];
                  if (name === 'collectionRate') return [`${value}%`, 'Collection Rate'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Amount" />
              <Line yAxisId="right" type="monotone" dataKey="collectionRate" stroke="#10b981" strokeWidth={2} name="Collection Rate" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {chartData.length > 0 && (
          <div className="mt-2 text-xs text-slate-500 text-center">
            Avg. Collection Rate: {Math.round(chartData.reduce((sum, d) => sum + d.collectionRate, 0) / chartData.length)}%
          </div>
        )}
      </div>
    );
  };

  const renderPaymentPatterns = () => {
    const patterns = analyticsData.patterns || [];
    const summary = analyticsData.summary || { highRisk: 0, mediumRisk: 0, lowRisk: 0, averageLatePercentage: '0' };
    
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
      { name: 'Low Risk', value: summary.lowRisk || 0, color: '#10b981' }
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
            <p className="text-lg font-bold text-emerald-600">{summary.lowRisk || 0}</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-[150px] w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 max-h-[150px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-600">
                  <th className="text-left">Renter</th>
                  <th className="text-left">Apt</th>
                  <th className="text-right">Late %</th>
                  <th className="text-right">Risk</th>
                </tr>
              </thead>
              <tbody>
                {patterns.slice(0, 3).map((p: any) => (
                  <tr key={p.renter_id} className="border-t border-slate-100">
                    <td className="py-1">{p.name}</td>
                    <td>{p.apartment_number}</td>
                    <td className="text-right">{p.late_payment_percentage}%</td>
                    <td className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        p.risk_category === 'High Risk' ? 'bg-rose-100 text-rose-700' :
                        p.risk_category === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.risk_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 text-center">
          Average Late Payment: {summary.averageLatePercentage}%
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
    
    // Format data for chart
    const chartData = trends.slice(0, 5).map((t: any) => ({
      name: t.building_name?.length > 12 ? t.building_name.substring(0, 10) + '...' : t.building_name,
      fullName: t.building_name,
      rate: t.occupancy_rate || 0,
      occupied: t.occupied_units || 0,
      total: t.total_units || 0,
      revenue: t.monthly_revenue || 0
    }));
    
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-blue-600">Average Occupancy</p>
            <p className="text-2xl font-bold text-blue-600">{summary.averageOccupancy?.toFixed(1) || 0}%</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-xs text-green-600">Total Units</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalUnits || trends.reduce((sum: number, t: any) => sum + t.total_units, 0)}</p>
          </div>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any) => `${value}%`}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.rate > 80 ? '#10b981' : entry.rate > 60 ? '#f59e0b' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-slate-500 text-center">
          Monthly Revenue: {formatCurrency(trends.reduce((sum, t) => sum + (t.monthly_revenue || 0), 0))}
        </div>
      </div>
    );
  };

  const renderMaintenanceAnalytics = () => {
    const byPriority = analyticsData.processedData?.byPriority || {};
    
    const priorityData = Object.entries(byPriority).map(([key, value]: [string, any]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: value.requestCount || 0,
      cost: value.totalCost || 0,
      avgDays: value.avgDaysToResolve || 0
    })).sort((a, b) => {
      const order = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
      return (order[a.name as keyof typeof order] || 5) - (order[b.name as keyof typeof order] || 5);
    });
    
    if (priorityData.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FaTools className="text-3xl mx-auto mb-2 text-slate-300" />
          <p>No maintenance data</p>
        </div>
      );
    }
    
    const totalRequests = priorityData.reduce((sum, d) => sum + d.count, 0);
    const totalCost = priorityData.reduce((sum, d) => sum + d.cost, 0);
    const avgResolution = priorityData.reduce((sum, d) => sum + d.avgDays, 0) / priorityData.length;
    
    return (
      <div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 p-2 rounded-lg text-center">
            <p className="text-xs text-slate-600">Total Requests</p>
            <p className="text-lg font-bold text-slate-900">{totalRequests}</p>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg text-center">
            <p className="text-xs text-slate-600">Total Cost</p>
            <p className="text-lg font-bold text-amber-600">{formatCompactCurrency(totalCost)}</p>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg text-center">
            <p className="text-xs text-slate-600">Avg Resolution</p>
            <p className="text-lg font-bold text-blue-600">{avgResolution.toFixed(1)} days</p>
          </div>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'count') return [`${value} requests`, 'Count'];
                  if (name === 'cost') return [formatCurrency(value), 'Cost'];
                  if (name === 'avgDays') return [`${value} days`, 'Avg Resolution'];
                  return value;
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="count">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {priorityData.map((item) => (
            <div key={item.name} className="flex justify-between p-1 bg-slate-50 rounded">
              <span className="text-slate-600">{item.name}:</span>
              <span className="font-medium">{item.count} req</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBuildingHierarchy = () => {
    const hierarchy = analyticsData.hierarchy || [];
    const summary = analyticsData.summary || { totalBuildings: 0, totalApartments: 0, totalOccupied: 0 };
    
    if (hierarchy.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FaSitemap className="text-3xl mx-auto mb-2 text-slate-300" />
          <p>No building hierarchy</p>
        </div>
      );
    }
    
    return (
      <div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-violet-50 p-2 rounded-lg text-center">
            <p className="text-xs text-violet-600">Buildings</p>
            <p className="text-lg font-bold text-violet-600">{summary.totalBuildings || hierarchy.length}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg text-center">
            <p className="text-xs text-blue-600">Apartments</p>
            <p className="text-lg font-bold text-blue-600">{summary.totalApartments || hierarchy.reduce((sum: number, b: any) => sum + (b.apartment_count || 0), 0)}</p>
          </div>
          <div className="bg-green-50 p-2 rounded-lg text-center">
            <p className="text-xs text-green-600">Occupied</p>
            <p className="text-lg font-bold text-green-600">{summary.totalOccupied || hierarchy.reduce((sum: number, b: any) => sum + (b.occupied_count || 0), 0)}</p>
          </div>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {hierarchy.filter((item: any) => item.level === 0).map((building: any, index: number) => (
            <div key={index} className="p-3 bg-violet-50 rounded-lg border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer"
                 onClick={() => navigateTo(`/manager/buildings/${building.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-violet-600 text-sm" />
                  <span className="font-medium text-sm">{building.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-600 font-medium">{building.occupied_count || 0} occ</span>
                  <span className="text-amber-600 font-medium">{building.vacant_count || 0} vac</span>
                  {(building.maintenance_count || 0) > 0 && (
                    <span className="text-rose-600 font-medium">{building.maintenance_count} mnt</span>
                  )}
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-violet-600 h-1.5 rounded-full" 
                  style={{ width: building.apartment_count ? ((building.occupied_count || 0) / building.apartment_count) * 100 : 0 }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500 text-center">
          Click on a building to view details
        </div>
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              fetchDashboardData();
              fetchAnalyticsData(activeAnalyticsTab);
            }}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={() => navigateTo('/manager/reports')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
          >
            <FaChartLine />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Renters</p>
              <p className="text-3xl font-bold mt-2 text-slate-900">{stats.totalRenters}</p>
              <p className="text-xs text-slate-500 mt-1">Active renters</p>
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
              <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
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
              <p className="text-xs text-slate-500 mt-1">Need attention</p>
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
              <p className="text-xs text-slate-500 mt-1">Payments to verify</p>
            </div>
            <div className="p-3 rounded-xl bg-white/50 text-violet-600">
              <FaReceipt className="text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Monthly Revenue</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.monthlyRevenue)}</p>
          </div>
          <FaMoneyBillWave className="text-2xl text-emerald-500" />
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Occupancy Rate</p>
            <p className="text-xl font-bold text-slate-900">{stats.occupancyRate}%</p>
          </div>
          <FaHome className="text-2xl text-blue-500" />
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Total Tasks</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalTasks}</p>
          </div>
          <FaClock className="text-2xl text-amber-500" />
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Completed Tasks</p>
            <p className="text-xl font-bold text-slate-900">{stats.completedTasks}</p>
          </div>
          <FaCheck className="text-2xl text-green-500" />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaChartLine className="text-violet-600" />
            Analytics & Insights
          </h2>
        </div>
        
        {/* Analytics Tabs */}
        <div className="flex overflow-x-auto border-b bg-white scrollbar-hide">
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
              <span className="text-lg">{tab.icon}</span>
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
                <div key={renter.id} className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                            <p className="text-sm text-slate-500">{formatCurrency(renter.rentAmount)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <FaEnvelope className="text-slate-400 text-xs" />
                          <p className="text-xs text-slate-500">{renter.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1"
                        onClick={() => handleApproveRenter(renter.id)}
                      >
                        <FaCheck size={12} />
                        Approve
                      </button>
                      <button 
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm flex items-center gap-1"
                        onClick={() => handleRejectRenter(renter.id)}
                      >
                        <FaTimes size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                    <FaClock className="text-xs" />
                    Submitted {renter.submittedAt}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
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
                <div key={index} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'payment' ? 'bg-emerald-500' :
                    activity.type === 'maintenance' ? 'bg-amber-500' :
                    activity.type === 'renter_approval' ? 'bg-blue-500' : 'bg-violet-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400">{activity.time}</p>
                      {activity.amount_display && (
                        <>
                          <span className="text-slate-300">•</span>
                          <p className="text-xs font-medium text-emerald-600">{activity.amount_display}</p>
                        </>
                      )}
                      {activity.priority && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activity.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                            activity.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {activity.priority}
                          </span>
                        </>
                      )}
                    </div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button
            onClick={() => navigateTo('/manager/payments')}
            className="p-4 rounded-xl border border-slate-200 bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaReceipt className="text-xl" />
            <span className="text-xs text-center">Verify Payments</span>
            {stats.pendingVerifications > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                {stats.pendingVerifications}
              </span>
            )}
          </button>
          
          <button
            onClick={() => navigateTo('/manager/renters/add')}
            className="p-4 rounded-xl border border-slate-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaUserPlus className="text-xl" />
            <span className="text-xs text-center">Add Renter</span>
          </button>
          
          <button
            onClick={() => navigateTo('/manager/maintenance')}
            className="p-4 rounded-xl border border-slate-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaWrench className="text-xl" />
            <span className="text-xs text-center">Maintenance</span>
            {stats.pendingComplaints > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                {stats.pendingComplaints}
              </span>
            )}
          </button>
          
          <button
            onClick={() => navigateTo('/manager/bills')}
            className="p-4 rounded-xl border border-slate-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaMoneyBillWave className="text-xl" />
            <span className="text-xs text-center">Manage Bills</span>
          </button>
          
          <button
            onClick={() => navigateTo('/manager/complaints')}
            className="p-4 rounded-xl border border-slate-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaExclamationTriangle className="text-xl" />
            <span className="text-xs text-center">Complaints</span>
          </button>
          
          <button
            onClick={() => navigateTo('/manager/messages')}
            className="p-4 rounded-xl border border-slate-200 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium flex flex-col items-center justify-center gap-2"
          >
            <FaBell className="text-xl" />
            <span className="text-xs text-center">Messages</span>
          </button>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600">Task Completion Rate</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-violet-600 h-2 rounded-full" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-900">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600">Collection Rate</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full" 
                style={{ width: '92%' }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-900">92%</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600">Occupancy Target</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${stats.occupancyRate}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-900">{stats.occupancyRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;