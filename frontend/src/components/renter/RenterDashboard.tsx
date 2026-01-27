// src/components/renter/RenterDashboard.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaHome,
  FaMoneyBillWave,
  FaTools,
  FaBell,
  FaCalendar,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaReceipt,
  FaChartLine,
  FaEnvelope,
  FaWrench,
  FaQuestionCircle,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  currentRent: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  nextPaymentDate: string;
  pendingComplaints: number;
  unreadMessages: number;
  leaseEndDate: string;
  apartmentNumber: string;
  buildingName: string;
  floor: string;
}

interface Payment {
  id: number;
  month: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at?: string;
}

interface Complaint {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  time: string;
  status?: string;
}

const RenterDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    currentRent: 0,
    paymentStatus: 'pending',
    nextPaymentDate: '',
    pendingComplaints: 0,
    unreadMessages: 0,
    leaseEndDate: '',
    apartmentNumber: '',
    buildingName: '',
    floor: ''
  });
  
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const renterId = localStorage.getItem('renterId');

      // Fetch renter profile data
      const profileResponse = await axios.get(`${API_URL}/renter/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        const profile = profileResponse.data.data;
        setStats({
          currentRent: profile.rent_amount || 0,
          paymentStatus: profile.payment_status || 'pending',
          nextPaymentDate: profile.next_due_date || '',
          pendingComplaints: profile.pending_complaints || 0,
          unreadMessages: profile.unread_messages || 0,
          leaseEndDate: profile.lease_end || '',
          apartmentNumber: profile.apartment_number || '',
          buildingName: profile.building_name || '',
          floor: profile.floor || ''
        });
      }

      // Fetch recent payments
      const paymentsResponse = await axios.get(`${API_URL}/renter/payments/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (paymentsResponse.data.success) {
        setRecentPayments(paymentsResponse.data.data.payments || []);
      }

      // Fetch recent complaints
      const complaintsResponse = await axios.get(`${API_URL}/renter/complaints/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (complaintsResponse.data.success) {
        setRecentComplaints(complaintsResponse.data.data.complaints || []);
      }

      // Generate recent activity
      const activities: RecentActivity[] = [];
      
      recentPayments.slice(0, 3).forEach(payment => {
        activities.push({
          id: payment.id,
          type: 'payment',
          title: `Payment for ${payment.month}`,
          time: payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending',
          status: payment.status
        });
      });

      recentComplaints.slice(0, 3).forEach(complaint => {
        activities.push({
          id: complaint.id,
          type: 'complaint',
          title: complaint.title,
          time: new Date(complaint.created_at).toLocaleDateString(),
          status: complaint.status
        });
      });

      setRecentActivity(activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Pay Rent':
        window.location.href = '/renter/payments';
        break;
      case 'Submit Complaint':
        window.location.href = '/renter/complaints/new';
        break;
      case 'Message Manager':
        window.location.href = '/renter/messages';
        break;
      case 'Request Document':
        handleDocumentRequest();
        break;
      default:
        toast(`Action: ${action}`);
    }
  };

  const handleDocumentRequest = () => {
    const documentType = prompt('What document do you need? (Rent Receipt, NOC, Agreement Copy, etc.)');
    if (documentType) {
      toast.success(`Request for ${documentType} submitted to manager`);
    }
  };

  const handlePaymentClick = () => {
    window.location.href = '/renter/payments/make';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'in_progress':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-violet-100">Here's your apartment overview</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <FaHome className="text-xl" />
            </div>
            <div>
              <p className="font-medium">Apartment {stats.apartmentNumber}</p>
              <p className="text-sm text-violet-200">{stats.buildingName} • Floor {stats.floor}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rent Card */}
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Monthly Rent</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-lg">₹</span>
                <p className="text-2xl font-bold text-slate-900">{stats.currentRent.toLocaleString()}</p>
              </div>
              <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stats.paymentStatus)}`}>
                {stats.paymentStatus.charAt(0).toUpperCase() + stats.paymentStatus.slice(1)}
              </span>
            </div>
            <FaMoneyBillWave className="text-2xl text-violet-500" />
          </div>
        </div>

        {/* Next Payment */}
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Next Payment</p>
              <p className="text-lg font-bold text-slate-900 mt-2">
                {stats.nextPaymentDate ? new Date(stats.nextPaymentDate).toLocaleDateString('en-US', { 
                  day: 'numeric',
                  month: 'short'
                }) : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Due Date</p>
            </div>
            <FaCalendar className="text-2xl text-blue-500" />
          </div>
        </div>

        {/* Pending Complaints */}
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Complaints</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{stats.pendingComplaints}</p>
              <p className="text-xs text-slate-500 mt-1">Needs attention</p>
            </div>
            <FaTools className="text-2xl text-amber-500" />
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Messages</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats.unreadMessages}</p>
              <p className="text-xs text-slate-500 mt-1">Unread</p>
            </div>
            <FaBell className="text-2xl text-slate-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleQuickAction('Pay Rent')}
                className="p-4 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-200 flex flex-col items-center gap-2 transition-colors"
              >
                <div className="p-3 bg-white rounded-lg">
                  <FaMoneyBillWave className="text-violet-600 text-xl" />
                </div>
                <span className="font-medium text-slate-900">Pay Rent</span>
              </button>

              <button
                onClick={() => handleQuickAction('Submit Complaint')}
                className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 flex flex-col items-center gap-2 transition-colors"
              >
                <div className="p-3 bg-white rounded-lg">
                  <FaWrench className="text-amber-600 text-xl" />
                </div>
                <span className="font-medium text-slate-900">Submit Complaint</span>
              </button>

              <button
                onClick={() => handleQuickAction('Message Manager')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex flex-col items-center gap-2 transition-colors"
              >
                <div className="p-3 bg-white rounded-lg">
                  <FaEnvelope className="text-blue-600 text-xl" />
                </div>
                <span className="font-medium text-slate-900">Message Manager</span>
              </button>

              <button
                onClick={() => handleQuickAction('Request Document')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center gap-2 transition-colors"
              >
                <div className="p-3 bg-white rounded-lg">
                  <FaQuestionCircle className="text-slate-600 text-xl" />
                </div>
                <span className="font-medium text-slate-900">Request Document</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <FaInfoCircle className="text-4xl text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'payment' ? 'bg-emerald-100' :
                        activity.type === 'complaint' ? 'bg-amber-100' :
                        'bg-blue-100'
                      }`}>
                        {activity.type === 'payment' ? <FaReceipt className="text-emerald-600" /> :
                         activity.type === 'complaint' ? <FaTools className="text-amber-600" /> :
                         <FaBell className="text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.time}</p>
                      </div>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Payment & Complaint Overview */}
        <div className="space-y-6">
          {/* Payment Overview */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Payment Overview</h3>
              <button
                onClick={handlePaymentClick}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Make Payment →
              </button>
            </div>
            
            <div className="space-y-3">
              {recentPayments.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No payment records</p>
              ) : (
                recentPayments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{payment.month}</span>
                      <span className="font-bold">₹{payment.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-slate-500">
                        Due: {new Date(payment.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Complaints Overview */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Complaints</h3>
              <button
                onClick={() => window.location.href = '/renter/complaints'}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-3">
              {recentComplaints.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No complaints submitted</p>
              ) : (
                recentComplaints.slice(0, 3).map((complaint) => (
                  <div key={complaint.id} className="p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium truncate">{complaint.title}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">
                        {new Date(complaint.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lease Information */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Lease Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Current Status</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Lease Ends</span>
                <span className="font-medium text-slate-900">
                  {stats.leaseEndDate ? new Date(stats.leaseEndDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="pt-3 border-t">
                <button className="w-full text-center py-2 text-violet-600 hover:text-violet-700 font-medium">
                  View Lease Agreement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Alert */}
      {stats.paymentStatus === 'overdue' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-rose-600 text-xl" />
            <div className="flex-1">
              <p className="font-medium text-rose-900">Payment Overdue</p>
              <p className="text-sm text-rose-700">
                Your rent payment is overdue. Please make payment immediately to avoid penalties.
              </p>
            </div>
            <button
              onClick={handlePaymentClick}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              Pay Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenterDashboard;