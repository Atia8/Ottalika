import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaTools, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTimes,
  FaUserCog,
  FaCalendar,
  FaHome,
  FaUser,
  FaPhone,
  FaPlus,
  FaTrash,
  FaSync,
  FaExclamationCircle,
  FaWrench,
  FaBuilding,
  FaEnvelope
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface MaintenanceRequest {
  id: string;
  renterName: string;
  apartment: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  estimatedCompletion?: string;
  resolvedAt?: string;
  renterPhone?: string;
  renterEmail?: string;
  notes?: string;
  floor?: string;
}

const ManagerMaintenance = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  });
  
  // New request form state
  const [newRequest, setNewRequest] = useState({
    apartment: '',
    type: 'general',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
        // Try to fetch from real API first
        const response = await axios.get(`${API_URL}/manager/maintenance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const requestsData = response.data.data.issues || [];
          const formattedRequests = requestsData.map((req: any) => ({
            id: req.id.toString(),
            renterName: req.renter_name || 'Unknown Renter',
            apartment: req.apartment_number || req.apartment || 'Unknown',
            type: req.type || 'general',
            title: req.title || 'Maintenance Request',
            description: req.description || 'No description provided',
            status: req.status === 'completed' ? 'resolved' : req.status,
            priority: req.priority || 'medium',
            createdAt: req.created_at ? new Date(req.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            updatedAt: req.updated_at ? new Date(req.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            assignedTo: req.assigned_to,
            renterPhone: req.renter_phone,
            renterEmail: req.renter_email,
            notes: req.notes,
            floor: req.floor
          }));
          
          setRequests(formattedRequests);
          updateStats(formattedRequests);
        } else {
          throw new Error('API returned error');
        }
      } catch (apiError) {
        console.log('API endpoint not available, using mock data');
        useMockData();
      }
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
      toast.error('Error loading maintenance data');
      useMockData();
    } finally {
      setLoading(false);
    }
  };

  const useMockData = () => {
    const mockRequests: MaintenanceRequest[] = [
      {
        id: '1',
        renterName: 'John Doe',
        apartment: '101',
        type: 'plumbing',
        title: 'Water leakage in bathroom',
        description: 'There is a constant water leakage from the bathroom tap. Need urgent repair.',
        status: 'pending',
        priority: 'high',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-05',
        renterPhone: '+1234567890',
        renterEmail: 'john@example.com',
        floor: '1'
      },
      {
        id: '2',
        renterName: 'Jane Smith',
        apartment: '102',
        type: 'electrical',
        title: 'Power outlet not working',
        description: 'The power outlet in the living room stopped working. Check wiring and socket.',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-04',
        updatedAt: '2024-01-05',
        assignedTo: 'Maintenance Team',
        estimatedCompletion: '2024-01-08',
        renterPhone: '+1987654321',
        renterEmail: 'jane@example.com',
        floor: '1'
      },
      {
        id: '3',
        renterName: 'Alice Brown',
        apartment: '201',
        type: 'elevator',
        title: 'Elevator making strange noise',
        description: 'The elevator makes loud grinding noises when moving between floors.',
        status: 'resolved',
        priority: 'urgent',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-04',
        resolvedAt: '2024-01-04',
        assignedTo: 'Technical Team',
        renterPhone: '+1122334455',
        renterEmail: 'alice@example.com',
        floor: '2'
      },
      {
        id: '4',
        renterName: 'Bob Johnson',
        apartment: '103',
        type: 'cleaning',
        title: 'Garbage disposal area needs cleaning',
        description: 'The garbage area is overflowing and smells bad. Needs immediate attention.',
        status: 'pending',
        priority: 'low',
        createdAt: '2024-01-06',
        updatedAt: '2024-01-06',
        renterPhone: '+1567890123',
        renterEmail: 'bob@example.com',
        floor: '1'
      },
      {
        id: '5',
        renterName: 'Emma Wilson',
        apartment: '301',
        type: 'ac',
        title: 'Air conditioner not cooling',
        description: 'AC unit in bedroom not cooling properly. Needs servicing.',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-06',
        assignedTo: 'HVAC Specialist',
        estimatedCompletion: '2024-01-09',
        renterPhone: '+1678901234',
        renterEmail: 'emma@example.com',
        floor: '3'
      }
    ];
    
    setRequests(mockRequests);
    updateStats(mockRequests);
  };

  const updateStats = (requestsData: MaintenanceRequest[]) => {
    const total = requestsData.length;
    const pending = requestsData.filter(r => r.status === 'pending').length;
    const inProgress = requestsData.filter(r => r.status === 'in_progress').length;
    const resolved = requestsData.filter(r => r.status === 'resolved' || r.status === 'completed').length;
    const urgent = requestsData.filter(r => r.priority === 'urgent').length;
    
    setStats({ total, pending, inProgress, resolved, urgent });
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleUpdateStatus = async (requestId: string, status: string, resolution?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try real API first
      try {
        await axios.put(`${API_URL}/manager/maintenance/${requestId}`, {
          status: status === 'resolved' ? 'completed' : status,
          notes: resolution
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError) {
        console.log('Using mock update');
      }
      
      // Update local state
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                status: status as any,
                resolvedAt: status === 'resolved' ? new Date().toISOString().split('T')[0] : request.resolvedAt,
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : request
        )
      );
      
      toast.success(`Request marked as ${status.replace('_', ' ')}`);
      
      // Refresh stats
      fetchMaintenanceRequests();
      
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAssignTask = async (requestId: string) => {
    const assignedTo = prompt('Enter the name of the person to assign this task to:', 'Maintenance Team');
    if (!assignedTo) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Try real API first
      try {
        await axios.put(`${API_URL}/manager/maintenance/${requestId}`, {
          assigned_to: assignedTo,
          status: 'in_progress'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError) {
        console.log('Using mock assignment');
      }
      
      // Update local state
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                assignedTo,
                status: 'in_progress',
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : request
        )
      );
      
      toast.success(`Task assigned to ${assignedTo}`);
      fetchMaintenanceRequests();
      
    } catch (error) {
      console.error('Failed to assign task:', error);
      toast.error('Failed to assign task');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this maintenance request?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Try real API first
      try {
        await axios.delete(`${API_URL}/manager/maintenance/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError) {
        console.log('Using mock delete');
      }
      
      // Update local state
      setRequests(prev => prev.filter(request => request.id !== requestId));
      toast.success('Maintenance request deleted successfully');
      fetchMaintenanceRequests();
      
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error('Failed to delete request');
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Try real API first
      try {
        await axios.post(`${API_URL}/manager/maintenance`, {
          title: newRequest.title,
          description: newRequest.description,
          type: newRequest.type,
          priority: newRequest.priority,
          apartment: newRequest.apartment
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError) {
        console.log('Using mock create');
      }
      
      // Create new request in local state
      const newReq: MaintenanceRequest = {
        id: (requests.length + 1).toString(),
        renterName: 'Manager Created',
        apartment: newRequest.apartment || 'N/A',
        type: newRequest.type,
        title: newRequest.title,
        description: newRequest.description,
        status: 'pending',
        priority: newRequest.priority,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        floor: newRequest.apartment.charAt(0) // Assuming first char is floor number
      };
      
      setRequests(prev => [newReq, ...prev]);
      setNewRequest({
        apartment: '',
        type: 'general',
        title: '',
        description: '',
        priority: 'medium'
      });
      setShowCreateModal(false);
      
      toast.success('Maintenance request created successfully');
      fetchMaintenanceRequests();
      
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('Failed to create request');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'completed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'plumbing': return '💧';
      case 'electrical': return '⚡';
      case 'ac': return '❄️';
      case 'cleaning': return '🧹';
      case 'elevator': return '🛗';
      default: return '🔧';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!(
        request.renterName.toLowerCase().includes(term) ||
        request.apartment.toLowerCase().includes(term) ||
        request.title.toLowerCase().includes(term) ||
        request.type.toLowerCase().includes(term) ||
        request.description.toLowerCase().includes(term)
      )) {
        return false;
      }
    }
    
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }
    
    if (priorityFilter !== 'all' && request.priority !== priorityFilter) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600 mb-4"></div>
        <p className="text-slate-600">Loading maintenance requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Management</h1>
          <p className="text-slate-600">Track and manage all maintenance issues and requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchMaintenanceRequests()}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            disabled={loading}
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
          >
            <FaPlus />
            New Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Requests</p>
              <p className="text-2xl font-bold mt-2">{stats.total}</p>
            </div>
            <FaTools className="text-2xl text-violet-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">{stats.pending}</p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold mt-2 text-blue-600">{stats.inProgress}</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.resolved}</p>
            </div>
            <FaCheckCircle className="text-2xl text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Urgent</p>
              <p className="text-2xl font-bold mt-2 text-rose-600">{stats.urgent}</p>
            </div>
            <FaExclamationCircle className="text-2xl text-rose-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by renter, apartment, issue, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <FaFilter />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Renter & Location
                </th>
                <th className="px 6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaTools className="text-4xl text-slate-300 mb-4" />
                      <p className="text-lg text-slate-500">No maintenance requests found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Create a new maintenance request to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-1">{getTypeIcon(request.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{request.title}</p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <FaCalendar className="text-xs" />
                              <span>
                                {new Date(request.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <span className="capitalize">{request.type}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FaUser className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{request.renterName}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <div className="flex items-center gap-1">
                              <FaHome className="text-xs" />
                              <span>#{request.apartment}</span>
                            </div>
                            {request.floor && (
                              <div className="flex items-center gap-1">
                                <FaBuilding className="text-xs" />
                                <span>Floor {request.floor}</span>
                              </div>
                            )}
                          </div>
                          {request.assignedTo && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                              <FaUserCog className="text-xs" />
                              <span>{request.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {request.resolvedAt && (
                          <span className="text-xs text-slate-500">
                            Resolved: {new Date(request.resolvedAt).toLocaleDateString('short')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAssignTask(request.id)}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Assign Task"
                            >
                              <FaUserCog />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Start Work"
                            >
                              <FaWrench />
                            </button>
                          </>
                        )}
                        
                        {request.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'resolved', 'Issue resolved')}
                            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark Resolved"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Request"
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

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Create Maintenance Request</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Apartment Number
                  </label>
                  <input
                    type="text"
                    value={newRequest.apartment}
                    onChange={(e) => setNewRequest({...newRequest, apartment: e.target.value})}
                    placeholder="e.g., 101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={newRequest.type}
                    onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="general">General</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="ac">AC</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="elevator">Elevator</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({...newRequest, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                    placeholder="Brief description of the issue"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                    placeholder="Detailed description of the issue..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Create Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedRequest.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                      {selectedRequest.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <FaTimes className="text-slate-500" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Request Information</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600">Description</p>
                      <p className="font-medium mt-1 p-3 bg-slate-50 rounded-lg whitespace-pre-wrap">
                        {selectedRequest.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Type</p>
                        <p className="font-medium capitalize flex items-center gap-2">
                          {getTypeIcon(selectedRequest.type)} {selectedRequest.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Created</p>
                        <p className="font-medium">
                          {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Contact & Assignment</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg">
                        <FaUser className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{selectedRequest.renterName}</p>
                        <p className="text-sm text-slate-600">Renter</p>
                        {selectedRequest.renterEmail && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <FaEnvelope /> {selectedRequest.renterEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg">
                        <FaHome className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Apartment {selectedRequest.apartment}</p>
                        <p className="text-sm text-slate-600">Unit</p>
                        {selectedRequest.floor && (
                          <p className="text-xs text-slate-500 mt-1">Floor {selectedRequest.floor}</p>
                        )}
                      </div>
                    </div>
                    {selectedRequest.assignedTo && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="p-2 bg-white rounded-lg">
                          <FaUserCog className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-700">{selectedRequest.assignedTo}</p>
                          <p className="text-sm text-blue-600">Assigned To</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.estimatedCompletion && (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="p-2 bg-white rounded-lg">
                          <FaCalendar className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-700">
                            {new Date(selectedRequest.estimatedCompletion).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-amber-600">Estimated Completion</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold text-slate-900 mb-4">Actions</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleAssignTask(selectedRequest.id);
                          setShowModal(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FaUserCog />
                        Assign Task
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedRequest.id, 'resolved');
                          setShowModal(false);
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                      >
                        <FaCheckCircle />
                        Mark Resolved
                      </button>
                    </>
                  )}
                  {selectedRequest.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedRequest.id, 'resolved');
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <FaCheckCircle />
                      Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (selectedRequest.renterPhone) {
                        window.open(`tel:${selectedRequest.renterPhone}`, '_blank');
                      } else {
                        toast.error('Phone number not available');
                      }
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FaPhone />
                    Call Renter
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteRequest(selectedRequest.id);
                      setShowModal(false);
                    }}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2"
                  >
                    <FaTrash />
                    Delete Request
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

export default ManagerMaintenance;