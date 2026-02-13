// frontend/src/components/owner/OwnerPayments.tsx
import { CheckCircle, XCircle, Search, Calendar } from "lucide-react";
import { useState } from "react";
import { useOwnerPayments } from "../../hooks/useOwnerPayments";
import { format } from 'date-fns';

export function OwnerPayments() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, '0')
  );
  const [searchTerm, setSearchTerm] = useState("");

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const monthDate = `${selectedYear}-${selectedMonth}-01`;
  const { data, isLoading, error, refetch } = useOwnerPayments(monthDate);

  if (isLoading) return <div className="p-8 text-center">Loading payments...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error.message}</div>;

  const rentersWithStatus = data?.apartments
    ?.filter(a => a.renter_id)
    .map(a => ({
      id: a.renter_id,
      name: a.renter_name,
      apartment: a.apartment_number,
      rentAmount: Number(a.rent_amount),
      paidThisMonth: a.payment_status === "paid",
      paidVerifyThisMonth: a.confirmation_status === "verified",
      confirmationStatus: a.confirmation_status,
      payment: {
        status: a.payment_status,
        paidDate: a.paid_at,
      }
    })) || [];

  const filteredRenters = rentersWithStatus.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.apartment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpected = data?.summary?.total_expected || 0;
  const totalCollected = data?.summary?.total_collected || 0;
  const paidCount = rentersWithStatus.filter(r => r.paidVerifyThisMonth).length;
  const unpaidCount = rentersWithStatus.filter(r => !r.paidVerifyThisMonth).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renter Payments</h1>
          <p className="text-gray-600 mt-1">Track payment status across all renters</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg w-24"
          >
            {(() => {
              const currentYear = new Date().getFullYear();
              const years: number[] = [];
              for (let i = currentYear - 5; i <= currentYear; i++) {
                years.push(i);
              }
              return years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ));
            })()}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {months
              .filter(month => {
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
                
                if (selectedYear === currentYear) {
                  return month.value <= currentMonth;
                }
                return true;
              })
              .map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
          </select>

          <button
            onClick={() => refetch?.()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-violet-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-gray-600">Expected</p>
              <p className="text-gray-900 text-xl font-bold">৳{totalExpected.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600">Collected</p>
              <p className="text-gray-900 text-xl font-bold">৳{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600">Paid</p>
              <p className="text-gray-900 text-xl font-bold">{paidCount} renters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600">Unpaid</p>
              <p className="text-gray-900 text-xl font-bold">{unpaidCount} renters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Progress */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-gray-900 font-semibold mb-4">Collection Progress</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>৳{totalCollected.toLocaleString()} of ৳{totalExpected.toLocaleString()}</span>
            <span>{totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : '0'}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-violet-600 h-3 rounded-full transition-all"
              style={{ width: `${totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or apartment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Payment Status Grid */}
      {filteredRenters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRenters.map((renter) => (
            <div
              key={renter.id}
              className={`p-6 rounded-xl border-2 ${
                renter.paidVerifyThisMonth
                  ? "bg-green-50 border-green-200"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-gray-900 font-semibold">{renter.name}</h3>
                  <p className="text-gray-600">Apartment {renter.apartment}</p>
                </div>
                {renter.paidVerifyThisMonth ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-orange-600" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent Amount:</span>
                  <span className="text-gray-900 font-medium">৳{renter.rentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={renter.paidThisMonth ? "text-green-600" : "text-orange-600"}>
                    {renter.paidThisMonth ? "Paid" : "Unpaid"}
                  </span>
                </div>

                {renter.paidThisMonth && renter.confirmationStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmation:</span>
                    <span className={
                      renter.confirmationStatus === "verified" 
                        ? "text-green-600" 
                        : "text-yellow-600"
                    }>
                      {renter.confirmationStatus === "verified" ? "Verified ✓" : "Pending Review"}
                    </span>
                  </div>
                )}
                {renter.payment?.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Date:</span>
                    <span className="text-gray-900">
                      {format(new Date(renter.payment.paidDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {!renter.paidThisMonth && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <p className="text-orange-700 font-medium">Payment pending</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No renters found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}