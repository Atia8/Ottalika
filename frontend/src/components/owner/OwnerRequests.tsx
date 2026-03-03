import { useEffect, useState } from "react";
import { type OwnerRequest } from "../../types/request";
import {
  getRequests,
  updateRequestStatus,
} from "../../services/requestService";

import { Clock, CheckCircle, Eye } from "lucide-react";

export const OwnerRequests = () => {
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const [selectedRequest, setSelectedRequest] =
    useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getRequests();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: number,
    status: "approved" | "rejected"
  ) => {
    try {
      await updateRequestStatus(id, status);

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status } : r
        )
      );

      if (selectedRequest === id) {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredRequests =
    filter === "all"
      ? requests
      : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter(
    (r) => r.status === "pending"
  ).length;

  const approvedCount = requests.filter(
    (r) => r.status === "approved"
  ).length;

  const totalCount = requests.length;

  const request =
    selectedRequest !== null
      ? requests.find((r) => r.id === selectedRequest)
      : null;

  if (loading) {
    return <div className="p-6 text-lg">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Renter Requests
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600">Pending Requests</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600">Approved</p>
              <p className="text-xl font-bold">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="bg-violet-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-gray-600">Total Requests</p>
              <p className="text-xl font-bold">{totalCount}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg border ${
              filter === f
                ? "bg-violet-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Request List */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">

        <h2 className="text-lg font-semibold">
          Requests ({filteredRequests.length})
        </h2>

        {filteredRequests.length === 0 && (
          <p className="text-gray-500">No requests found.</p>
        )}

        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className="border rounded-lg p-6 hover:border-violet-300 transition"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {request.subject}
                </h3>

                <p className="text-gray-600">
                  {request.renter_name} - {request.apartment}
                </p>

                <p className="text-gray-600 mt-2">
                  {request.message}
                </p>

                <p className="text-gray-500 mt-3">
                  Submitted: {request.created_at}
                </p>
              </div>

              <span
                className={`self-start  px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  request.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : request.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            {/* Actions */}
            {request.status === "pending" && (
              <div className="flex gap-3 mt-4 pt-4 border-t">

                <button
                  onClick={() =>
                    handleStatusUpdate(request.id, "approved")
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    handleStatusUpdate(request.id, "rejected")
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Reject
                </button>

                <button
                  onClick={() => setSelectedRequest(request.id)}
                  className="px-4 py-2 border rounded-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>

              </div>
            )}

          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedRequest && request && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">

            <h2 className="text-xl font-bold mb-4">
              {request.subject}
            </h2>

            <p className="mb-2">
              <b>From:</b> {request.renter_name} - {request.apartment}
            </p>

            <p className="mb-2">
              <b>Message:</b> {request.message}
            </p>

            <p className="mb-2">
              <b>Submitted:</b> {request.created_at}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-6 py-3 border rounded-lg"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};