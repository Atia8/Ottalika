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
  FaUserCog,
  FaCalendar,
  FaHome,
  FaUser,
  FaPhone
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface MaintenanceRequest {
  id: string;
  renterName: string;
  apartment: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  estimatedCompletion?: string;
  resolvedAt?: string;
}

const ManagerMaintenance = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, priorityFilter, requests]);

  const fetchMaintenanceRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const requestsData = response.data.data.complaints || [];
        setRequests(requestsData);
        
        // Calculate stats
        const total = requestsData.length;
        const pending = requestsData.filter(r => r.status === 'pending').length;
        const inProgress = requestsData.filter(r => r.status === 'in_progress').length;
        const resolved = requestsData.filter(r => r.status === 'resolved').length;
        
        setStats({ total, pending, inProgress, resolved });
      } else {
        toast.error('Failed to fetch maintenance requests');
      }
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
      toast.error('Error loading maintenance data');
      
      // Mock data for testing
      const mockRequests: MaintenanceRequest[] = [
        {
          id: '1',
          renterName: 'John Doe',
          apartment: '101',
          type: 'plumbing',
          title: 'Water leakage in bathroom',
          description: 'There is a constant water leakage from the bathroom tap.',
          status: 'pending',
          priority: 'high',
          createdAt: '2024-01-05',
          updatedAt: '2024-01-05'
        },
        {
          id: '2',
          renterName: 'Jane Smith',
          apartment: '102',
          type: 'electrical',
          title: 'Power outlet not working',
          description: 'The power outlet in the living room stopped working.',
          status: 'in_progress',
          priority: 'medium',
          createdAt: '2024-01-04',
          updatedAt: '2024-01-05',
          assignedTo: 'Maintenance Team',
          estimatedCompletion: '2024-01-08'
        },
        {
          id: '3',
          renterName: 'Alice Brown',
          apartment: '201',
          type: 'elevator',
          title: 'Elevator making strange noise',
          description: 'The elevator makes loud grinding noises when moving.',
          status: 'resolved',
          priority: 'high',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-04',
          resolvedAt: '2024-01-04'
        },
        {
          id: '4',
          renterName: 'John Doe',
          apartment: '101',
          type: 'cleaning',
          title: 'Garbage disposal area needs cleaning',
          description: 'The garbage area is overflowing and smells bad.',
          status: 'pending',
          priority: 'low',
          createdAt: '2024-01-06',
          updatedAt: '2024-01-06'
        }
      ];
      
      setRequests(mockRequests);
      setStats({
        total: mockRequests.length,
        pending: mockRequests.filter(r => r.status === 'pending').length,
        inProgress: mockRequests.filter(r => r.status === 'in_progress').length,
        resolved: mockRequests.filter(r => r.status === 'resolved').length
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request =>
        request.renterName.toLowerCase().includes(term) ||
        request.apartment.toLowerCase().includes(term) ||
        request.title.toLowerCase().includes(term) ||
        request.type.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    return filtered;
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleUpdateStatus = async (requestId: string, status: string, resolution?: string) => {
    try {
      const token = localStorage.getItem('token');
      const data: any = { status };
      if (resolution) data.resolution = resolution;
      
      await axios.put(`${API_URL}/manager/complaints/${requestId}/status`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Request status updated to ${status}`);
      fetchMaintenanceRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAssignTask = (requestId: string) => {
    const assignedTo = prompt('Enter the name of the person to assign this task to:');
    if (assignedTo) {
      handleUpdateStatus(requestId, 'in_progress');
      toast.success(`Task assigned to ${assignedTo}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const filteredRequests = filterRequests();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-slate-600">Manage and track all maintenance issues</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast.success('Add request feature coming soon!')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
          >
            <FaEdit />
            New Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Requests</p>
              <p className="text-2xl font-bold mt-2">{stats.total}</p>
            </div>
            <FaTools className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">{stats.pending}</p>
            </div>
            <FaClock className="text-2xl text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold mt-2 text-blue-600">{stats.inProgress}</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.resolved}</p>
            </div>
            <FaCheckCircle className="text-2xl text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by renter name, apartment, or issue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <FaFilter />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Renter & Apartment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
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
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No maintenance requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{request.title}</p>
                        <p className="text-sm text-slate-600 mt-1 truncate max-w-xs">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <FaCalendar />
                          <span>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <FaUser className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{request.renterName}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <FaHome className="text-xs" />
                            <span>Apartment {request.apartment}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
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
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAssignTask(request.id)}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Assign"
                            >
                              <FaUserCog />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'resolved', 'Issue resolved')}
                              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Mark Resolved"
                            >
                              <FaCheckCircle />
                            </button>
                          </>
                        )}
                        {request.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'resolved', 'Issue resolved')}
                            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Mark Resolved"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Maintenance Request Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Request Information</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600">Title</p>
                      <p className="font-medium text-lg">{selectedRequest.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Description</p>
                      <p className="font-medium mt-1 p-3 bg-slate-50 rounded-lg">
                        {selectedRequest.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Type</p>
                      <p className="font-medium capitalize">{selectedRequest.type}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Status</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Priority</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                          {selectedRequest.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Contact Information</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg">
                        <FaUser className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedRequest.renterName}</p>
                        <p className="text-sm text-slate-600">Renter</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg">
                        <FaHome className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">Apartment {selectedRequest.apartment}</p>
                        <p className="text-sm text-slate-600">Unit</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg">
                        <FaCalendar className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(selectedRequest.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-600">Submitted Date</p>
                      </div>
                    </div>
                    {selectedRequest.assignedTo && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="p-2 bg-white rounded-lg">
                          <FaUserCog className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedRequest.assignedTo}</p>
                          <p className="text-sm text-slate-600">Assigned To</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold text-slate-900 mb-4">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                    Contact Renter
                  </button>
                  <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Update Status
                  </button>
                  <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Add Note
                  </button>
                  <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Schedule Visit
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