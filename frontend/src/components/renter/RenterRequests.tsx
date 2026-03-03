import { useEffect, useState } from "react";
import { Plus, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  getRenterRequests,
  createRenterRequest,
} from "../../services/renterRequestService";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function RenterRequests() {
  const { user } = useAuth();
  const [renterProfile, setRenterProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Fetch renter profile on mount
  useEffect(() => {
    fetchRenterProfile();
  }, []);

  const fetchRenterProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/renter/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Renter profile loaded:', data.data);
        setRenterProfile(data.data);
        // After getting profile, fetch their requests
        fetchRequests(data.data.id);
      } else {
        console.error('Failed to fetch renter profile');
      }
    } catch (error) {
      console.error('Error fetching renter profile:', error);
    }
  };

  const fetchRequests = async (id: number) => {
    try {
      setLoading(true);
      const data = await getRenterRequests(id);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!renterProfile) {
      console.error('No renter profile loaded');
      return;
    }

    // Determine final subject
    let finalSubject = subject;
    if (requestType !== "Other Request") {
      finalSubject = requestType;
    }

    try {
      console.log('Submitting request with data:', {
        renter_name: renterProfile.name,
        renter_id: renterProfile.id,
        apartment: renterProfile.apartment_number || 'Unknown',
        subject: finalSubject,
        message,
      });

      await createRenterRequest({
        renter_name: renterProfile.name,
        renter_id: renterProfile.id,
        apartment: renterProfile.apartment_number || 'Not Assigned',
        subject: finalSubject,
        message,
      });

      // Reset form
      setShowModal(false);
      setRequestType("");
      setSubject("");
      setMessage("");
      
      // Refresh requests
      fetchRequests(renterProfile.id);
    } catch (err) {
      console.error('Error submitting request:', err);
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with renter info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gray-900 text-2xl font-semibold">
            Requests to Owner
          </h1>
          <p className="text-gray-500">
            {renterProfile ? `${renterProfile.name} • Apt ${renterProfile.apartment_number || 'N/A'}` : 'Submit and track your requests'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-sky-500 text-white rounded-lg flex items-center gap-2 hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Pending"
          count={pendingCount}
          color="amber"
          icon={<Clock className="w-6 h-6 text-amber-600" />}
        />
        <StatCard
          title="Approved"
          count={approvedCount}
          color="emerald"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
        />
        <StatCard
          title="Rejected"
          count={rejectedCount}
          color="rose"
          icon={<XCircle className="w-6 h-6 text-rose-600" />}
        />
      </div>

      {/* Request List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-lg">
            My Requests ({requests.length})
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {requests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
              <p>No requests submitted yet</p>
              <p className="text-sm mt-1">Click "New Request" to submit one</p>
            </div>
          )}

          {requests.map(req => (
            <div
              key={req.id}
              className="border rounded-xl p-5 hover:border-sky-200 transition"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{req.subject}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {req.message}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="text-sm text-gray-500 mt-3 pt-3 border-t flex justify-between">
                <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                <span className="text-xs">Apt {req.apartment}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-6">
              Submit Request
            </h2>

            <div className="space-y-4">
              <select
                value={requestType}
                onChange={(e) => {
                  setRequestType(e.target.value);
                  if (e.target.value !== "Other Request") {
                    setSubject(e.target.value);
                  }
                }}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">Select Request Type</option>
                <option value="Lease Extension Request">Lease Extension</option>
                <option value="Renovation Permission">Renovation Permission</option>
                <option value="Parking Space Request">Parking Space</option>
                <option value="Other Request">Other</option>
              </select>

              {requestType === "Other Request" && (
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter custom subject"
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Write your message..."
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />

              {renterProfile && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p>Submitting as: <span className="font-medium">{renterProfile.name}</span></p>
                  <p>Apartment: <span className="font-medium">{renterProfile.apartment_number || 'Not assigned'}</span></p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!requestType || !message}
                className="flex-1 bg-sky-500 text-white p-3 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Reusable Components */
function StatCard({ title, count, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-gray-600">{title}</p>
          <p className="text-2xl font-semibold">{count}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles = {
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700"
  };
  
  return (
    <span className={`px-3 py-1 text-xs rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
      {status}
    </span>
  );
}