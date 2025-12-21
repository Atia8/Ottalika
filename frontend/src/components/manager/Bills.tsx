import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaReceipt, 
  FaMoneyBillWave, 
  FaClock, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaDownload,
  FaPlus,
  FaEye,
  FaBuilding,
  FaCalendar,
  FaFileInvoice
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Bill {
  id: string;
  type: string;
  building: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  provider?: string;
  accountNumber?: string;
  month?: string;
  paidDate?: string;
}

const ManagerBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const billsData = response.data.data.bills || [];
        setBills(billsData);
        
        // Calculate stats
        const total = billsData.length;
        const pending = billsData.filter(b => b.status === 'pending').length;
        const paid = billsData.filter(b => b.status === 'paid').length;
        const overdue = billsData.filter(b => b.status === 'overdue').length;
        const totalAmount = billsData.reduce((sum: number, bill: Bill) => sum + bill.amount, 0);
        
        setStats({ total, pending, paid, overdue, totalAmount });
      } else {
        toast.error('Failed to fetch bills');
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      toast.error('Error loading bills data');
      
      // Mock data for testing
      const mockBills: Bill[] = [
        {
          id: '1',
          type: 'electricity',
          building: 'Building A',
          amount: 850,
          dueDate: '2024-01-10',
          status: 'pending',
          provider: 'National Grid',
          accountNumber: 'NG-123456',
          month: 'December 2023'
        },
        {
          id: '2',
          type: 'water',
          building: 'Building A',
          amount: 320,
          dueDate: '2024-01-15',
          status: 'pending',
          provider: 'Water Corp',
          accountNumber: 'WC-789012',
          month: 'December 2023'
        },
        {
          id: '3',
          type: 'maintenance',
          building: 'Building A',
          amount: 1500,
          dueDate: '2024-01-20',
          status: 'paid',
          provider: 'Maintenance Co',
          accountNumber: 'MC-345678',
          month: 'January 2024',
          paidDate: '2024-01-05'
        },
        {
          id: '4',
          type: 'lift_maintenance',
          building: 'Building B',
          amount: 600,
          dueDate: '2024-01-25',
          status: 'overdue',
          provider: 'Elevator Inc',
          accountNumber: 'EI-901234',
          month: 'January 2024'
        }
      ];
      
      setBills(mockBills);
      setStats({
        total: mockBills.length,
        pending: mockBills.filter(b => b.status === 'pending').length,
        paid: mockBills.filter(b => b.status === 'paid').length,
        overdue: mockBills.filter(b => b.status === 'overdue').length,
        totalAmount: mockBills.reduce((sum, bill) => sum + bill.amount, 0)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBills = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/manager/bills/generate-monthly`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Monthly bills generated successfully!');
      fetchBills();
    } catch (error) {
      console.error('Failed to generate bills:', error);
      toast.error('Failed to generate bills');
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    if (window.confirm('Mark this bill as paid?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/manager/bills/${billId}/pay`, {
          paymentMethod: 'bank_transfer',
          transactionId: `TRX-${Date.now()}`
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bill marked as paid!');
        fetchBills();
      } catch (error) {
        console.error('Failed to update bill:', error);
        toast.error('Failed to update bill');
      }
    }
  };

  const handleExportBills = () => {
    const csvContent = [
      ['Type', 'Building', 'Amount', 'Due Date', 'Status', 'Provider', 'Month'],
      ...bills.map(bill => [
        bill.type,
        bill.building,
        `₹${bill.amount}`,
        new Date(bill.dueDate).toLocaleDateString(),
        bill.status,
        bill.provider || 'N/A',
        bill.month || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Bills exported successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'overdue': return 'bg-rose-100 text-rose-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bills Management</h1>
          <p className="text-slate-600">Manage and track all building bills</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportBills}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FaDownload />
            Export
          </button>
          <button 
            onClick={handleGenerateBills}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
          >
            <FaPlus />
            Generate Monthly Bills
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Bills</p>
              <p className="text-2xl font-bold mt-2">{stats.total}</p>
            </div>
            <FaReceipt className="text-2xl text-blue-500" />
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
              <p className="text-sm text-slate-600">Paid</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600">{stats.paid}</p>
            </div>
            <FaMoneyBillWave className="text-2xl text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold mt-2 text-rose-600">{stats.overdue}</p>
            </div>
            <FaExclamationTriangle className="text-2xl text-rose-500" />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Bill Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Building
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No bills found. Generate monthly bills to get started.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FaFileInvoice className="text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900 capitalize">
                              {bill.type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-slate-500">{bill.month || 'Monthly'}</p>
                          </div>
                        </div>
                        {bill.provider && (
                          <p className="text-sm text-slate-500 mt-1">{bill.provider}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-slate-400" />
                        <p className="font-medium text-slate-900">{bill.building}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">₹{bill.amount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </p>
                          {bill.status === 'overdue' && (
                            <p className="text-sm text-rose-600">Overdue</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(bill.id)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1"
                          >
                            <FaCheck />
                            Mark Paid
                          </button>
                        )}
                        <button 
                          className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Pending Amount</span>
              <span className="font-semibold text-lg">₹{stats.totalAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pending Bills</span>
              <span className="font-semibold text-amber-600">{stats.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Overdue Bills</span>
              <span className="font-semibold text-rose-600">{stats.overdue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Paid Bills</span>
              <span className="font-semibold text-emerald-600">{stats.paid}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              <FaReceipt className="text-violet-600" />
              View All Bill History
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              <FaMoneyBillWave className="text-violet-600" />
              Add Custom Bill
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              <FaDownload className="text-violet-600" />
              Download Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerBills;