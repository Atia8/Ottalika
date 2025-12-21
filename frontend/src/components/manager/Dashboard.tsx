import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserCheck, FaExclamationTriangle, FaArrowRight, FaCheck, FaTimes } from 'react-icons/fa';

// Type Definitions
interface StatItem {
  id: number;
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

interface Renter {
  id: number;
  name: string;
  unit: string;
  status: 'Pending' | 'Verified' | 'Approved' | 'Rejected';
  days: string;
  color: string;
}

interface BuildingFloor {
  id: number;
  floor: string;
  issues: string;
  color: string;
}

interface Activity {
  id: number;
  time: string;
  activity: string;
}

interface QuickAction {
  id: number;
  label: string;
  color: string;
  onClick: () => void;
}

const ManagerDashboard = () => {
  // Stats state
  const [stats, setStats] = useState<StatItem[]>([
    {
      id: 1,
      title: 'Total Renters',
      value: '5',
      icon: <FaUsers className="text-3xl text-blue-600" />,
      color: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700'
    },
    {
      id: 2,
      title: 'Pending Approvals',
      value: '1',
      icon: <FaUserCheck className="text-3xl text-amber-600" />,
      color: 'from-amber-50 to-amber-100',
      textColor: 'text-amber-700'
    },
    {
      id: 3,
      title: 'Maintenance Issues',
      value: '3',
      icon: <FaExclamationTriangle className="text-3xl text-rose-600" />,
      color: 'from-rose-50 to-rose-100',
      textColor: 'text-rose-700'
    },
  ]);

  // Pending renters state
  const [pendingRenters, setPendingRenters] = useState<Renter[]>([
    {
      id: 1,
      name: 'Karim Hassan',
      unit: 'C-302',
      status: 'Pending',
      days: '2 days ago',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      unit: 'A-105',
      status: 'Verified',
      days: '1 day ago',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 3,
      name: 'Michael Chen',
      unit: 'B-204',
      status: 'Pending',
      days: '3 days ago',
      color: 'bg-amber-100 text-amber-700'
    },
  ]);

  // Building status state
  const [buildingStatus, setBuildingStatus] = useState<BuildingFloor[]>([
    { 
      id: 1, 
      floor: 'Ground Floor', 
      issues: 'No issues', 
      color: 'bg-emerald-100 text-emerald-700' 
    },
    { 
      id: 2, 
      floor: '1st Floor', 
      issues: 'AC Maintenance', 
      color: 'bg-amber-100 text-amber-700' 
    },
    { 
      id: 3, 
      floor: '2nd Floor', 
      issues: 'No issues', 
      color: 'bg-emerald-100 text-emerald-700' 
    },
    { 
      id: 4, 
      floor: '3rd Floor', 
      issues: 'Elevator Repair', 
      color: 'bg-rose-100 text-rose-700' 
    },
  ]);

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState<Activity[]>([
    { 
      id: 1, 
      time: '10:30 AM', 
      activity: 'Payment received from Unit A-101' 
    },
    { 
      id: 2, 
      time: 'Yesterday', 
      activity: 'Maintenance request resolved' 
    },
    { 
      id: 3, 
      time: '2 days ago', 
      activity: 'New renter application' 
    },
  ]);

  // Quick actions - defined as constants since they don't change
  const quickActions: QuickAction[] = [
    { 
      id: 1, 
      label: 'Send Notice', 
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      onClick: () => handleQuickAction('Send Notice')
    },
    { 
      id: 2, 
      label: 'Add Bill', 
      color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
      onClick: () => handleQuickAction('Add Bill')
    },
    { 
      id: 3, 
      label: 'Schedule Maintenance', 
      color: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
      onClick: () => handleQuickAction('Schedule Maintenance')
    },
    { 
      id: 4, 
      label: 'Generate Report', 
      color: 'bg-violet-50 text-violet-600 hover:bg-violet-100',
      onClick: () => handleQuickAction('Generate Report')
    },
  ];

  // Handle renter approval
  const handleApproveRenter = (renterId: number) => {
    setPendingRenters(prevRenters => 
      prevRenters.map(renter => 
        renter.id === renterId 
          ? { 
              ...renter, 
              status: 'Approved', 
              color: 'bg-emerald-100 text-emerald-700',
              days: 'Just now'
            }
          : renter
      )
    );

    // Update stats
    setStats(prevStats => 
      prevStats.map(stat => 
        stat.title === 'Pending Approvals' 
          ? { ...stat, value: Math.max(0, parseInt(stat.value) - 1).toString() }
          : stat
      )
    );

    // Add to recent activity
    const renter = pendingRenters.find(r => r.id === renterId);
    if (renter) {
      const newActivity: Activity = {
        id: recentActivity.length + 1,
        time: 'Just now',
        activity: `Approved renter application for ${renter.name} (${renter.unit})`
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
    }
  };

  // Handle renter rejection
  const handleRejectRenter = (renterId: number) => {
    setPendingRenters(prevRenters => 
      prevRenters.filter(renter => renter.id !== renterId)
    );

    // Update stats
    setStats(prevStats => 
      prevStats.map(stat => 
        stat.title === 'Pending Approvals' 
          ? { ...stat, value: Math.max(0, parseInt(stat.value) - 1).toString() }
          : stat
      )
    );

    // Add to recent activity
    const renter = pendingRenters.find(r => r.id === renterId);
    if (renter) {
      const newActivity: Activity = {
        id: recentActivity.length + 1,
        time: 'Just now',
        activity: `Rejected renter application for ${renter.name}`
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
    }
  };

  // Handle maintenance issue resolution
  const handleResolveIssue = (floorId: number) => {
    setBuildingStatus(prevStatus => 
      prevStatus.map(floor => 
        floor.id === floorId 
          ? { ...floor, issues: 'No issues', color: 'bg-emerald-100 text-emerald-700' }
          : floor
      )
    );

    // Update stats
    setStats(prevStats => 
      prevStats.map(stat => 
        stat.title === 'Maintenance Issues' 
          ? { ...stat, value: Math.max(0, parseInt(stat.value) - 1).toString() }
          : stat
      )
    );

    // Add to recent activity
    const floor = buildingStatus.find(f => f.id === floorId);
    if (floor) {
      const newActivity: Activity = {
        id: recentActivity.length + 1,
        time: 'Just now',
        activity: `Resolved ${floor.issues} on ${floor.floor}`
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    alert(`${action} action triggered!`);
    
    // Add to recent activity
    const newActivity: Activity = {
      id: recentActivity.length + 1,
      time: 'Just now',
      activity: `${action} action performed`
    };
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
  };

  // View all pending renters
  const handleViewAllRenters = () => {
    alert('Navigating to all renter requests page...');
  };

  // Handle stat card click
  const handleStatClick = (stat: StatItem) => {
    alert(`View details for ${stat.title}`);
  };

  // Calculate occupancy rate and revenue (mock calculation)
  const occupancyRate = '85%';
  const monthlyRevenue = '₹1,20,000';

  // Mock data refresh (simulating API call)
  useEffect(() => {
    const interval = setInterval(() => {
      // Update stats randomly for demo purposes
      setStats(prev => 
        prev.map(stat => 
          stat.title === 'Pending Approvals' 
            ? { ...stat, value: Math.floor(Math.random() * 5).toString() }
            : stat
        )
      );
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.id}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => handleStatClick(stat)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <p className="text-3xl font-bold mt-2 text-slate-900">{stat.value}</p>
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
            {pendingRenters.map((renter) => (
              <div 
                key={renter.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{renter.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{renter.unit}</p>
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
                    {renter.status !== 'Pending' && (
                      <button 
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
                        onClick={() => alert(`Viewing details for ${renter.name}`)}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">{renter.days}</p>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{occupancyRate}</p>
              <p className="text-sm text-slate-500">Occupancy Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{monthlyRevenue}</p>
              <p className="text-sm text-slate-500">Monthly Revenue</p>
            </div>
          </div>
        </div>

        {/* Right Column - Building Status */}
        <div className="space-y-6">
          {/* Building Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Building Status</h2>
            <div className="space-y-4">
              {buildingStatus.map((floor) => (
                <div 
                  key={floor.id} 
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <span className="font-medium text-slate-900">{floor.floor}</span>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${floor.color}`}>
                      {floor.issues}
                    </span>
                    {floor.issues !== 'No issues' && (
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="w-2 h-2 bg-violet-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">{activity.activity}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
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
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`p-4 rounded-xl border border-slate-200 ${action.color} font-medium transition-colors hover:shadow-sm`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;