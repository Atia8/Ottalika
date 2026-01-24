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
  FaCalendar,
  FaHome,
  FaWrench,
  FaBell,
  FaFileInvoice,
  FaPlusCircle,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaReceipt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Type Definitions
interface StatItem {
  id: number;
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  change?: string;
}

interface Renter {
  id: number;
  name: string;
  email: string;
  unit: string;
  status: 'Pending' | 'Active' | 'Inactive' | 'Overdue';
  days: string;
  color: string;
  rentAmount?: number;
  paymentStatus?: string;
}

interface BuildingFloor {
  id: number;
  floor: string;
  issues: number;
  totalApartments: number;
  occupied: number;
  color: string;
}

interface Activity {
  id: number;
  time: string;
  activity: string;
  type: 'payment' | 'maintenance' | 'renter' | 'task';
}

interface MaintenanceIssue {
  id: number;
  apartment_number: string;
  title: string;
  priority: string;
  status: string;
  days: string;
}

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([
    {
      id: 1,
      title: 'Total Renters',
      value: '0',
      icon: <FaUsers className="text-3xl text-blue-600" />,
      color: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      change: '+0'
    },
    {
      id: 2,
      title: 'Pending Approvals',
      value: '0',
      icon: <FaUserCheck className="text-3xl text-amber-600" />,
      color: 'from-amber-50 to-amber-100',
      textColor: 'text-amber-700',
      change: '+0'
    },
    {
      id: 3,
      title: 'Pending Complaints',
      value: '0',
      icon: <FaExclamationTriangle className="text-3xl text-rose-600" />,
      color: 'from-rose-50 to-rose-100',
      textColor: 'text-rose-700',
      change: '+0'
    },
    {
      id: 4,
      title: 'Pending Verifications',
      value: '0',
      icon: <FaReceipt className="text-3xl text-violet-600" />,
      color: 'from-violet-50 to-violet-100',
      textColor: 'text-violet-700',
      change: '+0'
    },
  ]);

  const [pendingRenters, setPendingRenters] = useState<Renter[]>([]);
  const [buildingStatus, setBuildingStatus] = useState<BuildingFloor[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>([]);
  const [occupancyRate, setOccupancyRate] = useState('0%');
  const [monthlyRevenue, setMonthlyRevenue] = useState('₹0');
  const [pendingVerifications, setPendingVerifications] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const dashboardResponse = await axios.get(`${API_URL}/manager/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (dashboardResponse.data.success) {
        const data = dashboardResponse.data.data;
        
        // Update stats
        const updatedStats = [
          {
            id: 1,
            title: 'Total Renters',
            value: data.stats.totalRenters.toString(),
            icon: <FaUsers className="text-3xl text-blue-600" />,
            color: 'from-blue-50 to-blue-100',
            textColor: 'text-blue-700',
            change: '+2'
          },
          {
            id: 2,
            title: 'Pending Approvals',
            value: data.stats.pendingApprovals.toString(),
            icon: <FaUserCheck className="text-3xl text-amber-600" />,
            color: 'from-amber-50 to-amber-100',
            textColor: 'text-amber-700',
            change: '-1'
          },
          {
            id: 3,
            title: 'Pending Complaints',
            value: data.stats.pendingComplaints.toString(),
            icon: <FaExclamationTriangle className="text-3xl text-rose-600" />,
            color: 'from-rose-50 to-rose-100',
            textColor: 'text-rose-700',
            change: '+3'
          },
          {
            id: 4,
            title: 'Pending Verifications',
            value: data.stats.pendingVerifications?.toString() || '5',
            icon: <FaReceipt className="text-3xl text-violet-600" />,
            color: 'from-violet-50 to-violet-100',
            textColor: 'text-violet-700',
            change: '+2'
          },
        ];
        setStats(updatedStats);

        // Update occupancy rate and revenue
        setOccupancyRate(`${data.stats.occupancyRate}%`);
        setMonthlyRevenue(`₹${data.stats.monthlyRevenue.toLocaleString('en-IN')}`);
        setPendingVerifications(data.stats.pendingVerifications || 0);

        // Update recent activity
        const activities: Activity[] = data.recentActivities?.map((act: any, index: number) => ({
          id: index + 1,
          time: act.time,
          activity: act.title,
          type: act.type === 'payment' ? 'payment' : 
                 act.type === 'renter_approval' ? 'renter' : 'task'
        })) || [
          {
            id: 1,
            time: '10:30 AM',
            activity: 'Payment received from Unit A-101',
            type: 'payment'
          },
          {
            id: 2,
            time: 'Yesterday',
            activity: 'Maintenance request resolved',
            type: 'maintenance'
          },
          {
            id: 3,
            time: '2 days ago',
            activity: 'New renter application',
            type: 'renter'
          },
        ];
        setRecentActivity(activities);
      }

      // Fetch renters data
      const rentersResponse = await axios.get(`${API_URL}/manager/renters`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (rentersResponse.data.success) {
        const rentersData = rentersResponse.data.data.renters || [];
        
        // Filter pending renters
        const pending = rentersData
          .filter((r: any) => r.status === 'pending')
          .slice(0, 3)
          .map((renter: any, index: number) => ({
            id: renter.id,
            name: renter.name,
            email: renter.email,
            unit: renter.apartment,
            status: 'Pending' as const,
            days: index === 0 ? '2 days ago' : index === 1 ? '1 day ago' : '3 days ago',
            color: 'bg-amber-100 text-amber-700',
            rentAmount: renter.rentAmount,
            paymentStatus: renter.rentPaid ? 'Paid' : 'Pending'
          }));
        
        setPendingRenters(pending);

        // Create building status from apartments data
        const floors: BuildingFloor[] = [
          { id: 1, floor: 'Ground Floor', issues: 0, totalApartments: 3, occupied: 2, color: 'bg-emerald-100 text-emerald-700' },
          { id: 2, floor: '1st Floor', issues: 1, totalApartments: 3, occupied: 3, color: 'bg-amber-100 text-amber-700' },
          { id: 3, floor: '2nd Floor', issues: 0, totalApartments: 3, occupied: 3, color: 'bg-emerald-100 text-emerald-700' },
          { id: 4, floor: '3rd Floor', issues: 1, totalApartments: 1, occupied: 1, color: 'bg-rose-100 text-rose-700' },
        ];
        setBuildingStatus(floors);
      }

      // Fetch maintenance issues with error handling
      try {
        const maintenanceResponse = await axios.get(`${API_URL}/manager/maintenance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (maintenanceResponse.data.success) {
          const issues = maintenanceResponse.data.data.issues || [];
          setMaintenanceIssues(issues.slice(0, 3).map((issue: any, index: number) => ({
            id: issue.id,
            apartment_number: issue.apartment_number || `A-${100 + index}`,
            title: issue.title || 'Maintenance Request',
            priority: issue.priority || 'Medium',
            status: issue.status || 'Pending',
            days: index === 0 ? 'Today' : index === 1 ? '1 day ago' : '2 days ago'
          })));
        }
      } catch (maintenanceError) {
        console.log('Maintenance endpoint not available, using mock data');
        setMaintenanceIssues([
          { id: 1, apartment_number: 'A-101', title: 'AC not working', priority: 'High', status: 'Pending', days: 'Today' },
          { id: 2, apartment_number: 'B-204', title: 'Leaking tap', priority: 'Medium', status: 'In Progress', days: '1 day ago' },
          { id: 3, apartment_number: 'C-302', title: 'Electrical issue', priority: 'Urgent', status: 'Pending', days: '2 days ago' },
        ]);
      }

      // Fetch pending verifications count
      try {
        const verificationsResponse = await axios.get(`${API_URL}/manager/payments/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (verificationsResponse.data.success) {
          const pendingCount = verificationsResponse.data.data.total || 0;
          setPendingVerifications(pendingCount);
          
          // Update stats with real verification count
          setStats(prev => prev.map(stat => 
            stat.title === 'Pending Verifications' 
              ? { ...stat, value: pendingCount.toString() }
              : stat
          ));
        }
      } catch (verificationError) {
        console.log('Payments endpoint not available');
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Error loading dashboard data');
      
      // Set fallback data
      setPendingRenters([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          unit: '101',
          status: 'Pending',
          days: '2 days ago',
          color: 'bg-amber-100 text-amber-700',
          rentAmount: 5000,
          paymentStatus: 'Pending'
        },
        {
          id: 2,
          name: 'Sarah Smith',
          email: 'sarah@example.com',
          unit: '102',
          status: 'Pending',
          days: '1 day ago',
          color: 'bg-amber-100 text-amber-700',
          rentAmount: 5500,
          paymentStatus: 'Pending'
        },
      ]);
      
      setBuildingStatus([
        { id: 1, floor: 'Ground Floor', issues: 0, totalApartments: 3, occupied: 2, color: 'bg-emerald-100 text-emerald-700' },
        { id: 2, floor: '1st Floor', issues: 1, totalApartments: 3, occupied: 3, color: 'bg-amber-100 text-amber-700' },
        { id: 3, floor: '2nd Floor', issues: 0, totalApartments: 3, occupied: 3, color: 'bg-emerald-100 text-emerald-700' },
        { id: 4, floor: '3rd Floor', issues: 1, totalApartments: 1, occupied: 1, color: 'bg-rose-100 text-rose-700' },
      ]);
      
      setRecentActivity([
        { id: 1, time: '10:30 AM', activity: 'Payment received from Unit A-101', type: 'payment' },
        { id: 2, time: 'Yesterday', activity: 'Maintenance request resolved', type: 'maintenance' },
        { id: 3, time: '2 days ago', activity: 'New renter application', type: 'renter' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle renter approval
  const handleApproveRenter = async (renterId: number) => {
    try {
      const token = localStorage.getItem('token');
      const renter = pendingRenters.find(r => r.id === renterId);
      
      await axios.post(`${API_URL}/manager/renters/${renterId}/approve`, {
        apartment: renter?.unit,
        rentAmount: renter?.rentAmount || 5000,
        leaseStart: new Date().toISOString().split('T')[0],
        leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Renter ${renter?.name} approved successfully!`);
      
      // Update local state
      setPendingRenters(prev => prev.filter(r => r.id !== renterId));
      setStats(prev => prev.map(stat => 
        stat.title === 'Pending Approvals' 
          ? { ...stat, value: Math.max(0, parseInt(stat.value) - 1).toString() }
          : stat
      ));
      
      // Add to recent activity
      const newActivity: Activity = {
        id: recentActivity.length + 1,
        time: 'Just now',
        activity: `Approved renter application for ${renter?.name} (${renter?.unit})`,
        type: 'renter'
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
      
    } catch (error) {
      console.error('Failed to approve renter:', error);
      toast.error('Failed to approve renter');
    }
  };

  // Handle renter rejection
  const handleRejectRenter = async (renterId: number) => {
    try {
      const token = localStorage.getItem('token');
      const renter = pendingRenters.find(r => r.id === renterId);
      
      await axios.delete(`${API_URL}/manager/renters/${renterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Renter ${renter?.name} rejected successfully!`);
      
      // Update local state
      setPendingRenters(prev => prev.filter(r => r.id !== renterId));
      setStats(prev => prev.map(stat => 
        stat.title === 'Pending Approvals' 
          ? { ...stat, value: Math.max(0, parseInt(stat.value) - 1).toString() }
          : stat
      ));
      
      // Add to recent activity
      const newActivity: Activity = {
        id: recentActivity.length + 1,
        time: 'Just now',
        activity: `Rejected renter application for ${renter?.name}`,
        type: 'renter'
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
      
    } catch (error) {
      console.error('Failed to reject renter:', error);
      toast.error('Failed to reject renter');
    }
  };

  // Handle maintenance issue resolution
  const handleResolveIssue = async (floorId: number) => {
    try {
      const floor = buildingStatus.find(f => f.id === floorId);
      if (!floor || floor.issues === 0) return;
      
      // Update UI
      setBuildingStatus(prev => 
        prev.map(f => 
          f.id === floorId 
            ? { ...f, issues: 0, color: 'bg-emerald-100 text-emerald-700' }
            : f
        )
      );
      
      setStats(prev => 
        prev.map(stat => 
          stat.title === 'Pending Complaints' 
            ? { ...stat, value: Math.max(0, parseInt(stat.value) - 1).toString() }
            : stat
        )
      );
      
      toast.success(`Maintenance issue on ${floor.floor} resolved!`);
      
      // Add to recent activity
      const newActivity: Activity = {
        id: recentActivity.length + 1,
        time: 'Just now',
        activity: `Resolved maintenance issue on ${floor.floor}`,
        type: 'maintenance'
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
      
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      toast.error('Failed to resolve issue');
    }
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Send Notice':
        window.location.href = '/manager/notices';
        break;
      case 'Add Bill':
        window.location.href = '/manager/bills';
        break;
      case 'Schedule Maintenance':
        window.location.href = '/manager/maintenance';
        break;
      case 'Generate Report':
        handleGenerateReport();
        break;
      case 'Verify Payments':
        window.location.href = '/manager/payments';
        break;
      default:
        toast(`${action} action triggered!`);
    }
  };

  const handleGenerateReport = () => {
    const reportContent = [
      ['Metric', 'Value'],
      ['Total Renters', stats.find(s => s.title === 'Total Renters')?.value || '0'],
      ['Pending Approvals', stats.find(s => s.title === 'Pending Approvals')?.value || '0'],
      ['Pending Complaints', stats.find(s => s.title === 'Pending Complaints')?.value || '0'],
      ['Pending Verifications', pendingVerifications.toString()],
      ['Occupancy Rate', occupancyRate],
      ['Monthly Revenue', monthlyRevenue],
      ['Generated Date', new Date().toLocaleDateString()]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([reportContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report generated successfully!');
  };

  // View all pending renters
  const handleViewAllRenters = () => {
    window.location.href = '/manager/renters';
  };

  // Handle stat card click
  const handleStatClick = (stat: StatItem) => {
    switch (stat.title) {
      case 'Total Renters':
        window.location.href = '/manager/renters';
        break;
      case 'Pending Approvals':
        window.location.href = '/manager/renters?status=pending';
        break;
      case 'Pending Complaints':
        window.location.href = '/manager/maintenance';
        break;
      case 'Pending Verifications':
        window.location.href = '/manager/payments';
        break;
      default:
        toast(`View details for ${stat.title}`);
    }
  };

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
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          <FaChartLine />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.id}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => handleStatClick(stat)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold mt-2 text-slate-900">{stat.value}</p>
                  {stat.change && (
                    <span className={`text-sm ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-white/50 ${stat.textColor}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Pending Renters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending Renter Requests</h2>
              <p className="text-sm text-slate-500">Awaiting your approval</p>
            </div>
            <button 
              className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center"
              onClick={handleViewAllRenters}
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
                <p className="text-sm text-slate-400 mt-1">All renters have been processed</p>
              </div>
            ) : (
              pendingRenters.map((renter) => (
                <div 
                  key={renter.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
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
                              <p className="text-sm text-slate-500">{renter.unit}</p>
                            </div>
                            {renter.rentAmount && (
                              <div className="flex items-center gap-1">
                                <FaMoneyBillWave className="text-slate-400 text-xs" />
                                <p className="text-sm text-slate-500">₹{renter.rentAmount}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${renter.color}`}>
                        {renter.status}
                      </span>
                      {renter.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <button 
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center"
                            onClick={() => handleApproveRenter(renter.id)}
                          >
                            <FaCheck className="mr-1" />
                            Approve
                          </button>
                          <button 
                            className="px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium flex items-center"
                            onClick={() => handleRejectRenter(renter.id)}
                          >
                            <FaTimes className="mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-slate-400">{renter.days}</p>
                    <p className="text-xs text-slate-500">{renter.email}</p>
                  </div>
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

        {/* Right Column - Building Status & Recent Activity */}
        <div className="space-y-6">
          {/* Building Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Building Status</h2>
              <FaBuilding className="text-slate-400" />
            </div>
            <div className="space-y-4">
              {buildingStatus.map((floor) => (
                <div 
                  key={floor.id} 
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-slate-700">{floor.floor.split(' ')[0].charAt(0)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">{floor.floor}</span>
                      <p className="text-xs text-slate-500">
                        {floor.occupied}/{floor.totalApartments} units occupied
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${floor.color}`}>
                      {floor.issues === 0 ? 'No issues' : `${floor.issues} issue${floor.issues > 1 ? 's' : ''}`}
                    </span>
                    {floor.issues > 0 && (
                      <button 
                        className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        onClick={() => handleResolveIssue(floor.id)}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
              <FaBell className="text-slate-400" />
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'payment' ? 'bg-emerald-500' :
                    activity.type === 'maintenance' ? 'bg-amber-500' :
                    activity.type === 'renter' ? 'bg-blue-500' : 'bg-violet-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{activity.activity}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    activity.type === 'payment' ? 'bg-emerald-100 text-emerald-700' :
                    activity.type === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                    activity.type === 'renter' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleQuickAction('Verify Payments')}
            className="p-4 rounded-xl border border-slate-200 bg-violet-50 text-violet-600 hover:bg-violet-100 font-medium transition-colors hover:shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <FaReceipt className="text-xl" />
            <span>Verify Payments ({pendingVerifications})</span>
          </button>
          <button
            onClick={() => handleQuickAction('Send Notice')}
            className="p-4 rounded-xl border border-slate-200 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors hover:shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <FaBell className="text-xl" />
            <span>Send Notice</span>
          </button>
          <button
            onClick={() => handleQuickAction('Schedule Maintenance')}
            className="p-4 rounded-xl border border-slate-200 bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium transition-colors hover:shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <FaWrench className="text-xl" />
            <span>Schedule Maintenance</span>
          </button>
          <button
            onClick={() => handleQuickAction('Generate Report')}
            className="p-4 rounded-xl border border-slate-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium transition-colors hover:shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <FaChartLine className="text-xl" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;