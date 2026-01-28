import { Layout } from "../Layout";
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar, FileText } from "lucide-react";
import { mockBills, mockComplaints, mockRenters, mockPayments } from "../lib/mockData";

import { useBills } from "../hooks/useBills";

import { useEffect, useState } from "react";

  export function OwnerManagerStatus() {
  const currentMonth = "January 2026";
  const today = new Date("2026-01-25");
  const [billTab, setBillTab] = useState<"pending" | "upcoming" | "summary"|"monthly-summary">("monthly-summary");
  const [currentTab, setCurrentTab] = useState("");


 // Step 1: Fetch bills from backend
  const { bills, loading } = useBills(billTab);
  
  
 useEffect(() => {
    if (!loading) {
      console.log("Bills data from backend:", bills);
      console.log("Number of bills:", bills.length);
      console.log("Sample bill:", bills[0]);
    }
  }, [loading, bills]);

  if (loading) return <p>Loading...</p>;


const realBills = bills; // This is from your backend

  // Step 2: Calculate with real bills data
  const totalBills = realBills.length;
  const paidBills = realBills.filter(b => b.status === "paid").length;
  const upcomingBills = realBills.filter(b => b.status === "upcoming");


  const pendingBills = realBills.filter(b => b.status === "pending");
  

  console.log("Total bills:", totalBills);
  console.log("Paid bills:", paidBills);
  console.log("Pending bills:", pendingBills.length);
  console.log("Upcoming bills:", upcomingBills.length);



  // Step 3: Check what fields exist in your real bills
  const sampleBill = realBills[0];
  if (sampleBill) {
    console.log("Bill fields:", Object.keys(sampleBill));
    console.log("due_date field:", sampleBill.due_date);
    console.log("paid_date field:", sampleBill.paid_date);
    console.log("title field:", sampleBill.title);
    console.log("amount field:", sampleBill.amount);
  }





  // Bills status
  // const { bills, loading } = useBills();
  // if (loading) return <p>Loading...</p>;






  // const totalBills = mockBills.length;
  // const paidBills = mockBills.filter(b => b.status === "paid").length;
  // const pendingBills = mockBills.filter(b => b.status === "pending");

  // Filter bills for different views
  // Pending/Overdue: Bills with status "pending" and due date before today
  //mock
  // const overdueBills = mockBills.filter(bill => {
  //   const dueDate = new Date(bill.dueDate);
  //   return bill.status === "pending" && dueDate < today;
  // });

//real
const overdueBills = realBills.filter(bill => {
  const dueDate = new Date(bill.due_date);  // Real API uses "due_date"
  return bill.status === "pending" && dueDate < today;
});

  // Upcoming: Bills with due date in current month (January 2026)
  //mock
  // const upcomingBills = mockBills.filter(bill => {
  //   const dueDate = new Date(bill.dueDate);
  //   return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
  // });

// const upcomingBills = realBills.filter(bill => {
//   const dueDate = new Date(bill.due_date);
//   return dueDate.getMonth() === today.getMonth() && 
//          dueDate.getFullYear() === today.getFullYear();
// });
  
  // Monthly Summary: Bills for current month
  //const currentMonthBills = mockBills.filter(bill => bill.month === currentMonth);
  const currentMonthBills = realBills.filter(bill => {
    const billDate = new Date(bill.due_date);
    const billMonth = billDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    return billMonth === currentMonth;
  });
  
  
  
  
  
  
  const currentMonthPaidBills = currentMonthBills.filter(bill => bill.status === "paid");
  const currentMonthUnpaidBills = currentMonthBills.filter(bill => bill.status === "pending");

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
  // const billScore = (paidBills / totalBills) * 100;
  // const complaintScore = (resolvedComplaints / totalComplaints) * 100;
  // const paymentScore = (verifiedPayments / totalRenters) * 100;
  // const overallScore = ((billScore + complaintScore + paymentScore) / 3).toFixed(0);

  const billScore = totalBills > 0 ? (paidBills / totalBills) * 100 : 0;

  // Temporary placeholders for other sections
  const complaintScore = 0;
  const paymentScore = 0;
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

        {/* Bills Management - Tabbed View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900 mb-4">Building Bills Management</h2>
            {/* Tab Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCurrentTab("pending")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentTab === "pending"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Pending ({pendingBills.length})</span>
                </div>
              </button>
              <button
                onClick={() => setCurrentTab("upcoming")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentTab === "upcoming"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming ({upcomingBills.length})</span>
                </div>
              </button>
              <button
                onClick={() => setCurrentTab("summary")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentTab === "summary"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Monthly Summary</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Pending/Overdue Bills Tab */}
            {currentTab === "pending" && (
              <div className="space-y-3">
                {overdueBills.length > 0 ? (
                  overdueBills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="text-gray-900 capitalize">{bill.title} Bill</p>
                        <p className="text-gray-600">{new Date(bill.due_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900">৳{bill.amount.toLocaleString()}</p>
                        <p className="text-red-600">Overdue</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600">No overdue bills! All bills are up to date.</p>
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Bills Tab */}
            {currentTab === "upcoming" && (
              <div className="space-y-3">
                {upcomingBills.length > 0 ? (
                  upcomingBills.map((bill) => {
                    const isPaid = bill.status === "paid";
                    return (
                      <div
                        key={bill.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          isPaid
                            ? "bg-green-50 border border-green-200"
                            : "bg-blue-50 border border-blue-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 capitalize">{bill.title} Bill</p>
                            {isPaid && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <p className="text-gray-600">{new Date(bill.due_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900">৳{bill.amount.toLocaleString()}</p>
                          {/* <p className={isPaid ? "text-green-600" : "text-blue-600"}>
                            {isPaid ? `Paid: ${bill.paidDate}` : `Due: ${bill.dueDate}`}
                          </p> */}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No bills due this month.</p>
                  </div>
                )}
              </div>
            )}

            {/* Monthly Summary Tab */}
            {currentTab === "summary" && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                    <p className="text-indigo-700">Total Bills</p>
                    <p className="text-indigo-900 mt-1">{totalBills}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <p className="text-green-700">Paid Bills</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-green-900">{paidBills}</p>
                      <p className="text-green-700">
                        ৳{currentMonthPaidBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <p className="text-orange-700">Unpaid Bills</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-orange-900">{currentMonthUnpaidBills.length}</p>
                      <p className="text-orange-700">
                        ৳{currentMonthUnpaidBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paid Bills */}
                {currentMonthPaidBills.length > 0 && (
                  <div>
                    <h3 className="text-gray-900 mb-3">✓ Paid Bills ({currentMonthPaidBills.length})</h3>
                    <div className="space-y-2">
                      {currentMonthPaidBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900 capitalize">{bill.title} Bill</p>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            {/* <p className="text-gray-600">Paid on: {bill.paidDate}</p> */}
                          </div>
                          <p className="text-gray-900">৳{bill.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unpaid Bills */}
                {currentMonthUnpaidBills.length > 0 && (
                  <div>
                    <h3 className="text-gray-900 mb-3">⏳ Unpaid Bills ({currentMonthUnpaidBills.length})</h3>
                    <div className="space-y-2">
                      {currentMonthUnpaidBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div>
                            <p className="text-gray-900 capitalize">{bill.title} Bill</p>
                            {/* <p className="text-gray-600">Due: {bill.due_Date}</p> */}
                          </div>
                          <p className="text-gray-900">৳{bill.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentMonthBills.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No bills for {currentMonth}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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