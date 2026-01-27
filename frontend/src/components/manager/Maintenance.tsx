// src/components/manager/ManagerMaintenance.tsx
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
  FaEnvelope,
  FaBell,
  FaCheck,
  FaHourglassHalf
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
  manager_marked_resolved?: boolean;
  renter_marked_resolved?: boolean;
  resolution?: string;
  resolution_notes?: string;
  needs_renter_confirmation?: boolean;
  estimated_cost?: number;
  actual_cost?: number;
  completed_at?: string;
  assigned_at?: string;
  building_name?: string;
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
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveData, setResolveData] = useState({
    resolution: '',
    resolution_notes: ''
  });
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
    waitingConfirmation: 0
  });
  
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
      
      console.log('📡 Fetching maintenance requests from API...');
      
      const response = await axios.get(`${API_URL}/manager/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ API Response:', response.data);
      
      if (response.data.success) {
        const requestsData = response.data.data.complaints || [];
        
        if (requestsData.length === 0) {
          toast('No complaints found in the database. Using mock data for demo.');
          useMockData();
          return;
        }
        
        const formattedRequests = requestsData.map((req: any) => {
          let status: MaintenanceRequest['status'] = 'pending';
          
          if (req.owner_view_status === 'resolved') {
            status = 'resolved';
          } else if (req.owner_view_status === 'pending_renter_confirmation') {
            status = 'completed';
          } else if (req.status === 'in_progress') {
            status = 'in_progress';
          } else if (req.status === 'completed' || req.status === 'resolved') {
            status = 'completed';
          }
          
          const formatDate = (dateString: string) => {
            if (!dateString) return new Date().toISOString().split('T')[0];
            try {
              return new Date(dateString).toISOString().split('T')[0];
            } catch {
              return new Date().toISOString().split('T')[0];
            }
          };
          
          return {
            id: req.id?.toString() || Math.random().toString(),
            renterName: req.renter_name || 'Unknown Renter',
            apartment: req.apartment_number || 'Unknown',
            type: req.type || req.category || 'general',
            title: req.title || 'Maintenance Request',
            description: req.description || 'No description provided',
            status: status,
            priority: (req.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
            createdAt: formatDate(req.created_at),
            updatedAt: formatDate(req.updated_at),
            assignedTo: req.assigned_to,
            renterPhone: req.renter_phone,
            renterEmail: req.renter_email,
            notes: req.notes,
            floor: req.floor,
            manager_marked_resolved: req.manager_marked_resolved || false,
            renter_marked_resolved: req.renter_marked_resolved || false,
            resolution: req.resolution,
            resolution_notes: req.resolution_notes,
            needs_renter_confirmation: (req.manager_marked_resolved && !req.renter_marked_resolved) || false,
            estimated_cost: req.estimated_cost,
            actual_cost: req.actual_cost,
            completed_at: req.completed_at,
            assigned_at: req.assigned_at,
            building_name: req.building_name,
            resolvedAt: req.completed_at ? formatDate(req.completed_at) : undefined
          };
        });
        
        setRequests(formattedRequests);
        updateStats(formattedRequests);
        
        console.log('✅ Formatted complaints:', formattedRequests);
        
      } else {
        toast.error('Failed to fetch complaints from server');
        useMockData();
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch maintenance requests:', error);
      
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.status === 404) {
          toast.error('Complaints endpoint not found. Please check backend routes.');
        } else if (error.response.status === 401) {
          toast.error('Authentication failed. Please login again.');
        } else if (error.response.status === 500) {
          toast.error('Server error. Please check backend logs.');
        } else {
          toast.error(`Server error: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else {
        console.error('Error message:', error.message);
        toast.error(`Error: ${error.message}`);
      }
      
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
        floor: '1',
        manager_marked_resolved: false,
        renter_marked_resolved: false,
        building_name: 'Main Building'
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
        floor: '1',
        manager_marked_resolved: false,
        renter_marked_resolved: false,
        building_name: 'Main Building'
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
        floor: '2',
        manager_marked_resolved: true,
        renter_marked_resolved: true,
        resolution: 'Elevator motor replaced and lubricated',
        resolution_notes: 'Full maintenance completed',
        building_name: 'Main Building'
      },
      {
        id: '4',
        renterName: 'Bob Johnson',
        apartment: '103',
        type: 'cleaning',
        title: 'Garbage disposal area needs cleaning',
        description: 'The garbage area is overflowing and smells bad. Needs immediate attention.',
        status: 'completed',
        priority: 'low',
        createdAt: '2024-01-06',
        updatedAt: '2024-01-07',
        renterPhone: '+1567890123',
        renterEmail: 'bob@example.com',
        floor: '1',
        manager_marked_resolved: true,
        renter_marked_resolved: false,
        resolution: 'Area cleaned and sanitized',
        resolution_notes: 'Waiting for renter confirmation',
        needs_renter_confirmation: true,
        building_name: 'Main Building'
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
        floor: '3',
        manager_marked_resolved: false,
        renter_marked_resolved: false,
        building_name: 'Main Building'
      }
    ];
    
    setRequests(mockRequests);
    updateStats(mockRequests);
  };

  const updateStats = (requestsData: MaintenanceRequest[]) => {
    const total = requestsData.length;
    const pending = requestsData.filter(r => r.status === 'pending').length;
    const inProgress = requestsData.filter(r => r.status === 'in_progress').length;
    const resolved = requestsData.filter(r => 
      r.manager_marked_resolved && r.renter_marked_resolved
    ).length;
    const urgent = requestsData.filter(r => r.priority === 'urgent').length;
    const waitingConfirmation = requestsData.filter(r => 
      r.manager_marked_resolved && !r.renter_marked_resolved
    ).length;
    
    setStats({ total, pending, inProgress, resolved, urgent, waitingConfirmation });
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log(`Updating request ${requestId} to status: ${status}`);
      
      const response = await axios.put(
        `${API_URL}/manager/complaints/${requestId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  status: status as any,
                  updatedAt: new Date().toISOString().split('T')[0]
                }
              : request
          )
        );
        
        toast.success(`Request marked as ${status.replace('_', ' ')}`);
        fetchMaintenanceRequests();
        
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
      
    } catch (error: any) {
      console.error('Failed to update status:', error);
      
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                status: status as any,
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : request
        )
      );
      
      toast.success(`Request marked as ${status.replace('_', ' ')} (local update)`);
    }
  };

  const handleMarkResolved = async (requestId: string) => {
    try {
      setResolvingId(requestId);
      const resolution = prompt('Enter resolution details:');
      const resolution_notes = prompt('Enter any additional notes (optional):');
      
      if (!resolution) {
        toast.error('Resolution details are required');
        setResolvingId(null);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      console.log(`📤 Marking request ${requestId} as resolved`);
      
      // Use the correct endpoint based on your backend
      const response = await axios.put(
        `${API_URL}/manager/complaints/${requestId}/mark-resolved`,
        {
          resolution,
          resolution_notes: resolution_notes || '',
          status: 'completed'
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Mark resolved response:', response.data);
      
      if (response.data.success) {
        toast.success('Complaint marked as resolved. Waiting for renter confirmation.');
        
        // Update local state
        setRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  status: 'completed',
                  manager_marked_resolved: true,
                  resolution,
                  resolution_notes: resolution_notes || '',
                  completed_at: new Date().toISOString(),
                  updatedAt: new Date().toISOString().split('T')[0],
                  resolvedAt: new Date().toISOString().split('T')[0]
                }
              : request
          )
        );
        
        // Update stats
        setStats(prev => ({
          ...prev,
          waitingConfirmation: prev.waitingConfirmation + 1,
          inProgress: Math.max(0, prev.inProgress - 1)
        }));
        
        // Refresh complaints list
        fetchMaintenanceRequests();
        
      } else {
        toast.error(response.data.message || 'Failed to mark as resolved');
      }
    } catch (error: any) {
      console.error('❌ Failed to mark as resolved:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.status === 404) {
          toast.error('Endpoint not found. Using alternative method.');
          // Try alternative endpoint
          await markResolvedAlternative(requestId);
        } else {
          toast.error(error.response.data?.message || 'Failed to mark as resolved');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } finally {
      setResolvingId(null);
    }
  };

  const markResolvedAlternative = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const resolution = prompt('Enter resolution details:');
      const resolution_notes = prompt('Enter any additional notes (optional):');
      
      if (!resolution) {
        toast.error('Resolution details are required');
        return;
      }
      
      // Alternative: Use status update endpoint
      const response = await axios.put(
        `${API_URL}/manager/complaints/${requestId}/status`,
        {
          status: 'completed',
          resolution,
          resolution_notes: resolution_notes || '',
          manager_marked_resolved: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Complaint marked as resolved (alternative method). Waiting for renter confirmation.');
        
        setRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  status: 'completed',
                  manager_marked_resolved: true,
                  resolution,
                  resolution_notes: resolution_notes || '',
                  completed_at: new Date().toISOString(),
                  updatedAt: new Date().toISOString().split('T')[0]
                }
              : request
          )
        );
        
        fetchMaintenanceRequests();
      }
    } catch (error) {
      console.error('Alternative method failed:', error);
      toast.error('Failed to mark as resolved. Please try again later.');
    }
  };

  const handleAssignTask = async (requestId: string) => {
    const assignedTo = prompt('Enter the name of the person to assign this task to:', 'Maintenance Team');
    if (!assignedTo) return;
    
    try {
      const token = localStorage.getItem('token');
      
      console.log(`Assigning request ${requestId} to ${assignedTo}`);
      
      const response = await axios.post(
        `${API_URL}/manager/complaints/${requestId}/assign`,
        { assigned_to: assignedTo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  assignedTo: assignedTo,
                  status: 'in_progress',
                  updatedAt: new Date().toISOString().split('T')[0],
                  assigned_at: new Date().toISOString()
                }
              : request
          )
        );
        
        toast.success(`Task assigned to ${assignedTo}`);
        fetchMaintenanceRequests();
        
      } else {
        throw new Error(response.data.message || 'Failed to assign task');
      }
      
    } catch (error: any) {
      console.error('Failed to assign task:', error);
      
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                assignedTo: assignedTo,
                status: 'in_progress',
                updatedAt: new Date().toISOString().split('T')[0],
                assigned_at: new Date().toISOString()
              }
            : request
        )
      );
      
      toast.success(`Task assigned to ${assignedTo} (local update)`);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this maintenance request?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      console.log(`Deleting request ${requestId}`);
      
      const response = await axios.delete(
        `${API_URL}/manager/complaints/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setRequests(prev => prev.filter(request => request.id !== requestId));
        toast.success('Maintenance request deleted successfully');
        fetchMaintenanceRequests();
        
      } else {
        throw new Error(response.data.message || 'Failed to delete request');
      }
      
    } catch (error: any) {
      console.error('Failed to delete request:', error);
      
      setRequests(prev => prev.filter(request => request.id !== requestId));
      toast.success('Maintenance request deleted (local update)');
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Creating new maintenance request:', newRequest);
      
      const response = await axios.post(
        `${API_URL}/manager/maintenance`,
        {
          title: newRequest.title,
          description: newRequest.description,
          type: newRequest.type,
          priority: newRequest.priority,
          apartment_id: 1,
          renter_id: 1
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        fetchMaintenanceRequests();
        
        setNewRequest({
          apartment: '',
          type: 'general',
          title: '',
          description: '',
          priority: 'medium'
        });
        setShowCreateModal(false);
        
        toast.success('Maintenance request created successfully');
        
      } else {
        throw new Error(response.data.message || 'Failed to create request');
      }
      
    } catch (error: any) {
      console.error('Failed to create request:', error);
      
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
        floor: newRequest.apartment.charAt(0),
        manager_marked_resolved: false,
        renter_marked_resolved: false,
        building_name: 'Main Building'
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
      
      toast.success('Maintenance request created (local update)');
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

  const getStatusColor = (status: string, needsRenterConfirmation?: boolean) => {
    if (needsRenterConfirmation) {
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
    
    switch (status) {
      case 'resolved':
      case 'completed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusText = (request: MaintenanceRequest) => {
    if (request.manager_marked_resolved && !request.renter_marked_resolved) {
      return 'AWAITING CONFIRMATION';
    }
    return request.status.replace('_', ' ').toUpperCase();
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

  const getResolutionStatus = (request: MaintenanceRequest) => {
    if (request.manager_marked_resolved && request.renter_marked_resolved) {
      return { text: 'Fully Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    } else if (request.manager_marked_resolved && !request.renter_marked_resolved) {
      return { text: 'Waiting Renter Confirmation', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    } else if (request.status === 'completed') {
      return { text: 'Completed (Needs Review)', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    return null;
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
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'needs_confirmation') {
        if (!request.manager_marked_resolved || request.renter_marked_resolved) return false;
      } else if (statusFilter === 'completed') {
        if (request.status !== 'completed' && request.status !== 'resolved') return false;
      } else {
        if (request.status !== statusFilter) return false;
      }
    }
    
    if (priorityFilter !== 'all' && request.priority !== priorityFilter) {
      return false;
    }
    
    return true;
  });

  if (loading && requests.length === 0) {
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
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2 transition-colors"
          >
            <FaPlus />
            New Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Awaiting Confirmation</p>
              <p className="text-2xl font-bold mt-2 text-amber-600">{stats.waitingConfirmation}</p>
            </div>
            <FaBell className="text-2xl text-amber-500" />
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
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="needs_confirmation">Awaiting Renter Confirmation</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
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
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Resolution Status
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
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                filteredRequests.map((request) => {
                  const resolutionStatus = getResolutionStatus(request);
                  
                  return (
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
                            {request.building_name && (
                              <div className="text-xs text-slate-500 mt-1">
                                {request.building_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            request.status,
                            request.manager_marked_resolved && !request.renter_marked_resolved
                          )}`}>
                            {getStatusText(request)}
                          </span>
                          {request.resolvedAt && (
                            <span className="text-xs text-slate-500">
                              Resolved: {new Date(request.resolvedAt).toLocaleDateString('short')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {resolutionStatus ? (
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${resolutionStatus.color}`}>
                              {resolutionStatus.text}
                            </span>
                            {request.manager_marked_resolved && !request.renter_marked_resolved && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <FaBell className="text-xs" />
                                Waiting for renter
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">In progress</span>
                        )}
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
                              onClick={() => handleMarkResolved(request.id)}
                              disabled={resolvingId === request.id}
                              className={`p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors ${
                                resolvingId === request.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Mark Resolved"
                            >
                              {resolvingId === request.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-emerald-600"></div>
                              ) : (
                                <FaCheckCircle />
                              )}
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
                  );
                })
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
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={newRequest.type}
                    onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedRequest.status,
                      selectedRequest.manager_marked_resolved && !selectedRequest.renter_marked_resolved
                    )}`}>
                      {getStatusText(selectedRequest)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                      {selectedRequest.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
                    {selectedRequest.notes && (
                      <div>
                        <p className="text-sm text-slate-600">Internal Notes</p>
                        <p className="font-medium mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          {selectedRequest.notes}
                        </p>
                      </div>
                    )}
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
                        {selectedRequest.renterPhone && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <FaPhone /> {selectedRequest.renterPhone}
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
                        {selectedRequest.building_name && (
                          <p className="text-xs text-slate-500 mt-1">{selectedRequest.building_name}</p>
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
                          {selectedRequest.assigned_at && (
                            <p className="text-xs text-blue-500 mt-1">
                              Assigned: {new Date(selectedRequest.assigned_at).toLocaleDateString('short')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Resolution Status */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className={`p-3 rounded-lg ${selectedRequest.manager_marked_resolved ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} border`}>
                        <p className="text-sm font-medium text-slate-700">Manager Status</p>
                        <p className={`mt-1 flex items-center gap-1 ${selectedRequest.manager_marked_resolved ? 'text-emerald-600 font-semibold' : 'text-slate-600'}`}>
                          {selectedRequest.manager_marked_resolved ? (
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
                      <div className={`p-3 rounded-lg ${selectedRequest.renter_marked_resolved ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} border`}>
                        <p className="text-sm font-medium text-slate-700">Renter Status</p>
                        <p className={`mt-1 flex items-center gap-1 ${selectedRequest.renter_marked_resolved ? 'text-emerald-600 font-semibold' : 'text-slate-600'}`}>
                          {selectedRequest.renter_marked_resolved ? (
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
                    
                    {selectedRequest.resolution && (
                      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="p-2 bg-white rounded-lg">
                          <FaCheckCircle className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-700">Resolution Details</p>
                          <p className="text-sm text-emerald-700 mt-2">{selectedRequest.resolution}</p>
                          {selectedRequest.resolution_notes && (
                            <p className="text-xs text-emerald-600 mt-1">{selectedRequest.resolution_notes}</p>
                          )}
                          {selectedRequest.completed_at && (
                            <p className="text-xs text-emerald-500 mt-2">
                              Completed: {new Date(selectedRequest.completed_at).toLocaleDateString('short')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Cost Information */}
                    {(selectedRequest.estimated_cost || selectedRequest.actual_cost) && (
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="p-2 bg-white rounded-lg">
                          <FaTools className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-purple-700">Cost Information</p>
                          <div className="flex gap-4 mt-2">
                            {selectedRequest.estimated_cost && (
                              <div>
                                <p className="text-xs text-purple-600">Estimated Cost</p>
                                <p className="text-sm font-semibold text-purple-700">
                                  ${selectedRequest.estimated_cost.toFixed(2)}
                                </p>
                              </div>
                            )}
                            {selectedRequest.actual_cost && (
                              <div>
                                <p className="text-xs text-purple-600">Actual Cost</p>
                                <p className="text-sm font-semibold text-purple-700">
                                  ${selectedRequest.actual_cost.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                      >
                        <FaUserCog />
                        Assign Task
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedRequest.id, 'in_progress');
                          setShowModal(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                      >
                        <FaWrench />
                        Start Work
                      </button>
                    </>
                  )}
                  
                  {selectedRequest.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        handleMarkResolved(selectedRequest.id);
                      }}
                      disabled={resolvingId === selectedRequest.id}
                      className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors ${
                        resolvingId === selectedRequest.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {resolvingId === selectedRequest.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Marking...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          Mark Resolved
                        </>
                      )}
                    </button>
                  )}
                  
                  {selectedRequest.manager_marked_resolved && !selectedRequest.renter_marked_resolved && (
                    <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-800 mb-2">
                        ⏳ Waiting for renter confirmation
                      </p>
                      <p className="text-sm text-amber-700">
                        The renter needs to confirm that the issue is fixed before it's considered fully resolved.
                        The renter will receive a notification to confirm.
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      if (selectedRequest.renterPhone) {
                        window.open(`tel:${selectedRequest.renterPhone}`, '_blank');
                      } else {
                        toast.error('Phone number not available');
                      }
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <FaPhone />
                    Call Renter
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteRequest(selectedRequest.id);
                      setShowModal(false);
                    }}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2 transition-colors"
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