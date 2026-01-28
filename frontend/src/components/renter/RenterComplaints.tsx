// src/components/renter/RenterComplaints.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaTools,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaWrench,
  FaBolt,
  FaHome,
  FaCalendar,
  FaUser,
  FaSync,
  FaComments,
  FaTint,
  FaBell,
  FaCheck,
  FaHourglassHalf
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'resolved';
  created_at: string;
  updated_at: string;
  apartment_number: string;
  floor?: string;
  assigned_to?: string;
  resolved_at?: string;
  resolution?: string;
  manager_marked_resolved?: boolean;
  renter_marked_resolved?: boolean;
  needs_renter_confirmation?: boolean;
}

interface ComplaintStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  needs_confirmation: number;
}

const RenterComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    needs_confirmation: 0
  });
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [newComplaint, setNewComplaint] = useState({
    title: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    description: ''
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/renter/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const complaintsData = response.data.data.complaints || [];
        
        const processedComplaints = complaintsData.map((complaint: any) => ({
          ...complaint,
          needs_renter_confirmation: complaint.manager_marked_resolved && !complaint.renter_marked_resolved
        }));
        
        setComplaints(processedComplaints);
        
        const needsConfirmationCount = processedComplaints.filter(
          c => c.manager_marked_resolved && !c.renter_marked_resolved
        ).length;
        
        const resolvedCount = processedComplaints.filter(c => 
          c.status === 'resolved' || 
          (c.renter_marked_resolved && c.manager_marked_resolved)
        ).length;
        
        setStats({
          total: processedComplaints.length,
          pending: processedComplaints.filter(c => c.status === 'pending').length,
          in_progress: processedComplaints.filter(c => c.status === 'in_progress').length,
          resolved: resolvedCount,
          needs_confirmation: needsConfirmationCount
        });
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Error loading complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!newComplaint.title.trim() || !newComplaint.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/renter/complaints`, newComplaint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Complaint submitted successfully!');
        setShowNewComplaint(false);
        setNewComplaint({
          title: '',
          category: 'general',
          priority: 'medium',
          description: ''
        });
        fetchComplaints();
      }
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      toast.error('Failed to submit complaint');
    }
  };

  const handleMarkResolved = async (complaintId: number) => {
  if (!window.confirm('Are you sure the issue is completely resolved?')) return;
  
  try {
    const token = localStorage.getItem('token');
    
    await axios.put(`${API_URL}/renter/complaints/${complaintId}/resolve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    toast.success('Complaint marked as resolved!');
    
    // Update local state
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === complaintId 
          ? { 
              ...complaint, 
              status: 'resolved',
              renter_marked_resolved: true,
              manager_marked_resolved: true, // Assume manager also agrees
              resolved_at: new Date().toISOString()
            }
          : complaint
      )
    );
    
    // Update stats
    setStats(prev => ({
      ...prev,
      resolved: prev.resolved + 1,
      in_progress: Math.max(0, prev.in_progress - 1)
    }));
    
  } catch (error) {
    console.error('Failed to mark as resolved:', error);
    toast.error('Failed to mark complaint as resolved');
  }
};

  const handleConfirmResolution = async (complaintId: number) => {
    try {
      setConfirmingId(complaintId);
      const token = localStorage.getItem('token');
      
      console.log(`📤 Confirming resolution for complaint ${complaintId}`);
      
      const response = await axios.put(
        `${API_URL}/renter/complaints/${complaintId}/confirm-resolve`, 
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Confirm resolution response:', response.data);
      
      if (response.data.success) {
        toast.success('Resolution confirmed! Complaint is now fully resolved.');
        
        setComplaints(prev => 
          prev.map(complaint => 
            complaint.id === complaintId 
              ? { 
                  ...complaint, 
                  renter_marked_resolved: true,
                  manager_marked_resolved: true,
                  status: 'resolved',
                  resolved_at: response.data.data?.resolved_at || new Date().toISOString(),
                  needs_renter_confirmation: false
                }
              : complaint
          )
        );
        
        setStats(prev => {
          const updatedComplaints = complaints.map(complaint => 
            complaint.id === complaintId 
              ? { ...complaint, renter_marked_resolved: true, status: 'resolved' }
              : complaint
          );
          
          const needsConfirmationCount = updatedComplaints.filter(
            c => c.manager_marked_resolved && !c.renter_marked_resolved
          ).length;
          
          const resolvedCount = updatedComplaints.filter(c => 
            c.status === 'resolved' || 
            (c.renter_marked_resolved && c.manager_marked_resolved)
          ).length;
          
          return {
            ...prev,
            resolved: resolvedCount,
            needs_confirmation: needsConfirmationCount
          };
        });
        
        setTimeout(() => {
          fetchComplaints();
        }, 100);
      } else {
        toast.error(response.data.message || 'Failed to confirm resolution');
      }
    } catch (error: any) {
      console.error('❌ Failed to confirm resolution:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.status === 404) {
          toast.error('Complaint not found or already resolved');
        } else if (error.response.status === 400) {
          toast.error(error.response.data.message || 'Cannot confirm resolution yet');
        } else {
          toast.error(error.response.data?.message || 'Failed to confirm resolution');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('An error occurred: ' + error.message);
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDeleteComplaint = async (complaintId: number) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/renter/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Complaint deleted successfully!');
      fetchComplaints();
    } catch (error) {
      console.error('Failed to delete complaint:', error);
      toast.error('Failed to delete complaint');
    }
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusColor = (status: string, needsRenterConfirmation?: boolean) => {
    if (needsRenterConfirmation) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    
    switch (status) {
      case 'resolved':
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

const getStatusText = (complaint: Complaint) => {
  if (complaint.manager_marked_resolved && !complaint.renter_marked_resolved) {
    return 'AWAITING YOUR CONFIRMATION';
  }
  if (complaint.status === 'resolved') {
    return 'RESOLVED';
  }
  return complaint.status.replace('_', ' ').toUpperCase();
};

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plumbing': return <FaWrench className="text-blue-600" />;
      case 'electrical': return <FaBolt className="text-yellow-600" />;
      case 'general': return <FaHome className="text-slate-600" />;
      default: return <FaTools className="text-violet-600" />;
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filterStatus === 'needs_confirmation') {
      if (!complaint.manager_marked_resolved || complaint.renter_marked_resolved) return false;
    } else if (filterStatus !== 'all' && complaint.status !== filterStatus) return false;
    
    if (filterPriority !== 'all' && complaint.priority !== filterPriority) return false;
    if (searchTerm && !complaint.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading && complaints.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Complaints</h1>
          <p className="text-slate-600">Submit and track your maintenance requests</p>
        </div>
        <button
          onClick={() => setShowNewComplaint(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2 transition-colors"
        >
          <FaPlus />
          New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Complaints</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <FaTools className="text-2xl text-violet-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{stats.pending}</p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.in_progress}</p>
            </div>
            <FaWrench className="text-2xl text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.resolved}</p>
            </div>
            <FaCheckCircle className="text-2xl text-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Confirmation</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{stats.needs_confirmation}</p>
            </div>
            <FaBell className="text-2xl text-amber-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="needs_confirmation">Needs My Confirmation</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={fetchComplaints}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FaSync />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Complaint Details</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Category</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Priority</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Created</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaTools className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">No complaints found</p>
                      <p className="text-slate-400 text-sm mt-1">
                        Submit a new complaint to get started
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900">{complaint.title}</p>
                        <p className="text-sm text-slate-600 mt-1 truncate max-w-xs">
                          {complaint.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(complaint.category)}
                        <span className="capitalize">{complaint.category}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                          complaint.status, 
                          complaint.manager_marked_resolved && !complaint.renter_marked_resolved
                        )}`}>
                          {getStatusText(complaint)}
                        </span>
                        
                        {complaint.manager_marked_resolved && !complaint.renter_marked_resolved && (
                          <div className="mt-2">
                            <div className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                              <FaBell className="text-xs" />
                              Awaiting your confirmation
                            </div>
                            <button
                              onClick={() => handleConfirmResolution(complaint.id)}
                              disabled={confirmingId === complaint.id}
                              className={`px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs flex items-center gap-1 w-full justify-center transition-colors ${
                                confirmingId === complaint.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {confirmingId === complaint.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                                  Confirming...
                                </>
                              ) : (
                                <>
                                  <FaCheck className="text-xs" />
                                  Confirm Fixed
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
  <div className="flex items-center gap-2">
    <button
      onClick={() => handleViewDetails(complaint)}
      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      title="View Details"
    >
      <FaEye />
    </button>
    
    {/* Add Mark as Resolved button for pending/in_progress complaints */}
    {(complaint.status === 'pending' || complaint.status === 'in_progress') && (
      <button
        onClick={() => handleMarkResolved(complaint.id)}
        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
        title="Mark as Resolved"
      >
        <FaCheckCircle />
      </button>
    )}
    
    {/* Keep the Confirm Fixed button for manager-resolved complaints */}
    {complaint.manager_marked_resolved && !complaint.renter_marked_resolved && (
      <button
        onClick={() => handleConfirmResolution(complaint.id)}
        disabled={confirmingId === complaint.id}
        className={`p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600 ${
          confirmingId === complaint.id ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Confirm Fixed"
      >
        {confirmingId === complaint.id ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-emerald-600"></div>
        ) : (
          <FaCheck />
        )}
      </button>
    )}
    
    <button
      onClick={() => handleDeleteComplaint(complaint.id)}
      className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-600"
      title="Delete"
    >
      <FaTrash />
    </button>
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Common Complaint Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaTint className="text-2xl text-blue-600" />
              <span className="font-medium">Plumbing</span>
              <span className="text-sm text-slate-500">Leaks, drainage, water issues</span>
            </div>
          </div>
          <div className="p-4 border rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaBolt className="text-2xl text-yellow-600" />
              <span className="font-medium">Electrical</span>
              <span className="text-sm text-slate-500">Wiring, lights, power issues</span>
            </div>
          </div>
          <div className="p-4 border rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaHome className="text-2xl text-slate-600" />
              <span className="font-medium">Structural</span>
              <span className="text-sm text-slate-500">Walls, floors, windows, doors</span>
            </div>
          </div>
          <div className="p-4 border rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <FaWrench className="text-2xl text-violet-600" />
              <span className="font-medium">General</span>
              <span className="text-sm text-slate-500">Appliance, cleaning, other</span>
            </div>
          </div>
        </div>
      </div>

      {showNewComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Submit New Complaint</h3>
                <button
                  onClick={() => setShowNewComplaint(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                    placeholder="Brief description of the issue"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={newComplaint.category}
                      onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                    >
                      <option value="general">General</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="structural">Structural</option>
                      <option value="appliance">Appliance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority *
                    </label>
                    <select
                      value={newComplaint.priority}
                      onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value as any})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                    placeholder="Detailed description of the issue..."
                    rows={4}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-amber-600 mt-1" />
                    <div>
                      <p className="font-medium text-amber-800">Emergency Contact</p>
                      <p className="text-sm text-amber-700 mt-1">
                        For urgent issues requiring immediate attention, please call the building manager at +880 17XXXXXXX
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowNewComplaint(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComplaint}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Submit Complaint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetails && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Complaint Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{selectedComplaint.title}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        selectedComplaint.status,
                        selectedComplaint.manager_marked_resolved && !selectedComplaint.renter_marked_resolved
                      )}`}>
                        {getStatusText(selectedComplaint)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FaCalendar />
                    <span>Submitted: {new Date(selectedComplaint.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-slate-900 mb-2">Description</h5>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-slate-900 mb-2">Category</h5>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(selectedComplaint.category)}
                      <span className="capitalize">{selectedComplaint.category}</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-900 mb-2">Last Updated</h5>
                    <div className="flex items-center gap-2 text-slate-600">
                      <FaCalendar />
                      <span>{new Date(selectedComplaint.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className={`p-3 rounded-lg ${selectedComplaint.manager_marked_resolved ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} border`}>
                    <p className="text-sm font-medium text-slate-700">Manager Status</p>
                    <p className={`mt-1 flex items-center gap-1 ${selectedComplaint.manager_marked_resolved ? 'text-emerald-600 font-semibold' : 'text-slate-600'}`}>
                      {selectedComplaint.manager_marked_resolved ? (
                        <>
                          <FaCheckCircle className="text-emerald-600" />
                          Marked as Resolved
                        </>
                      ) : (
                        <>
                          <FaHourglassHalf className="text-slate-600" />
                          Not Resolved Yet
                        </>
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${selectedComplaint.renter_marked_resolved ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} border`}>
                    <p className="text-sm font-medium text-slate-700">Your Status</p>
                    <p className={`mt-1 flex items-center gap-1 ${selectedComplaint.renter_marked_resolved ? 'text-emerald-600 font-semibold' : 'text-slate-600'}`}>
                      {selectedComplaint.renter_marked_resolved ? (
                        <>
                          <FaCheckCircle className="text-emerald-600" />
                          Confirmed Fixed
                        </>
                      ) : (
                        <>
                          <FaHourglassHalf className="text-slate-600" />
                          Not Confirmed Yet
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {selectedComplaint.assigned_to && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="p-2 bg-white rounded-lg">
                      <FaUser className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">Assigned to</p>
                      <p className="text-sm text-blue-600">{selectedComplaint.assigned_to}</p>
                    </div>
                  </div>
                )}

                {selectedComplaint.resolved_at && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="p-2 bg-white rounded-lg">
                      <FaCheckCircle className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-700">Resolved</p>
                      <p className="text-sm text-emerald-600">
                        {new Date(selectedComplaint.resolved_at).toLocaleDateString()}
                      </p>
                      {selectedComplaint.resolution && (
                        <p className="text-sm text-emerald-700 mt-2">{selectedComplaint.resolution}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedComplaint.manager_marked_resolved && !selectedComplaint.renter_marked_resolved && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaCheckCircle className="text-amber-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-800 mb-2">Confirm Resolution</p>
                        <p className="text-sm text-amber-700 mb-3">
                          The manager has marked this complaint as resolved. Please confirm that the issue has been fixed to complete the resolution process.
                        </p>
                        <button
                          onClick={() => {
                            handleConfirmResolution(selectedComplaint.id);
                            setShowDetails(false);
                          }}
                          disabled={confirmingId === selectedComplaint.id}
                          className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors ${
                            confirmingId === selectedComplaint.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {confirmingId === selectedComplaint.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                              Confirming...
                            </>
                          ) : (
                            <>
                              <FaCheckCircle />
                              Yes, Issue is Fixed
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

  <div className="flex flex-wrap gap-3 pt-6 border-t">
  {/* Add Mark as Resolved button */}
  {(selectedComplaint.status === 'pending' || selectedComplaint.status === 'in_progress') && (
    <button
      onClick={() => {
        handleMarkResolved(selectedComplaint.id);
        setShowDetails(false);
      }}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors"
    >
      <FaCheckCircle />
      Mark as Resolved
    </button>
  )}
  
  {/* Keep the Confirm Fixed button */}
  {selectedComplaint.manager_marked_resolved && !selectedComplaint.renter_marked_resolved && (
    <button
      onClick={() => {
        handleConfirmResolution(selectedComplaint.id);
        setShowDetails(false);
      }}
      disabled={confirmingId === selectedComplaint.id}
      className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors ${
        confirmingId === selectedComplaint.id ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {confirmingId === selectedComplaint.id ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          Confirming...
        </>
      ) : (
        <>
          <FaCheckCircle />
          Confirm Fixed
        </>
      )}
    </button>
  )}
  
  <button
    onClick={() => handleDeleteComplaint(selectedComplaint.id)}
    className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
  >
    <FaTrash />
    Delete
  </button>
</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenterComplaints;