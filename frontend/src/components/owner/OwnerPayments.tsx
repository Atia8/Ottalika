import { CheckCircle, XCircle, Search } from "lucide-react";
import { useState } from "react";
import { useOwnerPayments } from "../../hooks/useOwnerPayments";
import { format } from "date-fns";

export function OwnerPayments() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("01");
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
  const { data, isLoading, error } = useOwnerPayments(monthDate);

  if (isLoading) return <p>Loading payments...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const rentersWithStatus =
    data?.apartments
      .filter((a) => a.renter_id)
      .map((a) => ({
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
        },
      })) || [];

  const filteredRenters = rentersWithStatus.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.apartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpected = data?.summary.total_expected || 0;
  const totalCollected = data?.summary.total_collected || 0;
  const paidCount = rentersWithStatus.filter(
    (r) => r.paidVerifyThisMonth
  ).length;
  const unpaidCount = rentersWithStatus.filter(
    (r) => !r.paidVerifyThisMonth
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gray-900">Renter Payments</h1>
          <p className="text-gray-600 mt-1">
            Track payment status across all renters
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* YEAR */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg w-24"
          >
            {(() => {
              const currentYear = new Date().getFullYear();
              const years = [];
              for (let i = currentYear - 5; i <= currentYear; i++) {
                years.push(i.toString());
              }
              return years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ));
            })()}
          </select>

          {/* MONTH */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600">Expected</p>
          <p className="text-gray-900">
            ৳{totalExpected.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600">Collected</p>
          <p className="text-gray-900">
            ৳{totalCollected.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600">Paid</p>
          <p className="text-gray-900">{paidCount} renters</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600">Unpaid</p>
          <p className="text-gray-900">{unpaidCount} renters</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or apartment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>

      {/* RENTERS GRID */}
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
            <h3 className="text-gray-900">{renter.name}</h3>
            <p className="text-gray-600">{renter.apartment}</p>

            <p>৳{renter.rentAmount.toLocaleString()}</p>
            <p>
              {renter.paidThisMonth ? "Paid" : "Unpaid"}
            </p>

            {renter.payment?.paidDate && (
              <p>
                {format(
                  new Date(renter.payment.paidDate),
                  "MMM dd, yyyy"
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}