import { useEffect, useState } from "react";
import { Plus, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  getRenterRequests,
  createRenterRequest,
} from "../../services/renterRequestService";

export function RenterRequests() {

  const renterId = 1; // ⚠ Replace later with logged-in user ID
  const renterName = "John Doe"; // ⚠ Replace later with auth user

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [requestType, setRequestType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getRenterRequests(renterId);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await createRenterRequest({
        renter_name: renterName,
        renter_id: renterId,
        apartment: "A-101", // Replace with real user data later
        subject,
        message,
      });

      setShowModal(false);
      setRequestType("");
      setSubject("");
      setMessage("");

      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gray-900 text-2xl font-semibold">
            Requests to Owner
          </h1>
          <p className="text-gray-500">
            Submit and track your requests
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-sky-500 text-white rounded-lg flex items-center gap-2"
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
              No requests submitted yet
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
                  <p className="text-gray-600 text-sm">
                    {req.message}
                  </p>
                </div>

                <StatusBadge status={req.status} />
              </div>

              <div className="text-sm text-gray-500 mt-3 pt-3 border-t">
                Submitted: {req.created_at}
              </div>

            </div>
          ))}

        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">

          <div className="bg-white rounded-xl p-6 max-w-lg w-full">

            <h2 className="text-xl font-semibold mb-6">
              Submit Request
            </h2>

            <div className="space-y-4">

              <select
                value={requestType}
                onChange={(e) => {
                  setRequestType(e.target.value);
                  setSubject(e.target.value);
                }}
                className="w-full border p-3 rounded-lg"
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
                  onChange={(e)=>setSubject(e.target.value)}
                  placeholder="Custom Subject"
                  className="w-full border p-3 rounded-lg"
                />
              )}

              <textarea
                value={message}
                onChange={(e)=>setMessage(e.target.value)}
                rows={5}
                placeholder="Write message..."
                className="w-full border p-3 rounded-lg"
              />

            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={()=>setShowModal(false)}
                className="flex-1 border p-3 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!requestType || !message}
                className="flex-1 bg-sky-500 text-white p-3 rounded-lg disabled:bg-gray-300"
              >
                <Send className="w-4 h-4 inline mr-2"/>
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

function StatCard({title,count,icon}:any){
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

function StatusBadge({status}:any){
  return (
    <span className={`px-3 py-1 text-xs rounded-full ${
      status==="approved"
      ? "bg-emerald-100 text-emerald-700"
      : status==="rejected"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700"
    }`}>
      {status}
    </span>
  );
}