import React from 'react';
import { FaUsers, FaUserCheck, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';

const ManagerDashboard = () => {
  // Stats data
  const stats = [
    {
      title: 'Total Renters',
      value: '5',
      icon: <FaUsers className="text-3xl text-blue-600" />,
      color: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700'
    },
    {
      title: 'Pending Approvals',
      value: '1',
      icon: <FaUserCheck className="text-3xl text-amber-600" />,
      color: 'from-amber-50 to-amber-100',
      textColor: 'text-amber-700'
    },
    {
      title: 'Maintenance Issues',
      value: '3',
      icon: <FaExclamationTriangle className="text-3xl text-rose-600" />,
      color: 'from-rose-50 to-rose-100',
      textColor: 'text-rose-700'
    },
  ];

  // Pending renters data
  const pendingRenters = [
    {
      name: 'Karim Hassan',
      unit: 'C-302',
      status: 'Pending',
      days: '2 days ago',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      name: 'Sarah Johnson',
      unit: 'A-105',
      status: 'Verified',
      days: '1 day ago',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      name: 'Michael Chen',
      unit: 'B-204',
      status: 'Pending',
      days: '3 days ago',
      color: 'bg-amber-100 text-amber-700'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 shadow-sm border border-slate-200`}
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
            <button className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center">
              View All
              <FaArrowRight className="ml-2" />
            </button>
          </div>

          <div className="space-y-4">
            {pendingRenters.map((renter, index) => (
              <div 
                key={index}
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
                    <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium">
                      Review
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">{renter.days}</p>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">85%</p>
              <p className="text-sm text-slate-500">Occupancy Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">₹1,20,000</p>
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
              {[
                { floor: 'Ground Floor', issues: 'No issues', color: 'bg-emerald-100 text-emerald-700' },
                { floor: '1st Floor', issues: 'AC Maintenance', color: 'bg-amber-100 text-amber-700' },
                { floor: '2nd Floor', issues: 'No issues', color: 'bg-emerald-100 text-emerald-700' },
                { floor: '3rd Floor', issues: 'Elevator Repair', color: 'bg-rose-100 text-rose-700' },
              ].map((floor, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-900">{floor.floor}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${floor.color}`}>
                    {floor.issues}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { time: '10:30 AM', activity: 'Payment received from Unit A-101' },
                { time: 'Yesterday', activity: 'Maintenance request resolved' },
                { time: '2 days ago', activity: 'New renter application' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg">
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
          {[
            { label: 'Send Notice', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { label: 'Add Bill', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
            { label: 'Schedule Maintenance', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
            { label: 'Generate Report', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
          ].map((action, index) => (
            <button
              key={index}
              className={`p-4 rounded-xl border border-slate-200 ${action.color} font-medium transition-colors`}
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