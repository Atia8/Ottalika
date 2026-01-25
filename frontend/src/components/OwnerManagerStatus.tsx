import { Layout } from "../Layout";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { mockBills, mockComplaints, mockRenters, mockPayments } from "../lib/mockData";

export function OwnerManagerStatus() {
  const currentMonth = "December 2025";
  
  // Bills status
  const totalBills = mockBills.length;
  const paidBills = mockBills.filter(b => b.status === "paid").length;
  const pendingBills = mockBills.filter(b => b.status === "pending");

  // Complaints status
  const totalComplaints = mockComplaints.length;
  const resolvedComplaints = mockComplaints.filter(c => c.status === "resolved").length;
  const pendingComplaints = mockComplaints.filter(c => c.status === "pending");
  const inProgressComplaints = mockComplaints.filter(c => c.status === "in-progress");

  // Payment verification
  const currentMonthPayments = mockPayments.filter(p => p.month === currentMonth);
  const verifiedPayments = currentMonthPayments.filter(p => p.status === "confirmed").length;
  const totalRenters = mockRenters.length;

  // Overall performance score
  const billScore = (paidBills / totalBills) * 100;
  const complaintScore = (resolvedComplaints / totalComplaints) * 100;
  const paymentScore = (verifiedPayments / totalRenters) * 100;
  const overallScore = ((billScore + complaintScore + paymentScore) / 3).toFixed(0);

  return (
    <Layout role="owner">
      <div className="space-y-6">
        <div>
          <h1 className="text-gray-900">Manager Performance</h1>
          <p className="text-gray-600 mt-1">Monitor manager's task completion and building operations</p>
        </div>

        {/* Overall Performance */}
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 p-6 rounded-xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-violet-100">Overall Performance Score</p>
              <p className="text-white mt-2">{overallScore}%</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Bills Payment</h3>
              <div className={`p-2 rounded-lg ${
                billScore >= 80 ? "bg-green-100" : billScore >= 50 ? "bg-orange-100" : "bg-red-100"
              }`}>
                {billScore >= 80 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : billScore >= 50 ? (
                  <Clock className="w-5 h-5 text-orange-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Paid: {paidBills}</span>
                <span>Pending: {pendingBills.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    billScore >= 80 ? "bg-green-600" : billScore >= 50 ? "bg-orange-600" : "bg-red-600"
                  }`}
                  style={{ width: `${billScore}%` }}
                />
              </div>
              <p className="text-gray-600">{billScore.toFixed(0)}% Completion</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Complaint Resolution</h3>
              <div className={`p-2 rounded-lg ${
                complaintScore >= 80 ? "bg-green-100" : complaintScore >= 50 ? "bg-orange-100" : "bg-red-100"
              }`}>
                {complaintScore >= 80 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : complaintScore >= 50 ? (
                  <Clock className="w-5 h-5 text-orange-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Resolved: {resolvedComplaints}</span>
                <span>Pending: {pendingComplaints.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    complaintScore >= 80 ? "bg-green-600" : complaintScore >= 50 ? "bg-orange-600" : "bg-red-600"
                  }`}
                  style={{ width: `${complaintScore}%` }}
                />
              </div>
              <p className="text-gray-600">{complaintScore.toFixed(0)}% Resolution Rate</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Payment Verification</h3>
              <div className={`p-2 rounded-lg ${
                paymentScore >= 80 ? "bg-green-100" : paymentScore >= 50 ? "bg-orange-100" : "bg-red-100"
              }`}>
                {paymentScore >= 80 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : paymentScore >= 50 ? (
                  <Clock className="w-5 h-5 text-orange-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Verified: {verifiedPayments}</span>
                <span>Total: {totalRenters}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    paymentScore >= 80 ? "bg-green-600" : paymentScore >= 50 ? "bg-orange-600" : "bg-red-600"
                  }`}
                  style={{ width: `${paymentScore}%` }}
                />
              </div>
              <p className="text-gray-600">{paymentScore.toFixed(0)}% Verified</p>
            </div>
          </div>
        </div>

        {/* Pending Bills */}
        {pendingBills.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-gray-900">Pending Bills</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {pendingBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="text-gray-900 capitalize">{bill.type} Bill</p>
                      <p className="text-gray-600">{bill.month}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900">৳{bill.amount.toLocaleString()}</p>
                      <p className="text-orange-600">Due: {bill.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending/In-Progress Complaints */}
        {(pendingComplaints.length > 0 || inProgressComplaints.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-gray-900">Active Complaints</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[...pendingComplaints, ...inProgressComplaints].map((complaint) => (
                  <div key={complaint.id} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-gray-900">{complaint.title}</p>
                        <p className="text-gray-600">{complaint.renterName} - {complaint.apartment}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        complaint.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {complaint.status === "in-progress" ? "In Progress" : "Pending"}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">{complaint.description}</p>
                    <p className="text-gray-500 mt-2">
                      Submitted: {complaint.createdAt} | Priority: <span className={
                        complaint.priority === "high" ? "text-red-600" : "text-yellow-600"
                      }>{complaint.priority}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">Recommendations</h2>
          <div className="space-y-3">
            {pendingBills.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-gray-900">Follow up on pending bills</p>
                  <p className="text-gray-600">There are {pendingBills.length} bills pending payment</p>
                </div>
              </div>
            )}
            {pendingComplaints.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-gray-900">Address pending complaints</p>
                  <p className="text-gray-600">{pendingComplaints.length} complaints need immediate attention</p>
                </div>
              </div>
            )}
            {Number(overallScore) >= 80 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-gray-900">Excellent performance</p>
                  <p className="text-gray-600">Manager is maintaining high standards across all areas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
