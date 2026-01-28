// frontend/src/pages/owner/OwnerComplaints.tsx
import { AlertCircle, Clock, CheckCircle, Filter, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "pending" | "in-progress" | "resolved";
  apartment: string;
  renterName: string;
  createdAt: string;
  resolvedAt: string | null;
}

export function OwnerComplaints() {
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "resolved">("all");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/owner/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setComplaints(result.data);
      } else if (Array.isArray(result)) {
        setComplaints(result);
      } else {
        setComplaints([]);
      }
      
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints based on selected filter
  const filteredComplaints = filter === "all"
    ? complaints
    : complaints.filter(c => c.status === filter);

  // Calculate statistics from real data
  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const inProgressCount = complaints.filter(c => c.status === "in-progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;

  // Calculate resolution rate
  const resolutionRate = complaints.length > 0 
    ? (resolvedCount / complaints.length) * 100 
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance & Complaints</h1>
          <p className="text-gray-600 mt-1">Monitor all building maintenance issues and complaints</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <h2 className="font-medium">Error Loading Complaints</h2>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={fetchComplaints}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance & Complaints</h1>
          <p className="text-gray-600 mt-1">Monitor all building maintenance issues and complaints</p>
        </div>
        <button
          onClick={fetchComplaints}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Rate */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaint Resolution Rate</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>{resolvedCount} of {complaints.length} complaints resolved</span>
            <span className="font-semibold">{resolutionRate.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-violet-600 h-3 rounded-full transition-all"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            filter === "all"
              ? "bg-violet-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          All ({complaints.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg ${
            filter === "pending"
              ? "bg-violet-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("in-progress")}
          className={`px-4 py-2 rounded-lg ${
            filter === "in-progress"
              ? "bg-violet-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`px-4 py-2 rounded-lg ${
            filter === "resolved"
              ? "bg-violet-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">All Complaints ({filteredComplaints.length})</h2>
            {loading && (
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Updating...
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{complaint.title}</h3>
                        <p className="text-gray-600 mt-1">
                          {complaint.renterName} - {complaint.apartment}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ml-4 ${
                        complaint.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : complaint.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {complaint.status === "in-progress" ? "In Progress" : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">{complaint.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        Category: <span className="capitalize font-medium text-gray-900">{complaint.category}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        Priority: <span className={`capitalize font-medium ${
                          complaint.priority === "high" ? "text-red-600" :
                          complaint.priority === "medium" ? "text-yellow-600" :
                          "text-green-600"
                        }`}>{complaint.priority}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        Submitted: <span className="text-gray-900">
                          {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                      {complaint.resolvedAt && (
                        <span className="flex items-center gap-1">
                          Resolved: <span className="text-green-600">
                            {new Date(complaint.resolvedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredComplaints.length === 0 && complaints.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No complaints found in the system</p>
              </div>
            )}
            
            {filteredComplaints.length === 0 && complaints.length > 0 && (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  No complaints found with status: "{filter}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}